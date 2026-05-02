"""Storage abstraction for binary uploads.

Today: FilesystemStorage writes under UPLOAD_ROOT (configured per env).
Later: drop in S3Storage / GCSStorage with the same `save / open / delete /
exists` shape and change one wiring line in app/__init__.py — routes and
models never see the storage backend.

SECURITY notes for any future Storage implementation:
- The `key` is a server-generated relative path. Never accept a client-supplied
  filename or path; that's how path-traversal bugs ship.
- `_resolve` ensures keys never escape the configured root.
"""
import os
import uuid
from typing import BinaryIO


class StorageError(Exception):
    """Base exception for storage problems."""


class StorageKeyError(StorageError):
    """Raised when a key is invalid (path traversal, bad form) or not found."""


class FilesystemStorage:
    """Stores blobs as files on the local filesystem under `root`.

    All keys are interpreted as paths *relative to* root. Keys are validated
    on every call to defeat path traversal — even if the caller is internal,
    we don't trust the key to be safe.
    """

    def __init__(self, root: str):
        # Resolve once at init so all later checks compare against an absolute,
        # symlink-resolved path. Anything else can be tricked by symlinks
        # planted in the root directory.
        self.root = os.path.realpath(root)
        os.makedirs(self.root, exist_ok=True)

    # ── internal ────────────────────────────────────────────────────────────
    def _resolve(self, key: str) -> str:
        """Translate a storage key to an absolute filesystem path under root.

        Rejects:
          - empty keys
          - absolute paths (any drive letter or leading slash)
          - any '..' component
          - paths whose realpath escapes self.root
        """
        if not key or not isinstance(key, str):
            raise StorageKeyError(f'invalid storage key: {key!r}')
        if os.path.isabs(key):
            raise StorageKeyError(f'storage key must be relative: {key!r}')
        # Normalise both Windows and POSIX separators before component checks.
        parts = key.replace('\\', '/').split('/')
        if any(p in ('', '..') for p in parts):
            raise StorageKeyError(f'storage key has bad components: {key!r}')

        full = os.path.realpath(os.path.join(self.root, key))
        # commonpath raises on different drives (Windows) — wrap defensively.
        try:
            common = os.path.commonpath([full, self.root])
        except ValueError as e:
            raise StorageKeyError(f'storage key escapes root: {key!r}') from e
        if common != self.root:
            raise StorageKeyError(f'storage key escapes root: {key!r}')
        return full

    # ── public interface (stable across backends) ───────────────────────────
    def save(self, key: str, stream: BinaryIO) -> int:
        """Write the contents of `stream` to the location named by `key`.

        Returns the number of bytes written. Streams in 64KB chunks so we
        never load a multi-MB upload fully into memory at the storage layer.
        """
        path = self._resolve(key)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        bytes_written = 0
        with open(path, 'wb') as out:
            while True:
                chunk = stream.read(64 * 1024)
                if not chunk:
                    break
                out.write(chunk)
                bytes_written += len(chunk)
        return bytes_written

    def open(self, key: str) -> BinaryIO:
        """Return a binary file-like for reading the blob at `key`.

        Caller is responsible for closing it. Raises StorageKeyError if the
        key is invalid OR the underlying file does not exist — same exception
        in both cases so callers can't enumerate keys.
        """
        path = self._resolve(key)
        if not os.path.exists(path):
            raise StorageKeyError(f'not found: {key!r}')
        return open(path, 'rb')

    def delete(self, key: str) -> None:
        """Remove the blob at `key`. Idempotent (no error if already gone)."""
        path = self._resolve(key)
        try:
            os.remove(path)
        except FileNotFoundError:
            pass

    def exists(self, key: str) -> bool:
        try:
            return os.path.exists(self._resolve(key))
        except StorageKeyError:
            return False


# ── Supabase Storage backend ────────────────────────────────────────────────
class SupabaseStorage:
    """Persists blobs in a Supabase Storage bucket.

    Use this in production where Render's ephemeral disk would lose uploads
    on every redeploy. The Flask backend is the trust boundary — we use the
    service-role key here, which bypasses Supabase RLS. That's correct for
    our model: every read/write is gated by our own JWT auth before it ever
    reaches storage.

    One-time setup in the Supabase dashboard:
        1. Storage → New bucket → name `ticket-photos`, **private** (NOT public).
        2. Settings → API → copy your `service_role` key (NOT the anon key).
        3. Set env vars on Render (and locally if you want to test prod path):
             PHOTO_STORAGE_BACKEND=supabase
             SUPABASE_URL=https://<project-ref>.supabase.co
             SUPABASE_SERVICE_KEY=<service-role-key>
             SUPABASE_PHOTO_BUCKET=ticket-photos

    SECURITY:
        - NEVER put SUPABASE_SERVICE_KEY into a mobile build, an env var the
          client can read, or a public Render setting. It bypasses every RLS
          policy on the project.
        - Bucket must be private. A public bucket would let anyone with a URL
          retrieve any photo, defeating our auth scoping.
    """

    def __init__(self, url: str, service_key: str, bucket: str):
        if not url or not service_key:
            raise StorageError(
                'SupabaseStorage requires SUPABASE_URL and SUPABASE_SERVICE_KEY'
            )
        if not bucket:
            raise StorageError('SupabaseStorage requires a bucket name')
        try:
            from supabase import create_client
        except ImportError as e:  # pragma: no cover — surfaced at app boot
            raise StorageError(
                "supabase package not installed; add `supabase` to requirements.txt"
            ) from e
        self.client = create_client(url, service_key)
        self.bucket = bucket

    def save(self, key: str, stream) -> int:
        """Upload bytes from `stream` to the bucket under `key`.

        Reads stream into memory before sending. Acceptable here because the
        upstream route already enforces MAX_PHOTO_BYTES (10MB) before calling.
        """
        data = stream.read() if hasattr(stream, 'read') else stream
        # `upsert='true'` is defense-in-depth: storage keys are uuid4 so a
        # collision shouldn't happen, but if it ever does we silently overwrite
        # rather than 409. The DB side enforces uniqueness via submission_uuid.
        self.client.storage.from_(self.bucket).upload(
            path=key,
            file=data,
            file_options={
                'content-type': 'application/octet-stream',
                'upsert': 'true',
            },
        )
        return len(data)

    def open(self, key: str):
        """Download bytes from the bucket. Returns a BytesIO for compatibility
        with FilesystemStorage's file-handle return."""
        import io
        try:
            data = self.client.storage.from_(self.bucket).download(key)
        except Exception as e:
            raise StorageKeyError(f'not found: {key!r}') from e
        if data is None:
            raise StorageKeyError(f'not found: {key!r}')
        return io.BytesIO(data)

    def delete(self, key: str) -> None:
        """Remove the blob. Idempotent — Supabase swallows missing-key errors."""
        try:
            self.client.storage.from_(self.bucket).remove([key])
        except Exception:
            pass

    def exists(self, key: str) -> bool:
        """Check if a key exists by listing the parent prefix."""
        try:
            folder, _, filename = key.rpartition('/')
            result = self.client.storage.from_(self.bucket).list(path=folder or None)
            return any(item.get('name') == filename for item in (result or []))
        except Exception:
            return False


# ── Key generation ──────────────────────────────────────────────────────────
def make_photo_storage_key(ticket_id: int, extension: str) -> str:
    """Generate a collision-free, opaque storage key for a ticket photo.

    Format: 'tickets/<ticket_id>/<uuid4-hex>.<ext>'

    The uuid4-hex is unguessable so an attacker can't brute-force keys to
    retrieve photos, even if our auth check ever has a bug.
    Extension is lowercased and validated to alphanumeric to keep the path
    safe; callers should pass the canonical extension derived from validated
    content (e.g. 'jpg' from a Pillow-confirmed JPEG), not the client's
    uploaded filename.
    """
    ext = (extension or '').lstrip('.').lower()
    if not ext.isalnum() or not (1 <= len(ext) <= 8):
        raise StorageKeyError(f'invalid extension: {extension!r}')
    return f'tickets/{int(ticket_id)}/{uuid.uuid4().hex}.{ext}'

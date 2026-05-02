"""Photo validation, EXIF GPS extraction, and metadata-stripping re-encode.

Pillow does the heavy lifting here:
- `Image.verify()` strict-parses the file. A polyglot (PNG + appended JS,
  JPEG with embedded HTML) fails this step.
- `Image.MAX_IMAGE_PIXELS` blocks decompression bombs BEFORE pixels load.
- A re-save through Pillow produces fresh bytes — anything attackers smuggled
  past `verify()` does not survive the re-encode.

We never trust the client's `Content-Type` header; the only source of truth
is what Pillow successfully parses.

Only JPEG and PNG are accepted today. iPhone HEIC uploads should be converted
to JPEG client-side (Expo `ImageManipulator` does this in one call). Adding
HEIC support server-side is a one-line change once we install pillow-heif.
"""
import hashlib
import io
from typing import Optional, Tuple

from PIL import ExifTags, Image, ImageOps, UnidentifiedImageError


# Bomb cap — anything decoding to more than 50 megapixels raises
# Image.DecompressionBombError. Generous for site photos, well under Pillow's
# default 178956970 ceiling.
Image.MAX_IMAGE_PIXELS = 50_000_000


# Accepted Pillow format names → MIME we'll store and serve.
ACCEPTED_FORMATS = {
    'JPEG': 'image/jpeg',
    'PNG': 'image/png',
}

# Canonical extension for storage keys (preferred over Pillow's format string
# directly because 'JPEG' → 'jpg' is the conventional file extension).
FORMAT_TO_EXTENSION = {
    'JPEG': 'jpg',
    'PNG': 'png',
}


class PhotoValidationError(ValueError):
    """Raised when a photo isn't a valid image we accept."""


def validate_image(file_bytes: bytes) -> Tuple[Image.Image, str, str]:
    """Confirm `file_bytes` is a real image we accept.

    Two-pass flow:
      1. `verify()` does strict format parsing without loading pixels.
      2. Re-open for actual use (verify consumes the file pointer).

    Returns:
        (PIL Image opened for read, format string e.g. 'JPEG', mime_type)
    Raises:
        PhotoValidationError on any failure — message is safe to surface.
    """
    if not file_bytes:
        raise PhotoValidationError('empty file')

    try:
        Image.open(io.BytesIO(file_bytes)).verify()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as e:
        raise PhotoValidationError(f'not a valid image: {e}') from e
    except Exception as e:  # pragma: no cover — defensive catch-all
        raise PhotoValidationError(f'image rejected: {e}') from e

    # verify() invalidates the loaded image — re-open for use.
    img = Image.open(io.BytesIO(file_bytes))

    if img.format not in ACCEPTED_FORMATS:
        raise PhotoValidationError(
            f'unsupported format {img.format!r}; allowed: {sorted(ACCEPTED_FORMATS)}'
        )

    return img, img.format, ACCEPTED_FORMATS[img.format]


def extract_gps(img: Image.Image) -> Tuple[Optional[float], Optional[float]]:
    """Pull EXIF GPS coordinates BEFORE we strip metadata.

    These values become an integrity signal for the AI anomaly endpoint later
    (compare to the work order's geofence). Returning (None, None) is normal
    and expected — many photos have no GPS, especially after client-side
    conversion or screenshotting.
    """
    try:
        exif = img._getexif()  # noqa: SLF001 — Pillow's prefixed-but-public API
    except Exception:
        return None, None

    if not exif:
        return None, None

    gps_tag = next(
        (t for t, name in ExifTags.TAGS.items() if name == 'GPSInfo'),
        None,
    )
    if gps_tag is None:
        return None, None

    raw = exif.get(gps_tag)
    if not raw:
        return None, None

    gps = {ExifTags.GPSTAGS.get(k, k): v for k, v in raw.items()}
    lat = _to_degrees(gps.get('GPSLatitude'), gps.get('GPSLatitudeRef'))
    lng = _to_degrees(gps.get('GPSLongitude'), gps.get('GPSLongitudeRef'))
    return lat, lng


def _to_degrees(coords, ref) -> Optional[float]:
    """Convert (degrees, minutes, seconds) + 'N/S/E/W' into a signed float.

    Bad EXIF can produce NaN, infinity, or strings — every conversion is
    guarded so we return None instead of poisoning downstream code.
    """
    if not coords or not ref:
        return None
    try:
        d, m, s = (float(c) for c in coords)
        deg = d + m / 60.0 + s / 3600.0
        if ref in ('S', 'W'):
            deg = -deg
        if not (-180.0 <= deg <= 180.0):
            return None
        return deg
    except (TypeError, ValueError):
        return None


def strip_exif_and_reencode(img: Image.Image, target_format: str) -> bytes:
    """Re-encode `img` without metadata. Returns the clean bytes for storage.

    Privacy:  EXIF can carry home-address GPS, device serial numbers, faces in
              thumbnails — strip everything before persistence.
    Integrity: A re-encode through Pillow's encoder produces fresh bytes;
              polyglots that snuck past verify() (e.g. JPEG with appended JS
              after EOI) do not survive the round-trip.

    Orientation is applied BEFORE the strip so portraits stay portraits when
    the EXIF rotation tag goes away.
    """
    img = ImageOps.exif_transpose(img)

    out = io.BytesIO()
    save_kwargs = {}
    if target_format == 'JPEG':
        save_kwargs['quality'] = 88
        save_kwargs['optimize'] = True
        save_kwargs['exif'] = b''  # explicit empty EXIF block
    elif target_format == 'PNG':
        save_kwargs['optimize'] = True
        # Pillow doesn't accept exif= for PNG; PNG textual chunks aren't
        # written unless we explicitly add them, which we don't.

    img.save(out, format=target_format, **save_kwargs)
    return out.getvalue()


def sha256_hex(data: bytes) -> str:
    """Stable content hash for audit/dedupe."""
    return hashlib.sha256(data).hexdigest()

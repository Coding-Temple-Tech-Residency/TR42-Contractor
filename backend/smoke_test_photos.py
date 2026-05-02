#!/usr/bin/env python3
"""Local smoke test for the ticket photo upload endpoints.

Walks the full happy path plus a few security probes:
    1. POST /auth/login                     — get a JWT
    2. POST /api/photos                     — upload a photo
    3. POST /api/photos (same UUID)         — idempotency check
    4. GET  /api/photos?ticket_id=<id>      — list photos
    5. GET  /api/photos/<photo_id>          — fetch bytes + verify headers
    6. GET  /api/photos/<photo_id> (no JWT) — auth-required check

Exits 0 on success, non-zero on first failure with the offending response
body printed.

Usage
-----
    python smoke_test_photos.py <username> <password> <ticket_id> <photo_path>

Example
-------
    python smoke_test_photos.py contractor1 hunter2 1 ./test.jpg

Pre-conditions (set these up in your local SQLite DB first):
    - A row in `authuser` with role/user_type='contractor' and the given creds
    - A matching row in `contractor` (FK back to that authuser via user_id)
    - A row in `ticket` whose `assigned_contractor` FK points at that
      contractor's id
    - The image file at <photo_path> is a real JPEG or PNG ≤ 10MB

Override the base URL with SMOKE_TEST_URL env var if your backend isn't on
the default port (e.g. SMOKE_TEST_URL=http://localhost:5001).
"""
import os
import sys
import uuid
from pathlib import Path

import requests

BASE_URL = os.environ.get('SMOKE_TEST_URL', 'http://localhost:5000').rstrip('/')


def fail(message, response=None):
    """Print a clean error and exit non-zero."""
    print(f'❌ {message}')
    if response is not None:
        print(f'   status: {response.status_code}')
        print(f'   body:   {response.text[:1000]}')
    sys.exit(1)


def main():
    if len(sys.argv) != 5:
        print(__doc__)
        sys.exit(1)

    username, password, ticket_id_raw, photo_path_raw = sys.argv[1:5]

    try:
        ticket_id = int(ticket_id_raw)
    except ValueError:
        fail(f'ticket_id must be an integer, got {ticket_id_raw!r}')

    photo_path = Path(photo_path_raw)
    if not photo_path.exists():
        fail(f'photo file not found: {photo_path}')
    if photo_path.stat().st_size > 10 * 1024 * 1024:
        fail(f'photo exceeds 10MB cap: {photo_path.stat().st_size} bytes')

    print(f'Backend: {BASE_URL}')
    print(f'User:    {username}')
    print(f'Ticket:  {ticket_id}')
    print(f'Photo:   {photo_path} ({photo_path.stat().st_size} bytes)')
    print()

    # ── 1. Login ─────────────────────────────────────────────────────
    print(f'→ POST {BASE_URL}/auth/login')
    r = requests.post(
        f'{BASE_URL}/auth/login',
        json={'identifier': username, 'password': password},
        timeout=10,
    )
    if r.status_code != 200:
        fail('login failed', r)

    payload = r.json()
    token = payload.get('token')
    if not token:
        fail(f'login response had no token: {payload}')

    user_role = payload.get('user', {}).get('user_type')
    print(f'✓ login OK (token len={len(token)}, user_type={user_role!r})')
    if user_role != 'contractor':
        print(f'⚠️  user_type is {user_role!r}, not "contractor" — '
              'route is gated to contractors only and will return 403')

    headers = {'Authorization': f'Bearer {token}'}

    # ── 2. Upload ────────────────────────────────────────────────────
    submission_uuid = str(uuid.uuid4())
    print(f'\n→ POST {BASE_URL}/api/photos  '
          f'(ticket_id={ticket_id}, submission_uuid={submission_uuid[:8]}…)')

    with open(photo_path, 'rb') as f:
        r = requests.post(
            f'{BASE_URL}/api/photos',
            headers=headers,
            data={
                'ticket_id': str(ticket_id),
                'submission_uuid': submission_uuid,
            },
            files={'photo': (photo_path.name, f, 'application/octet-stream')},
            timeout=30,
        )

    if r.status_code != 201:
        fail('upload failed', r)

    photo = r.json()
    photo_id = photo['id']
    print(f'✓ upload OK')
    print(f'   id={photo_id}  byte_size={photo["byte_size"]}  '
          f'mime={photo["mime_type"]}')
    print(f'   exif_lat={photo.get("exif_lat")}  exif_lng={photo.get("exif_lng")}')
    print(f'   content_hash={photo["content_hash"][:16]}…')
    print(f'   url={photo.get("url")}')

    # ── 3. Idempotency ───────────────────────────────────────────────
    print(f'\n→ POST {BASE_URL}/api/photos AGAIN with the same submission_uuid')
    with open(photo_path, 'rb') as f:
        r = requests.post(
            f'{BASE_URL}/api/photos',
            headers=headers,
            data={
                'ticket_id': str(ticket_id),
                'submission_uuid': submission_uuid,
            },
            files={'photo': (photo_path.name, f, 'application/octet-stream')},
            timeout=30,
        )

    if r.status_code != 200:
        fail(f'idempotency expected 200, got {r.status_code}', r)
    if r.json()['id'] != photo_id:
        fail(f'idempotency returned different id '
             f'(got {r.json()["id"]!r}, expected {photo_id})')
    print(f'✓ idempotent (returned same id={photo_id})')

    # ── 4. List ──────────────────────────────────────────────────────
    print(f'\n→ GET {BASE_URL}/api/photos?ticket_id={ticket_id}')
    r = requests.get(
        f'{BASE_URL}/api/photos',
        headers=headers,
        params={'ticket_id': ticket_id},
        timeout=10,
    )
    if r.status_code != 200:
        fail('list failed', r)

    photos = r.json()
    if not isinstance(photos, list) or not any(p['id'] == photo_id for p in photos):
        fail(f'uploaded photo {photo_id} not in list response: {photos}')
    print(f'✓ list OK ({len(photos)} photos for ticket {ticket_id})')

    # ── 5. Fetch bytes + verify headers ──────────────────────────────
    print(f'\n→ GET {BASE_URL}/api/photos/{photo_id}')
    r = requests.get(
        f'{BASE_URL}/api/photos/{photo_id}',
        headers=headers,
        timeout=10,
    )
    if r.status_code != 200:
        fail('fetch failed', r)

    print(f'✓ fetch OK  ({len(r.content)} bytes  '
          f'content-type={r.headers.get("Content-Type")!r})')

    # Security header check — defense-in-depth against polyglot rendering.
    expected = {
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'",
        'Cache-Control': 'private, no-store',
    }
    for name, want in expected.items():
        got = r.headers.get(name)
        if got == want:
            print(f'✓ header {name}: {got}')
        else:
            print(f'⚠️  header {name}: expected {want!r}, got {got!r}')

    # ── 6. Unauthenticated fetch — must 401 ──────────────────────────
    print(f'\n→ GET {BASE_URL}/api/photos/{photo_id}  (no Authorization header)')
    r = requests.get(f'{BASE_URL}/api/photos/{photo_id}', timeout=10)
    if r.status_code != 401:
        fail(f'expected 401 without auth, got {r.status_code}', r)
    print(f'✓ unauthenticated request rejected with 401')

    print('\n🎉 All smoke tests passed.')


if __name__ == '__main__':
    main()

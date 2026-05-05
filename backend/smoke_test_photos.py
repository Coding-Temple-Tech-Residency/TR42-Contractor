#!/usr/bin/env python3
"""Local smoke test for the ticket photo upload endpoints.

Walks the happy path plus a couple of security probes:
    1. POST /auth/login                     get a JWT
    2. POST /api/photos                     upload a photo
    3. GET  /api/photos?ticket_id=<id>      list photos
    4. GET  /api/photos/<photo_id>          fetch bytes + verify headers
    5. GET  /api/photos/<photo_id> (no JWT) auth-required check

Exits 0 on success, non-zero on first failure with the offending response
body printed.

Usage
-----
    python smoke_test_photos.py <username> <password> <ticket_id> <photo_path>

Example
-------
    python smoke_test_photos.py contractor1 hunter2 <ticket-uuid> ./test.jpg

Pre-conditions:
    - A row in `auth_user` with user_type='contractor' and the given creds
    - A matching row in `contractor` (FK back to that auth_user via user_id)
    - A row in `ticket` whose `assigned_contractor` FK points at that
      contractor's id
    - The image file at <photo_path> is a real JPEG or PNG and 10MB or less

Override the base URL with SMOKE_TEST_URL env var if your backend isn't on
the default port (e.g. SMOKE_TEST_URL=http://localhost:5001).

Note: idempotency / offline retry tests are not in this smoke test yet
because the Supabase ticket_photo schema doesn't carry submission_uuid /
content_hash. Once Daniel adds those columns, this file gets a step 2.5
that re-POSTs the same photo and confirms the server returns the same row.
"""
import os
import sys
from pathlib import Path

import requests

BASE_URL = os.environ.get('SMOKE_TEST_URL', 'http://localhost:5000').rstrip('/')


def fail(message, response=None):
    """Print a clean error and exit non-zero."""
    print(f'FAIL: {message}')
    if response is not None:
        print(f'   status: {response.status_code}')
        print(f'   body:   {response.text[:1000]}')
    sys.exit(1)


def main():
    if len(sys.argv) != 5:
        print(__doc__)
        sys.exit(1)

    username, password, ticket_id, photo_path_raw = sys.argv[1:5]

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
    print(f'-> POST {BASE_URL}/auth/login')
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
    print(f'OK login (token len={len(token)}, user_type={user_role!r})')
    if user_role != 'contractor':
        print(f'WARN: user_type is {user_role!r}, not "contractor". '
              'Route is gated to contractors only and will return 403.')

    headers = {'Authorization': f'Bearer {token}'}

    # ── 2. Upload ────────────────────────────────────────────────────
    print(f'\n-> POST {BASE_URL}/api/photos  (ticket_id={ticket_id})')

    with open(photo_path, 'rb') as f:
        r = requests.post(
            f'{BASE_URL}/api/photos',
            headers=headers,
            data={'ticket_id': ticket_id},
            files={'photo': (photo_path.name, f, 'application/octet-stream')},
            timeout=30,
        )

    if r.status_code != 201:
        fail('upload failed', r)

    photo = r.json()
    photo_id = photo['id']
    print(f'OK upload')
    print(f'   id={photo_id}')
    print(f'   latitude={photo.get("latitude")}  longitude={photo.get("longitude")}')
    print(f'   url={photo.get("url")}')

    # ── 3. List ──────────────────────────────────────────────────────
    print(f'\n-> GET {BASE_URL}/api/photos?ticket_id={ticket_id}')
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
    print(f'OK list ({len(photos)} photos for ticket {ticket_id})')

    # ── 4. Fetch bytes + verify headers ──────────────────────────────
    print(f'\n-> GET {BASE_URL}/api/photos/{photo_id}')
    r = requests.get(
        f'{BASE_URL}/api/photos/{photo_id}',
        headers=headers,
        timeout=10,
    )
    if r.status_code != 200:
        fail('fetch failed', r)

    print(f'OK fetch  ({len(r.content)} bytes  '
          f'content-type={r.headers.get("Content-Type")!r})')

    # Security header check
    expected = {
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'",
        'Cache-Control': 'private, no-store',
    }
    for name, want in expected.items():
        got = r.headers.get(name)
        if got == want:
            print(f'OK header {name}: {got}')
        else:
            print(f'WARN header {name}: expected {want!r}, got {got!r}')

    # ── 5. Unauthenticated fetch must 401 ────────────────────────────
    print(f'\n-> GET {BASE_URL}/api/photos/{photo_id}  (no Authorization header)')
    r = requests.get(f'{BASE_URL}/api/photos/{photo_id}', timeout=10)
    if r.status_code != 401:
        fail(f'expected 401 without auth, got {r.status_code}', r)
    print(f'OK unauthenticated request rejected with 401')

    print('\nAll smoke tests passed.')


if __name__ == '__main__':
    main()

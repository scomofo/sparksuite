"""
download_freesound_chords.py
────────────────────────────
Downloads real acoustic guitar chord WAVs from Freesound (NoiseCollector)
and renames them to chord_X.wav ready for ChordSpark.

SETUP — one time only:
  1. Go to: https://freesound.org/apiv2/apply/
     Fill in:
       Name:        ChordSpark
       Description: Download guitar chord samples for a guitar learning app
       Callback URL: http://localhost
  2. You'll see a table — copy the values into CLIENT_ID and CLIENT_SECRET below.

INSTALL:
  pip install requests requests-oauthlib scipy numpy

RUN:
  python download_freesound_chords.py
  -> Follow the one-time browser prompt, paste back the redirect URL
  -> WAVs saved to .\\guitar_chords\\  and renamed chord_X.wav
"""

import os, sys, json, time, webbrowser
from pathlib import Path
from urllib.parse import urlparse, parse_qs

try:
    import requests
    from requests_oauthlib import OAuth2Session
except ImportError:
    sys.exit("ERROR: Run:  pip install requests requests-oauthlib")

try:
    import numpy as np
    from scipy.io import wavfile
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False
    print("WARNING: scipy/numpy not found - normalization disabled.")
    print("  Run:  pip install scipy numpy  to enable it.\n")

# -----------------------------------------------------------------
# PASTE YOUR CREDENTIALS HERE
# -----------------------------------------------------------------
CLIENT_ID     = "vpfg92AwtyKE7mEbv8E1"
CLIENT_SECRET = "kO4eK06SWOWEDfbQ64q9mlYgNusKTrD72CrIHW2v"
# -----------------------------------------------------------------

OUTPUT_DIR      = "guitar_chords"
TOKEN_FILE      = ".freesound_token.json"
OAUTH_AUTH_URL  = "https://freesound.org/apiv2/oauth2/authorize/"
OAUTH_TOKEN_URL = "https://freesound.org/apiv2/oauth2/access_token/"
API_BASE        = "https://freesound.org/apiv2"

# NoiseCollector pack IDs on Freesound
# Pack 647  = "Acoustic Guitar"   (Yamaha, metal pick, Behringer B1 mic)
# Pack 1349 = "Acoustic Guitar 2" (Yamaha, USB mic)
NC_PACK_IDS = [647, 1349]

# Map output chord name -> list of filenames to try (in order of preference).
# NoiseCollector files use names like: yamaha_C.wav, yamaha Am.wav, chord_Em.wav
# The script lowercases everything for matching, so case doesn't matter here.
CHORD_TARGETS = [
    ("C",   ["yamaha_c.wav",   "yamaha c.wav"]),
    ("D",   ["yamaha_d.wav",   "yamaha d.wav"]),
    ("E",   ["yamaha_e.wav",   "yamaha e.wav"]),
    ("F",   ["yamaha_f.wav",   "yamaha f.wav"]),
    ("G",   ["yamaha_g.wav",   "yamaha g.wav"]),
    ("A",   ["yamaha_a.wav",   "yamaha a.wav"]),
    ("B",   ["yamaha_b.wav",   "yamaha b.wav"]),
    ("Am",  ["yamaha_am.wav",  "yamaha am.wav"]),
    ("Bm",  ["yamaha_bm.wav",  "yamaha bm.wav"]),
    ("Dm",  ["yamaha_dm.wav",  "yamaha dm.wav"]),
    ("Em",  ["yamaha_em.wav",  "yamaha em.wav",  "chord_em.wav"]),
    ("Fm",  ["yamaha_fm.wav",  "yamaha fm.wav",  "chord_fm.wav"]),
    ("C7",  ["yamaha_c7.wav",  "yamaha c7.wav"]),
    ("D7",  ["yamaha_d7.wav",  "yamaha d7.wav"]),
    ("E7",  ["yamaha_e7.wav",  "yamaha e7.wav"]),
    ("G7",  ["yamaha_g7.wav",  "yamaha g7.wav"]),
    ("A7",  ["yamaha_a7.wav",  "yamaha a7.wav"]),
    ("B7",  ["yamaha_b7.wav",  "yamaha b7.wav"]),
]


# ── OAuth ──────────────────────────────────────────────────────────

def load_token():
    if os.path.exists(TOKEN_FILE):
        try:
            return json.loads(Path(TOKEN_FILE).read_text())
        except Exception:
            pass
    return None

def save_token(token):
    Path(TOKEN_FILE).write_text(json.dumps(token))

def get_access_token():
    cached = load_token()
    if cached:
        print("Using cached OAuth token.\n")
        return cached["access_token"]

    if CLIENT_ID == "YOUR_CLIENT_ID_HERE":
        print("\nERROR: CLIENT_ID and CLIENT_SECRET not set.")
        print("  1. Go to: https://freesound.org/apiv2/apply/")
        print("  2. Paste credentials at the top of this script.")
        sys.exit(1)

    print("-" * 60)
    print("  FREESOUND ONE-TIME AUTHORIZATION")
    print("-" * 60)

    oauth = OAuth2Session(CLIENT_ID, redirect_uri="http://localhost")
    auth_url, _ = oauth.authorization_url(OAUTH_AUTH_URL)

    print(f"\nOpening browser for authorization...")
    print(f"If it doesn't open automatically, go to:\n\n  {auth_url}\n")
    webbrowser.open(auth_url)

    print("After clicking 'Authorize!', your browser will redirect to")
    print("http://localhost/?code=XXXXXXXX  (the page will show an error - that's fine).")
    print("Copy the FULL URL from your browser's address bar and paste it below.\n")

    redirect = input("Paste the redirect URL here: ").strip()

    parsed = urlparse(redirect)
    params = parse_qs(parsed.query)
    code = params.get("code", [redirect])[0]

    try:
        token = oauth.fetch_token(
            OAUTH_TOKEN_URL,
            code=code,
            client_secret=CLIENT_SECRET,
        )
    except Exception as e:
        sys.exit(f"\nERROR: Token exchange failed: {e}\n"
                 "Check that CLIENT_ID and CLIENT_SECRET are correct.")

    save_token(token)
    print("\nAuthorization successful. Token cached - won't need to repeat this.\n")
    return token["access_token"]


# ── API helpers ────────────────────────────────────────────────────

def api_get(path, params=None, token=None):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    r = requests.get(f"{API_BASE}{path}", params=params, headers=headers, timeout=30)
    r.raise_for_status()
    return r.json()

def get_pack_sounds(pack_id, token):
    """Return list of {id, name} dicts for all sounds in a pack."""
    sounds = []
    path = f"/packs/{pack_id}/sounds/"
    params = {"fields": "id,name", "page_size": 150}
    while path:
        data = api_get(path, params=params, token=token)
        sounds.extend(data.get("results", []))
        next_url = data.get("next")
        if next_url:
            path = next_url.replace(API_BASE, "")
            params = None
        else:
            path = None
    return sounds

def download_original(sound_id, dest, token):
    """Download original audio file for sound_id."""
    r = requests.get(
        f"{API_BASE}/sounds/{sound_id}/download/",
        headers={"Authorization": f"Bearer {token}"},
        timeout=60,
        stream=True,
    )
    if r.status_code != 200:
        return False
    dest.write_bytes(r.content)
    return True


# ── Normalization ──────────────────────────────────────────────────

def normalize_wav(path):
    try:
        rate, data = wavfile.read(str(path))
        if data.dtype == np.int16:
            f = data.astype(np.float32) / 32768.0
        elif data.dtype == np.int32:
            f = data.astype(np.float32) / 2147483648.0
        elif data.dtype == np.float32:
            f = data.copy()
        else:
            return
        peak = np.max(np.abs(f))
        if peak > 0:
            f = f * (0.95 / peak)
        out = np.clip(f * 32767, -32768, 32767).astype(np.int16)
        wavfile.write(str(path), rate, out)
    except Exception as e:
        print(f"      Warning: normalize failed: {e}")


# ── Main ───────────────────────────────────────────────────────────

def main():
    print("\nFreesound Guitar Chord Downloader")
    print("Source: NoiseCollector - Yamaha Acoustic (CC BY 3.0)")
    print(f"Output: .\\{OUTPUT_DIR}\\\n")

    token = get_access_token()
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Index all sounds from both packs: lowercase_filename -> sound_id
    print("Fetching pack contents from Freesound API...")
    pack_index = {}
    for pack_id in NC_PACK_IDS:
        try:
            sounds = get_pack_sounds(pack_id, token)
            for s in sounds:
                pack_index[s["name"].lower()] = s["id"]
            print(f"  Pack {pack_id}: {len(sounds)} sounds indexed.")
        except Exception as e:
            print(f"  Warning: Could not load pack {pack_id}: {e}")

    print(f"\nTotal sounds available: {len(pack_index)}")
    print(f"Looking for {len(CHORD_TARGETS)} chords...\n")

    success, skipped, failed = [], [], []

    for chord_name, patterns in CHORD_TARGETS:
        dest = Path(OUTPUT_DIR) / f"chord_{chord_name}.wav"

        if dest.exists():
            print(f"  --  chord_{chord_name}.wav  already exists")
            skipped.append(chord_name)
            continue

        # Find first matching pattern in the pack index
        sound_id = None
        matched = None
        for pat in patterns:
            sound_id = pack_index.get(pat)
            if sound_id:
                matched = pat
                break

        if not sound_id:
            print(f"  X   chord_{chord_name}.wav  -- no match  (tried: {patterns})")
            failed.append(chord_name)
            continue

        print(f"  ->  chord_{chord_name}.wav  from '{matched}' (#{sound_id})")
        ok = download_original(sound_id, dest, token)

        if ok:
            if HAS_SCIPY:
                normalize_wav(dest)
                print(f"      saved + normalized")
            else:
                print(f"      saved")
            success.append(chord_name)
        else:
            dest.unlink(missing_ok=True)
            print(f"      download failed")
            failed.append(chord_name)

        time.sleep(0.3)  # polite rate limiting

    # Summary
    print(f"\n{'=' * 52}")
    print(f"  Done!")
    print(f"  Downloaded : {len(success)}   {', '.join(success) if success else 'none'}")
    if skipped:
        print(f"  Skipped    : {len(skipped)}   (already existed)")
    if failed:
        print(f"  Failed     : {len(failed)}   {', '.join(failed)}")
        print(f"\n  To fix missing chords:")
        print(f"  1. Log into freesound.org")
        print(f"  2. Go to freesound.org/people/NoiseCollector/sounds/")
        print(f"  3. Find the chord, note the exact filename")
        print(f"  4. Add it to CHORD_TARGETS in this script and re-run")

    if success:
        print(f"""
  ATTRIBUTION (add to ChordSpark About screen):
    Guitar sounds by NoiseCollector on freesound.org
    freesound.org/people/NoiseCollector/
    Licensed under Creative Commons Attribution 3.0
""")


if __name__ == "__main__":
    main()

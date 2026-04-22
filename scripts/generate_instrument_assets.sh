#!/usr/bin/env bash
# Generate SparkSuite instrument card + hero artwork via inference.sh.
#
# Prereqs:
#   infsh login
#   inference.sh credits
#
# Output: drops the 10 files directly into resources/instruments/<id>/ and
# overwrites any existing files. Run one section at a time if you want to
# approve them progressively.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RES="$ROOT/resources/instruments"

# Shared style tokens — matches the Warm Ember palette in spark-showroom.css.
STYLE_CARD="Studio product photography, centered instrument, off-white / warm ivory body, soft warm-ember orange rim light (#FF7B3A) from upper right, deep charcoal #12100E background, shallow depth of field, sharp focus on body, no text, no watermark, no hands, transparent background where possible, 1:1 square composition, subject fills ~75% of frame"
STYLE_HERO="Cinematic product photography, instrument angled 3/4 on dark matte surface, warm ember orange rim light (#FF7B3A), deep charcoal #12100E background fading to near-black at bottom, moody low-key lighting, subtle lens vignette, shallow depth of field, no text, no watermark, no hands, 16:10 wide composition, subject sits in upper two-thirds so the lower third stays dark for caption overlay"

gen () {
  local app="$1"          # model app id
  local prompt="$2"       # full prompt
  local aspect="$3"       # "1:1" or "16:10"
  local out="$4"          # output path
  local size_note="$5"    # human-readable size for logging
  echo ">>> $out ($size_note, $aspect)"
  # Seedream 4.5 accepts an aspect_ratio; Pruna p-image accepts width/height.
  case "$app" in
    bytedance/seedream-4-5)
      infsh app run "$app" --input "{\"prompt\": $(printf '%s' "$prompt" | jq -Rs .), \"aspect_ratio\": \"$aspect\", \"size\": \"2K\"}" --output "$out"
      ;;
    pruna/p-image)
      local w=1024 h=1024
      if [ "$aspect" = "16:10" ]; then w=1280; h=800; fi
      infsh app run "$app" --input "{\"prompt\": $(printf '%s' "$prompt" | jq -Rs .), \"width\": $w, \"height\": $h}" --output "$out"
      ;;
    *)
      echo "unknown app: $app" >&2; exit 2 ;;
  esac
}

# ─── Cards (1:1 square, transparent preferred) ──────────────────────────
gen bytedance/seedream-4-5 "$STYLE_CARD, subject: vintage sunburst electric guitar (Fender Stratocaster silhouette), glossy lacquer, visible tuning pegs and pickups, neck pointing toward upper right" 1:1 "$RES/guitar/card.png"  "320x320 generated at 2K, resize downstream"
gen bytedance/seedream-4-5 "$STYLE_CARD, subject: four-string electric bass guitar, deep-purple (#7C3AED) finish, chrome hardware, long neck pointing toward upper right" 1:1 "$RES/bass/card.png"    "320x320 generated at 2K"
gen bytedance/seedream-4-5 "$STYLE_CARD, subject: soprano ukulele, honey-brown koa wood top, teal (#14B8A6) rim accent light, four nylon strings visible" 1:1 "$RES/ukulele/card.png" "320x320 generated at 2K"
gen bytedance/seedream-4-5 "$STYLE_CARD, subject: grand piano keyboard fragment showing black and white keys, cyan (#0EA5E9) accent glow along the key edge, polished ebony finish" 1:1 "$RES/piano/card.png"   "320x320 generated at 2K"
gen bytedance/seedream-4-5 "$STYLE_CARD, subject: acoustic drum kit overhead view, kick drum center with two toms, chrome cymbals, yellow (#FFE66D) stage lighting highlights" 1:1 "$RES/drums/card.png"   "320x320 generated at 2K"

# ─── Heroes (16:10 wide, dark-bottom for caption legibility) ─────────────
gen bytedance/seedream-4-5 "$STYLE_HERO, subject: Fender Stratocaster electric guitar leaning against a black amp stack, dramatic side light, shallow DOF on the headstock" 16:10 "$RES/guitar/hero.jpg" "800x500 generated at 2K"
gen bytedance/seedream-4-5 "$STYLE_HERO, subject: four-string purple electric bass on a dark velvet stage floor, chrome hardware catching the rim light" 16:10 "$RES/bass/hero.jpg"   "800x500 generated at 2K"
gen bytedance/seedream-4-5 "$STYLE_HERO, subject: koa-wood soprano ukulele on a weathered dark wood table, single warm spotlight from upper left, faint teal fill from the right" 16:10 "$RES/ukulele/hero.jpg" "800x500 generated at 2K"
gen bytedance/seedream-4-5 "$STYLE_HERO, subject: grand piano keyboard in three-quarter perspective, cyan spot light grazing the keys, the rest of the instrument dissolving into shadow" 16:10 "$RES/piano/hero.jpg" "800x500 generated at 2K"
gen bytedance/seedream-4-5 "$STYLE_HERO, subject: acoustic drum kit on a dim stage, single yellow spotlight on the snare, kick drum partially lit, cymbals reflecting warm accent light" 16:10 "$RES/drums/hero.jpg"   "800x500 generated at 2K"

echo ""
echo "Done. Generated files:"
ls -la "$RES"/*/{card.png,hero.jpg} 2>/dev/null || true
echo ""
echo "Next: resize each card.png down to 320x320 and each hero.jpg to 800x500."
echo "ImageMagick one-liner:"
echo "  for f in $RES/*/card.png; do magick \"\$f\" -resize 320x320 \"\$f\"; done"
echo "  for f in $RES/*/hero.jpg; do magick \"\$f\" -resize 800x500^ -gravity center -extent 800x500 \"\$f\"; done"

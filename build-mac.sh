#!/bin/bash
echo "========================================"
echo "  ChordSpark - macOS Build"
echo "========================================"
echo

echo "[1/3] Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Install from https://nodejs.org"
    exit 1
fi
node -v

echo
echo "[2/3] Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: npm install failed"
    exit 1
fi

echo
echo "[3/3] Building macOS DMG..."
npm run build:mac
if [ $? -ne 0 ]; then
    echo "ERROR: Build failed"
    exit 1
fi

echo
echo "========================================"
echo "  Build complete!"
echo "  DMG: dist/ChordSpark-1.0.0.dmg"
echo "========================================"
echo
open dist

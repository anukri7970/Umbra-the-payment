#!/bin/bash
set -e
echo "Installing Compact Compiler..."
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
export PATH="$HOME/.local/bin:$PATH"
compact update 0.31.1

echo "Compiling Umbra Payroll Contract for Frontend..."
mkdir -p preprod-deployment/contracts/src/managed/bboard
compact compile contracts/umbra-payroll.compact preprod-deployment/contracts/src/managed/bboard

echo "Copying WASM/Bincode assets to public directory for runtime fetching..."
mkdir -p public/managed/bboard
cp preprod-deployment/contracts/src/managed/bboard/*.bincode public/managed/bboard/ 2>/dev/null || true
cp preprod-deployment/contracts/src/managed/bboard/*.wasm public/managed/bboard/ 2>/dev/null || true

echo "Building React App..."
vite build

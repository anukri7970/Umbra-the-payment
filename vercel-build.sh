#!/bin/bash
set -e
echo "Installing Compact Compiler..."
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
export PATH="$HOME/.local/bin:$PATH"
compact update 0.31.1

echo "Compiling Umbra Payroll Contract..."
mkdir -p preprod-deployment/contracts/src/managed/bboard
compact compile contracts/umbra-payroll.compact preprod-deployment/contracts/src/managed/bboard

echo "--- COMPACT GENERATED FILES ---"
ls -la preprod-deployment/contracts/src/managed/bboard/contract/
echo "-------------------------------"

echo "Copying compiled managed/ assets to public/ for runtime ZK proof fetching..."
mkdir -p public/managed/bboard
cp -r preprod-deployment/contracts/src/managed/bboard/* public/managed/bboard/ 2>/dev/null || true

echo "--- PUBLIC MANAGED FILES ---"
ls -la public/managed/bboard/ || true
echo "----------------------------"

echo "Building React App..."
tsc -b && vite build

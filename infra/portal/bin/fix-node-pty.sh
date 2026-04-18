#!/bin/bash
# Restores homebridge node-pty-prebuilt-multiarch fork as node-pty
# Needed after ao update or reinstall (linux prebuilt workaround, zero sudo)
set -e
AO_DIR="$HOME/.local/lib/node_modules/@aoagents/ao"
cd "$AO_DIR"
if [ ! -d "node_modules/@homebridge/node-pty-prebuilt-multiarch/prebuilds/linux-x64" ]; then
  npm install @homebridge/node-pty-prebuilt-multiarch --no-save
fi
if [ ! -L "node_modules/node-pty" ] || [ "$(readlink node_modules/node-pty)" != "@homebridge/node-pty-prebuilt-multiarch" ]; then
  rm -rf node_modules/node-pty
  ln -s @homebridge/node-pty-prebuilt-multiarch node_modules/node-pty
fi
echo "node-pty fork symlink OK at $(date)"

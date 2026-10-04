#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname -- "${BASH_SOURCE[0]}")/.."
mkdir -p data
chmod 700 data
exec 9>data/hourly-batch.lock
flock -n 9 || { echo 'Another email batch is active; skipping overlap.'; exit 0; }
exec /usr/bin/node scripts/hourlyBatch.mjs

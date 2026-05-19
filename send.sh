#!/bin/bash
# Pulls email logs from the database, sends emails, and updates log statuses.

set -euo pipefail

cd "C:\Users\zando\Desktop\email-microservice"

node pullSales.ts

npm run send-emails
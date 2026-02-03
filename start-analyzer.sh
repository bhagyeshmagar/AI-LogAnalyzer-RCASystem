#!/bin/bash
# Start Log Analyzer Service
# Fixes timezone issue with PostgreSQL 16 (Asia/Calcutta is deprecated, use Asia/Kolkata)

cd "$(dirname "$0")"

java -Duser.timezone=Asia/Kolkata \
     -jar log-analyzer-service/target/log-analyzer-service-0.0.1-SNAPSHOT.jar "$@"

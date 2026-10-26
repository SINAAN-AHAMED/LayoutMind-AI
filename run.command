#!/bin/bash
cd "$(dirname "$0")" || exit 1
for layoutmind_python in python3.12 python3.13 python3.14 python3; do
  if command -v "$layoutmind_python" >/dev/null 2>&1 && "$layoutmind_python" -c 'import sys; sys.exit(0 if sys.version_info >= (3,12) else 1)' 2>/dev/null; then
    exec "$layoutmind_python" start.py "$@"
  fi
done
printf '%s\n' 'Install Python 3.12, then run: python3.12 start.py'
read -r -p 'Press Return to close.'
exit 1

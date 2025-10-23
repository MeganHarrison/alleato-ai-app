#!/bin/bash
cd "$(dirname "$0")"

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✓ Loaded environment variables from .env"
fi

# Kill any existing server
pkill -f "chatkit_backend.py" || true

# Start the server
echo "Starting ChatKit production server..."
python3 chatkit_backend.py
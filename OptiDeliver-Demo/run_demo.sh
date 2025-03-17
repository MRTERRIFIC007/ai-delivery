#!/bin/bash

echo "Starting OptiDeliver Demo..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install Python 3 and try again."
    exit 1
fi

# Navigate to the API directory
cd api

# Check if requirements are installed
echo "Checking Python dependencies..."
if ! pip3 list | grep -q "flask"; then
    echo "Installing required Python packages..."
    pip3 install -r requirements.txt
fi

# Start the Flask API server in the background
echo "Starting API server..."
python3 app.py &
API_PID=$!

# Wait for the API server to start
echo "Waiting for API server to start..."
sleep 3

# Open the frontend in the default browser
echo "Opening frontend in browser..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open ../frontend/index.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open ../frontend/index.html
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    start ../frontend/index.html
else
    echo "Please open the frontend manually: $(pwd)/../frontend/index.html"
fi

echo "Demo is running!"
echo "Press Ctrl+C to stop the demo."

# Wait for user to press Ctrl+C
trap "echo 'Stopping demo...'; kill $API_PID; echo 'Demo stopped.'; exit 0" INT
wait $API_PID 
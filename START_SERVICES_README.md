# Starting the Optideliver Services

This README provides instructions on how to start all of the Optideliver services together: frontend, backend, and AI service.

## Prerequisites

- Node.js and npm installed
- Python 3.x installed with pip
- For the AI service, the Python requirements listed in `ai-service/requirements.txt`

## Option 1: Using the Shell Script (Unix/Mac)

This option starts all services in the background in a single terminal window.

1. Make the script executable (if not already):

   ```
   chmod +x start-services.sh
   ```

2. Run the script:

   ```
   ./start-services.sh
   ```

3. The script will:

   - Check if required ports are available
   - Install dependencies if needed
   - Start the AI service (Python)
   - Start the backend server
   - Start the frontend server
   - Direct all output to log files in the `logs` directory

4. Press `Ctrl+C` to stop all services when done.

## Option 2: Using the Node.js Script (All Platforms)

This option opens separate terminal windows for each service, which can be easier for debugging.

1. Run the script:

   ```
   node run-services.js
   ```

2. The script will:

   - Open a new terminal window for the AI service
   - Open a new terminal window for the backend server
   - Open a new terminal window for the frontend server
   - Install dependencies in each terminal before starting the service

3. Close each terminal window manually when done.

## Starting Services Manually

If the scripts don't work for your environment, you can start each service manually:

### 1. Start the AI Service

```
cd ai-service
pip install -r requirements.txt
python3 main.py
```

### 2. Start the Backend

```
cd backend
npm install
npm run dev
```

### 3. Start the Frontend

```
cd frontend/sender-interface
npm install
npm run dev
```

## Accessing the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- AI Service: http://localhost:5050

## Troubleshooting

### "Port already in use" error

- Make sure no other services are running on ports 3000, 5000, or 5050
- Kill any processes using those ports:

  ```
  # Find process using a port
  lsof -i :PORT_NUMBER

  # Kill the process
  kill -9 PROCESS_ID
  ```

### AI Service not starting

- Check the logs in the `logs/ai-service.log` file
- Ensure all Python dependencies are installed:
  ```
  cd ai-service
  pip install -r requirements.txt
  ```

### Backend or Frontend not starting

- Check the respective logs in the `logs` directory
- Ensure all Node.js dependencies are installed:
  ```
  cd backend  # or frontend/sender-interface
  npm install
  ```

### Script not working on Windows

- If the shell script doesn't work, try the Node.js script
- If neither works, start the services manually in separate terminal windows

#!/bin/bash

# Colors for better output visibility
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the absolute path to the project directory
PROJECT_DIR="$(pwd)"
echo -e "${YELLOW}Project directory: ${PROJECT_DIR}${NC}"

echo -e "${YELLOW}Starting OptiDeliver services...${NC}"

# Create logs directory if it doesn't exist
mkdir -p "${PROJECT_DIR}/logs"

# Set environment variables
export AI_SERVICE_URL="http://localhost:5050"
export AI_TIMESLOT_SERVICE_URL="http://localhost:5050/timeslot"
export AI_ROUTE_SERVICE_URL="http://localhost:5050/route"

# Backend port - changed from 5000 to 5001
export BACKEND_PORT=5001

# Function to check if a port is in use
check_port() {
  lsof -i :$1 > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo -e "${RED}Error: Port $1 is already in use. Please free it up before continuing.${NC}"
    return 1
  fi
  return 0
}

# Check common ports
check_port $BACKEND_PORT || exit 1  # Backend (now using 5001)
check_port 3000 || exit 1  # Frontend
check_port 5050 || exit 1  # AI Service

# Check directories exist
echo -e "${YELLOW}Checking directory structure...${NC}"
if [ ! -d "${PROJECT_DIR}/ai-service" ]; then
  echo -e "${RED}Error: ai-service directory not found at ${PROJECT_DIR}/ai-service${NC}"
  
  # List all directories to help find the correct one
  echo -e "${YELLOW}Available directories in ${PROJECT_DIR}:${NC}"
  ls -la "${PROJECT_DIR}" | grep "^d"
  
  read -p "Would you like to continue without starting the AI service? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
else
  echo -e "${GREEN}AI service directory found at ${PROJECT_DIR}/ai-service${NC}"
fi

if [ ! -d "${PROJECT_DIR}/backend" ]; then
  echo -e "${RED}Error: backend directory not found at ${PROJECT_DIR}/backend${NC}"
  
  # List all directories to help find the correct one
  echo -e "${YELLOW}Available directories in ${PROJECT_DIR}:${NC}"
  ls -la "${PROJECT_DIR}" | grep "^d"
  
  echo -e "${RED}Cannot continue without backend. Exiting.${NC}"
  exit 1
else
  echo -e "${GREEN}Backend directory found at ${PROJECT_DIR}/backend${NC}"
fi

if [ ! -d "${PROJECT_DIR}/frontend/sender-interface" ]; then
  echo -e "${RED}Error: frontend/sender-interface directory not found at ${PROJECT_DIR}/frontend/sender-interface${NC}"
  
  # List all directories to help find the correct one
  echo -e "${YELLOW}Available directories in ${PROJECT_DIR}/frontend:${NC}"
  ls -la "${PROJECT_DIR}/frontend" | grep "^d"
  
  echo -e "${RED}Cannot continue without frontend. Exiting.${NC}"
  exit 1
else
  echo -e "${GREEN}Frontend directory found at ${PROJECT_DIR}/frontend/sender-interface${NC}"
fi

# Start AI Service
echo -e "${YELLOW}Starting AI Service on port 5050...${NC}"
if [ -d "${PROJECT_DIR}/ai-service" ]; then
  cd "${PROJECT_DIR}/ai-service"
  
  if [ -f "package.json" ]; then
    echo "Starting Node.js AI service..."
    npm start > "${PROJECT_DIR}/logs/ai-service.log" 2>&1 &
  elif [ -f "requirements.txt" ]; then
    echo "Starting Python AI service..."
    if [ -f "main.py" ]; then
      python3 main.py > "${PROJECT_DIR}/logs/ai-service.log" 2>&1 &
    elif [ -f "app.py" ]; then
      python3 app.py > "${PROJECT_DIR}/logs/ai-service.log" 2>&1 &
    else
      python3 -m uvicorn main:app --host 0.0.0.0 --port 5050 > "${PROJECT_DIR}/logs/ai-service.log" 2>&1 &
    fi
  else
    echo -e "${RED}Error: Cannot determine how to start AI service. No package.json or requirements.txt found.${NC}"
    echo -e "${YELLOW}Please start the AI service manually and press any key to continue...${NC}"
    read -n 1
  fi
  
  cd "${PROJECT_DIR}"
  AI_PID=$!
  echo -e "${GREEN}AI Service started with PID: $AI_PID${NC}"
else
  echo -e "${YELLOW}AI Service directory not found. Continuing without starting AI service.${NC}"
  echo -e "${YELLOW}Please ensure the AI service is running manually on port 5050.${NC}"
fi

# Start Backend
echo -e "${YELLOW}Starting Backend on port ${BACKEND_PORT}...${NC}"
if [ -d "${PROJECT_DIR}/backend" ]; then
  cd "${PROJECT_DIR}/backend"
  
  # Create or update .env file for backend with the proper port
  echo "PORT=${BACKEND_PORT}" > .env
  echo "AI_SERVICE_URL=${AI_SERVICE_URL}" >> .env
  echo "AI_TIMESLOT_SERVICE_URL=${AI_TIMESLOT_SERVICE_URL}" >> .env
  echo "AI_ROUTE_SERVICE_URL=${AI_ROUTE_SERVICE_URL}" >> .env
  
  npm install > "${PROJECT_DIR}/logs/backend-setup.log" 2>&1
  npm run dev > "${PROJECT_DIR}/logs/backend.log" 2>&1 &
  BACKEND_PID=$!
  cd "${PROJECT_DIR}"
  echo -e "${GREEN}Backend started with PID: $BACKEND_PID${NC}"
else
  echo -e "${RED}Error: backend directory not found.${NC}"
  exit 1
fi

# Give backend time to start
echo -e "${YELLOW}Waiting 5 seconds for backend to initialize...${NC}"
sleep 5

# Start Frontend
echo -e "${YELLOW}Starting Frontend on port 3000...${NC}"
if [ -d "${PROJECT_DIR}/frontend/sender-interface" ]; then
  cd "${PROJECT_DIR}/frontend/sender-interface"
  
  # Create or update .env file for frontend with backend API URL
  echo "VITE_APP_API_URL=http://localhost:${BACKEND_PORT}" > .env
  
  npm install > "${PROJECT_DIR}/logs/frontend-setup.log" 2>&1
  npm run dev > "${PROJECT_DIR}/logs/frontend.log" 2>&1 &
  FRONTEND_PID=$!
  cd "${PROJECT_DIR}"
  echo -e "${GREEN}Frontend started with PID: $FRONTEND_PID${NC}"
else
  echo -e "${RED}Error: frontend/sender-interface directory not found.${NC}"
  exit 1
fi

echo
echo -e "${GREEN}All services started successfully!${NC}"
echo -e "${YELLOW}Access the application at: ${GREEN}http://localhost:3000${NC}"
echo -e "${YELLOW}Backend API available at: ${GREEN}http://localhost:${BACKEND_PORT}${NC}"
echo -e "${YELLOW}AI Service available at: ${GREEN}http://localhost:5050${NC}"
echo
echo -e "${YELLOW}Logs are available in the logs directory:${NC}"
echo -e "  ${GREEN}Frontend: ${NC}logs/frontend.log"
echo -e "  ${GREEN}Backend: ${NC}logs/backend.log"
echo -e "  ${GREEN}AI Service: ${NC}logs/ai-service.log"
echo
echo -e "${YELLOW}Press Ctrl+C to stop all services.${NC}"

# Function to cleanup processes when script exits
cleanup() {
  echo -e "\n${YELLOW}Shutting down services...${NC}"
  
  echo -e "${YELLOW}Stopping Frontend...${NC}"
  kill $FRONTEND_PID 2>/dev/null || true
  
  echo -e "${YELLOW}Stopping Backend...${NC}"
  kill $BACKEND_PID 2>/dev/null || true
  
  if [ ! -z "$AI_PID" ]; then
    echo -e "${YELLOW}Stopping AI Service...${NC}"
    kill $AI_PID 2>/dev/null || true
  fi
  
  echo -e "${GREEN}All services stopped.${NC}"
  exit 0
}

# Set trap to properly kill all processes on exit
trap cleanup SIGINT SIGTERM EXIT

# Wait for user to press Ctrl+C
wait 
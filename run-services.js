/**
 * This script starts all the required services for the Optideliver application.
 * It opens separate terminal windows for each service.
 */

const { exec } = require("child_process");
const os = require("os");
const fs = require("fs");
const path = require("path");
const platform = os.platform();

// Configuration
const BACKEND_PORT = 5001; // Changed from default 5000
const FRONTEND_PORT = 3000;
const AI_SERVICE_PORT = 5050;

// Get the absolute path to the project directory
const rootDir = process.cwd();
console.log(`Project directory: ${rootDir}`);

// Determine terminal commands based on the OS
let terminalCmd;
let runCommand;

if (platform === "darwin") {
  // macOS
  terminalCmd = 'osascript -e \'tell app "Terminal" to do script';
  runCommand = (command, cwd) => `cd "${cwd}" && ${command}"\'`;
} else if (platform === "win32") {
  // Windows
  terminalCmd = "start cmd.exe /k";
  runCommand = (command, cwd) => `"cd /d "${cwd}" && ${command}"`;
} else {
  // Linux and others
  terminalCmd = "gnome-terminal --";
  runCommand = (command, cwd) =>
    `bash -c 'cd "${cwd}" && ${command}; exec bash'`;
}

// Function to execute a command in a new terminal
function runInNewTerminal(command, cwd = rootDir, title = "") {
  const fullCommand = runCommand(command, cwd);

  console.log(`Starting: ${command} in ${cwd}`);

  if (platform === "darwin") {
    // Add title for macOS
    exec(`${terminalCmd} "${title}; ${fullCommand}"`, (error) => {
      if (error) {
        console.error(`Error starting terminal: ${error}`);
      }
    });
  } else {
    exec(`${terminalCmd} ${fullCommand}`, (error) => {
      if (error) {
        console.error(`Error starting terminal: ${error}`);
      }
    });
  }
}

// Create environment files
function createEnvFiles() {
  try {
    // Check if backend directory exists
    const backendDir = path.join(rootDir, "backend");
    if (fs.existsSync(backendDir)) {
      // Backend .env
      const backendEnvContent = `PORT=${BACKEND_PORT}
AI_SERVICE_URL=http://localhost:${AI_SERVICE_PORT}
AI_TIMESLOT_SERVICE_URL=http://localhost:${AI_SERVICE_PORT}/timeslot
AI_ROUTE_SERVICE_URL=http://localhost:${AI_SERVICE_PORT}/route`;

      fs.writeFileSync(path.join(backendDir, ".env"), backendEnvContent);
      console.log("Created backend .env file");
    } else {
      console.error(`Backend directory not found at: ${backendDir}`);
    }

    // Check if frontend directory exists
    const frontendDir = path.join(rootDir, "frontend", "sender-interface");
    if (fs.existsSync(frontendDir)) {
      // Frontend .env
      const frontendEnvContent = `VITE_APP_API_URL=http://localhost:${BACKEND_PORT}`;
      fs.writeFileSync(path.join(frontendDir, ".env"), frontendEnvContent);
      console.log("Created frontend .env file");
    } else {
      console.error(`Frontend directory not found at: ${frontendDir}`);
    }
  } catch (error) {
    console.error("Error creating .env files:", error);
  }
}

console.log("Starting Optideliver services...");

// Check directory structure
console.log("Checking directory structure...");
const aiServiceDir = path.join(rootDir, "ai-service");
const backendDir = path.join(rootDir, "backend");
const frontendDir = path.join(rootDir, "frontend", "sender-interface");

const aiServiceExists = fs.existsSync(aiServiceDir);
const backendExists = fs.existsSync(backendDir);
const frontendExists = fs.existsSync(frontendDir);

if (!aiServiceExists) {
  console.error(`AI Service directory not found at: ${aiServiceDir}`);
  console.log("Available directories:");
  fs.readdirSync(rootDir)
    .filter((item) => fs.statSync(path.join(rootDir, item)).isDirectory())
    .forEach((dir) => console.log(`- ${dir}`));
}

if (!backendExists) {
  console.error(`Backend directory not found at: ${backendDir}`);
  console.log("Available directories:");
  fs.readdirSync(rootDir)
    .filter((item) => fs.statSync(path.join(rootDir, item)).isDirectory())
    .forEach((dir) => console.log(`- ${dir}`));
  console.error("Cannot continue without backend directory. Exiting.");
  process.exit(1);
}

if (!frontendExists) {
  console.error(`Frontend directory not found at: ${frontendDir}`);
  if (fs.existsSync(path.join(rootDir, "frontend"))) {
    console.log("Available directories in frontend:");
    fs.readdirSync(path.join(rootDir, "frontend"))
      .filter((item) =>
        fs.statSync(path.join(rootDir, "frontend", item)).isDirectory()
      )
      .forEach((dir) => console.log(`- ${dir}`));
  }
  console.error("Cannot continue without frontend directory. Exiting.");
  process.exit(1);
}

// Create required environment files
createEnvFiles();

// Start AI Service
console.log("Attempting to start AI Service...");
if (aiServiceExists) {
  // Determine how to start the AI service
  const mainPyExists = fs.existsSync(path.join(aiServiceDir, "main.py"));
  const appPyExists = fs.existsSync(path.join(aiServiceDir, "app.py"));
  const packageJsonExists = fs.existsSync(
    path.join(aiServiceDir, "package.json")
  );

  if (mainPyExists) {
    runInNewTerminal(
      "pip install -r requirements.txt && python3 main.py",
      aiServiceDir,
      "AI Service (Python)"
    );
  } else if (appPyExists) {
    runInNewTerminal(
      "pip install -r requirements.txt && python3 app.py",
      aiServiceDir,
      "AI Service (Python)"
    );
  } else if (packageJsonExists) {
    runInNewTerminal(
      "npm install && npm start",
      aiServiceDir,
      "AI Service (Node.js)"
    );
  } else {
    console.log(
      "Could not determine how to start the AI service. Please start it manually."
    );
    console.log("Try: cd ai-service && python3 main.py");
  }
} else {
  console.log(
    "AI Service directory not found. Please start the AI service manually."
  );
}

// Start Backend
console.log(`Starting Backend on port ${BACKEND_PORT}...`);
runInNewTerminal(
  "npm install && npm run dev",
  backendDir,
  `Backend Server (Port ${BACKEND_PORT})`
);

// Start Frontend
console.log("Starting Frontend...");
runInNewTerminal("npm install && npm run dev", frontendDir, "Frontend Server");

console.log("\nAll services have been started in separate terminal windows.");
console.log("Access the application at: http://localhost:3000");
console.log(`Backend API available at: http://localhost:${BACKEND_PORT}`);
console.log("AI Service should be available at: http://localhost:5050");
console.log(
  "\nPress Ctrl+C to close this script (services will continue running in their terminal windows)."
);

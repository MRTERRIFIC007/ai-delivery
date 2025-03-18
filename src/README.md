# OptiDeliver - AI-Powered Delivery Optimization System

## Project Structure

The project is organized as follows:

```
src/
├── backend/                  # Backend API server
│   ├── src/                  # Source code
│   ├── package.json          # Backend dependencies
│   └── tsconfig.json         # TypeScript configuration
├── frontend/                 # Frontend applications
│   ├── sender-interface/     # Sender interface web application
│   ├── postman-app/          # Postman mobile application
│   └── route-dashboard/      # Admin route dashboard
├── ai-service/               # AI optimization service
├── docs/                     # Documentation
│   ├── api/                  # API documentation
│   ├── backend/              # Backend documentation
│   ├── frontend/             # Frontend documentation
│   └── deployment/           # Deployment guides
├── tests/                    # Test suites
│   ├── backend/              # Backend tests
│   └── frontend/             # Frontend tests
├── FOUNDMENTALS_TRUTH.md     # Project foundations and core principles
└── package.json              # Root package.json for project-wide scripts
```

## Getting Started

### Installation

To install all dependencies:

```bash
npm run install:all
```

Or install specific components:

```bash
npm run install:backend    # Install backend dependencies
npm run install:frontend   # Install sender interface dependencies
npm run install:postman    # Install postman app dependencies
npm run install:dashboard  # Install route dashboard dependencies
npm run install:ai         # Install AI service dependencies
```

### Running the Application

#### Start Backend Server

```bash
npm run start:backend
```

#### Start Sender Interface (Main Frontend)

```bash
npm run start:frontend
```

#### Start Postman App

```bash
npm run start:postman
```

#### Start Route Dashboard

```bash
npm run start:dashboard
```

#### Start AI Service

```bash
npm run start:ai
```

### Testing

Run all tests:

```bash
npm test
```

Or run specific test suites:

```bash
npm run test:backend    # Run backend tests
npm run test:frontend   # Run frontend tests
```

## Database

- MongoDB Atlas
- Connection string is stored in backend/.env file

## Authentication

For development, any email/password combination can be used to log in.

## API Documentation

API documentation is available in the `/docs/api` directory.

## Main Features

1. Sender Interface for creating and tracking deliveries
2. Postman App for delivery management
3. Route Dashboard for administrative oversight
4. AI-powered route optimization service

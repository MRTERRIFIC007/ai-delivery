# OptiDeliver: AI-Powered Delivery Optimization System

OptiDeliver is an advanced delivery optimization system that leverages artificial intelligence to predict optimal delivery time slots, optimize routes, and improve overall delivery efficiency.

## Project Structure

The project is organized into three main components:

```
OptiDeliver/
├── ai-service/        # AI prediction model and datasets
│   ├── Dataset.csv    # Training data for the AI model
│   ├── prediction.py  # Python script for the prediction service
│   └── prediction.ipynb # Jupyter notebook with model development
├── backend/           # Node.js/Express backend server
│   ├── src/           # Source code for the backend
│   │   ├── config/    # Configuration files
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/ # Express middleware
│   │   ├── models/    # Database models
│   │   ├── routes/    # API routes
│   │   ├── utils/     # Utility functions
│   │   └── index.ts   # Main application entry point
│   ├── .env           # Environment variables
│   ├── package.json   # Dependencies
│   └── tsconfig.json  # TypeScript configuration
└── frontend/          # Web interfaces
    ├── sender-interface/     # Interface for senders to create delivery orders
    ├── postman-app/          # App for delivery personnel
    └── route-dashboard/      # Management dashboard for route optimization

```

## Components

### 1. AI Prediction Service

The AI component uses machine learning to predict optimal delivery time slots based on various factors like distance, weather, traffic, and historical data. It achieves 92.7% accuracy using a Decision Tree Classifier.

- **Location**: `ai-service/`
- **Key Files**:
  - `prediction.py`: Python script that can be run as a Flask API service
  - `Dataset.csv`: Training data for the model
  - `prediction.ipynb`: Development notebook with model exploration

### 2. Backend API Server

A Node.js/Express server that handles all business logic, database operations, and serves as an intermediary between the frontend applications and the AI service.

- **Location**: `backend/`
- **Technology Stack**: TypeScript, Node.js, Express, MongoDB
- **Features**:
  - User authentication and management
  - Order processing
  - Delivery scheduling
  - Integration with AI prediction service
  - RESTful API endpoints

### 3. Frontend Applications

#### Sender Interface

- **Location**: `frontend/sender-interface/`
- **Purpose**: Allows senders to create and track delivery orders
- **Technology**: React.js

#### Postman App

- **Location**: `frontend/postman-app/`
- **Purpose**: Mobile application for delivery personnel showing optimized routes
- **Technology**: React Native

#### Route Optimization Dashboard

- **Location**: `frontend/route-dashboard/`
- **Purpose**: Management dashboard for monitoring deliveries and optimizing routes
- **Technology**: React.js, Leaflet maps

## Getting Started

### AI Service Setup

1. Navigate to the AI service directory:

   ```
   cd ai-service
   ```

2. Install required Python packages:

   ```
   pip install flask flask-cors pandas scikit-learn numpy
   ```

3. Run the AI prediction service:
   ```
   python prediction.py
   ```
   This will start the service at http://localhost:5001

### Backend Setup

1. Navigate to the backend directory:

   ```
   cd backend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Configure environment variables:

   - Copy `.env.example` to `.env` (if not already present)
   - Update MongoDB connection string and other settings

4. Run the backend server:
   ```
   npm run dev
   ```
   This will start the server at http://localhost:3000

### Frontend Setup

1. Navigate to the desired frontend application:

   ```
   cd frontend/sender-interface
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the application:
   ```
   npm start
   ```

## System Architecture

OptiDeliver follows a microservices architecture with these data flows:

1. Sender creates a delivery order through the Sender Interface
2. Backend validates the order and requests prediction from AI Service
3. AI Service returns optimal delivery time slots
4. Backend schedules the delivery and notifies delivery personnel
5. Delivery personnel receive route information through the Postman App
6. Managers monitor overall delivery status via the Route Optimization Dashboard

## API Documentation

The backend API provides the following endpoints:

- `/api/users` - User management
- `/api/orders` - Order processing
- `/api/deliveries` - Delivery management
- `/api/time-slots` - Time slot management

For detailed API documentation, run the backend server and visit `/api-docs`.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

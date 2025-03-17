# OptiDeliver System Setup Guide

This guide provides step-by-step instructions on how to run the OptiDeliver AI-Powered Delivery Optimization System.

## System Overview

OptiDeliver consists of four main components:

1. **AI Prediction Model**: A machine learning model that predicts optimal delivery time slots based on location and address type.
2. **Sender Interface**: A web application for senders to create and manage delivery orders.
3. **Postman App**: An application for delivery personnel to view and update delivery statuses.
4. **Route Optimization Dashboard**: A dashboard for visualizing and optimizing delivery routes.

## Prerequisites

- **Python 3.10+** with pip
- **Node.js 14+** with npm
- Modern web browser (Chrome, Firefox, Safari, or Edge)

## 1. Setting Up the AI Prediction Model

The prediction model is the core component that powers the delivery time slot optimization.

### Installation

```bash
# Install required Python packages
pip install pandas numpy scikit-learn matplotlib jupyter
```

### Running the Model

You can run the prediction model in two ways:

#### Option 1: As a Python Script

```bash
# Navigate to the project directory
cd /path/to/OptiDeliver

# Run the Python script
python prediction.py
```

#### Option 2: As a Jupyter Notebook

```bash
# Navigate to the project directory
cd /path/to/OptiDeliver

# Start Jupyter Notebook
jupyter notebook prediction.ipynb
```

The notebook will open in your browser. Click "Run All" to execute all cells.

### Expected Output

The model will:

- Load and process the delivery dataset
- Train a decision tree classifier
- Achieve approximately 92.7% accuracy
- Make predictions for sample delivery addresses
- Display the predicted time slots for each address

## 2. Setting Up the Web Components

The system includes three web applications that work together to provide a complete delivery management solution.

### Sender Interface

```bash
# Navigate to the Sender Interface directory
cd /path/to/OptiDeliver/Sender-interface

# Install dependencies
npm install

# Start the development server
npm run dev
```

The Sender Interface will be available at: http://localhost:5173 (or another port if 5173 is in use)

### Postman App

```bash
# Navigate to the Postman App directory
cd /path/to/OptiDeliver/Postman-app/project

# Install dependencies
npm install

# Start the development server
npm run dev
```

The Postman App will be available at: http://localhost:5174 (or another port if 5173 is in use)

### Route Optimization Dashboard

```bash
# Navigate to the Route Optimization Dashboard directory
cd /path/to/OptiDeliver/Route-optimization-dashboard/route/project

# Install dependencies
npm install

# Start the development server
npm run dev
```

The Route Optimization Dashboard will be available at: http://localhost:5175 (or another port if 5173 and 5174 are in use)

## Troubleshooting

### Empty package.json in Route Dashboard

If you encounter an error about an empty package.json file in the Route-optimization-dashboard/route directory, create a proper package.json file:

```bash
cd /path/to/OptiDeliver/Route-optimization-dashboard/route
echo '{
  "name": "route-optimization-dashboard",
  "version": "1.0.0",
  "private": true,
  "description": "Route Optimization Dashboard for OptiDeliver"
}' > package.json
```

### Port Already in Use

If a port is already in use, the development server will automatically try the next available port. Check the terminal output for the correct URL.

## Using the System

1. **AI Prediction Model**: Provides time slot predictions based on delivery addresses.
2. **Sender Interface**: Use this to create new delivery orders and track existing ones.
3. **Postman App**: Delivery personnel use this to view assigned deliveries and update statuses.
4. **Route Optimization Dashboard**: Visualizes delivery routes and optimizes delivery order.

## Data Flow

1. Senders create delivery orders through the Sender Interface
2. The AI model predicts optimal time slots for these deliveries
3. Delivery personnel receive optimized routes through the Postman App
4. Managers monitor delivery progress through the Route Optimization Dashboard

## Additional Resources

- Dataset.csv: Contains the delivery data used for training the prediction model
- prediction.ipynb: Jupyter notebook with the complete prediction model
- prediction.py: Python script version of the prediction model

# OptiDeliver Demo Project Structure

This document provides an overview of the project structure for the OptiDeliver demo.

## Directory Structure

```
OptiDeliver-Demo/
├── api/                      # Backend API
│   ├── app.py                # Flask API server
│   ├── Dataset.csv           # Training data for the AI model
│   ├── requirements.txt      # Python dependencies
│   └── API_DOCUMENTATION.md  # API documentation
│
├── frontend/                 # Frontend web application
│   └── index.html            # HTML/JS/CSS for the demo interface
│
├── README.md                 # Project overview and setup instructions
├── PHASE2_PLAN.md            # Plan for full implementation
├── PROJECT_STRUCTURE.md      # This file
├── run_demo.sh               # Shell script to run the demo (Unix/Mac)
└── run_demo.bat              # Batch file to run the demo (Windows)
```

## Component Overview

### API (Backend)

The backend API is built with Flask and provides endpoints for:

- Health check (`GET /health`)
- Predicting optimal time slots (`POST /predict`)

The AI model is a Decision Tree Classifier trained on delivery data from `Dataset.csv`. It predicts the optimal time slot for a delivery based on customer ID, location coordinates, and address type.

### Frontend

The frontend is a single HTML file with embedded JavaScript and CSS. It provides:

- A form for creating delivery orders
- A results panel showing AI predictions
- A map visualization of delivery locations
- A list of scheduled deliveries

The frontend communicates with the backend API using fetch requests.

## Data Flow

1. User enters customer and location information in the frontend form
2. Frontend sends a POST request to the `/predict` endpoint
3. Backend processes the request and runs the AI model
4. Backend returns the predicted optimal time slot
5. Frontend displays the prediction and updates the map
6. Frontend adds the delivery to the list of scheduled deliveries

## Technologies Used

- **Backend**: Python, Flask, scikit-learn, pandas, numpy
- **Frontend**: HTML, CSS, JavaScript, Leaflet.js (for maps)
- **Data**: CSV file with delivery data

## Future Enhancements (Phase 2)

See `PHASE2_PLAN.md` for details on the full implementation plan, which includes:

- Database integration
- User authentication
- Mobile app for delivery personnel
- Advanced route optimization
- Real-time tracking

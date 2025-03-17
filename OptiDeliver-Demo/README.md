# OptiDeliver Demo

This is a simplified demonstration of the OptiDeliver AI-Powered Delivery Optimization System. It showcases the core functionality of using AI to predict optimal delivery time slots based on customer location and address type.

## Features

- AI-powered prediction of optimal delivery time slots
- Simple sender interface for creating delivery orders
- Map visualization of delivery locations
- Route optimization dashboard

## Setup Instructions

### Prerequisites

- Python 3.7 or higher
- Web browser (Chrome, Firefox, Safari, or Edge)

### API Setup

1. Navigate to the `api` directory:

   ```
   cd OptiDeliver-Demo/api
   ```

2. Install the required Python packages:

   ```
   pip install -r requirements.txt
   ```

3. Start the Flask API server:

   ```
   python app.py
   ```

   The API server will start on http://localhost:5000

### Frontend Setup

1. Simply open the `frontend/index.html` file in your web browser:

   ```
   open OptiDeliver-Demo/frontend/index.html
   ```

   Or you can double-click the file in your file explorer.

## How to Use

1. Make sure the API server is running.
2. Open the frontend in your web browser.
3. Fill in the order form with customer details:
   - Customer ID (e.g., CUST102)
   - Latitude and Longitude (location coordinates)
   - Address Type (Residential, Commercial, or Industrial)
4. Click "Create Order & Predict Optimal Time Slot"
5. View the AI prediction results and the updated map.

## What's Working in This Demo

- AI prediction model (92.7% accuracy)
- API endpoint for predictions
- Frontend form for order creation
- Map visualization of delivery locations
- Basic route optimization dashboard

## What's Missing (Full Implementation)

- User authentication and accounts
- Persistent database storage
- Backend server for storing orders and user data
- Mobile app for delivery personnel
- Advanced route optimization algorithms
- Real-time tracking and updates
- Integration with external mapping services

## Technical Details

- The AI model uses a Decision Tree Classifier trained on delivery data
- The API is built with Flask and includes CORS support
- The frontend uses vanilla HTML, CSS, and JavaScript
- Map visualization is implemented using Leaflet.js

## Next Steps for Full Implementation

See the Phase 2 plan in the project documentation for details on implementing the full system.

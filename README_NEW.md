# OptiDeliver - AI-Powered Delivery Optimization System

## Overview

OptiDeliver is a comprehensive solution designed to optimize delivery routes, predict optimal time slots, and provide interfaces for both senders and delivery personnel to manage shipments efficiently.

![OptiDeliver System](https://github.com/rishitsura/india-post-delivery-system/raw/main/india%20post%20logo.png)

## Key Features

- **AI-Powered Time Slot Prediction**: Uses machine learning to predict the optimal delivery time slots based on location and address type.
- **Route Optimization**: Calculates the most efficient delivery routes to minimize travel time and distance.
- **Sender Interface**: Web application for creating and tracking delivery orders.
- **Postman App**: Mobile-friendly application for delivery personnel to view assignments and update statuses.
- **Analytics Dashboard**: Visualizes delivery metrics and route optimization.

## Components

The system consists of four main components:

1. **AI Prediction Model** (`prediction.py` / `prediction.ipynb`)

   - Decision Tree Classifier with 92.7% accuracy
   - Predicts optimal time slots based on geographical and address data

2. **Sender Interface** (`Sender-interface/`)

   - React-based web application
   - Order creation and tracking functionality

3. **Postman App** (`Postman-app/project/`)

   - React application for delivery personnel
   - Delivery status updates and route visualization

4. **Route Optimization Dashboard** (`Route-optimization-dashboard/route/project/`)
   - Interactive map visualization
   - Delivery route optimization

## Getting Started

For detailed setup instructions, please refer to the [Setup Guide](SETUP_GUIDE.md).

### Quick Start

```bash
# Run the AI prediction model
python prediction.py

# Start the Sender Interface
cd Sender-interface && npm install && npm run dev

# Start the Postman App
cd Postman-app/project && npm install && npm run dev

# Start the Route Optimization Dashboard
cd Route-optimization-dashboard/route/project && npm install && npm run dev
```

## Dataset

The system uses a dataset of 5,000 delivery records with the following features:

- Customer ID
- Delivery coordinates (latitude, longitude)
- Address type
- Time slot preferences
- Delivery outcomes

## Technologies Used

- **Backend**: Python, scikit-learn, pandas, numpy
- **Frontend**: React, TypeScript, Tailwind CSS
- **Mapping**: Leaflet, React Leaflet
- **Development**: Vite, Node.js

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Dataset provided by India Post delivery records
- Developed as part of the Smart India Hackathon 2024

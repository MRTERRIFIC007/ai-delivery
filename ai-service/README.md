# OptiDeliver AI Service

The OptiDeliver AI Service provides intelligent delivery optimization and time slot prediction for postal and delivery services. This service uses machine learning to predict optimal delivery time slots based on customer preferences, location data, and historical delivery patterns.

## Features

- **Time Slot Prediction**: Predicts the optimal delivery time slot for each customer based on various factors including location, address type, and day of week.
- **Route Optimization**: Optimizes delivery routes to minimize travel distance and time while considering time slot constraints.
- **Customer Preference Learning**: Learns from customer interactions to improve future predictions.
- **Dataset Management**: Tools for data preprocessing, visualization, and augmentation.

## Getting Started

### Prerequisites

- Python 3.8+
- pip (Python package manager)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/optideliver.git
   cd optideliver/ai-service
   ```

2. Create a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Configuration

1. Create a `.env` file in the `ai-service` directory with the following settings:

   ```
   DEBUG=True
   PORT=5000
   HOST=0.0.0.0
   ```

2. Place your delivery dataset in the `ai-service` directory as `Dataset.csv`. The dataset should include the following columns:
   - Order ID
   - Postman ID
   - Customer ID
   - Delivery Address (Lat, Long)
   - Item Type
   - Booking Date
   - Delivery Date
   - Day of Week
   - Address Type
   - Initial Time Slot
   - Modified Time Slot (optional)

## Running the Service

1. Start the AI service:

   ```bash
   python main.py
   ```

2. The service will be available at `http://localhost:5000` (or the port specified in your `.env` file).

## API Endpoints

### Main Service

- `GET /`: Information about the service and available endpoints
- `GET /health`: Health check for the service
- `POST /create-order`: Create a new delivery order and predict optimal time slot
- `GET /sample-dataset`: Retrieve a sample of the delivery dataset

### Time Slot Prediction

- `POST /timeslot/predict-timeslot`: Predict optimal delivery time slot
- `POST /timeslot/learn`: Update customer preference data
- `GET /timeslot/customer-preferences/<customer_id>`: Retrieve customer preferences
- `POST /timeslot/retrain`: Force model retraining
- `GET /timeslot/health`: Health check for time slot prediction service

### Route Optimization

- `POST /route/optimize-routes`: Optimize delivery routes
- `POST /route/calculate-eta`: Calculate estimated arrival times for a route
- `GET /route/health`: Health check for route optimization service

## API Usage Examples

### Predict Time Slot

```bash
curl -X POST http://localhost:5000/timeslot/predict-timeslot \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUST102",
    "latitude": 17.486395,
    "longitude": 78.500423,
    "address_type": 1,
    "day_of_week": 3,
    "item_type": "GID-PAN"
  }'
```

### Optimize Routes

```bash
curl -X POST http://localhost:5000/route/optimize-routes \
  -H "Content-Type: application/json" \
  -d '{
    "deliveries": [
      {
        "customer_id": "CUST101",
        "latitude": 17.485,
        "longitude": 78.501,
        "address_type": 0,
        "time_slot": 3
      },
      {
        "customer_id": "CUST102",
        "latitude": 17.486,
        "longitude": 78.500,
        "address_type": 1,
        "time_slot": 3
      }
    ],
    "num_postmen": 1,
    "depot_latitude": 17.480,
    "depot_longitude": 78.490
  }'
```

### Create New Order

```bash
curl -X POST http://localhost:5000/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUST102",
    "latitude": 17.486395,
    "longitude": 78.500423,
    "address_type": 1,
    "item_type": "GID-PAN",
    "day_of_week": 3,
    "delivery_date": "2024-12-18"
  }'
```

## Component Documentation

### Dataset Manager

The Dataset Manager handles loading, preprocessing, and augmentation of delivery data. Key functionality:

- Data loading and preprocessing
- Feature engineering
- Data visualization
- Dataset augmentation with synthetic data
- Statistical analysis

### Time Slot Prediction

The Time Slot Prediction service uses machine learning to predict optimal delivery time slots. Key features:

- ML-based time slot prediction
- Customer preference learning
- Fallback prediction for new customers
- Explanations for predictions

### Route Optimization

The Route Optimization service implements efficient delivery route planning algorithms. Key features:

- Distance matrix calculation
- Nearest neighbor algorithm
- 2-opt route improvement
- Clustering for multi-postman routing
- Time-based route planning
- ETA calculation

## Testing

Run the test suite to validate the AI service:

```bash
python test_ai_service.py
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

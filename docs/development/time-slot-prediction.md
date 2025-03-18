# AI Time Slot Prediction Implementation

## Overview

The AI time slot prediction system is a core component of the Optideliver platform, designed to analyze customer preferences and provide personalized delivery time recommendations. The system leverages machine learning to understand patterns in delivery preferences based on various contextual factors.

## Implementation Details

### AI Service Architecture

- **Technology**: Python with Flask API
- **Port**: 5005
- **Model**: Random Forest Classifier with preprocessing pipeline
- **Training Data**: Combination of synthetic data and real customer preferences

### Core Components

#### 1. Historical Data Management

```python
# Save historical data to this file
HISTORICAL_DATA_FILE = 'timeslot_preferences.json'

def load_historical_data():
    """Load historical recipient preferences if available"""
    global recipient_preferences
    try:
        if os.path.exists(HISTORICAL_DATA_FILE):
            with open(HISTORICAL_DATA_FILE, 'r') as f:
                recipient_preferences = json.load(f)
            print(f"Loaded {len(recipient_preferences)} recipient preference records")
        else:
            recipient_preferences = {}
            print("No historical data found, starting fresh")
    except Exception as e:
        print(f"Error loading historical data: {e}")
        recipient_preferences = {}
```

#### 2. Model Initialization and Training

```python
def initialize_model():
    """Initialize the time slot prediction model"""
    global model, pipeline
    try:
        # Load historical preference data
        load_historical_data()

        # Initialize Random Forest model
        model = RandomForestClassifier(n_estimators=100)

        # Create preprocessing pipeline for categorical features
        categorical_features = ['location_type', 'area_code', 'day_type']
        numerical_features = ['day_of_week', 'recipient_id', 'distance', 'order_value']

        categorical_transformer = OneHotEncoder(handle_unknown='ignore')

        preprocessor = ColumnTransformer(
            transformers=[
                ('cat', categorical_transformer, categorical_features),
                ('num', 'passthrough', numerical_features)
            ])

        pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', model)
        ])

        print("Time slot prediction model initialized")
        return True
    except Exception as e:
        print(f"Error initializing model: {e}")
        return False
```

#### 3. API Endpoints

##### Prediction Endpoint

```python
@app.route('/predict-timeslot', methods=['POST'])
def predict_time_slot():
    """API endpoint to predict optimal time slots for delivery"""
    try:
        if not request.json:
            return jsonify({'error': 'No data provided'}), 400

        # Extract data from request
        customer_data = request.json

        required_fields = ['recipient_id', 'day_of_week', 'area_code']
        for field in required_fields:
            if field not in customer_data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        predictions = predict_time_slots(customer_data)

        return jsonify({
            'success': True,
            'predictions': predictions,
            'recipient_id': customer_data.get('recipient_id', 0)
        })
    except Exception as e:
        print(f"Error in prediction endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'predictions': get_fallback_predictions()
        }), 500
```

##### Learning Endpoint

```python
@app.route('/learn', methods=['POST'])
def learn_preference():
    """API endpoint to learn from user preferences"""
    try:
        if not request.json:
            return jsonify({'error': 'No data provided'}), 400

        data = request.json
        if 'recipient_data' not in data or 'selected_slot' not in data:
            return jsonify({'error': 'Missing required data'}), 400

        recipient_data = data['recipient_data']
        selected_slot = data['selected_slot']

        # Add preference to historical data
        recipient_id = str(recipient_data.get('recipient_id', 0))
        if recipient_id not in recipient_preferences:
            recipient_preferences[recipient_id] = []

        # Add the preference with timestamp
        preference = {
            'recipient_id': recipient_id,
            'day_of_week': recipient_data.get('day_of_week', 0),
            'day_type': 'weekday' if recipient_data.get('day_of_week', 0) < 5 else 'weekend',
            'preferred_slot': selected_slot,
            'location_type': recipient_data.get('location_type', 'home'),
            'area_code': recipient_data.get('area_code', '110'),
            'distance': recipient_data.get('distance', 5.0),
            'order_value': recipient_data.get('order_value', 500.0),
            'timestamp': datetime.now().isoformat()
        }

        recipient_preferences[recipient_id].append(preference)

        # Save updated preferences
        save_historical_data()

        # Retrain model with new data
        train_model()

        return jsonify({
            'success': True,
            'message': 'Preference recorded and model updated'
        })
    except Exception as e:
        print(f"Error in learning endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
```

## Integration with Backend

The Node.js backend makes API calls to the AI service to get time slot predictions. The implementation is in the `timeSlotController.ts` file:

```typescript
// Get AI predictions for time slots
let aiPredictions = [];
try {
  // Call AI prediction service with India Post specific parameters
  const dayOfWeek = queryDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const customerLocation = area;
  const locationType = addressType || "home";
  const areaCode = postalCode
    ? (postalCode as string).substring(0, 3)
    : "110"; // First 3 digits of postal code

  // Try to connect to AI service, but handle if it's not available
  try {
    const response = await fetch("http://localhost:5005/predict-timeslot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient_id: customerId || customer?.id || 0,
        day_of_week: dayOfWeek,
        location_type: locationType,
        area_code: areaCode,
        distance: 5.0, // Default distance, could be calculated based on delivery area
        order_value: 500.0, // Default order value
      }),
      // Add a timeout to prevent hanging if service is down
      timeout: 3000,
    });
```

## Frontend Display

The predictions are displayed in the `TimeSlotSelector.tsx` component, which:

1. Highlights the top recommended time slot
2. Shows a confidence meter for each prediction
3. Displays the reasoning behind the recommendation

## How to Test

1. Run the AI service: `cd ai-service && python3 timeslot_prediction.py`
2. Request predictions for a user multiple times
3. Select different time slots to observe the learning behavior
4. Check the `timeslot_preferences.json` file to see recorded preferences

## Future Improvements

1. **Enhanced Model**: Incorporate more features like weather data, traffic patterns, and seasonal trends
2. **A/B Testing**: Implement A/B testing for different prediction algorithms
3. **Real-time Updates**: Add WebSocket support for real-time prediction updates
4. **Batch Processing**: Add support for batch prediction for next-day deliveries

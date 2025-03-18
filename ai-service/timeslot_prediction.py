import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import pickle
import random
import json
import os.path

load_dotenv()

app = Flask(__name__)
CORS(app)

# Define time slots that match India Post delivery windows
# India Post typically delivers between 10am to 5pm
TIME_SLOTS = [
    '10-11', '11-12', '12-13', '13-14', 
    '14-15', '15-16', '16-17', '17-18', '18-19'
]

# Save historical data to this file
HISTORICAL_DATA_FILE = 'timeslot_preferences.json'

# Initialize model variables
model = None
label_encoder = LabelEncoder()
pipeline = None
recipient_preferences = {}  # Maps recipient_id to their historical preferences

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

def save_historical_data():
    """Save recipient preferences to disk"""
    try:
        with open(HISTORICAL_DATA_FILE, 'w') as f:
            json.dump(recipient_preferences, f)
        print(f"Saved {len(recipient_preferences)} recipient preference records")
    except Exception as e:
        print(f"Error saving historical data: {e}")

def initialize_model():
    """
    Initialize or load the time slot prediction model
    In a real system, this would load a trained model from disk
    """
    global model, pipeline
    try:
        # Load historical preference data
        load_historical_data()
        
        # Initialize the model
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
        
        # Create the full pipeline
        pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', model)
        ])
        
        print("Time slot prediction model initialized")
        return True
    except Exception as e:
        print(f"Error initializing model: {e}")
        return False

def generate_mock_data():
    """
    Generate mock historical data for initial model training
    This simulates customer preference patterns
    Focuses on India Post delivery scenarios
    """
    # Days of week (0=Monday, 6=Sunday)
    days = list(range(7))
    
    # India Post typically doesn't deliver on Sundays, so we focus on weekdays
    weekdays = list(range(6))  # 0-5 (Monday to Saturday)
    
    # Location types (home, office, etc)
    location_types = ['home', 'office', 'commercial', 'residential']
    
    # Area codes (postal codes first 3 digits)
    area_codes = ['110', '400', '600', '700', '500']  # Major Indian cities
    
    # Generate 1000 sample records
    data = []
    for _ in range(1000):
        recipient_id = str(random.randint(1, 100))
        day = random.choice(weekdays)
        day_type = 'weekday' if day < 5 else 'weekend'
        area_code = random.choice(area_codes)
        
        # Different patterns for different customers based on India Post scenarios
        if int(recipient_id) % 3 == 0:  # Working professionals
            # Working professionals typically prefer evening deliveries after work
            if day == 5:  # Saturday
                slot = random.choice(TIME_SLOTS)  # Any time on weekend
            else:
                slot = random.choice(TIME_SLOTS[5:])  # Evening on weekdays (after 4pm)
            location = 'home' if random.random() > 0.2 else 'residential'
        elif int(recipient_id) % 3 == 1:  # Business customers
            # Business customers prefer business hours
            if day < 5:  # Weekday
                slot = random.choice(TIME_SLOTS[1:5])  # Business hours (11am-3pm)
            else:
                slot = random.choice(TIME_SLOTS[0:3])  # Morning on Saturday
            location = 'office' if random.random() > 0.3 else 'commercial'
        else:  # Mixed or stay-at-home
            if day < 5:  # Weekday
                # During daytime for homemakers
                slot = random.choice(TIME_SLOTS[0:5])  # Morning to afternoon
            else:
                slot = random.choice(TIME_SLOTS)  # Any time on weekend
            location = 'home' if random.random() > 0.3 else 'residential'
        
        # Generate other features
        distance = round(random.uniform(1, 30), 2)  # kilometers
        order_value = round(random.uniform(100, 5000), 2)  # rupees
        
        data.append({
            'recipient_id': recipient_id,
            'day_of_week': day,
            'day_type': day_type,
            'preferred_slot': slot,
            'location_type': location,
            'area_code': area_code,
            'distance': distance,
            'order_value': order_value
        })
    
    return pd.DataFrame(data)

def train_model():
    """
    Train the model on historical data
    In a real system, this would use actual customer data
    """
    global pipeline, label_encoder
    
    try:
        # Generate mock data (would be replaced with real data)
        df = generate_mock_data()
        
        # Add any real historical data we have
        if recipient_preferences:
            historical_records = []
            for recipient_id, preferences in recipient_preferences.items():
                for pref in preferences:
                    historical_records.append(pref)
            
            if historical_records:
                hist_df = pd.DataFrame(historical_records)
                # Combine with our mock data
                df = pd.concat([df, hist_df], ignore_index=True)
                print(f"Added {len(historical_records)} real historical records to training data")
        
        # Encode the target variable
        label_encoder.fit(df['preferred_slot'])
        y = label_encoder.transform(df['preferred_slot'])
        
        # Prepare features
        X = df.drop('preferred_slot', axis=1)
        
        # Train the pipeline (preprocessing + model)
        pipeline.fit(X, y)
        
        # Calculate accuracy on training data
        accuracy = pipeline.score(X, y)
        print(f"Model trained with accuracy: {accuracy:.2f}")
        
        return True
    except Exception as e:
        print(f"Error training model: {e}")
        return False

def predict_time_slots(customer_data):
    """
    Predict optimal time slots based on customer data
    Returns ranked time slots with confidence scores
    """
    global pipeline, label_encoder, recipient_preferences
    
    try:
        recipient_id = str(customer_data.get('recipient_id', 0))
        
        # First check if this recipient has strong historical preferences
        if recipient_id in recipient_preferences and len(recipient_preferences[recipient_id]) >= 3:
            # Get their most frequent choice
            slots = [p['preferred_slot'] for p in recipient_preferences[recipient_id]]
            # Count occurrences of each slot
            from collections import Counter
            slot_counter = Counter(slots)
            
            # If there's a dominant preference (chosen more than 50% of the time)
            most_common = slot_counter.most_common(1)[0]
            if most_common[1] / len(slots) > 0.5:
                print(f"Using historical preference for recipient {recipient_id}: {most_common[0]}")
                # Give high confidence to their most common slot
                preferred_slot = most_common[0]
                
                # Generate results with their preferred slot at the top
                remaining_slots = [s for s in TIME_SLOTS if s != preferred_slot]
                results = [
                    {
                        "time_slot": preferred_slot,
                        "confidence": 95.0,  # High confidence based on history
                        "rank": 1,
                        "source": "historical_preference"
                    }
                ]
                
                # Add remaining slots with lower confidence
                for i, slot in enumerate(remaining_slots):
                    results.append({
                        "time_slot": slot,
                        "confidence": max(30, 60 - (i * 5)),  # Decreasing confidence
                        "rank": i + 2,
                        "source": "alternative"
                    })
                
                return results
        
        # If no strong preference, use the ML model
        # Prepare input features
        input_df = pd.DataFrame([customer_data])
        
        # If pipeline exists and has been trained
        if pipeline and hasattr(pipeline, 'predict_proba'):
            # Get probability for each class
            probs = pipeline.predict_proba(input_df)[0]
            
            # Map probabilities to time slots
            slots = label_encoder.classes_
            
            # Sort by probability (descending)
            slot_probs = [(slot, prob) for slot, prob in zip(slots, probs)]
            slot_probs.sort(key=lambda x: x[1], reverse=True)
            
            # Convert to readable format
            results = [
                {
                    "time_slot": slot,
                    "confidence": round(prob * 100, 2),
                    "rank": i + 1,
                    "source": "ml_model"
                }
                for i, (slot, prob) in enumerate(slot_probs)
            ]
            
            return results
        else:
            # Fallback to heuristic-based prediction if model not ready
            return fallback_prediction(customer_data)
    except Exception as e:
        print(f"Error in prediction: {e}")
        return fallback_prediction(customer_data)

def fallback_prediction(customer_data):
    """
    Provide fallback time slot predictions based on simple heuristics
    Tailored for India Post delivery patterns
    """
    day = customer_data.get('day_of_week', datetime.now().weekday())
    location = customer_data.get('location_type', 'home')
    
    # For Sunday (day 6), we don't have delivery options
    if day == 6:
        day = 5  # Treat as Saturday
    
    # Define the day type
    day_type = 'weekend' if day >= 5 else 'weekday'
    
    # Simple rules-based approach based on India Post delivery patterns
    if location in ['office', 'commercial']:
        # Business addresses prefer business hours
        if day_type == 'weekday':
            primary_slots = ['11-12', '12-13', '13-14', '14-15']  # Business hours
        else:
            primary_slots = ['10-11', '11-12', '12-13']  # Morning on weekend
    else:
        # Home addresses prefer varied times
        if day_type == 'weekend':
            primary_slots = TIME_SLOTS  # All slots good on weekend
        else:
            # Working people prefer evening deliveries on weekdays
            primary_slots = ['17-18', '18-19', '16-17']  # Evening slots on weekdays
    
    # Add confidence scores based on simple heuristics
    results = []
    for i, slot in enumerate(TIME_SLOTS):
        if slot in primary_slots:
            confidence = random.uniform(70, 95)  # High confidence for primary slots
        else:
            confidence = random.uniform(30, 65)  # Lower confidence for others
        
        results.append({
            "time_slot": slot,
            "confidence": round(confidence, 2),
            "rank": i + 1,
            "source": "heuristic"
        })
    
    # Sort by confidence
    results.sort(key=lambda x: x['confidence'], reverse=True)
    for i, result in enumerate(results):
        result['rank'] = i + 1
    
    return results

@app.route('/predict-timeslot', methods=['POST'])
def predict():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract customer details from request
        customer_data = {
            'recipient_id': str(data.get('customer_id', data.get('recipient_id', 0))),
            'day_of_week': data.get('day_of_week', datetime.now().weekday()),
            'day_type': 'weekend' if data.get('day_of_week', datetime.now().weekday()) >= 5 else 'weekday',
            'location_type': data.get('location_type', 'home'),
            'area_code': data.get('area_code', '110'),
            'distance': data.get('distance', 5.0),
            'order_value': data.get('order_value', 500.0)
        }
        
        # Get predictions
        predictions = predict_time_slots(customer_data)
        
        # Return the predictions with India Post specific explanations
        formatted_predictions = []
        for pred in predictions:
            explanation = get_india_post_explanation(
                pred['time_slot'], 
                pred['confidence'], 
                customer_data['location_type'],
                customer_data['day_of_week']
            )
            formatted_pred = pred.copy()
            formatted_pred['explanation'] = explanation
            formatted_predictions.append(formatted_pred)
        
        return jsonify({
            'recipient_id': customer_data['recipient_id'],
            'predictions': formatted_predictions,
            'message': 'Time slot predictions generated successfully'
        })
    except Exception as e:
        print(f"Error in predict endpoint: {e}")
        return jsonify({'error': str(e)}), 500

def get_india_post_explanation(time_slot, confidence, location_type, day_of_week):
    """
    Generate India Post specific explanations for time slot recommendations
    """
    day_name = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][day_of_week]
    
    if confidence > 85:
        if location_type in ['office', 'commercial']:
            return f"Highly recommended for your {location_type} address on {day_name}. Our data shows this is when most businesses prefer India Post deliveries."
        else:
            return f"Highly recommended based on your historical preferences and similar {location_type} deliveries on {day_name}s."
    elif confidence > 70:
        if day_of_week >= 5:  # Weekend
            return f"Good option for {day_name} delivery to your {location_type}. Many recipients in your area choose this time."
        else:
            return f"Good match for your {location_type} delivery on {day_name}, minimizing the chance of missed deliveries."
    elif confidence > 50:
        return f"Reasonable option for {day_name} delivery. Our postman will typically be in your area around this time."
    else:
        return f"Alternative delivery window if your preferred slots are unavailable. Less optimal for efficient delivery routes."

@app.route('/learn', methods=['POST'])
def learn():
    """
    Endpoint to feed back actual customer selections to improve the model
    Critical for the learning component required by India Post
    """
    global recipient_preferences
    
    try:
        data = request.json
        if not data or 'recipient_data' not in data or 'selected_slot' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Extract data
        recipient_data = data['recipient_data']
        selected_slot = data['selected_slot']
        recipient_id = str(recipient_data.get('recipient_id', recipient_data.get('customer_id', 0)))
        
        # Create record of this preference
        preference_record = {
            'recipient_id': recipient_id,
            'day_of_week': recipient_data.get('day_of_week', datetime.now().weekday()),
            'day_type': 'weekend' if recipient_data.get('day_of_week', datetime.now().weekday()) >= 5 else 'weekday',
            'preferred_slot': selected_slot,
            'location_type': recipient_data.get('location_type', 'home'),
            'area_code': recipient_data.get('area_code', '110'),
            'distance': recipient_data.get('distance', 5.0),
            'order_value': recipient_data.get('order_value', 500.0),
            'timestamp': datetime.now().isoformat()
        }
        
        # Store in our preferences database
        if recipient_id not in recipient_preferences:
            recipient_preferences[recipient_id] = []
        
        # Add this preference
        recipient_preferences[recipient_id].append(preference_record)
        
        # Limit to last 10 preferences per recipient
        if len(recipient_preferences[recipient_id]) > 10:
            recipient_preferences[recipient_id] = recipient_preferences[recipient_id][-10:]
        
        # Save to disk
        save_historical_data()
        
        # Retrain model with new data if we have enough samples
        if sum(len(prefs) for prefs in recipient_preferences.values()) % 10 == 0:
            print("Retraining model with updated preferences...")
            train_model()
        
        return jsonify({
            'status': 'success',
            'message': 'Time slot preference learned and model updated',
            'preference_count': len(recipient_preferences[recipient_id])
        })
    except Exception as e:
        print(f"Error in learn endpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/recipient-preferences/<recipient_id>', methods=['GET'])
def get_recipient_preferences(recipient_id):
    """Return a recipient's historical preferences"""
    recipient_id = str(recipient_id)
    if recipient_id in recipient_preferences:
        return jsonify({
            'recipient_id': recipient_id,
            'preferences': recipient_preferences[recipient_id],
            'preference_count': len(recipient_preferences[recipient_id])
        })
    else:
        return jsonify({
            'recipient_id': recipient_id,
            'preferences': [],
            'preference_count': 0
        })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        return jsonify({
            'status': 'healthy',
            'service': 'AI Time Slot Prediction',
            'model_initialized': model is not None,
            'time': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

# Initialize the model when the service starts
if __name__ == '__main__':
    # Initialize and train our model
    if initialize_model():
        train_model()
    
    # In a real application, we'd load a pre-trained model here
    
    print("Starting India Post Time Slot Prediction Service on http://localhost:5015")
    app.run(host="0.0.0.0", port=5015, debug=True) 
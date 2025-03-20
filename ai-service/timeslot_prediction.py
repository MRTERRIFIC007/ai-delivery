import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import pickle
import json
import logging
from pathlib import Path
import joblib

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger('timeslot_prediction')

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Constants
TIME_SLOTS = ['10-11', '11-12', '12-13', '13-14', '14-15', '15-16', '16-17', '17-18', '18-19']
DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
ADDRESS_TYPES = {0: 'Residential', 1: 'Commercial', 2: 'Industrial', 3: 'Educational', 4: 'Government'}

# File paths
MODEL_PATH = 'timeslot_model.pkl'
CUSTOMER_DATA_PATH = 'customer_data.json'
DATASET_PATH = 'Dataset.csv'

# Global variables
model = None
pipeline = None
customer_preferences = {}

def load_customer_data():
    """Load customer preferences if available"""
    global customer_preferences
    try:
        if os.path.exists(CUSTOMER_DATA_PATH):
            with open(CUSTOMER_DATA_PATH, 'r') as f:
                customer_preferences = json.load(f)
            logger.info(f"Loaded {len(customer_preferences)} customer preference records")
        else:
            customer_preferences = {}
            logger.info("No historical customer data found, starting fresh")
    except Exception as e:
        logger.error(f"Error loading customer data: {e}")
        customer_preferences = {}

def save_customer_data():
    """Save customer preferences to disk"""
    try:
        with open(CUSTOMER_DATA_PATH, 'w') as f:
            json.dump(customer_preferences, f)
        logger.info(f"Saved {len(customer_preferences)} customer preference records")
    except Exception as e:
        logger.error(f"Error saving customer data: {e}")

def load_training_data():
    """Load the delivery dataset from CSV"""
    try:
        if not os.path.exists(DATASET_PATH):
            logger.warning(f"Dataset file not found at {DATASET_PATH}")
            return None
            
        df = pd.read_csv(DATASET_PATH)
        logger.info(f"Loaded dataset with {len(df)} records")
        return df
    except Exception as e:
        logger.error(f"Error loading dataset: {e}")
        return None

def preprocess_dataset(df):
    """Process the raw dataset for model training"""
    try:
        # Extract latitude and longitude from the delivery address
        df[['Latitude', 'Longitude']] = df['Delivery Address (Lat, Long)'].str.split(',', expand=True).apply(pd.to_numeric)
        
        # Convert booking and delivery dates to datetime
        df['Booking Date'] = pd.to_datetime(df['Booking Date'])
        df['Delivery Date'] = pd.to_datetime(df['Delivery Date'])
        
        # Calculate lead time (days between booking and delivery)
        df['Lead Time'] = (df['Delivery Date'] - df['Booking Date']).dt.days
        
        # Create features for model
        features = df[['Customer ID', 'Postman ID', 'Latitude', 'Longitude', 
                       'Item Type', 'Day of Week', 'Address Type', 'Lead Time', 
                       'Initial Time Slot']]
                       
        # If there's a Modified Time Slot column, use it as the target
        if 'Modified Time Slot' in df.columns:
            features['Preferred Time Slot'] = df['Modified Time Slot']
        else:
            features['Preferred Time Slot'] = df['Initial Time Slot']
            
        # Handle missing values
        features = features.fillna({
            'Address Type': 0,  # Default to residential
            'Lead Time': features['Lead Time'].median()
        })
        
        logger.info(f"Preprocessed dataset: {features.shape}")
        return features
    except Exception as e:
        logger.error(f"Error preprocessing dataset: {e}")
        return None

def build_model():
    """Build the machine learning pipeline"""
    try:
        # Define feature types
        categorical_features = ['Customer ID', 'Postman ID', 'Item Type', 'Address Type']
        numerical_features = ['Latitude', 'Longitude', 'Day of Week', 'Lead Time']
        
        # Create preprocessing pipeline
        categorical_transformer = Pipeline(steps=[
            ('onehot', OneHotEncoder(handle_unknown='ignore'))
        ])
        
        numerical_transformer = Pipeline(steps=[
            ('scaler', StandardScaler())
        ])
        
        preprocessor = ColumnTransformer(
            transformers=[
                ('cat', categorical_transformer, categorical_features),
                ('num', numerical_transformer, numerical_features)
            ])
        
        # Create the full model pipeline
        model_pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', RandomForestClassifier(
                n_estimators=100, 
                max_depth=10,
                min_samples_split=10,
                random_state=42
            ))
        ])
        
        logger.info("Model pipeline built successfully")
        return model_pipeline
    except Exception as e:
        logger.error(f"Error building model: {e}")
        return None

def train_model(force_retrain=False):
    """Train or load the time slot prediction model"""
    global model, pipeline
    
    try:
        # Check if model already exists and we're not forcing retraining
        if os.path.exists(MODEL_PATH) and not force_retrain:
            logger.info(f"Loading existing model from {MODEL_PATH}")
            pipeline = joblib.load(MODEL_PATH)
            model = pipeline.named_steps['classifier']
            return True
            
        # Load and preprocess the dataset
        raw_data = load_training_data()
        if raw_data is None:
            logger.error("Could not load training data")
            return False
            
        dataset = preprocess_dataset(raw_data)
        if dataset is None:
            logger.error("Could not preprocess data")
            return False
        
        # Prepare features and target
        X = dataset.drop(['Preferred Time Slot'], axis=1)
        y = dataset['Preferred Time Slot']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Build and train model
        pipeline = build_model()
        if pipeline is None:
            logger.error("Could not build model")
            return False
            
        logger.info("Training model...")
        pipeline.fit(X_train, y_train)
        model = pipeline.named_steps['classifier']
        
        # Evaluate model
        y_pred = pipeline.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        logger.info(f"Model trained with accuracy: {accuracy:.4f}")
        logger.info(f"Classification report:\n{classification_report(y_test, y_pred)}")
        
        # Save model
        joblib.dump(pipeline, MODEL_PATH)
        logger.info(f"Model saved to {MODEL_PATH}")
        
        return True
    except Exception as e:
        logger.error(f"Error in model training: {e}")
        return False

def predict_optimal_timeslot(customer_data):
    """Predict the optimal delivery time slot based on customer data"""
    try:
        # Check if we have customer preferences
        customer_id = customer_data.get('customer_id', '')
        if customer_id in customer_preferences:
            # Use historical preference data
            pref_data = customer_preferences[customer_id]
            logger.info(f"Using historical preferences for customer {customer_id}")
            
            # Check if preference for this day of week exists
            day_of_week = int(customer_data.get('day_of_week', 0))
            day_prefs = [p for p in pref_data if p.get('day_of_week') == day_of_week]
            
            if day_prefs:
                # Find most frequent time slot for this day
                slots = [p.get('time_slot') for p in day_prefs]
                preferred_slot = max(set(slots), key=slots.count)
                confidence = slots.count(preferred_slot) / len(slots)
                
                return {
                    'predicted_time_slot': int(preferred_slot),
                    'confidence': round(confidence, 2),
                    'method': 'historical_preference',
                    'explanation': get_explanation(int(preferred_slot), confidence, 
                                                 customer_data.get('address_type', 0), 
                                                 day_of_week)
                }
        
        # If no preferences or insufficient data, use the ML model
        if pipeline is None:
            logger.error("Model not initialized")
            return fallback_prediction(customer_data)
            
        # Prepare input data for prediction
        input_data = pd.DataFrame({
            'Customer ID': [customer_data.get('customer_id', '')],
            'Postman ID': [customer_data.get('postman_id', '')],
            'Latitude': [float(customer_data.get('latitude', 0))],
            'Longitude': [float(customer_data.get('longitude', 0))],
            'Item Type': [customer_data.get('item_type', '')],
            'Day of Week': [int(customer_data.get('day_of_week', 0))],
            'Address Type': [int(customer_data.get('address_type', 0))],
            'Lead Time': [int(customer_data.get('lead_time', 7))]
        })
        
        # Make prediction
        predicted_slot = int(pipeline.predict(input_data)[0])
        confidence_scores = pipeline.predict_proba(input_data)[0]
        confidence = round(float(max(confidence_scores)), 2)
        
        return {
            'predicted_time_slot': predicted_slot,
            'confidence': confidence,
            'method': 'machine_learning',
            'explanation': get_explanation(predicted_slot, confidence, 
                                         int(customer_data.get('address_type', 0)), 
                                         int(customer_data.get('day_of_week', 0)))
        }
    except Exception as e:
        logger.error(f"Error predicting time slot: {e}")
        return fallback_prediction(customer_data)

def fallback_prediction(customer_data):
    """Provide a fallback prediction if the model fails"""
    day_of_week = int(customer_data.get('day_of_week', 0))
    address_type = int(customer_data.get('address_type', 0))
    
    # Business logic fallback based on address type and day of week
    if address_type == 1:  # Commercial
        if day_of_week < 5:  # Weekdays
            slot = 3  # 13-14 (lunchtime)
        else:
            slot = 1  # 11-12 (morning)
    else:  # Residential
        if day_of_week < 5:  # Weekdays
            slot = 6  # 16-17 (after work)
        else:
            slot = 4  # 14-15 (afternoon)
    
    return {
        'predicted_time_slot': slot,
        'confidence': 0.5,
        'method': 'fallback',
        'explanation': get_explanation(slot, 0.5, address_type, day_of_week)
    }

def get_explanation(time_slot, confidence, address_type, day_of_week):
    """Generate a human-readable explanation for the prediction"""
    slot_time = TIME_SLOTS[time_slot - 1] if time_slot <= len(TIME_SLOTS) else "10-11"
    day_name = DAYS_OF_WEEK[day_of_week] if day_of_week < len(DAYS_OF_WEEK) else "weekday"
    address_type_name = ADDRESS_TYPES.get(address_type, "Unknown")
    
    if confidence > 0.8:
        confidence_text = "high confidence"
    elif confidence > 0.5:
        confidence_text = "moderate confidence"
    else:
        confidence_text = "low confidence"
    
    explanations = {
        # Commercial address explanations
        (1, 0): f"This {address_type_name} location typically receives deliveries during {slot_time} on Mondays with {confidence_text}.",
        (1, 1): f"Tuesday deliveries to {address_type_name} locations are optimally scheduled at {slot_time} based on {confidence_text}.",
        (1, 2): f"We recommend {slot_time} for Wednesday deliveries to this {address_type_name} address with {confidence_text}.",
        (1, 3): f"Our data indicates {slot_time} is optimal for Thursday deliveries to {address_type_name} locations with {confidence_text}.",
        (1, 4): f"Friday deliveries to {address_type_name} locations work best at {slot_time} with {confidence_text}.",
        (1, 5): f"Saturday deliveries to {address_type_name} locations are recommended at {slot_time} with {confidence_text}.",
        (1, 6): f"Sunday deliveries are limited, but {slot_time} works best for {address_type_name} locations with {confidence_text}.",
        
        # Residential address explanations
        (0, 0): f"For this {address_type_name} address, Monday deliveries at {slot_time} have the highest success rate with {confidence_text}.",
        (0, 1): f"Tuesday {address_type_name} deliveries are most successful at {slot_time} with {confidence_text}.",
        (0, 2): f"We recommend {slot_time} for Wednesday deliveries to this {address_type_name} with {confidence_text}.",
        (0, 3): f"Thursday deliveries to {address_type_name} addresses work best at {slot_time} with {confidence_text}.",
        (0, 4): f"For Friday deliveries to this {address_type_name}, {slot_time} is optimal with {confidence_text}.",
        (0, 5): f"Saturday deliveries to {address_type_name} addresses are most successful at {slot_time} with {confidence_text}.",
        (0, 6): f"For Sunday deliveries to this {address_type_name}, we recommend {slot_time} with {confidence_text}."
    }
    
    # Get explanation or use default
    key = (min(address_type, 1), day_of_week)  # Group address types as commercial (1) or residential (0)
    return explanations.get(key, f"We recommend delivery at {slot_time} on {day_name} with {confidence_text}.")

def update_customer_preferences(customer_id, data):
    """Update customer preferences with new delivery data"""
    global customer_preferences
    
    if customer_id not in customer_preferences:
        customer_preferences[customer_id] = []
    
    # Add preference data
    preference = {
        'day_of_week': int(data.get('day_of_week', 0)),
        'time_slot': int(data.get('time_slot', 1)),
        'address_type': int(data.get('address_type', 0)),
        'timestamp': datetime.now().isoformat()
    }
    
    customer_preferences[customer_id].append(preference)
    
    # Limit to last 10 preferences per customer
    if len(customer_preferences[customer_id]) > 10:
        customer_preferences[customer_id] = customer_preferences[customer_id][-10:]
    
    # Save updated preferences
    save_customer_data()
    
    return True

# API Endpoints
@app.route('/predict-timeslot', methods=['POST'])
def predict():
    """API endpoint to predict optimal time slot"""
    try:
        data = request.json
        logger.info(f"Received prediction request: {data}")
        
        # Validate required fields
        required_fields = ['customer_id', 'latitude', 'longitude', 'address_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Make prediction
        result = predict_optimal_timeslot(data)
        logger.info(f"Prediction result: {result}")
        
        return jsonify({
            'customer_id': data['customer_id'],
            'predicted_time_slot': result['predicted_time_slot'],
            'confidence': result['confidence'],
            'explanation': result['explanation']
        })
    except Exception as e:
        logger.error(f"Error in predict endpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/learn', methods=['POST'])
def learn():
    """API endpoint to learn from customer feedback"""
    try:
        data = request.json
        logger.info(f"Received learning data: {data}")
        
        # Validate required fields
        required_fields = ['customer_id', 'time_slot', 'day_of_week', 'address_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Update customer preferences
        updated = update_customer_preferences(data['customer_id'], data)
        
        if updated:
            return jsonify({'status': 'success', 'message': 'Customer preferences updated'})
        else:
            return jsonify({'status': 'error', 'message': 'Failed to update preferences'}), 500
    except Exception as e:
        logger.error(f"Error in learn endpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/customer-preferences/<customer_id>', methods=['GET'])
def get_customer_preferences(customer_id):
    """API endpoint to get customer preferences"""
    try:
        if customer_id not in customer_preferences:
            return jsonify({'preferences': []})
        
        return jsonify({'preferences': customer_preferences[customer_id]})
    except Exception as e:
        logger.error(f"Error getting customer preferences: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/retrain', methods=['POST'])
def retrain():
    """API endpoint to force model retraining"""
    try:
        result = train_model(force_retrain=True)
        if result:
            return jsonify({'status': 'success', 'message': 'Model retrained successfully'})
        else:
            return jsonify({'status': 'error', 'message': 'Failed to retrain model'}), 500
    except Exception as e:
        logger.error(f"Error retraining model: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """API endpoint to check service health"""
    try:
        return jsonify({
            'status': 'healthy',
            'model_loaded': pipeline is not None,
            'customer_records': len(customer_preferences),
            'version': '1.0.0'
        })
    except Exception as e:
        logger.error(f"Error in health check: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Initialize on startup
def initialize():
    """Initialize the service on startup"""
    logger.info("Initializing AI service...")
    load_customer_data()
    train_model()
    logger.info("AI service initialized successfully")

# Main entry point
if __name__ == '__main__':
    # Initialize the service
    initialize()
    
    # Get port from environment or use default
    port = int(os.environ.get('PORT', 5002))
    
    logger.info(f"Starting AI Prediction Service on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True) 
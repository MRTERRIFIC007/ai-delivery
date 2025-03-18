import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global variables to store the trained model and encoder
tree_classifier = None
le = None

def initialize_model():
    global tree_classifier, le
    
    # Load the dataset
    print("Loading dataset...")
    model_data = pd.read_csv('Dataset.csv')

    # Extract latitude and longitude from the delivery address
    model_data[['Latitude', 'Longitude']] = model_data['Delivery Address (Lat, Long)'].str.split(',', expand=True).apply(pd.to_numeric)

    # Select features for the model
    model_features = model_data[['Customer ID', 'Latitude', 'Longitude', 'Address Type', 'Initial Time Slot', 'Delivery Outcome']]

    # Display information about the dataset
    print("\nDataset Information:")
    model_features.info()
    print("\nDataset Statistics:")
    print(model_features.describe())

    # Encode the Customer ID
    print("\nEncoding Customer ID...")
    le = LabelEncoder()
    model_features['Customer ID'] = le.fit_transform(model_features['Customer ID'])

    # Prepare features and target
    X = model_features[['Customer ID', 'Latitude', 'Longitude', 'Address Type']]
    y = model_features['Initial Time Slot']

    # Split the data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train a decision tree classifier
    print("\nTraining the model...")
    tree_classifier = DecisionTreeClassifier(random_state=42)
    tree_classifier.fit(X_train, y_train)

    # Evaluate the model
    y_pred = tree_classifier.predict(X_test)
    accuracy = tree_classifier.score(X_test, y_test)
    print(f"\nModel Accuracy: {accuracy:.4f}")
    
    return tree_classifier, le, accuracy

# Initialize the model when the app starts
tree_classifier, le, accuracy = initialize_model()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'model_accuracy': accuracy
    })

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        if not data or 'customer_id' not in data or 'latitude' not in data or 'longitude' not in data or 'address_type' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Extract data from request
        customer_id = data['customer_id']
        latitude = float(data['latitude'])
        longitude = float(data['longitude'])
        address_type = int(data['address_type'])
        
        # Encode customer ID
        try:
            encoded_customer_id = le.transform([customer_id])[0]
        except:
            # If customer ID is not in training data, use a default value
            encoded_customer_id = 0
        
        # Prepare input for prediction
        input_data = np.array([[encoded_customer_id, latitude, longitude, address_type]])
        
        # Make prediction
        predicted_time_slot = int(tree_classifier.predict(input_data)[0])
        
        return jsonify({
            'customer_id': customer_id,
            'predicted_time_slot': predicted_time_slot
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    try:
        data = request.json
        if not data or 'deliveries' not in data:
            return jsonify({'error': 'Missing deliveries field'}), 400
        
        results = []
        for delivery in data['deliveries']:
            if 'customer_id' not in delivery or 'latitude' not in delivery or 'longitude' not in delivery or 'address_type' not in delivery:
                continue
                
            # Extract data
            customer_id = delivery['customer_id']
            latitude = float(delivery['latitude'])
            longitude = float(delivery['longitude'])
            address_type = int(delivery['address_type'])
            
            # Encode customer ID
            try:
                encoded_customer_id = le.transform([customer_id])[0]
            except:
                # If customer ID is not in training data, use a default value
                encoded_customer_id = 0
            
            # Prepare input for prediction
            input_data = np.array([[encoded_customer_id, latitude, longitude, address_type]])
            
            # Make prediction
            predicted_time_slot = int(tree_classifier.predict(input_data)[0])
            
            results.append({
                'customer_id': customer_id,
                'predicted_time_slot': predicted_time_slot
            })
        
        return jsonify({'predictions': results})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting AI Prediction Service on http://localhost:5002")
    app.run(host='0.0.0.0', port=5002, debug=True) 
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder

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

# Make predictions for new data
print("\nMaking predictions for new delivery addresses...")
customer_ids = ['CUST102', 'CUST151', 'CUST104', 'CUST040']
new_data = np.array([
    [17.490, 78.504, 1],  # Latitude, Longitude, Address Type
    [17.470, 78.448, 1],
    [17.484, 78.478, 3],
    [17.467998, 78.413967, 3]
])

# Encode Customer ID in the new data
encoded_customer_ids = le.transform(customer_ids)

# Prepare the complete input array for the model
full_new_data = np.column_stack((encoded_customer_ids, new_data))

# Convert the data to float as required by the model
full_new_data = full_new_data.astype(float)

# Predict the time slots using the trained model
predicted_time_slots = tree_classifier.predict(full_new_data)

# Display the results mapping back to the original customer IDs
print("\nPrediction Results:")
for i, time_slot in enumerate(predicted_time_slots):
    print(f"Predicted Time Slot for {customer_ids[i]} (Address Type {int(new_data[i, 2])}): Time Slot {time_slot}")

print("\nPrediction completed successfully!") 
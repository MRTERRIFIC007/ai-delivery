import unittest
import json
import os
import pandas as pd
import numpy as np
from pathlib import Path

# Add test directory to path to import modules
import sys
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

# Import modules to test
from dataset_manager import DatasetManager
from timeslot_prediction import predict_optimal_timeslot, fallback_prediction
from route_optimization import RouteOptimizer

class TestDatasetManager(unittest.TestCase):
    """Test cases for the DatasetManager class"""
    
    def setUp(self):
        """Set up test environment"""
        # Create a sample dataset for testing
        self.test_data_path = 'test_dataset.csv'
        self.create_test_dataset()
        self.dataset_manager = DatasetManager(dataset_path=self.test_data_path)
    
    def tearDown(self):
        """Clean up after tests"""
        # Remove test files
        if os.path.exists(self.test_data_path):
            os.remove(self.test_data_path)
    
    def create_test_dataset(self):
        """Create a small test dataset for testing"""
        data = []
        for i in range(20):
            data.append({
                'Order ID': f'ORD{1000+i}',
                'Postman ID': f'POST{i%5+1:03d}',
                'Customer ID': f'CUST{100+i}',
                'Delivery Address (Lat, Long)': f'{17.5+i/100},{78.5+i/100}',
                'Item Type': 'REGULAR' if i % 3 == 0 else 'PRIORITY',
                'Booking Date': '2024-01-01',
                'Delivery Date': '2024-01-10',
                'Day of Week': i % 7,
                'Address Type': i % 3,
                'Initial Time Slot': i % 9 + 1
            })
        
        # Create dataframe
        df = pd.DataFrame(data)
        df.to_csv(self.test_data_path, index=False)
    
    def test_load_dataset(self):
        """Test dataset loading"""
        df = self.dataset_manager.load_dataset()
        self.assertIsNotNone(df)
        self.assertEqual(len(df), 20)
    
    def test_preprocess_dataset(self):
        """Test dataset preprocessing"""
        processed_df = self.dataset_manager.preprocess_dataset()
        self.assertIsNotNone(processed_df)
        self.assertIn('Latitude', processed_df.columns)
        self.assertIn('Longitude', processed_df.columns)
        self.assertIn('Lead Time', processed_df.columns)
    
    def test_get_feature_stats(self):
        """Test feature statistics"""
        stats = self.dataset_manager.get_feature_stats()
        self.assertIsNotNone(stats)
        self.assertEqual(stats['record_count'], 20)
        self.assertIn('time_slot_distribution', stats)

class TestTimeslotPrediction(unittest.TestCase):
    """Test cases for the time slot prediction functionality"""
    
    def test_fallback_prediction(self):
        """Test fallback prediction"""
        # Test with commercial address on weekday
        commercial_weekday = {
            'customer_id': 'CUST100',
            'day_of_week': 2,
            'address_type': 1
        }
        result = fallback_prediction(commercial_weekday)
        self.assertEqual(result['predicted_time_slot'], 3)
        
        # Test with residential address on weekend
        residential_weekend = {
            'customer_id': 'CUST101',
            'day_of_week': 6,
            'address_type': 0
        }
        result = fallback_prediction(residential_weekend)
        self.assertEqual(result['predicted_time_slot'], 4)
    
    def test_prediction_format(self):
        """Test prediction output format"""
        test_data = {
            'customer_id': 'CUST102',
            'day_of_week': 3,
            'address_type': 1,
            'latitude': 17.5,
            'longitude': 78.5
        }
        result = fallback_prediction(test_data)
        self.assertIn('predicted_time_slot', result)
        self.assertIn('confidence', result)
        self.assertIn('explanation', result)
        self.assertIn('method', result)

class TestRouteOptimization(unittest.TestCase):
    """Test cases for the route optimization functionality"""
    
    def setUp(self):
        """Set up test environment"""
        self.optimizer = RouteOptimizer()
        self.test_deliveries = [
            {
                'order_id': 'ORD1001',
                'customer_id': 'CUST101',
                'latitude': 17.5,
                'longitude': 78.5,
                'address_type': 0
            },
            {
                'order_id': 'ORD1002',
                'customer_id': 'CUST102',
                'latitude': 17.51,
                'longitude': 78.52,
                'address_type': 1
            },
            {
                'order_id': 'ORD1003',
                'customer_id': 'CUST103',
                'latitude': 17.49,
                'longitude': 78.48,
                'address_type': 0
            }
        ]
    
    def test_distance_matrix(self):
        """Test distance matrix calculation"""
        locations = [(d['latitude'], d['longitude']) for d in self.test_deliveries]
        distance_matrix = self.optimizer.calculate_distance_matrix(locations)
        
        self.assertEqual(distance_matrix.shape, (3, 3))
        self.assertEqual(distance_matrix[0, 0], 0)  # Distance to self is 0
        self.assertTrue(np.all(distance_matrix >= 0))  # All distances are non-negative
    
    def test_nearest_neighbor_route(self):
        """Test nearest neighbor routing"""
        locations = [(d['latitude'], d['longitude']) for d in self.test_deliveries]
        distance_matrix = self.optimizer.calculate_distance_matrix(locations)
        
        route = self.optimizer.nearest_neighbor_route(distance_matrix)
        
        self.assertEqual(len(route), 3)
        self.assertEqual(set(route), {0, 1, 2})  # All points visited
    
    def test_route_optimization(self):
        """Test complete route optimization"""
        result = self.optimizer.optimize_postman_routes(self.test_deliveries)
        
        self.assertTrue(result['success'])
        self.assertEqual(result['total_deliveries'], 3)
        self.assertGreater(result['total_distance_km'], 0)
        self.assertEqual(len(result['routes']), 1)
        
        # Test with multiple postmen
        result_multi = self.optimizer.optimize_postman_routes(self.test_deliveries, num_postmen=2)
        self.assertEqual(result_multi['total_postmen'], 2)

class TestIntegration(unittest.TestCase):
    """Integration tests for the AI service components"""
    
    def setUp(self):
        """Set up test environment"""
        # Create objects for testing
        self.dataset_manager = DatasetManager()
        self.route_optimizer = RouteOptimizer()
    
    def test_prediction_with_dataset(self):
        """Test prediction using dataset data"""
        # Skip test if dataset not available
        if not os.path.exists('Dataset.csv'):
            self.skipTest("Dataset.csv not found, skipping test")
        
        # Load dataset
        df = self.dataset_manager.load_dataset()
        if df is None:
            self.skipTest("Failed to load dataset")
        
        # Process dataset
        processed_df = self.dataset_manager.preprocess_dataset()
        if processed_df is None:
            self.skipTest("Failed to process dataset")
        
        # Get a sample customer
        if len(processed_df) > 0:
            sample = processed_df.iloc[0]
            
            # Create prediction request
            customer_data = {
                'customer_id': sample['Customer ID'],
                'latitude': sample['Latitude'],
                'longitude': sample['Longitude'],
                'address_type': int(sample['Address Type']),
                'day_of_week': int(sample['Day of Week'])
            }
            
            # Make prediction
            result = fallback_prediction(customer_data)
            self.assertIsNotNone(result)
            self.assertIn('predicted_time_slot', result)
    
    def test_route_optimization_with_dataset(self):
        """Test route optimization using dataset data"""
        # Skip test if dataset not available
        if not os.path.exists('Dataset.csv'):
            self.skipTest("Dataset.csv not found, skipping test")
        
        # Load and process dataset
        self.dataset_manager.load_dataset()
        processed_df = self.dataset_manager.preprocess_dataset()
        
        if processed_df is None or len(processed_df) == 0:
            self.skipTest("Failed to process dataset or empty dataset")
        
        # Take first 5 delivery points
        deliveries = []
        for i in range(min(5, len(processed_df))):
            row = processed_df.iloc[i]
            deliveries.append({
                'order_id': row['Order ID'],
                'customer_id': row['Customer ID'],
                'latitude': row['Latitude'],
                'longitude': row['Longitude'],
                'address_type': int(row['Address Type'])
            })
        
        # Optimize routes
        result = self.route_optimizer.optimize_postman_routes(deliveries)
        self.assertTrue(result['success'])
        self.assertEqual(result['total_deliveries'], len(deliveries))

if __name__ == '__main__':
    unittest.main() 
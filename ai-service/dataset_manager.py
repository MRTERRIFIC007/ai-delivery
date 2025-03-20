import pandas as pd
import numpy as np
import os
import json
import logging
from datetime import datetime, timedelta
import random
from pathlib import Path

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger('dataset_manager')

class DatasetManager:
    """Manages dataset operations for the delivery optimization system"""
    
    def __init__(self, dataset_path='Dataset.csv', output_path=None):
        """
        Initialize the dataset manager
        
        Args:
            dataset_path: Path to the main dataset file
            output_path: Path to save processed/augmented data
        """
        self.dataset_path = dataset_path
        self.output_path = output_path or os.path.dirname(dataset_path)
        self.data = None
        self.processed_data = None
    
    def load_dataset(self):
        """
        Load the delivery dataset from CSV file
        
        Returns:
            Pandas DataFrame with the dataset
        """
        try:
            if not os.path.exists(self.dataset_path):
                logger.error(f"Dataset file not found at {self.dataset_path}")
                return None
            
            df = pd.read_csv(self.dataset_path)
            logger.info(f"Loaded dataset with {len(df)} records")
            self.data = df
            return df
        except Exception as e:
            logger.error(f"Error loading dataset: {e}")
            return None
    
    def preprocess_dataset(self):
        """
        Preprocess the raw dataset for model training
        
        Returns:
            Pandas DataFrame with processed data
        """
        try:
            if self.data is None:
                self.load_dataset()
                
            if self.data is None:
                logger.error("No data available for preprocessing")
                return None
            
            df = self.data.copy()
            
            # Extract latitude and longitude from the delivery address
            df[['Latitude', 'Longitude']] = df['Delivery Address (Lat, Long)'].str.split(',', expand=True).apply(pd.to_numeric)
            
            # Convert booking and delivery dates to datetime
            df['Booking Date'] = pd.to_datetime(df['Booking Date'])
            df['Delivery Date'] = pd.to_datetime(df['Delivery Date'])
            
            # Calculate lead time (days between booking and delivery)
            df['Lead Time'] = (df['Delivery Date'] - df['Booking Date']).dt.days
            
            # Month and season features
            df['Month'] = df['Delivery Date'].dt.month
            df['Season'] = df['Month'] % 12 // 3 + 1  # 1: Spring, 2: Summer, 3: Fall, 4: Winter
            
            # Handle missing values
            df = df.fillna({
                'Address Type': 0,  # Default to residential
                'Lead Time': df['Lead Time'].median(),
                'Initial Time Slot': 1  # Default to first slot
            })
            
            self.processed_data = df
            logger.info(f"Preprocessed dataset: {df.shape}")
            return df
        except Exception as e:
            logger.error(f"Error preprocessing dataset: {e}")
            return None
    
    def get_feature_stats(self):
        """
        Get statistical information about the dataset features
        
        Returns:
            Dictionary with feature statistics
        """
        try:
            if self.processed_data is None:
                self.preprocess_dataset()
                
            if self.processed_data is None:
                logger.error("No processed data available for analysis")
                return None
            
            df = self.processed_data
            
            # Get numerical feature statistics
            num_stats = df.describe().to_dict()
            
            # Get categorical feature distributions
            categorical_cols = ['Customer ID', 'Postman ID', 'Item Type', 'Address Type', 'Day of Week']
            cat_stats = {}
            
            for col in categorical_cols:
                if col in df.columns:
                    cat_stats[col] = df[col].value_counts().to_dict()
            
            # Time slot distribution
            time_slot_col = 'Modified Time Slot' if 'Modified Time Slot' in df.columns else 'Initial Time Slot'
            time_slot_dist = df[time_slot_col].value_counts().to_dict()
            
            return {
                'record_count': len(df),
                'numerical_stats': num_stats,
                'categorical_distributions': cat_stats,
                'time_slot_distribution': time_slot_dist
            }
        except Exception as e:
            logger.error(f"Error analyzing dataset: {e}")
            return None
    
    def visualize_data(self, output_path=None):
        """
        Generate visualizations of the dataset
        
        Args:
            output_path: Path to save visualization files
            
        Returns:
            True if successful, False otherwise
        """
        try:
            import matplotlib.pyplot as plt
            import seaborn as sns
            
            if self.processed_data is None:
                self.preprocess_dataset()
                
            if self.processed_data is None:
                logger.error("No processed data available for visualization")
                return False
            
            df = self.processed_data
            output_path = output_path or os.path.join(self.output_path, 'visualizations')
            os.makedirs(output_path, exist_ok=True)
            
            # Time slot distribution
            plt.figure(figsize=(10, 6))
            time_slot_col = 'Modified Time Slot' if 'Modified Time Slot' in df.columns else 'Initial Time Slot'
            sns.countplot(x=time_slot_col, data=df)
            plt.title('Time Slot Distribution')
            plt.savefig(os.path.join(output_path, 'time_slot_distribution.png'))
            
            # Day of week vs time slot
            plt.figure(figsize=(12, 6))
            pivot = df.pivot_table(index='Day of Week', columns=time_slot_col, aggfunc='size', fill_value=0)
            sns.heatmap(pivot, annot=True, cmap='YlGnBu')
            plt.title('Day of Week vs Time Slot')
            plt.savefig(os.path.join(output_path, 'day_vs_timeslot.png'))
            
            # Address type vs time slot
            plt.figure(figsize=(12, 6))
            pivot = df.pivot_table(index='Address Type', columns=time_slot_col, aggfunc='size', fill_value=0)
            sns.heatmap(pivot, annot=True, cmap='YlGnBu')
            plt.title('Address Type vs Time Slot')
            plt.savefig(os.path.join(output_path, 'address_vs_timeslot.png'))
            
            # Geographical distribution
            plt.figure(figsize=(12, 10))
            plt.scatter(df['Longitude'], df['Latitude'], alpha=0.5)
            plt.title('Delivery Locations')
            plt.xlabel('Longitude')
            plt.ylabel('Latitude')
            plt.savefig(os.path.join(output_path, 'delivery_locations.png'))
            
            logger.info(f"Saved visualizations to {output_path}")
            return True
        except Exception as e:
            logger.error(f"Error creating visualizations: {e}")
            return False
    
    def augment_dataset(self, num_samples=1000, save=True):
        """
        Augment the dataset with synthetic data
        
        Args:
            num_samples: Number of synthetic samples to generate
            save: Whether to save the augmented dataset
            
        Returns:
            Pandas DataFrame with augmented data
        """
        try:
            if self.processed_data is None:
                self.preprocess_dataset()
                
            if self.processed_data is None:
                logger.error("No processed data available for augmentation")
                return None
            
            df = self.processed_data.copy()
            
            # Get unique values from original data
            customer_ids = df['Customer ID'].unique()
            postman_ids = df['Postman ID'].unique()
            item_types = df['Item Type'].unique()
            
            # Get coordinate ranges
            lat_min, lat_max = df['Latitude'].min(), df['Latitude'].max()
            lon_min, lon_max = df['Longitude'].min(), df['Longitude'].max()
            
            # Generate synthetic data
            synthetic_data = []
            today = datetime.now().date()
            
            for _ in range(num_samples):
                # Random customer and postman
                customer_id = random.choice(customer_ids)
                postman_id = random.choice(postman_ids)
                
                # Random coordinates within original data range
                latitude = random.uniform(lat_min, lat_max)
                longitude = random.uniform(lon_min, lon_max)
                
                # Random dates
                booking_offset = random.randint(1, 30)
                delivery_offset = booking_offset + random.randint(1, 14)
                
                booking_date = today - timedelta(days=booking_offset)
                delivery_date = today - timedelta(days=booking_offset) + timedelta(days=random.randint(1, 14))
                
                # Other attributes
                day_of_week = delivery_date.weekday()
                address_type = random.randint(0, 2)  # 0: Residential, 1: Commercial, 2: Industrial
                item_type = random.choice(item_types)
                
                # Time slot - based on address type and day of week patterns
                if address_type == 1:  # Commercial
                    if day_of_week < 5:  # Weekday
                        initial_slot = random.choices([2, 3, 4], weights=[0.3, 0.5, 0.2])[0]
                    else:
                        initial_slot = random.choices([1, 2], weights=[0.6, 0.4])[0]
                else:  # Residential
                    if day_of_week < 5:  # Weekday
                        initial_slot = random.choices([5, 6, 7], weights=[0.3, 0.5, 0.2])[0]
                    else:
                        initial_slot = random.randint(1, 7)
                
                # Sometimes the modified slot is different
                if random.random() < 0.3:
                    # Adjacent time slot with higher probability
                    modified_slot = max(1, min(9, initial_slot + random.choice([-1, 0, 1])))
                else:
                    modified_slot = initial_slot
                
                # Create record
                record = {
                    'Order ID': f"ORD{1000 + len(df) + len(synthetic_data)}",
                    'Postman ID': postman_id,
                    'Customer ID': customer_id,
                    'Delivery Address (Lat, Long)': f"{latitude},{longitude}",
                    'Item Type': item_type,
                    'Booking Date': booking_date.strftime('%Y-%m-%d'),
                    'Delivery Date': delivery_date.strftime('%Y-%m-%d'),
                    'Day of Week': day_of_week,
                    'Address Type': address_type,
                    'Initial Time Slot': initial_slot,
                    'Modified Time Slot': modified_slot,
                    'Latitude': latitude,
                    'Longitude': longitude,
                    'Lead Time': (delivery_date - booking_date).days
                }
                
                synthetic_data.append(record)
            
            # Create augmented dataframe
            synthetic_df = pd.DataFrame(synthetic_data)
            augmented_df = pd.concat([df, synthetic_df], ignore_index=True)
            
            logger.info(f"Created {len(synthetic_data)} synthetic records, total: {len(augmented_df)}")
            
            # Save augmented dataset
            if save:
                output_path = os.path.join(self.output_path, 'augmented_dataset.csv')
                augmented_df.to_csv(output_path, index=False)
                logger.info(f"Saved augmented dataset to {output_path}")
            
            return augmented_df
        except Exception as e:
            logger.error(f"Error augmenting dataset: {e}")
            return None
    
    def split_dataset(self, test_size=0.2, random_state=42):
        """
        Split the dataset into training and testing sets
        
        Args:
            test_size: Proportion of the dataset to include in the test split
            random_state: Random seed for reproducibility
            
        Returns:
            Dictionary with train and test dataframes
        """
        try:
            from sklearn.model_selection import train_test_split
            
            if self.processed_data is None:
                self.preprocess_dataset()
                
            if self.processed_data is None:
                logger.error("No processed data available for splitting")
                return None
            
            df = self.processed_data
            
            # Split the dataset
            train_df, test_df = train_test_split(df, test_size=test_size, random_state=random_state)
            
            logger.info(f"Split dataset into train ({len(train_df)} records) and test ({len(test_df)} records)")
            
            return {
                'train': train_df,
                'test': test_df
            }
        except Exception as e:
            logger.error(f"Error splitting dataset: {e}")
            return None
    
    def get_delivery_features(self):
        """
        Extract features relevant for delivery optimization
        
        Returns:
            DataFrame with delivery features
        """
        try:
            if self.processed_data is None:
                self.preprocess_dataset()
                
            if self.processed_data is None:
                logger.error("No processed data available")
                return None
            
            df = self.processed_data
            
            # Select relevant features
            features = df[[
                'Order ID', 'Postman ID', 'Customer ID', 
                'Latitude', 'Longitude', 'Item Type',
                'Day of Week', 'Address Type', 'Lead Time',
                'Initial Time Slot'
            ]]
            
            if 'Modified Time Slot' in df.columns:
                features['Preferred Time Slot'] = df['Modified Time Slot']
            else:
                features['Preferred Time Slot'] = df['Initial Time Slot']
            
            return features
        except Exception as e:
            logger.error(f"Error extracting delivery features: {e}")
            return None
    
    def export_to_json(self, output_path=None):
        """
        Export the dataset to JSON format for API consumption
        
        Args:
            output_path: Path to save the JSON file
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if self.processed_data is None:
                self.preprocess_dataset()
                
            if self.processed_data is None:
                logger.error("No processed data available for export")
                return False
            
            df = self.processed_data
            output_path = output_path or os.path.join(self.output_path, 'delivery_data.json')
            
            # Convert to list of dictionaries
            records = df.to_dict(orient='records')
            
            # Save to JSON
            with open(output_path, 'w') as f:
                json.dump(records, f)
            
            logger.info(f"Exported {len(records)} records to {output_path}")
            return True
        except Exception as e:
            logger.error(f"Error exporting dataset to JSON: {e}")
            return False 
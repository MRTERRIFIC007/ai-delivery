import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from haversine import haversine
import logging
import json
import os
from datetime import datetime, timedelta
from sklearn.cluster import KMeans

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger('route_optimization')

# Initialize Flask app for the API
app = Flask(__name__)
CORS(app)

# Constants
MAX_DELIVERIES_PER_POSTMAN = 25
TIME_SLOTS = ['10-11', '11-12', '12-13', '13-14', '14-15', '15-16', '16-17', '17-18', '18-19']
POSTMAN_SPEED_KM_PER_HOUR = 12  # Average speed of postman on two-wheeler
DELIVERY_TIME_MINUTES = {
    0: 5,   # Residential: 5 minutes
    1: 7,   # Commercial: 7 minutes
    2: 10,  # Industrial: 10 minutes
    3: 5,   # Educational: 5 minutes
    4: 8    # Government: 8 minutes
}

class RouteOptimizer:
    def __init__(self):
        self.service_name = "OptiDeliver Route Optimization Service"
    
    def calculate_distance_matrix(self, locations):
        """
        Calculate distance matrix between all locations using haversine formula
        
        Args:
            locations: List of (latitude, longitude) tuples
            
        Returns:
            2D numpy array of distances in km
        """
        n = len(locations)
        distance_matrix = np.zeros((n, n))
        
        for i in range(n):
            for j in range(i+1, n):
                dist = haversine(locations[i], locations[j])
                distance_matrix[i, j] = dist
                distance_matrix[j, i] = dist
        
        return distance_matrix
    
    def nearest_neighbor_route(self, distance_matrix, start_idx=0):
        """
        Implement nearest neighbor algorithm for route planning
        
        Args:
            distance_matrix: 2D array of distances between points
            start_idx: Index of starting point
            
        Returns:
            List of indices representing the route
        """
        n = distance_matrix.shape[0]
        unvisited = set(range(n))
        unvisited.remove(start_idx)
        route = [start_idx]
        current = start_idx
        
        while unvisited:
            next_point = min(unvisited, key=lambda x: distance_matrix[current, x])
            route.append(next_point)
            unvisited.remove(next_point)
            current = next_point
        
        return route
    
    def two_opt_improvement(self, route, distance_matrix, max_iterations=100):
        """
        Implement 2-opt algorithm to improve TSP route
        
        Args:
            route: Initial route
            distance_matrix: 2D array of distances between points
            max_iterations: Maximum number of improvement iterations
            
        Returns:
            Improved route
        """
        best_route = route.copy()
        improved = True
        iteration = 0
        
        while improved and iteration < max_iterations:
            improved = False
            best_distance = self.calculate_route_distance(best_route, distance_matrix)
            
            for i in range(1, len(route) - 2):
                for j in range(i + 1, len(route) - 1):
                    new_route = best_route.copy()
                    # Reverse the route between positions i and j
                    new_route[i:j+1] = reversed(new_route[i:j+1])
                    new_distance = self.calculate_route_distance(new_route, distance_matrix)
                    
                    if new_distance < best_distance:
                        best_distance = new_distance
                        best_route = new_route
                        improved = True
            
            iteration += 1
        
        logger.info(f"Route improved with 2-opt algorithm in {iteration} iterations")
        return best_route
    
    def calculate_route_distance(self, route, distance_matrix):
        """
        Calculate total distance of a route
        
        Args:
            route: List of indices representing the route
            distance_matrix: 2D array of distances between points
            
        Returns:
            Total distance in km
        """
        total_distance = 0
        for i in range(len(route) - 1):
            total_distance += distance_matrix[route[i], route[i+1]]
        return total_distance
    
    def cluster_deliveries(self, deliveries, num_clusters):
        """
        Cluster deliveries geographically to assign to different postmen
        
        Args:
            deliveries: List of delivery points with coordinates
            num_clusters: Number of clusters (postmen)
            
        Returns:
            List of delivery clusters
        """
        if len(deliveries) <= num_clusters:
            # If we have fewer deliveries than clusters, assign one delivery per cluster
            return [[delivery] for delivery in deliveries[:num_clusters]]
        
        # Extract coordinates
        coordinates = np.array([[d['latitude'], d['longitude']] for d in deliveries])
        
        # Perform K-means clustering
        kmeans = KMeans(n_clusters=num_clusters, random_state=42)
        clusters = kmeans.fit_predict(coordinates)
        
        # Group deliveries by cluster
        clustered_deliveries = [[] for _ in range(num_clusters)]
        for i, delivery in enumerate(deliveries):
            cluster_idx = clusters[i]
            clustered_deliveries[cluster_idx].append(delivery)
        
        return clustered_deliveries
    
    def estimate_delivery_time(self, route, deliveries, distance_matrix):
        """
        Estimate the time required for completing a delivery route
        
        Args:
            route: List of indices representing the route
            deliveries: List of delivery details
            distance_matrix: 2D array of distances between points
            
        Returns:
            Dictionary with estimated times and distances
        """
        total_distance = self.calculate_route_distance(route, distance_matrix)
        
        # Calculate travel time (in hours)
        travel_time_hours = total_distance / POSTMAN_SPEED_KM_PER_HOUR
        
        # Calculate total service time (in hours)
        service_time_hours = 0
        for idx in route:
            if idx < len(deliveries):  # Skip depot if included
                address_type = deliveries[idx].get('address_type', 0)
                service_time_hours += DELIVERY_TIME_MINUTES.get(address_type, 5) / 60
        
        # Total route time
        total_time_hours = travel_time_hours + service_time_hours
        
        return {
            'total_distance_km': round(total_distance, 2),
            'travel_time_hours': round(travel_time_hours, 2),
            'service_time_hours': round(service_time_hours, 2),
            'total_time_hours': round(total_time_hours, 2),
            'estimated_completion_minutes': round(total_time_hours * 60, 0)
        }
    
    def optimize_postman_routes(self, deliveries, num_postmen=1, depot_location=None):
        """
        Main function to optimize delivery routes for multiple postmen
        
        Args:
            deliveries: List of delivery points
            num_postmen: Number of available postmen
            depot_location: (latitude, longitude) of post office depot
            
        Returns:
            Dictionary with optimized routes and statistics
        """
        try:
            if not deliveries:
                return {'error': 'No deliveries provided'}
            
            # Set default depot location if not provided (use first delivery as reference)
            if not depot_location and deliveries:
                depot_location = (deliveries[0]['latitude'], deliveries[0]['longitude'])
            
            # Cluster deliveries based on number of postmen
            delivery_clusters = self.cluster_deliveries(deliveries, num_postmen)
            
            # Optimize route for each cluster
            routes = []
            for cluster_idx, cluster in enumerate(delivery_clusters):
                if not cluster:
                    continue
                
                # Create locations list including depot
                locations = [(d['latitude'], d['longitude']) for d in cluster]
                if depot_location:
                    locations.insert(0, depot_location)  # Add depot as first location
                
                # Calculate distance matrix
                distance_matrix = self.calculate_distance_matrix(locations)
                
                # Get initial route using nearest neighbor
                initial_route = self.nearest_neighbor_route(distance_matrix)
                
                # Improve route using 2-opt
                optimized_route = self.two_opt_improvement(initial_route, distance_matrix)
                
                # Calculate route statistics
                route_details = self.estimate_delivery_time(optimized_route, cluster, distance_matrix)
                
                # Map route indices back to delivery details
                route_deliveries = []
                for idx in optimized_route:
                    if idx == 0 and depot_location:  # Depot
                        route_deliveries.append({
                            'type': 'depot',
                            'latitude': depot_location[0],
                            'longitude': depot_location[1],
                            'name': 'Post Office Depot'
                        })
                    else:
                        adj_idx = idx - 1 if depot_location else idx  # Adjust index if we added a depot
                        if adj_idx < len(cluster):
                            delivery = cluster[adj_idx].copy()
                            delivery['type'] = 'delivery'
                            route_deliveries.append(delivery)
                
                routes.append({
                    'postman_id': f"P{cluster_idx + 1}",
                    'delivery_count': len(cluster),
                    'route': route_deliveries,
                    'statistics': route_details
                })
            
            # Calculate overall statistics
            total_deliveries = sum(len(cluster) for cluster in delivery_clusters)
            total_distance = sum(route['statistics']['total_distance_km'] for route in routes)
            total_time = sum(route['statistics']['total_time_hours'] for route in routes)
            
            return {
                'success': True,
                'total_postmen': len(routes),
                'total_deliveries': total_deliveries,
                'total_distance_km': round(total_distance, 2),
                'total_time_hours': round(total_time, 2),
                'routes': routes
            }
            
        except Exception as e:
            logger.error(f"Error in route optimization: {e}")
            return {'error': str(e)}
    
    def optimize_by_time_slot(self, deliveries, num_postmen=1, depot_location=None):
        """
        Optimize routes by time slot to handle scheduled deliveries
        
        Args:
            deliveries: List of delivery points with time slots
            num_postmen: Number of available postmen
            depot_location: (latitude, longitude) of post office depot
            
        Returns:
            Dictionary with optimized routes per time slot
        """
        try:
            if not deliveries:
                return {'error': 'No deliveries provided'}
            
            # Group deliveries by time slot
            time_slot_deliveries = {}
            for delivery in deliveries:
                time_slot = delivery.get('time_slot')
                if time_slot not in time_slot_deliveries:
                    time_slot_deliveries[time_slot] = []
                time_slot_deliveries[time_slot].append(delivery)
            
            # Optimize routes for each time slot
            time_slot_routes = {}
            for time_slot, slot_deliveries in time_slot_deliveries.items():
                if slot_deliveries:
                    slot_result = self.optimize_postman_routes(
                        slot_deliveries, num_postmen, depot_location
                    )
                    time_slot_routes[time_slot] = slot_result
            
            # Calculate overall statistics
            total_deliveries = sum(result['total_deliveries'] for result in time_slot_routes.values())
            total_distance = sum(result['total_distance_km'] for result in time_slot_routes.values())
            
            return {
                'success': True,
                'total_time_slots': len(time_slot_routes),
                'total_postmen': num_postmen,
                'total_deliveries': total_deliveries,
                'total_distance_km': round(total_distance, 2),
                'time_slot_routes': time_slot_routes
            }
            
        except Exception as e:
            logger.error(f"Error in time slot route optimization: {e}")
            return {'error': str(e)}

# Create optimizer instance
route_optimizer = RouteOptimizer()

# API endpoints
@app.route('/optimize-routes', methods=['POST'])
def optimize_routes():
    """API endpoint to optimize delivery routes"""
    try:
        data = request.json
        if not data or 'deliveries' not in data:
            return jsonify({'error': 'Missing required field: deliveries'}), 400
        
        deliveries = data['deliveries']
        num_postmen = int(data.get('num_postmen', 1))
        
        # Check if depot location is provided
        depot_location = None
        if 'depot_latitude' in data and 'depot_longitude' in data:
            depot_location = (float(data['depot_latitude']), float(data['depot_longitude']))
        
        # Check if we should organize by time slot
        by_time_slot = data.get('by_time_slot', False)
        
        if by_time_slot:
            result = route_optimizer.optimize_by_time_slot(deliveries, num_postmen, depot_location)
        else:
            result = route_optimizer.optimize_postman_routes(deliveries, num_postmen, depot_location)
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in optimize routes endpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/calculate-eta', methods=['POST'])
def calculate_eta():
    """API endpoint to calculate estimated arrival times for a route"""
    try:
        data = request.json
        if not data or 'route' not in data:
            return jsonify({'error': 'Missing required field: route'}), 400
        
        route = data['route']
        start_time = data.get('start_time', '10:00')
        
        # Parse start time
        hours, minutes = map(int, start_time.split(':'))
        current_time = datetime.now().replace(hour=hours, minute=minutes, second=0, microsecond=0)
        
        # Calculate ETAs for each stop
        for stop in route:
            # Travel time to this stop (from previous location)
            travel_time_minutes = stop.get('travel_time_minutes', 10)
            
            # Service time at this stop
            address_type = stop.get('address_type', 0)
            service_time_minutes = DELIVERY_TIME_MINUTES.get(address_type, 5)
            
            # Add travel time to current time
            current_time += timedelta(minutes=travel_time_minutes)
            
            # Set ETA
            stop['eta'] = current_time.strftime('%H:%M')
            
            # Add service time for next stop calculation
            current_time += timedelta(minutes=service_time_minutes)
        
        return jsonify({
            'route_with_eta': route,
            'start_time': start_time,
            'end_time': current_time.strftime('%H:%M')
        })
    except Exception as e:
        logger.error(f"Error in calculate ETA endpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """API endpoint to check service health"""
    return jsonify({
        'status': 'healthy',
        'service': route_optimizer.service_name,
        'version': '1.0.0'
    })

# Main entry point
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5003))
    logger.info(f"Starting Route Optimization Service on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True) 
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import math

load_dotenv()

app = Flask(__name__)
CORS(app)

def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two points using Haversine formula
    """
    R = 6371  # Earth's radius in kilometers

    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    distance = R * c

    return distance

def optimize_route(deliveries, start_location):
    """
    Optimize delivery routes using a simple nearest neighbor algorithm
    """
    try:
        # Parse start location
        start_lat, start_lon = map(float, start_location.split(','))
        
        # Create list of all locations including start point
        locations = [(start_lat, start_lon)] + [(d['latitude'], d['longitude']) for d in deliveries]
        n = len(locations)
        
        # Initialize route
        unvisited = set(range(1, n))  # Skip start location
        current = 0
        route = [current]
        total_distance = 0
        detailed_route = []
        
        # Simple nearest neighbor algorithm
        while unvisited:
            # Find nearest unvisited location
            current_loc = locations[current]
            min_dist = float('inf')
            next_loc_idx = None
            
            for i in unvisited:
                dist = calculate_distance(
                    current_loc[0], current_loc[1],
                    locations[i][0], locations[i][1]
                )
                if dist < min_dist:
                    min_dist = dist
                    next_loc_idx = i
            
            # Add to route
            route.append(next_loc_idx)
            total_distance += min_dist
            
            # Add segment details
            if next_loc_idx is not None:
                next_loc = locations[next_loc_idx]
                detailed_route.append({
                    'start_address': f"{current_loc[0]}, {current_loc[1]}",
                    'end_address': f"{next_loc[0]}, {next_loc[1]}",
                    'distance': min_dist * 1000,  # Convert to meters
                    'duration': (min_dist * 1000) / 50,  # Rough estimate: 50 meters per second
                    'polyline': None  # We don't have actual route polylines without Google Maps
                })
            
            unvisited.remove(next_loc_idx)
            current = next_loc_idx
        
        # Return to start
        last_dist = calculate_distance(
            locations[current][0], locations[current][1],
            start_lat, start_lon
        )
        route.append(0)
        total_distance += last_dist
        
        # Add final segment back to start
        detailed_route.append({
            'start_address': f"{locations[current][0]}, {locations[current][1]}",
            'end_address': f"{start_lat}, {start_lon}",
            'distance': last_dist * 1000,
            'duration': (last_dist * 1000) / 50,
            'polyline': None
        })
        
        return {
            'route': route,
            'total_distance': total_distance * 1000,  # Convert to meters
            'total_duration': (total_distance * 1000) / 50,  # Rough estimate
            'detailed_route': detailed_route
        }
        
    except Exception as e:
        print(f"Error in route optimization: {str(e)}")
        return None

@app.route('/optimize-route', methods=['POST'])
def optimize():
    try:
        data = request.json
        if not data or 'deliveries' not in data or 'start_location' not in data:
            print("Missing required fields in request:", data)
            return jsonify({'error': 'Missing required fields'}), 400
        
        deliveries = data['deliveries']
        start_location = data['start_location']
        
        print("Received request:", data)
        
        optimized_route = optimize_route(deliveries, start_location)
        
        if optimized_route:
            return jsonify(optimized_route)
        else:
            return jsonify({'error': 'Failed to optimize route'}), 500
            
    except Exception as e:
        print("Error in optimize endpoint:", str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        return jsonify({
            'status': 'healthy',
            'service': 'Route Optimization Service',
            'time': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

if __name__ == "__main__":
    print("Starting Route Optimization Service on http://localhost:5017")
    app.run(host="0.0.0.0", port=5017, debug=True) 
import os
import logging
import time
from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS
from waitress import serve
from dotenv import load_dotenv
import threading

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger('ai_service')

# Load environment variables
load_dotenv()

# Import service modules
try:
    # Import modules directly instead of as blueprints
    import timeslot_prediction
    import route_optimization
    from dataset_manager import DatasetManager
    logger.info("Successfully imported all service modules")
except Exception as e:
    logger.error(f"Error importing modules: {e}")
    raise

# Initialize the main Flask app
app = Flask(__name__)
CORS(app)

# Create blueprints for the services
timeslot_blueprint = Blueprint('timeslot', __name__)
route_blueprint = Blueprint('route', __name__)

# Copy routes from the timeslot app to the blueprint
for rule in timeslot_prediction.app.url_map.iter_rules():
    if rule.endpoint != 'static':
        view_func = timeslot_prediction.app.view_functions[rule.endpoint]
        timeslot_blueprint.route(rule.rule, methods=rule.methods)(view_func)

# Copy routes from the route app to the blueprint
for rule in route_optimization.app.url_map.iter_rules():
    if rule.endpoint != 'static':
        view_func = route_optimization.app.view_functions[rule.endpoint]
        route_blueprint.route(rule.rule, methods=rule.methods)(view_func)

# Register blueprints
app.register_blueprint(timeslot_blueprint, url_prefix='/timeslot')
app.register_blueprint(route_blueprint, url_prefix='/route')

# Main endpoints
@app.route('/', methods=['GET'])
def index():
    """Root endpoint with service information"""
    return jsonify({
        'service': 'OptiDeliver AI Service',
        'version': '1.0.0',
        'endpoints': {
            'timeslot': '/timeslot/predict-timeslot',
            'route': '/route/optimize-routes',
            'health': '/health'
        }
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for the entire service"""
    return jsonify({
        'status': 'healthy',
        'service': 'OptiDeliver AI Service',
        'version': '1.0.0',
        'components': {
            'timeslot_prediction': 'active',
            'route_optimization': 'active',
            'dataset_manager': 'active'
        }
    })

@app.route('/create-order', methods=['POST'])
def create_order():
    """
    Create a new delivery order and predict optimal time slot
    
    Request format:
    {
        "customer_id": "CUST102",
        "latitude": 17.486395,
        "longitude": 78.500423,
        "address_type": 1,  # 0: Residential, 1: Commercial
        "item_type": "GID-PAN",
        "day_of_week": 3,
        "delivery_date": "2024-12-18"
    }
    """
    try:
        data = request.json
        logger.info(f"Received order creation request: {data}")
        
        # Validate required fields
        required_fields = ['customer_id', 'latitude', 'longitude', 'address_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Generate order ID
        import random
        order_id = f"ORD{random.randint(1000, 9999)}"
        
        # Assign postman (would be optimized in real implementation)
        postman_id = f"POST{random.randint(1, 10):03d}"
        
        # Use timeslot_prediction directly
        prediction_result = timeslot_prediction.predict_optimal_timeslot({
            'customer_id': data['customer_id'],
            'latitude': data['latitude'],
            'longitude': data['longitude'],
            'address_type': data['address_type'],
            'item_type': data.get('item_type', 'REGULAR'),
            'day_of_week': data.get('day_of_week', 0),
            'lead_time': data.get('lead_time', 7),
            'postman_id': postman_id
        })
        
        # Create final order
        order = {
            'order_id': order_id,
            'customer_id': data['customer_id'],
            'postman_id': postman_id,
            'latitude': data['latitude'],
            'longitude': data['longitude'],
            'delivery_address': f"{data['latitude']},{data['longitude']}",
            'address_type': data['address_type'],
            'item_type': data.get('item_type', 'REGULAR'),
            'booking_date': data.get('booking_date', time.strftime('%Y-%m-%d')),
            'delivery_date': data.get('delivery_date', ''),
            'day_of_week': data.get('day_of_week', 0),
            'predicted_time_slot': prediction_result.get('predicted_time_slot', 1),
            'confidence': prediction_result.get('confidence', 0.0),
            'explanation': prediction_result.get('explanation', '')
        }
        
        logger.info(f"Created order: {order_id} with time slot {order['predicted_time_slot']}")
        
        return jsonify({
            'success': True,
            'order': order
        })
    except Exception as e:
        logger.error(f"Error creating order: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/sample-dataset', methods=['GET'])
def get_sample_data():
    """Return a sample of the dataset for demonstration"""
    try:
        # Initialize dataset manager
        manager = DatasetManager()
        df = manager.load_dataset()
        
        if df is None:
            return jsonify({'error': 'Failed to load dataset'}), 500
        
        # Return sample data (first 10 rows)
        sample = df.head(10).to_dict(orient='records')
        
        return jsonify({
            'success': True,
            'sample_size': len(sample),
            'data': sample
        })
    except Exception as e:
        logger.error(f"Error retrieving sample data: {e}")
        return jsonify({'error': str(e)}), 500

def initialize_services():
    """Initialize all service components"""
    try:
        logger.info("Initializing AI services...")
        
        # Initialize dataset manager and process the dataset
        dataset_manager = DatasetManager()
        dataset_manager.load_dataset()
        dataset_manager.preprocess_dataset()
        
        # Initialize timeslot prediction
        timeslot_prediction.initialize()
        
        logger.info("All services initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        return False

if __name__ == '__main__':
    # Initialize services
    initialized = initialize_services()
    
    if initialized:
        # Get configuration from environment
        host = os.environ.get('HOST', '0.0.0.0')
        port = int(os.environ.get('PORT', 5000))
        debug_mode = os.environ.get('DEBUG', 'False').lower() == 'true'
        
        if debug_mode:
            logger.info(f"Starting AI Service in DEBUG mode on http://{host}:{port}")
            app.run(host=host, port=port, debug=True)
        else:
            logger.info(f"Starting AI Service in PRODUCTION mode on http://{host}:{port}")
            serve(app, host=host, port=port, threads=4)
    else:
        logger.error("Failed to start AI Service due to initialization errors") 
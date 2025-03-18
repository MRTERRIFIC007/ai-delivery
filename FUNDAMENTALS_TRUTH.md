# FUNDAMENTALS_TRUTH

## Project Structure

- **Frontend**: React application with TypeScript and Tailwind CSS
- **Backend**: Node.js Express API with MongoDB integration
- **AI Service**: Python-based service with route optimization and delivery prediction

## Core Features Implemented

1. **User Authentication**

   - Login/Registration system
   - Protected routes for authenticated users
   - Public tracking without authentication

2. **Order Management**

   - Create new delivery orders
   - Track orders by tracking number
   - View order details and status
   - Schedule delivery time slots

3. **Delivery Management**

   - Time slot selection for deliveries
   - Status tracking (pending, in transit, delivered)
   - Public order tracking interface

4. **AI-Powered Route Optimization**

   - Google Maps integration for visualization
   - Route optimization algorithm using nearest neighbor
   - Distance and duration estimation
   - Visualization of optimized delivery routes

5. **AI-Powered Time Slot Prediction for India Post**
   - Machine learning-based time slot recommendation system for India Post deliveries
   - Recipient-centric time slot predictions based on location type and day of week
   - Customized time slots based on historical recipient preferences
   - Learning system that adapts to recipient choices over time
   - India Post specific time slots (10am-7pm) with confidence scoring
   - Recipient feedback loop to continuously improve predictions

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, React Router
- **Backend**: Node.js, Express, MongoDB
- **AI Service**: Flask, Pandas, scikit-learn, RandomForest
- **Tools**: Vite, npm

## Architectural Design

- Microservices architecture with separate services for:
  - Frontend user interface (port 5173)
  - Backend API (port 5003)
  - Route optimization service (port 5006)
  - India Post time slot prediction service (port 5010)

## API Integration

- Backend API endpoints for order management
- Route optimization API for delivery route planning
- Time slot prediction API with continuous learning capability
- Recipient preference recording and learning

## User Interfaces

1. **Admin/Sender Interface**

   - Dashboard for managing orders
   - Order creation form
   - Delivery map with route optimization

2. **Recipient Interface**
   - Package tracking by tracking number
   - Time slot selection with AI recommendations
   - Order status information
   - Ability to update preferred delivery time slots

## India Post Specific Features

1. **Customized Time Slots**

   - Time slots aligned with India Post working hours (10am-7pm)
   - Different slot recommendations for residential vs. business addresses
   - Weekend vs. weekday differentiation
   - Area code (postal code) based recommendations

2. **Learning System**

   - Captures recipient preferences over time
   - Builds a preference model per recipient
   - Improves recommendations based on historical choices
   - Provides explanations specific to India Post operations

3. **Reduced Failed Deliveries**
   - Aims to minimize missed deliveries through smart scheduling
   - Prioritizes recipient-preferred time slots
   - Adapts to changing recipient behaviors

## Future Integrations

- Twilio for OTP and authentication
- MongoDB Atlas for cloud database
- SMS notifications for delivery updates and time slot changes

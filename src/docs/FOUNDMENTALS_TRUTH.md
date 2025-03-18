# OptiDeliver - Foundational Truths

This document serves as a reference for the foundational elements of the OptiDeliver project. It will be updated as development progresses to maintain consistency and prevent hallucinations.

## Project Structure

1. **Backend**: Node.js with Express and TypeScript

   - Located in: `/backend`
   - Main entry point: `/backend/src/index.ts`

2. **Frontend**: React with Vite and TypeScript
   - Located in: `/frontend/sender-interface`
   - Main entry point: `/frontend/sender-interface/src/main.tsx`

## Database

- MongoDB Atlas
- Connection string: MongoDB Atlas with the following details:
  - Cluster: `cluster0.0pn8t.mongodb.net`
  - Credentials: admin/admin
  - Development mode can function without MongoDB connection

## API Routes

1. **User Routes**: `/api/users`

   - Authentication endpoints
   - User management

2. **Order Routes**: `/api/orders`

   - Order creation, retrieval, and management

3. **Delivery Routes**: `/api/deliveries`

   - Delivery status and tracking

4. **Time Slot Routes**: `/api/time-slots`
   - Time slot management and availability

## Models

1. **User Model**:

   - Fields: \_id, name, email, password, role (sender/receiver)

2. **Order Model**:

   - Fields: \_id, trackingId, senderId, receiverDetails, deliveryDate, selectedTimeSlot, status, createdAt

3. **TimeSlot Model**:
   - Fields: startTime, endTime, capacity, available, area, postmanId, isActive, maxDeliveriesPerPostman, priority

## Authentication

- JWT-based authentication
- Development mode includes mock authentication middleware

## AI Integration

- Will integrate with an AI service for delivery optimization
- AI service URL defined in environment variables

## Future Integrations

- Twilio for OTP integration (planned future feature)

## Environment Variables

Backend:

- PORT=5003
- MONGODB_URI= MongoDB Atlas connection string
- JWT_SECRET= Secret key for JWT
- NODE_ENV= Current environment (development/production)
- AI_SERVICE_URL= URL for AI service

Frontend:

- VITE_APP_API_URL= Backend API URL
- VITE_APP_NAME= Application name
- VITE_APP_VERSION= Application version

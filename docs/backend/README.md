# OptiDeliver Backend Documentation

## Overview

The OptiDeliver backend is a robust Node.js/Express application that powers the delivery optimization system for India Post. It provides RESTful APIs, handles data processing, and integrates with various services including AI prediction and MongoDB database.

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcrypt
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **AI Integration**: Custom AI service

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── index.ts         # Application entry point
├── tests/               # Test files
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## Core Services

### 1. Authentication Service

- User registration and login
- JWT token management
- Password hashing with bcrypt
- Role-based access control

### 2. Order Management Service

- Order creation and validation
- Time slot allocation
- Status tracking
- History management

### 3. Route Optimization Service

- AI-powered route planning
- Delivery sequence optimization
- Real-time route updates
- Performance analytics

### 4. Notification Service

- SMS notifications
- Email alerts
- Push notifications
- Delivery reminders

### 5. AI Integration Service

- Time slot prediction
- Route optimization
- Delivery pattern analysis
- Performance forecasting

## Database Models

### 1. User Model

```typescript
interface User {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
  role: "sender" | "recipient" | "postman" | "admin";
  phone: string;
  addresses: Address[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Order Model

```typescript
interface Order {
  _id: ObjectId;
  senderId: ObjectId;
  recipientId: ObjectId;
  status: OrderStatus;
  timeSlot: TimeSlot;
  address: Address;
  trackingNumber: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. TimeSlot Model

```typescript
interface TimeSlot {
  _id: ObjectId;
  startTime: Date;
  endTime: Date;
  capacity: number;
  available: number;
  area: string;
  postmanId?: ObjectId;
}
```

## API Endpoints

### Authentication Routes

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh-token
```

### Order Routes

```
POST /api/orders
GET /api/orders
GET /api/orders/:id
PUT /api/orders/:id
DELETE /api/orders/:id
```

### Time Slot Routes

```
GET /api/time-slots
POST /api/time-slots
PUT /api/time-slots/:id
DELETE /api/time-slots/:id
```

### Route Optimization Routes

```
POST /api/routes/optimize
GET /api/routes/:id
PUT /api/routes/:id/status
```

## Middleware

### 1. Authentication Middleware

- JWT token validation
- Role-based access control
- Request logging

### 2. Validation Middleware

- Request body validation
- Query parameter validation
- File upload validation

### 3. Error Handling Middleware

- Global error handler
- Custom error classes
- Error logging

## AI Service Integration

### 1. Time Slot Prediction

```typescript
interface PredictionRequest {
  address: Address;
  historicalData: DeliveryHistory[];
  currentLoad: number;
}

interface PredictionResponse {
  recommendedTimeSlots: TimeSlot[];
  confidence: number;
  reasoning: string;
}
```

### 2. Route Optimization

```typescript
interface RouteRequest {
  deliveries: Delivery[];
  constraints: RouteConstraints;
  preferences: RoutePreferences;
}

interface RouteResponse {
  optimizedRoute: Route;
  estimatedTime: number;
  efficiency: number;
}
```

## Error Handling

### 1. Custom Error Classes

```typescript
class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
  }
}

class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

class AuthenticationError extends AppError {
  constructor(message: string) {
    super(401, message);
  }
}
```

### 2. Error Response Format

```typescript
interface ErrorResponse {
  status: "error";
  code: number;
  message: string;
  details?: any;
}
```

## Security Measures

### 1. Authentication

- JWT token-based authentication
- Password hashing with bcrypt
- Token refresh mechanism
- Session management

### 2. Data Protection

- Input sanitization
- XSS prevention
- CSRF protection
- Rate limiting

### 3. API Security

- HTTPS enforcement
- Request validation
- Response sanitization
- Error message handling

## Performance Optimization

### 1. Database Optimization

- Indexing strategies
- Query optimization
- Connection pooling
- Caching

### 2. API Optimization

- Response compression
- Request batching
- Pagination
- Caching headers

### 3. Resource Management

- Memory usage optimization
- Connection pooling
- Background job processing
- Load balancing

## Testing

### 1. Unit Tests

- Service layer testing
- Controller testing
- Utility function testing
- Model testing

### 2. Integration Tests

- API endpoint testing
- Database integration
- External service integration
- Authentication flow

### 3. Performance Tests

- Load testing
- Stress testing
- Endurance testing
- Spike testing

## Deployment

### 1. Environment Setup

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start production server
npm start
```

### 2. Environment Variables

```env
NODE_ENV=production
PORT=5003
MONGODB_URI=mongodb://localhost:27017/optideliver
JWT_SECRET=your-secret-key
AI_SERVICE_URL=http://localhost:5001
```

### 3. Docker Deployment

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 5003
CMD ["npm", "start"]
```

## Monitoring and Logging

### 1. Application Logging

- Request logging
- Error logging
- Performance metrics
- Audit trails

### 2. System Monitoring

- Resource usage
- API performance
- Database metrics
- External service health

### 3. Alerting

- Error alerts
- Performance alerts
- Security alerts
- System health alerts

## Maintenance

### 1. Regular Tasks

- Dependency updates
- Security patches
- Database backups
- Log rotation

### 2. Performance Tuning

- Query optimization
- Cache management
- Resource allocation
- Load balancing

### 3. Security Updates

- Vulnerability scanning
- Security patches
- Access review
- Compliance checks

## Support

### 1. Troubleshooting

- Common issues
- Error resolution
- Performance issues
- Security incidents

### 2. Documentation

- API documentation
- Database schema
- Deployment guide
- Maintenance procedures

### 3. Contact

- Technical support
- Security team
- Development team
- Operations team

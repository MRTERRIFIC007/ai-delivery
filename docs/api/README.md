# OptiDeliver API Documentation

## Overview

This document outlines the API endpoints and their interactions between the frontend and backend components of the OptiDeliver system. The API follows RESTful principles and uses JSON for data exchange.

## Base URL

```
Development: http://localhost:5003/api
Production: https://api.optideliver.com/api
```

## Authentication

All API requests require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Common Response Format

### Success Response

```json
{
  "status": "success",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "status": "error",
  "code": 400,
  "message": "Error message",
  "details": {
    // Additional error details
  }
}
```

## Authentication Endpoints

### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "name": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "role": "sender" | "recipient" | "postman" | "admin"
}
```

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

### Refresh Token

```http
POST /auth/refresh-token
Authorization: Bearer <refresh_token>
```

## Order Management Endpoints

### Create Order

```http
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipientId": "string",
  "timeSlot": {
    "startTime": "ISO date string",
    "endTime": "ISO date string"
  },
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "pincode": "string"
  },
  "packageDetails": {
    "weight": "number",
    "dimensions": {
      "length": "number",
      "width": "number",
      "height": "number"
    }
  }
}
```

### Get Orders

```http
GET /orders
Authorization: Bearer <token>
Query Parameters:
  - page: number
  - limit: number
  - status: string
  - date: string
```

### Update Order Status

```http
PUT /orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "string",
  "notes": "string"
}
```

## Time Slot Management

### Get Available Time Slots

```http
GET /time-slots
Authorization: Bearer <token>
Query Parameters:
  - date: string
  - area: string
  - capacity: number
```

### Book Time Slot

```http
POST /time-slots/book
Authorization: Bearer <token>
Content-Type: application/json

{
  "timeSlotId": "string",
  "orderId": "string"
}
```

### Modify Time Slot

```http
PUT /time-slots/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "startTime": "ISO date string",
  "endTime": "ISO date string",
  "capacity": "number"
}
```

## Route Optimization

### Get Optimized Route

```http
POST /routes/optimize
Authorization: Bearer <token>
Content-Type: application/json

{
  "deliveries": [
    {
      "orderId": "string",
      "address": {
        "street": "string",
        "city": "string",
        "state": "string",
        "pincode": "string"
      },
      "timeSlot": {
        "startTime": "ISO date string",
        "endTime": "ISO date string"
      }
    }
  ],
  "constraints": {
    "maxDistance": "number",
    "maxTime": "number",
    "vehicleCapacity": "number"
  }
}
```

### Update Route Status

```http
PUT /routes/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "string",
  "currentLocation": {
    "latitude": "number",
    "longitude": "number"
  },
  "estimatedArrival": "ISO date string"
}
```

## Notification Endpoints

### Send Delivery Notification

```http
POST /notifications/delivery
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "string",
  "type": "SMS" | "EMAIL" | "PUSH",
  "message": "string",
  "recipient": {
    "phone": "string",
    "email": "string"
  }
}
```

### Get Notification History

```http
GET /notifications/history
Authorization: Bearer <token>
Query Parameters:
  - orderId: string
  - type: string
  - startDate: string
  - endDate: string
```

## AI Service Integration

### Get Time Slot Predictions

```http
POST /ai/predict-time-slots
Authorization: Bearer <token>
Content-Type: application/json

{
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "pincode": "string"
  },
  "historicalData": [
    {
      "date": "ISO date string",
      "success": "boolean",
      "timeSlot": {
        "startTime": "ISO date string",
        "endTime": "ISO date string"
      }
    }
  ]
}
```

### Get Route Optimization Suggestions

```http
POST /ai/optimize-route
Authorization: Bearer <token>
Content-Type: application/json

{
  "deliveries": [
    {
      "orderId": "string",
      "address": {
        "street": "string",
        "city": "string",
        "state": "string",
        "pincode": "string"
      },
      "timeSlot": {
        "startTime": "ISO date string",
        "endTime": "ISO date string"
      }
    }
  ],
  "constraints": {
    "maxDistance": "number",
    "maxTime": "number",
    "vehicleCapacity": "number"
  }
}
```

## Rate Limiting

API requests are limited to:

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

## Error Codes

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## WebSocket Events

### Real-time Updates

```typescript
interface WebSocketMessage {
  type: "ORDER_UPDATE" | "DELIVERY_STATUS" | "ROUTE_UPDATE";
  data: any;
  timestamp: string;
}
```

### Connection

```javascript
const ws = new WebSocket("ws://localhost:5003/ws");

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // Handle message
};
```

## API Versioning

The API is versioned through the URL path:

```
/api/v1/...
```

## CORS Configuration

The API allows requests from:

- Development: `http://localhost:3000`
- Production: `https://optideliver.com`

## Security Headers

All responses include security headers:

- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000; includeSubDomains

## Testing

### Test Credentials

```json
{
  "email": "test@example.com",
  "password": "password"
}
```

### Test Environment

Base URL: `http://localhost:5003/api`
Test Database: `optideliver_test`

## Support

For API support:

- Email: api-support@optideliver.com
- Documentation: https://api.optideliver.com/docs
- Status Page: https://status.optideliver.com

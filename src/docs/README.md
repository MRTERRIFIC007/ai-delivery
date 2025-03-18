# Optideliver - AI-Powered Delivery Optimization System

## Introduction

The **OptiDeliver** is a comprehensive solution designed to optimize the delivery routes, track deliveries, and provide an interface for senders to manage their shipments. The system consists of four main components:

- **Sender Interface**: A web application for senders to create and manage delivery orders.
- **Postman App**: An application for delivery personnel to view and update delivery statuses.
- **Route Optimization Dashboard**: A dashboard for optimizing delivery routes and tracking delivery metrics.
- **Backend API Server**: A Node.js/Express server that provides API endpoints for all the frontend components and integrates with the AI prediction service.

## Project Structure

```markdown
├── Dataset.csv
├── Finale OptiDeliver_Infinitely Innovative_SIH-2024_final.pptx
├── OptiDeliver-Phase2/
│ ├── backend/
│ │ ├── src/
│ │ │ ├── config/
│ │ │ ├── controllers/
│ │ │ ├── middleware/
│ │ │ ├── models/
│ │ │ ├── routes/
│ │ │ ├── utils/
│ │ │ └── index.ts
│ │ ├── .env
│ │ ├── package.json
│ │ └── tsconfig.json
├── Postman-app/
│ └── project/
│ ├── .bolt/
│ ├── .env
│ ├── .gitignore
│ ├── eslint.config.js
│ ├── index.html
│ └── src/
├── prediction.ipynb
├── prediction.py
├── Route-optimization-dashboard/
│ └── route/
│ └── project/
│ ├── .bolt/
│ ├── .env
│ ├── .gitignore
│ ├── index.html
│ └── src/
├── Sender-interface/
│ ├── .bolt/
│ ├── .env
│ ├── .gitignore
│ ├── dashboard.js
│ ├── eslint.config.js
│ ├── index.html
│ ├── package.json
│ ├── postcss.config.js
│ ├── public/
│ ├── src/
│ ├── styles.css
│ ├── tailwind.config.js
│ ├── tsconfig.app.json
│ ├── tsconfig.json
│ ├── tsconfig.node.json
│ └── vite.config.ts
└── Survey Responses.xlsx
```

## Components

### Sender Interface

Located in [`Sender-interface`](Sender-interface), this React application allows senders to:

- Create new delivery orders.
- Manage and track existing orders.
- Receive notifications about delivery statuses.

#### Features

- User authentication and authorization.
- Order creation with recipient details and delivery preferences.
- Real-time tracking of deliveries.

### Postman App

Found in [`Postman-app/project`](Postman-app/project), this application enables delivery personnel to:

- View assigned deliveries.
- Update delivery statuses (e.g., pending, in-progress, completed).
- View optimized delivery routes on a map.

#### Features

- Interactive map display using Leaflet and React Leaflet.
- Delivery metrics calculation (e.g., completed deliveries, distance covered).
- Real-time updates and notifications.

### Route Optimization Dashboard

Located in [`Route-optimization-dashboard/route/project`](Route-optimization-dashboard/route/project), this dashboard provides:

- Visualization of delivery routes.
- Optimization algorithms to calculate the most efficient delivery order.
- Tracking of delivery progress and statuses.

#### Features

- Map visualization with markers for delivery points.
- Route optimization using custom utilities.
- Integration with delivery tracking data.

### Backend API Server

Located in [`OptiDeliver-Phase2/backend`](OptiDeliver-Phase2/backend), this Node.js/Express server provides:

- RESTful API endpoints for all frontend components
- User authentication and authorization
- Database integration with MongoDB
- Integration with the AI prediction service

#### Features

- **User Management**: Registration, login, profile management with JWT authentication
- **Order Management**: Create, read, update, and delete delivery orders
- **Delivery Management**: Assign orders to delivery personnel, update delivery status
- **Time Slot Prediction**: Integration with AI service to predict optimal delivery time slots
- **Statistics and Analytics**: Delivery metrics and time slot efficiency data

#### Backend Structure

- **Models**: MongoDB schemas for User, Order, and other data entities
- **Routes**: API endpoints for users, orders, deliveries, and time slots
- **Middleware**: Authentication and authorization middleware
- **Utils**: Utility functions including AI service integration
- **Config**: Database and environment configuration

### AI Prediction Service

Located in the root directory as `prediction.py` (converted from `prediction.ipynb`), this Python service:

- Analyzes delivery data to predict optimal time slots
- Provides an API endpoint for the backend to request predictions
- Achieves 92.7% accuracy in time slot prediction

## Installation

### Prerequisites

- **Node.js** (version 14 or higher)
- **npm** or **yarn**
- **MongoDB** (local or Atlas)
- **Python 3.8+** (for AI service)

### Clone the Repository

```bash
git clone https://github.com/rishitsura/india-post-delivery-system.git
```

## Installing Dependencies

### Backend API Server

```bash
cd OptiDeliver-Phase2/backend
npm install
```

### Sender Interface

```bash
cd india-post-delivery-system/Sender-interface
npm install
```

### Postman App

```bash
cd india-post-delivery-system/Postman-app/project
npm install
```

### Route Optimization Dashboard

```bash
cd india-post-delivery-system/Route-optimization-dashboard/route/project
npm install
```

### AI Prediction Service

```bash
pip install flask flask-cors pandas scikit-learn numpy
```

## Running the System

### Backend API Server

```bash
cd OptiDeliver-Phase2/backend
npm run dev
```

The backend server will run on http://localhost:5000

### AI Prediction Service

```bash
python prediction.py
```

The AI service will run on http://localhost:5001

### Frontend Applications

Run each of the frontend applications according to their respective documentation.

## API Endpoints

### Authentication

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login a user
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update user profile
- `PUT /api/users/change-password` - Change password

### Orders

- `GET /api/orders` - Get all orders (admin)
- `GET /api/orders/my-orders` - Get user's orders
- `GET /api/orders/:id` - Get a specific order
- `POST /api/orders` - Create a new order
- `PUT /api/orders/:id` - Update an order
- `DELETE /api/orders/:id` - Delete an order

### Deliveries

- `GET /api/deliveries/personnel` - Get all delivery personnel (admin)
- `GET /api/deliveries/my-route` - Get delivery person's current route
- `PUT /api/deliveries/status/:orderId` - Update delivery status
- `GET /api/deliveries/stats` - Get delivery statistics (admin)

### Time Slots

- `GET /api/timeslots/available` - Get available time slots
- `GET /api/timeslots/distribution` - Get time slot distribution (admin)
- `GET /api/timeslots/ai-health` - Check AI service health
- `GET /api/timeslots/efficiency` - Get time slot efficiency metrics (admin)

## System Architecture

The OptiDeliver system follows a microservices architecture:

1. **Frontend Applications**: Three separate React applications for different user roles
2. **Backend API Server**: Node.js/Express server providing RESTful APIs
3. **AI Prediction Service**: Python Flask service for time slot prediction
4. **Database**: MongoDB for data persistence

Data flows through the system as follows:

- Senders create delivery orders via the Sender Interface
- The backend processes the order and requests a time slot prediction from the AI service
- Delivery personnel receive assigned orders through the Postman App
- Managers monitor deliveries and optimize routes via the Route Optimization Dashboard

## Usage

- Access the Sender Interface to create and manage delivery orders.
- Use the Postman App to view assigned deliveries and update their statuses.
- Utilize the Route Optimization Dashboard to visualize and optimize delivery routes.
- The Backend API Server connects all components and provides data persistence.
- The AI Prediction Service analyzes delivery data to suggest optimal time slots.

## Contributing

We welcome contributions to improve the India Post Delivery System! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow the existing code style and conventions
- Write clear commit messages
- Update documentation as needed
- Add tests for new features
- Ensure all tests pass before submitting PR

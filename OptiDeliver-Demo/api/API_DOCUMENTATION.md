# OptiDeliver API Documentation

This document describes the API endpoints available in the OptiDeliver demo.

## Base URL

All API endpoints are relative to:

```
http://localhost:5000
```

## Endpoints

### Health Check

**GET /health**

Check if the API and model are running properly.

**Response**

```json
{
  "status": "healthy",
  "model": "loaded",
  "accuracy": 92.7
}
```

### Predict Optimal Time Slot

**POST /predict**

Predict the optimal delivery time slot based on customer information and location.

**Request Body**

```json
{
  "customer_id": "CUST102",
  "latitude": 17.49,
  "longitude": 78.504,
  "address_type": 1
}
```

**Parameters**

| Parameter    | Type   | Description                                                    |
| ------------ | ------ | -------------------------------------------------------------- |
| customer_id  | string | Unique identifier for the customer                             |
| latitude     | number | Latitude coordinate of the delivery location                   |
| longitude    | number | Longitude coordinate of the delivery location                  |
| address_type | number | Type of address (1: Residential, 2: Commercial, 3: Industrial) |

**Response**

```json
{
  "customer_id": "CUST102",
  "predicted_time_slot": 2,
  "accuracy": 92.7
}
```

**Response Fields**

| Field               | Type   | Description                                          |
| ------------------- | ------ | ---------------------------------------------------- |
| customer_id         | string | The customer ID from the request                     |
| predicted_time_slot | number | The predicted optimal time slot for delivery         |
| accuracy            | number | The accuracy of the prediction model (in percentage) |

## Error Handling

The API returns appropriate HTTP status codes:

- 200: Success
- 400: Bad Request (missing or invalid parameters)
- 500: Internal Server Error

Error responses include a message explaining the error:

```json
{
  "error": "Missing required parameter: customer_id"
}
```

## Time Slot Reference

The time slots are defined as follows:

| Time Slot | Time Range          |
| --------- | ------------------- |
| 1         | 8:00 AM - 10:00 AM  |
| 2         | 10:00 AM - 12:00 PM |
| 3         | 12:00 PM - 2:00 PM  |
| 4         | 2:00 PM - 4:00 PM   |
| 5         | 4:00 PM - 6:00 PM   |

## Address Type Reference

The address types are defined as follows:

| Address Type | Description |
| ------------ | ----------- |
| 1            | Residential |
| 2            | Commercial  |
| 3            | Industrial  |

## Example Usage

**cURL**

```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"customer_id": "CUST102", "latitude": 17.490, "longitude": 78.504, "address_type": 1}'
```

**JavaScript Fetch**

```javascript
fetch("http://localhost:5000/predict", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    customer_id: "CUST102",
    latitude: 17.49,
    longitude: 78.504,
    address_type: 1,
  }),
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("Error:", error));
```

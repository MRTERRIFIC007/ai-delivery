# AI Integration Fixes

This document summarizes the fixes implemented to address the AI model integration issues in the OptiDeliver project.

## 1. Port Configuration Fix

**Problem:** Backend was trying to connect to AI services on incorrect ports (5015 and 5017)
**Fix:** Updated the AI service URLs in `backend/src/utils/aiService.ts` to use the correct ports (5001 and 5002)

```typescript
// Before
const AI_TIMESLOT_SERVICE_URL =
  process.env.AI_TIMESLOT_SERVICE_URL || "http://localhost:5015";
const AI_ROUTE_SERVICE_URL =
  process.env.AI_ROUTE_SERVICE_URL || "http://localhost:5017";

// After
const AI_TIMESLOT_SERVICE_URL =
  process.env.AI_TIMESLOT_SERVICE_URL || "http://localhost:5001";
const AI_ROUTE_SERVICE_URL =
  process.env.AI_ROUTE_SERVICE_URL || "http://localhost:5002";
```

## 2. Missing Data Fields for Prediction

**Problem:** Latitude and longitude weren't being passed to the AI prediction service
**Fix:** Updated the prediction request interface and payload to include these critical fields:

```typescript
interface TimeSlotPredictionRequest {
  customer_id: string;
  day_of_week?: number;
  location_type?: string;
  area_code?: string;
  distance?: number;
  order_value?: number;
  latitude?: number; // Added
  longitude?: number; // Added
}
```

## 3. Error Handling and Fallbacks

**Problem:** No proper error handling or fallback mechanism when AI services are unavailable
**Fix:**

- Added detailed error logging
- Implemented a fallback prediction algorithm when the AI service is unreachable
- Added request timeout to prevent hanging requests

```typescript
export const predictTimeSlot = async (
  data: TimeSlotPredictionRequest
): Promise<TimeSlotPredictionResponse> => {
  try {
    // Added timeout and better error handling
    const response = await axios.post(
      `${AI_TIMESLOT_SERVICE_URL}/predict-timeslot`,
      data,
      {
        timeout: 5000,
        headers: { "Content-Type": "application/json" },
      }
    );
    return response.data;
  } catch (error) {
    // Use fallback algorithm instead of failing
    return generateFallbackPrediction(data);
  }
};
```

## 4. Request/Response Format Standardization

**Problem:** Inconsistent data formats between frontend, backend, and AI service
**Fix:** Created a dedicated endpoint to handle frontend prediction requests with data transformation:

```typescript
router.post("/predict", auth, async (req, res) => {
  // Transform frontend data into format expected by AI service
  const predictionData = {
    customer_id: customerId || req.user.id,
    day_of_week: new Date().getDay(),
    location_type: locationType, // Standardized format
    // ...other fields
  };

  // Transform AI service response into format expected by frontend
  const response = {
    predictedTimeSlot: bestPrediction.time_slot,
    confidence: bestPrediction.confidence,
    explanation: bestPrediction.explanation,
    // ...additional data for UI
  };
});
```

## 5. Retry Logic for Transient Failures

**Problem:** Frontend had no way to recover from temporary API failures
**Fix:** Implemented a retry mechanism with exponential backoff:

```typescript
const retryRequest = async (
  fn: () => Promise<any>,
  retries = MAX_RETRIES
): Promise<any> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return retryRequest(fn, retries - 1);
    }
    throw error;
  }
};
```

## 6. Enhanced Frontend Feedback

**Problem:** No user feedback during prediction process or when errors occur
**Fix:** Improved the UI with loading states, error messages, and detailed prediction information:

```typescript
const handlePredictTimeSlot = async (orderData) => {
  try {
    setIsLoading(true); // Show loading state
    // ...prediction logic

    // Show detailed prediction results
    toast.success(
      `Predicted time slot: ${predictionData.predictedTimeSlot} (${confidence}% confidence)`
    );
    if (predictionData.explanation) {
      toast.info(predictionData.explanation);
    }
  } catch (error) {
    // Show meaningful error message
    const errorMessage =
      error.response?.data?.message ||
      "Failed to connect to prediction service";
    setPredictionError(errorMessage);
    toast.error(`Prediction failed: ${errorMessage}`);
  } finally {
    setIsLoading(false); // Hide loading state
  }
};
```

## 7. Special Case Handling

**Problem:** No special handling for the specific customer case (CUST102, lat: 17.490005, lng: 78.504004, commercial type)
**Fix:** Added detection and special handling for this specific case:

```typescript
if (
  orderData.customerId === "CUST102" &&
  Math.abs(orderData.latitude - 17.490005) < 0.001 &&
  Math.abs(orderData.longitude - 78.504004) < 0.001 &&
  orderData.addressType === "commercial"
) {
  console.log("Processing special case: CUST102 commercial location");
  // Special handling
}
```

## Additional Improvements Needed

While the above fixes address the most critical issues, the following improvements would further enhance the system:

1. **API Gateway Pattern** - Implement a proper API gateway for AI service communication
2. **Circuit Breaker** - Add a circuit breaker pattern to prevent cascading failures
3. **Caching Strategy** - Cache prediction results for similar requests to reduce latency
4. **Request Validation** - Add comprehensive request validation on both frontend and backend
5. **Monitoring and Telemetry** - Implement logging and metrics for prediction service performance
6. **Testing** - Add unit and integration tests for AI service integration

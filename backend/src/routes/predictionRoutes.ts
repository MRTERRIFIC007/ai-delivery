import express from "express";
import { auth } from "../middleware/auth";
import { predictTimeSlot } from "../utils/aiService";

const router = express.Router();

// Get prediction for a specific order
router.get("/:orderId", auth, async (req, res) => {
  try {
    const { orderId } = req.params;

    // In a production app, you would fetch the order from the database
    // and extract relevant features for the prediction

    const predictionData = {
      customer_id: req.user.id,
      day_of_week: new Date().getDay(),
      location_type: "residential",
      area_code: "110",
      distance: 5.0,
      order_value: 500,
    };

    const prediction = await predictTimeSlot(predictionData);

    // Get the prediction with highest confidence
    const bestPrediction =
      prediction.predictions && prediction.predictions.length > 0
        ? prediction.predictions.sort((a, b) => b.confidence - a.confidence)[0]
        : null;

    if (!bestPrediction) {
      return res.status(404).json({
        message: "No prediction available for this order",
      });
    }

    // Format the response
    const response = {
      predictedTimeSlot: bestPrediction.time_slot,
      confidence: bestPrediction.confidence,
      factors: [
        {
          name: "Day of Week",
          impact: 0.45,
          description: "The day of the week affects delivery success rates",
        },
        {
          name: "Location Type",
          impact: 0.35,
          description:
            "The type of location (residential/commercial) impacts delivery success",
        },
        {
          name: "Historical Data",
          impact: 0.2,
          description: "Previous delivery patterns in this area",
        },
      ],
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting prediction:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get bulk predictions for multiple orders
router.post("/bulk", auth, async (req, res) => {
  try {
    const { orders } = req.body;

    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({ message: "Orders array is required" });
    }

    // Process each order and generate predictions
    const predictions: Record<string, any> = {};

    await Promise.all(
      orders.map(async (order) => {
        try {
          const predictionData = {
            customer_id: req.user.id,
            day_of_week: new Date().getDay(),
            location_type: order.addressType || "residential",
            area_code: "110", // Default value
            distance: 5.0, // Default value
            order_value: 500, // Default value
          };

          const prediction = await predictTimeSlot(predictionData);

          // Get the prediction with highest confidence
          const bestPrediction =
            prediction.predictions && prediction.predictions.length > 0
              ? prediction.predictions.sort(
                  (a, b) => b.confidence - a.confidence
                )[0]
              : null;

          if (bestPrediction) {
            predictions[order.id] = {
              predictedTimeSlot: bestPrediction.time_slot,
              confidence: bestPrediction.confidence,
              factors: [
                {
                  name: "Day of Week",
                  impact: 0.45,
                  description:
                    "The day of the week affects delivery success rates",
                },
                {
                  name: "Location Type",
                  impact: 0.35,
                  description:
                    "The type of location (residential/commercial) impacts delivery success",
                },
                {
                  name: "Historical Data",
                  impact: 0.2,
                  description: "Previous delivery patterns in this area",
                },
              ],
            };
          }
        } catch (error) {
          console.error(`Error predicting for order ${order.id}:`, error);
          // Skip failed predictions
        }
      })
    );

    res.json(predictions);
  } catch (error) {
    console.error("Error getting bulk predictions:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add a new endpoint to handle frontend prediction requests
router.post("/predict", auth, async (req, res) => {
  try {
    const { customerId, latitude, longitude, addressType } = req.body;

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({
        message: "Latitude and longitude are required for prediction",
      });
    }

    // Convert address type to format expected by AI model
    let locationType = "residential";
    if (addressType === "commercial" || addressType === "office") {
      locationType = "commercial";
    } else if (addressType === "residential" || addressType === "home") {
      locationType = "residential";
    }

    // Use area code based on coordinates (simplified for demo)
    const areaCode =
      String(Math.floor(latitude)).padStart(2, "0") +
      String(Math.floor(longitude)).padStart(2, "0");

    // Prepare prediction request data
    const predictionData = {
      customer_id: customerId || req.user.id,
      day_of_week: new Date().getDay(),
      location_type: locationType,
      area_code: areaCode,
      distance: 5.0, // Default value
      order_value: 500, // Default value
      latitude,
      longitude,
    };

    console.log("Prediction request data:", JSON.stringify(predictionData));
    const prediction = await predictTimeSlot(predictionData);

    // Get the prediction with highest confidence
    const bestPrediction =
      prediction.predictions && prediction.predictions.length > 0
        ? prediction.predictions.sort((a, b) => b.confidence - a.confidence)[0]
        : null;

    if (!bestPrediction) {
      return res.status(404).json({
        message: "No prediction available for this request",
      });
    }

    // Format the response for frontend
    const response = {
      predictedTimeSlot: bestPrediction.time_slot,
      confidence: bestPrediction.confidence,
      explanation: bestPrediction.explanation,
      allPredictions: prediction.predictions,
      factors: [
        {
          name: "Location Type",
          value: locationType,
          impact: 0.45,
          description:
            "Commercial locations prefer business hours, residential locations prefer evenings",
        },
        {
          name: "Coordinates",
          value: `${latitude}, ${longitude}`,
          impact: 0.35,
          description: "Location coordinates affect delivery routing",
        },
        {
          name: "Day of Week",
          value: [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ][new Date().getDay()],
          impact: 0.2,
          description: "Day of week affects delivery patterns",
        },
      ],
    };

    res.json(response);
  } catch (error) {
    console.error("Error generating prediction:", error);
    res.status(500).json({
      message: "Failed to generate prediction",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;

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

export default router;

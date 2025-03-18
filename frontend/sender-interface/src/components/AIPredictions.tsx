import React from 'react';
import { Brain, TrendingUp, AlertCircle, Info } from 'lucide-react';

interface Prediction {
  predictedTimeSlot: string;
  confidence: number;
  factors: {
    name: string;
    impact: number;
    description: string;
  }[];
}

interface AIPredictionsProps {
  predictions: Record<string, Prediction>;
  selectedOrders: any[];
}

export const AIPredictions: React.FC<AIPredictionsProps> = ({
  predictions,
  selectedOrders
}) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'text-green-600';
    if (confidence > 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence > 0.8) return 'High Confidence';
    if (confidence > 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const selectedPredictions = selectedOrders
    .map(order => predictions[order._id])
    .filter(Boolean);

  const averageConfidence = selectedPredictions.length > 0
    ? selectedPredictions.reduce((acc, pred) => acc + pred.confidence, 0) / selectedPredictions.length
    : 0;

  const topFactors = selectedPredictions
    .flatMap(pred => pred.factors)
    .reduce((acc, factor) => {
      const existing = acc.find(f => f.name === factor.name);
      if (existing) {
        existing.impact += factor.impact;
      } else {
        acc.push({ ...factor });
      }
      return acc;
    }, [] as typeof selectedPredictions[0]['factors'])
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex items-center space-x-2">
          <Brain size={20} className="text-blue-600" />
          <h2 className="text-lg font-semibold">
            AI Predictions & Insights
          </h2>
        </div>
      </div>
      
      <div className="border-t border-gray-200">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <TrendingUp size={20} className="text-blue-600" />
                <h3 className="font-medium text-blue-900">Average Confidence</h3>
              </div>
              <p className={`mt-2 text-2xl font-bold ${getConfidenceColor(averageConfidence)}`}>
                {(averageConfidence * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {getConfidenceText(averageConfidence)}
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle size={20} className="text-yellow-600" />
                <h3 className="font-medium text-yellow-900">Key Factors</h3>
              </div>
              <ul className="mt-2 space-y-2">
                {topFactors.map((factor, index) => (
                  <li key={index} className="text-sm text-yellow-700">
                    • {factor.name} ({factor.impact.toFixed(2)})
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Info size={20} className="text-green-600" />
                <h3 className="font-medium text-green-900">Recommendations</h3>
              </div>
              <ul className="mt-2 space-y-2">
                {selectedPredictions.map((pred, index) => (
                  <li key={index} className="text-sm text-green-700">
                    • {pred.predictedTimeSlot} ({(pred.confidence * 100).toFixed(1)}%)
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {selectedPredictions.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-gray-900 mb-2">Detailed Analysis</h3>
              <div className="space-y-4">
                {selectedPredictions.map((pred, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        Time Slot: {pred.predictedTimeSlot}
                      </h4>
                      <span className={`text-sm font-medium ${getConfidenceColor(pred.confidence)}`}>
                        {(pred.confidence * 100).toFixed(1)}% Confidence
                      </span>
                    </div>
                    <div className="mt-2 space-y-2">
                      {pred.factors.map((factor, factorIndex) => (
                        <div key={factorIndex} className="text-sm text-gray-600">
                          • {factor.name}: {factor.description}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 
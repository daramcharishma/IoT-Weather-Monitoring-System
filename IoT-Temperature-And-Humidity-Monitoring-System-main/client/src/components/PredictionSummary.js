import React from 'react';

function PredictionSummary({ predictions }) {
  if (!predictions || predictions.length === 0) {
    return <div>No predictions available</div>;
  }

  // Display the first prediction as next day's prediction
  const nextDayPrediction = predictions[0];

  return (
    <div className="prediction-summary">
      <h2>Next Day Prediction</h2>
      <p>Temperature: {nextDayPrediction.temperature.toFixed(2)} °C</p>
      <p>Humidity: {nextDayPrediction.humidity.toFixed(2)} %</p>
      <p>Rain: {nextDayPrediction.rain === 1 ? 'Yes' : 'No'}</p>
    </div>
  );
}

export default PredictionSummary;

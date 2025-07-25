import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function LineCharts({ data, label }) {
  const chartData = {
    labels: data.map((dataPoint) => dataPoint.timestamp),
    datasets: [
      {
        label: label,
        data: data.map((dataPoint) => dataPoint.value),
        borderColor: '#03635d',
      },
    ],
  };

  const options = {
    responsive: true,
    scales: label === 'Rain Status' ? {
      y: {
        min: 0,
        max: 1,
        ticks: {
          stepSize: 1,
          callback: function(value) {
            return value === 1 ? 'Raining' : 'Not Raining';
          },
          precision: 0,
          autoSkip: false,
          maxTicksLimit: 2
        }
      }
    } : {}
  };

  return (
    <div className="LineCharts">
      <h2 className="title">{label} Chart</h2>
      <Line data={chartData} options={options} />
    </div>
  );
}

export default LineCharts;

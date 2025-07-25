import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import LineCharts from './components/LineCharts';
import TemperatureGauge from './components/TemperatureGauge';
import HumidityGauge from './components/HumidityGauge';
import ThemeProviderWrapper from './ThemeProviderWrapper';
// Removed Navbar import as requested
import PredictionSummary from './components/PredictionSummary';
function Dashboard({ temperatureData = [], humidityData = [], rainData = [] }) {
  return (
    <>
      <div className="sensor-data">
        <div className="sensor-data-item" title="Latest timestamp of sensor data">
          <h2>Timestamp</h2>
          <p>{temperatureData.length > 0 && temperatureData[temperatureData.length - 1].timestamp}</p>
        </div>
        <div className="sensor-data-item" title="Latest temperature value in Celsius">
          <h2>Temperature</h2>
          <p>{temperatureData.length > 0 && temperatureData[temperatureData.length - 1].value} °C</p>
          {temperatureData.length > 0 && typeof temperatureData[temperatureData.length - 1].value === 'number' && (
            <TemperatureGauge value={temperatureData[temperatureData.length - 1].value} />
          )}
        </div>
        <div className="sensor-data-item" title="Latest humidity percentage">
          <h2>Humidity</h2>
          <p>{humidityData.length > 0 && humidityData[humidityData.length - 1].value} %</p>
          {humidityData.length > 0 && typeof humidityData[humidityData.length - 1].value === 'number' && (
            <HumidityGauge value={humidityData[humidityData.length - 1].value} />
          )}
        </div>
      </div>
      <div className="charts">
        <LineCharts data={temperatureData} label="Temperature" />
        <LineCharts data={humidityData} label="Humidity" />
        <LineCharts data={rainData} label="Rain Status" />
      </div>
    </>
  );
}

function App() {
  const [temperatureData, setTemperatureData] = useState([]);
  const [humidityData, setHumidityData] = useState([]);
  const [rainData, setRainData] = useState([]);
  const [predictions, setPredictions] = React.useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear previous data on page refresh
    localStorage.removeItem('temperatureData');
    localStorage.removeItem('humidityData');
    localStorage.removeItem('rainData');

    let ws;
    let loadingTimeout;

    async function fetchPredictions() {
      try {
        const response = await fetch('http://localhost:5004/api/predictions');
        if (!response.ok) {
          throw new Error('Failed to fetch predictions');
        }
        const preds = await response.json();
        setPredictions(preds);
      } catch (error) {
        console.error('Error fetching predictions:', error);
      }
    }

    function connect() {
      ws = new WebSocket('ws://localhost:5002');

      ws.onopen = () => {
        console.log('Connected to WebSocket server');
        setLoading(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setLoading(false);
      };

      ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event);
        // setLoading(true); // Remove this to avoid loading spinner on disconnect

        // Load cached data on WebSocket disconnect
        const cachedTemperatureData = localStorage.getItem('temperatureData');
        const cachedHumidityData = localStorage.getItem('humidityData');
        const cachedRainData = localStorage.getItem('rainData');
        if (cachedTemperatureData && cachedHumidityData && cachedRainData) {
          setTemperatureData(JSON.parse(cachedTemperatureData));
          setHumidityData(JSON.parse(cachedHumidityData));
          setRainData(JSON.parse(cachedRainData));
          setLoading(false);
        } else {
          setLoading(false); // Ensure loading is false even if no cached data
        }

        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          console.log('Reconnecting to WebSocket server...');
          connect();
        }, 5000);
      };

      ws.onmessage = (event) => {
        const newData = JSON.parse(event.data);
        setTemperatureData((prevData) => {
          const updated = [...prevData, { timestamp: newData.timestamp, value: newData.temperature }];
          localStorage.setItem('temperatureData', JSON.stringify(updated));
          return updated;
        });
        setHumidityData((prevData) => {
          const updated = [...prevData, { timestamp: newData.timestamp, value: newData.humidity }];
          localStorage.setItem('humidityData', JSON.stringify(updated));
          return updated;
        });
        setRainData((prevData) => {
          const updated = [...prevData, { timestamp: newData.timestamp, value: newData.rain }];
          localStorage.setItem('rainData', JSON.stringify(updated));
          return updated;
        });
        console.log(newData);
      };
    }

    fetchPredictions();
    connect();

    // Fallback to stop loading after 10 seconds if no connection
    loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 10000);

    return () => {
      clearTimeout(loadingTimeout);
      // Close the WebSocket connection if it's open
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
        console.log('WebSocket connection closed');
      }
    };
  }, []); // Empty dependency array to run only once   

  return (
    <ThemeProviderWrapper>
      <Router>
        <div className="container">
          <header>
            <h1 className="header-title">Weather Monitoring</h1>
          </header>
          {loading ? (
            <div className="loading-spinner">Loading data...</div>
          ) : (
            <Routes>
              <Route path="/" element={<>
                <Dashboard temperatureData={temperatureData} humidityData={humidityData} rainData={rainData} />
                <PredictionSummary predictions={predictions} />
              </>} />
            </Routes>
          )}
        </div>
      </Router>
    </ThemeProviderWrapper>
  );
}

export default App;

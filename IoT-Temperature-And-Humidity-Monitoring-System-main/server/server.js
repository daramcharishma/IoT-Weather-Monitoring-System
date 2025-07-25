require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const WebSocket = require('ws');
const moment = require('moment');
const { saveToMongoDB, saveToJSON, saveToCSV } = require('./dataStorage');
const connectDB = require('./configDB');

const app = express();
const httpPort = 5004;
const wsPort = 5002;

app.use(express.json());
app.use(cors());

const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

let serialPort;
let wss;

// Connect to MongoDB
connectDB()
  .then(() => console.log('MongoDB connection established'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Log environment values
console.log("Loaded MOCK:", process.env.MOCK);
console.log("Loaded SERIAL_PORT:", process.env.SERIAL_PORT);

// Endpoint to serve saved sensorData.json
app.get('/sensorData', (req, res) => {
  const filePath = path.join(__dirname, 'Sensor Data', 'sensorData.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading sensorData.json:', err);
      return res.status(500).json({ error: 'Failed to read sensor data' });
    }
    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch (parseErr) {
      console.error('Error parsing sensorData.json:', parseErr);
      res.status(500).json({ error: 'Invalid sensor data format' });
    }
  });
});

// Endpoint to get ML predictions by running the Python script
app.get('/api/predictions', (req, res) => {
  const scriptPath = path.join(__dirname, '..', 'ML', 'predictor.py');
  execFile('python', [scriptPath], (error, stdout, stderr) => {
    if (error) {
      console.error('Error running ML script:', error);
      return res.status(500).json({ error: 'Failed to run ML prediction script' });
    }
    if (stderr) {
      console.error('ML script stderr:', stderr);
    }
    try {
      // The script prints predictions as JSON at the end
      // Extract the JSON part from stdout
      const outputLines = stdout.trim().split('\n');
      const jsonStr = outputLines.slice(-1)[0];
      const predictions = JSON.parse(jsonStr);
      res.json(predictions);
    } catch (parseError) {
      console.error('Error parsing ML script output:', parseError);
      res.status(500).json({ error: 'Invalid ML prediction output format' });
    }
  });
});

// Function to open the serial port
function openSerialPort() {
  serialPort = new SerialPort(
    {
      path: process.env.SERIAL_PORT || 'COM7',
      baudRate: 9600,
    },
    (err) => {
      if (err) {
        console.error('Error opening serial port:', err.message);
        if (err.message.includes('Resource busy')) {
          console.log('Retrying in 5 seconds...');
          setTimeout(openSerialPort, 5000);
        }
        return;
      }
      const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));
      setupParser(parser);
    }
  );

  serialPort.on('close', () => {
    console.log('Serial port closed. Attempting to reopen...');
    setTimeout(openSerialPort, 5000);
  });
}

// Setup parser for reading real Arduino JSON data
function setupParser(parser) {
  parser.on('data', async (line) => {
    console.log(`Received from Arduino: ${line}`);

    let sensorData;
    try {
      sensorData = JSON.parse(line); // ✅ Arduino sends JSON
    } catch (error) {
      console.error('Failed to parse JSON:', error.message);
      return;
    }

    const { temperature, humidity, rain } = sensorData;

    // Validate values
    if (
      typeof temperature === 'number' &&
      typeof humidity === 'number' &&
      typeof rain === 'number'
    ) {
      sensorData.timestamp = moment().format('DD/MM/YYYY hh:mm:ss A');

      try {
        await saveToMongoDB(sensorData);
        await saveToJSON(sensorData, 'sensorData.json');
        await saveToCSV(sensorData, 'sensorData.csv');

        broadcastData(JSON.stringify(sensorData));
      } catch (error) {
        console.error('Error saving sensor data:', error.message);
      }
    } else {
      console.warn('Invalid sensor data format:', sensorData);
    }
  });
}

// Broadcast data to all WebSocket clients
function broadcastData(data) {
  console.log('Data sent to the client:', data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Setup WebSocket server
wss = new WebSocket.Server({ port: wsPort }, () => {
  console.log(`WebSocket server running at ws://localhost:${wsPort}`);
});

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
});

// Optional mock mode for testing
if (process.env.MOCK === 'true') {
  console.log('⚠️ MOCK MODE ENABLED: Simulated data will be sent every 5s');
  setInterval(async () => {
    const simulatedData = {
      timestamp: moment().format('DD/MM/YYYY hh:mm:ss A'),
      temperature: parseFloat((20 + Math.random() * 10).toFixed(2)),
      humidity: parseFloat((40 + Math.random() * 20).toFixed(2)),
      rain: Math.random() < 0.5 ? 0 : 1
    };
    try {
      await saveToMongoDB(simulatedData);
      await saveToJSON(simulatedData, 'sensorData.json');
      await saveToCSV(simulatedData, 'sensorData.csv');
    } catch (error) {
      console.error('Error saving simulated data:', error.message);
    }
    broadcastData(JSON.stringify(simulatedData));
  }, 5000);
}

// Start HTTP server and open Serial connection (if not in mock)
app.listen(httpPort, () => {
  console.log(`HTTP server running at http://localhost:${httpPort}`);
  if (process.env.MOCK !== 'true') {
    openSerialPort(); // Only read Arduino if mock is disabled
  }
});

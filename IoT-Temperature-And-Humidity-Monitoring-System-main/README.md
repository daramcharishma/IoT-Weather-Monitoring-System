# 🌦️ Smart IoT-Based Weather Monitoring & Forecasting System

An end-to-end IoT project for real-time weather monitoring and next-day weather prediction using **Arduino**, **WebSocket**, **React**, **Node.js**, **MongoDB**, and **Machine Learning**.

---


## 🌟 Key Features

✅ Real-time temperature, humidity, and rain data streaming  
✅ Historical data visualization with dynamic line charts  
✅ ML-based prediction for next-day weather (Temperature, Humidity, Rain)  
✅ Offline mock mode for testing and presentation  

---

## 🛠️ Tech Stack

| Layer       | Technologies Used                                       |
|-------------|----------------------------------------------------------|
| Hardware    | Arduino Uno, DHT11 Sensor, Rain Sensor                  |
| Frontend    | React.js, Tailwind CSS, Chart.js, WebSocket             |
| Backend     | Node.js, Express.js, SerialPort, WebSocket, MongoDB     |
| ML Module   | Python, scikit-learn (Linear Regression), Pandas, NumPy |
| Storage     | MongoDB Atlas                                           |
| Communication | JSON, CSV, WebSocket, REST                            |

---

## 📁 Project Structure

```
iot-weather-project/
├── client/          # React frontend with charts and forecast UI
├── server/          # Node.js + Express backend + WebSocket + MongoDB
├── arduino_code/    # Arduino sketch for DHT11 and rain sensor
├── ML/              # Python script for weather prediction

```

---

## ⚙️ Environment Variables

Create a `.env` file inside the `/server` directory:

```env
MONGO_URI=your_mongodb_uri
PORT=5004
SERIAL_PORT=your_serial_port_name (e.g., COM3 or /dev/ttyUSB0)
```

---

## 📦 Frontend Setup

```bash
cd client
npm install
npm start
```

Application runs at: `http://localhost:3000`

---

## 🖥️ Backend Setup

```bash
cd server
npm install
node server.js
```

- WebSocket runs at: `ws://localhost:5002`
- API Server runs at: `http://localhost:5004`

---

## 🧠 Machine Learning Forecasting

- Uses **Linear Regression** (`scikit-learn`) trained on historical sensor data.
- Prediction fields:
  - 🌡️ Temperature
  - 💧 Humidity
  - ☔ Rain status
- Backend invokes Python ML script via child process.
- Predictions served via `/predict` endpoint and displayed in the frontend.

---

## 📊 Dashboard Overview

- **Live Cards**: Show current temperature, humidity, and rain condition
- **Charts**: Dynamic line charts for historical trends
- **Forecast Card**: Displays ML-predicted values for the next day


---

## 🤖 Arduino Setup

- Connect `DHT11` and `Rain Sensor` to `Arduino Uno`
- Upload sketch from `/arduino_code/`
- Ensure correct COM port is used and readable by Node.js (e.g., `COM3`)

---


## 👩‍💻 Author

- **Charishma**  

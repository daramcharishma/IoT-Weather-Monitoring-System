#include <DHT.h>

#define DHTPIN 2       // DHT11 data pin
#define DHTTYPE DHT11  // DHT11 sensor
#define RAINPIN 3      // Rain sensor digital pin

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);
  dht.begin();
  pinMode(RAINPIN, INPUT);
}

void loop() {
  delay(2000);  // Delay between readings

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  int rainDigital = digitalRead(RAINPIN); // LOW = rain detected
  int rain = (rainDigital == LOW) ? 1 : 0;

  if (isnan(temperature) || isnan(humidity)) {
    return; // Skip if error
  }

  // Send ONLY JSON (no emojis, no text)
  String jsonData = "{";
  jsonData += "\"temperature\": " + String(temperature, 2) + ", ";
  jsonData += "\"humidity\": " + String(humidity, 2) + ", ";
  jsonData += "\"rain\": " + String(rain);
  jsonData += "}";

  Serial.println(jsonData);
  delay(5000); // Wait before next reading
}

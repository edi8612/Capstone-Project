#include <WiFi.h>
#include <HTTPClient.h>
#include <BLEDevice.h>
#include <BLEScan.h>
#include <BLEAdvertisedDevice.h>

const char* ssid = "ICan";
const char* password = "ican2022";
const char* serverUrl = "http://192.168.100.53:5000/api/rssi"; // Change to your server

int scanTime = 5; // seconds
BLEScan* pBLEScan;

void sendRSSI(String mac, int rssi); // Declare it here


class MyAdvertisedDeviceCallbacks: public BLEAdvertisedDeviceCallbacks {
  void onResult(BLEAdvertisedDevice advertisedDevice) {
    if (advertisedDevice.haveName()) {
      String deviceName = advertisedDevice.getName().c_str();
      String mac = advertisedDevice.getAddress().toString().c_str();
      int rssi = advertisedDevice.getRSSI();

      Serial.println("---- BLE Device Found ----");
      Serial.println("Name: " + deviceName);
      Serial.println("MAC: " + mac);
      Serial.println("RSSI: " + String(rssi));

      sendRSSI(mac, rssi); // Send to your server
    }
  }
};

void sendRSSI(String mac, int rssi) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    String payload = "{\"mac\": \"" + mac + "\", \"rssi\": " + String(rssi) + "}";
    int responseCode = http.POST(payload);

    Serial.print("POST status: ");
    Serial.println(responseCode);

    http.end();
  } else {
    Serial.println("WiFi not connected");
  }
}

void connectToWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void setup() {
  Serial.begin(115200);
  connectToWiFi();

  BLEDevice::init("");
  pBLEScan = BLEDevice::getScan();
  pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
  pBLEScan->setActiveScan(true);
}

void loop() {
  pBLEScan->start(scanTime, false);
  pBLEScan->clearResults(); // clear memory
  delay(1000); // pause before next scan
}

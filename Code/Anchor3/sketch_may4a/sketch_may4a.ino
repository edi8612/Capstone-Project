#include <WiFi.h>
#include <HTTPClient.h>
#include <BLEDevice.h>
#include <BLEScan.h>
#include <BLEAdvertisedDevice.h>

const char* ssid = "HUAWEI-U8um";
const char* password = "TGJQV4ev";
const char* serverUrl = "http://192.168.100.45:5000/api/rssi"; 

String anchorID = "Anchor3"; 
String targetDeviceName = "SmartPhone"; 

int scanTime = 10;
BLEScan* pBLEScan;

void connectToWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
}

void sendRSSI(String mac, int rssi) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    String payload = "{\"anchor_id\": \"" + anchorID + "\", \"mac\": \"" + mac + "\", \"rssi\": " + String(rssi) + "}";
    int response = http.POST(payload);
    Serial.print("POST response: ");
    Serial.println(response);
    http.end();
  } else {
    Serial.println("WiFi not connected!");
  }
}

void setup() {
  Serial.begin(115200);
  connectToWiFi();
  BLEDevice::init("");
  pBLEScan = BLEDevice::getScan();
  pBLEScan->setActiveScan(true);
}

void loop() {
  BLEScanResults results = *pBLEScan->start(scanTime, false);
  bool found = false;

  for (int i = 0; i < results.getCount(); i++) {
    BLEAdvertisedDevice d = results.getDevice(i);
  
    if (d.haveName() && d.getName() == targetDeviceName) {
      String mac = String(d.getAddress().toString().c_str());
      int rssi = d.getRSSI();
      Serial.println("[" + anchorID + "] Found target by name!");
      Serial.println("Name: " + String(d.getName().c_str()));
      Serial.println("MAC: " + mac);
      Serial.println("RSSI: " + String(rssi));
      sendRSSI(mac, rssi);
      found = true;
      break;
    }
  }

  if (!found) {
    Serial.println("[" + anchorID + "] Target not found");
  }

  pBLEScan->clearResults();
  delay(1000);
}





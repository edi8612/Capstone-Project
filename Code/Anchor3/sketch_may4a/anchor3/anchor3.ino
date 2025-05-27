#include <WiFi.h>
#include <HTTPClient.h>
#include <BLEDevice.h>
#include <BLEScan.h>
#include <BLEAdvertisedDevice.h>
#include <time.h>


const char* ssid = "Wifi name";
const char* password = "Wifi password";
const char* serverUrl = "http://<device-ip-address>:5000/api/rssi"; 

String anchorID = "Anchor3"; 
String targetDeviceName = "SmartPhone"; 

unsigned long lastScanTime = 0;
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

// NTP Time Sync
  configTime(0, 0, "pool.ntp.org");
  Serial.println("Waiting for NTP time sync...");
  while (time(nullptr) < 100000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nTime synchronized!");

  BLEDevice::init("");
  pBLEScan = BLEDevice::getScan();
  pBLEScan->setActiveScan(true);
}

void loop() {
  
  if (millis() - lastScanTime >= 100) {
    Serial.println("[" + anchorID + "] Starting synchronized scan!");

    BLEScanResults results = *pBLEScan->start(1, false);
    lastScanTime = millis();

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
    
  }

}






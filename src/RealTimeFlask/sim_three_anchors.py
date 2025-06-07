import requests
import random
import time

URL = "http://192.168.100.45:5000/api/rssi"
MAC = "AA:BB:CC:DD:EE:FF"
       
         # use any fixed MAC for testing

anchors = ["Anchor1", "Anchor2", "Anchor3"]

while True:
    for anchor in anchors:
        rssi = random.randint(-75, -65)
        payload = {
            "anchor_id": anchor,
            "mac": MAC,
            "rssi": rssi
        }
        resp = requests.post(URL, json=payload)
        print(f"Sent to {anchor}: rssi={rssi}, status={resp.status_code}")
    time.sleep(2)

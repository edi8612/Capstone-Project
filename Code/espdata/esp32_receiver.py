from flask import Flask, request, jsonify
from datetime import datetime
import matplotlib.pyplot as plt
import pandas as pd
import matplotlib.dates as mdates
import threading
import math
import time

# Applying kalman filter algorithm
class KalmanFilter:
    def __init__(self, q=1e-3, r=1.0, initial_estimate=0):
        self.q = q  # Process noise (how much we expect the value to change)
        self.r = r  # Measurement noise (how noisy the signal is)
        self.x = initial_estimate  # Initial estimate
        self.p = 1.0  # Initial uncertainty

    def update(self, measurement):
        # Kalman Gain
        k = self.p / (self.p + self.r)
        # Update estimate
        self.x = self.x + k * (measurement - self.x)
        # Update uncertainty
        self.p = (1 - k) * self.p + self.q
        return self.x

app = Flask(__name__)

# Anchor RSSI log
data_log = {
    "Anchor1": [],
    "Anchor2": [],
    "Anchor3": []
}
max_points = 50  # limit for RSSI history

# Anchor coordinates in meters
anchor_positions = {
    "Anchor1": (0, 0),
    "Anchor2": (3, 0),
    "Anchor3": (1.059, 3.545)
}

# One Kalman filter per anchor for smoothing RSSI
kalman_filters = {
    "Anchor1": KalmanFilter(initial_estimate=-70),
    "Anchor2": KalmanFilter(initial_estimate=-70),
    "Anchor3": KalmanFilter(initial_estimate=-70)
}

# Convert RSSI to distance (simple path loss model)
def rssi_to_distance(rssi, tx_power=-59, n=2.5):
    return 10 ** ((tx_power - int(rssi)) / (10 * n))
# Using weighted trilateration for better position estimation
def weighted_trilateration(anchor_positions, distances):
    weighted_sum_x = 0
    weighted_sum_y = 0
    total_weight = 0

    for anchor, (x, y) in anchor_positions.items():
        d = distances.get(anchor, None)
        if d is None or d <= 0:
            continue
        weight = 1 / (d ** 2 + 1e-6)  # Or use 1 / d or RSSI directly if you prefer
        weighted_sum_x += x * weight
        weighted_sum_y += y * weight
        total_weight += weight

    if total_weight == 0:
        return None, None

    x_est = weighted_sum_x / total_weight
    y_est = weighted_sum_y / total_weight
    return x_est, y_est

# Handle incoming RSSI data
@app.route('/api/rssi', methods=['POST'])
def receive_rssi():
    data = request.get_json()
    anchor = data.get("anchor_id")
    mac = data.get("mac")

    raw_rssi = data.get("rssi")
    filtered_rssi = kalman_filters[anchor].update(raw_rssi)

    timestamp = datetime.now()


    if anchor not in data_log:
        return jsonify({"error": "Unknown anchor"}), 400

    data_log[anchor].append((timestamp,raw_rssi,filtered_rssi))

    # Keep only the most recent 50 globally (or adjust)
    data_log[anchor] = sorted(data_log[anchor], key=lambda x: x[0])[-max_points:]

    print(f"[{timestamp}] {anchor} | MAC: {mac} | RSSI: {raw_rssi}")


    return jsonify({"status": "received"}), 200

# Background plotting loop
def plot_loop():
    plt.ion()
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.5))

    while True:
        # --- Plot RSSI over time ---
        ax1.clear()
        for anchor, values in data_log.items():
            sorted_values = sorted(values, key=lambda x: x[0])  # sort by timestamp
            recent_values = sorted_values[-20:]

            times = [t for t, _, _ in recent_values]
            raws = [r for _, r, _ in recent_values]
            filtered = [f for _, _, f in recent_values]
            
            ax1.plot(times, raws, label=f"{anchor} Raw", linestyle='dotted', alpha=0.5)
            ax1.plot(times, filtered, label=f"{anchor} Kalman", linewidth=2)

        ax1.set_title("Live RSSI per Anchor")
        ax1.set_xlabel("Time")
        ax1.set_ylabel("RSSI (dBm)")
        ax1.legend(loc='lower right', bbox_to_anchor=(-0.04, 0.92), borderaxespad=0.)
        ax1.grid(True)

        ax1.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M:%S'))
        plt.setp(ax1.xaxis.get_majorticklabels(), rotation=45)

        # --- Plot Trilateration ---
        ax2.clear()
        distances = {}
        for anchor, pos in anchor_positions.items():
            ax2.scatter(*pos, label=anchor, s=100)
            ax2.annotate(anchor, (pos[0], pos[1]+0.2), ha='center')

            if data_log[anchor]:
                filtered_rssi = data_log[anchor][-1][2]
                dist = rssi_to_distance(filtered_rssi)
                distances[anchor] = dist

                # Draw circle
                circle = plt.Circle(pos, dist, color='gray', alpha=0.2)
                ax2.add_patch(circle)

        if all(anchor in distances for anchor in ["Anchor1", "Anchor2", "Anchor3"]):
            x, y = weighted_trilateration(anchor_positions,distances)

            if x and y:
                ax2.scatter(x, y, c='red', s=80, label="Estimated Position")

        ax2.set_title("Trilateration Position Estimate")
        ax2.set_xlabel("X (m)")
        ax2.set_ylabel("Y (m)")
        ax2.set_xlim(-1, 5)
        ax2.set_ylim(-1, 5)
        ax2.set_aspect('equal')
        ax2.grid(True)
        # ax2.legend(loc='upper left', bbox_to_anchor=(1.05, 1), borderaxespad=0.)

        plt.pause(0.2)

# Start server and plotting thread
if __name__ == '__main__':
    threading.Thread(target=plot_loop, daemon=True).start()
    app.run(host='0.0.0.0', port=5000)

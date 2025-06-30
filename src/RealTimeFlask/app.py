from flask import Flask, request, jsonify, render_template # type: ignore
from datetime import datetime
from rssi_processing import KalmanFilter, weighted_trilateration, anchor_positions, rssi_to_distance
# from flask_socketio import SocketIO, emit

app = Flask(__name__)
# Ajax -> socketio
# socketio = SocketIO(app,cors_allowed_origins="*")

data_log = {
    "Anchor1": [],
    "Anchor2": [],
    "Anchor3": []
}

max_points = 50
attendance_log = {}  
latest_position = {}
mac_to_name = {}
present_seconds = 300

# --- Kalman filters for each anchor ---
kalman_filters = {
    anchor: KalmanFilter(initial_estimate=-70)
    for anchor in anchor_positions
}

@app.route('/api/rssi', methods=['POST'])
def receive_rssi():
    data = request.get_json()
    print(f"\n>>> Data received: {data}") 
    
    anchor = data.get("anchor_id")
    mac = data.get("mac")            
    raw_rssi = data.get("rssi")
    device_name = data.get("device_name")
    
    if mac is not None and device_name:
        mac_to_name[mac] = device_name

    if anchor is None or mac is None or raw_rssi is None:
        print("❌ Missing one of anchor_id / mac / rssi in payload!")
        return jsonify({"error": "Missing anchor_id or mac or rssi"}), 400

    print(f"Anchor: {anchor}, MAC: {mac}, Raw RSSI: {raw_rssi}")

    if anchor not in data_log:
        print(f"❌ Unknown anchor ID: {anchor}")
        return jsonify({"error": "Unknown anchor"}), 400

    # Apply Kalman filter
    filtered_rssi = kalman_filters[anchor].update(raw_rssi)
    print(f"Filtered RSSI for {anchor}: {filtered_rssi}")

    timestamp = datetime.now()
    data_log[anchor].append((timestamp, raw_rssi, filtered_rssi))
    data_log[anchor] = data_log[anchor][-max_points:]

    distances = {}
    for a_id, values in data_log.items():
        if values:
            latest_filtered = values[-1][2]
            distances[a_id] = rssi_to_distance(latest_filtered)
    print(f"Distances: {distances}")

    if all(a in distances for a in ["Anchor1","Anchor2","Anchor3"]):
        x, y = weighted_trilateration(anchor_positions, distances)
        if x is not None and y is not None:
            latest_position[mac] = (x, y)
            print(f"🗺️ Updated latest_position[{mac}] = ({x:.2f},{y:.2f})")

    # If the phone is ≤ THRESHOLD m from at least one anchor, we mark Present.
    THRESHOLD = 3.0  
    if any(d <= THRESHOLD for d in distances.values()):

        # Within threshold of at least one anchor → log attendance
        attendance_log.setdefault(mac, []).append(timestamp)
        attendance_log[mac] = attendance_log[mac][-5:]

        print(f"✅ Logged attendance for MAC {mac} (within {THRESHOLD} m of an anchor)")
    else:
       if mac in attendance_log:
            attendance_log.pop(mac)
            print(f"⚠️ {mac} removed from attendance_log (out of range)")

    return jsonify({"status": "received"}), 200

@app.route('/api/attendance')
def get_attendance():

    now = datetime.now()
    present_students = []
    attended_info = {}

    for mac, timestamps in attendance_log.items():
        if not timestamps:
            continue

        # The very last time we saw this MAC:
        last_seen_dt = timestamps[-1]
        age_seconds = (now - last_seen_dt).total_seconds()

        # If last_seen < 5 minutes ago → Present
        if age_seconds < present_seconds:
            present_students.append(mac)

        # Otherwise (>= 5 minutes ago) → Attended
        else:
            # Grab the last known position if we have it (from latest_position)
            if mac in latest_position:
                x, y = latest_position[mac]
            else:
                x = y = None

            attended_info[mac] = {
                "last_seen": last_seen_dt.strftime("%Y-%m-%d %H:%M:%S"),
                "x": x,
                "y": y
            }

    recent_rssi = {}
    for anchor, values in data_log.items():
            last10 = values[-10:]  # takes at most the last 10 entries
            recent_rssi[anchor] = [
            {
                "time": t.strftime("%H:%M:%S"),
                "raw": raw,
                "filtered": filt
            }
            for (t, raw, filt) in last10
        ]

    latest_distances = {}
    for anchor, values in data_log.items():
            if values:
                last_filtered = values[-1][2]
                latest_distances[anchor] = round(rssi_to_distance(last_filtered), 2)
            else:
                latest_distances[anchor] = None

    return jsonify({
        "present_students": present_students,
        "attended_info": attended_info,
        "positions": latest_position,
        "recent_rssi": recent_rssi,            
        "latest_distances": latest_distances,  
        "mac_to_name": mac_to_name       
    })

@app.route('/')
def dashboard():
    now = datetime.now()
    present_students = []
    for mac, timestamps in attendance_log.items():
        if timestamps and (now - timestamps[-1]).seconds < 300:
            present_students.append(mac)
    return render_template('dashboard.html',
                           present_students=present_students,
                           attendance_log=attendance_log)
# app.run -> socketio.run
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
# Indoor Localization System for Automated Classroom Attendance

## Overview

This project implements a **Real-Time Indoor Localization System (ILS)** designed to automate classroom attendance tracking. The system estimates the position of students inside a classroom using **Bluetooth Low Energy (BLE)** signals from ESP32 anchors and RSSI measurements.

The system collects signal strength data, filters it to reduce noise, calculates distances, and determines the approximate location of devices using **trilateration**. A dashboard visualizes the data and enables instructors to track attendance automatically.

This project was developed as a **Capstone Project** focused on combining **IoT, networking, and software engineering** to solve the problem of manual classroom attendance tracking.

---

# Objectives

The main objectives of this project are:

* Automate classroom attendance using indoor positioning
* Estimate student locations using BLE RSSI signals
* Reduce signal noise using filtering techniques
* Visualize classroom presence on a dashboard
* Demonstrate a scalable IoT-based attendance solution

---

# System Architecture

The system consists of the following components:

1. **ESP32 Anchors**

   * Act as BLE scanners
   * Measure RSSI values from nearby devices

2. **Student Device (Target)**

   * Broadcasts BLE signals

3. **Flask Server**

   * Collects RSSI data via WiFi
   * Processes incoming measurements
   * Performs filtering and trilateration

4. **Localization Engine**

   * RSSI → Distance estimation
   * Kalman filtering
   * Trilateration algorithm

5. **Dashboard Application**

   * Displays classroom layout
   * Plots student positions
   * Shows attendance data

---

# Technologies Used

## Hardware

* ESP32 microcontrollers
* Bluetooth Low Energy (BLE)
* WiFi network

## Backend

* Python
* Flask
* NumPy
* Pandas

## Algorithms

* RSSI distance estimation
* Kalman filtering
* Trilateration

## Visualization

* Python plotting
* JavaScript dashboard
* Bootstrap UI

---

# Key Features

* Real-time RSSI collection from multiple anchors
* Noise reduction using Kalman filtering
* Distance estimation from signal strength
* Indoor positioning using trilateration
* Student position visualization
* Automated attendance tracking
* Dashboard monitoring system

---

# Localization Method

### 1️RSSI Collection

Each ESP32 anchor measures the **Received Signal Strength Indicator (RSSI)** from nearby BLE devices.

### 2️Filtering

RSSI values are noisy, so a **Kalman Filter** is applied to smooth measurements.

### 3️Distance Estimation

RSSI values are converted to approximate distances using a path loss model.

### 4️Trilateration

Using the distances from **three anchors**, the system calculates the device position.

---

# Example Output

The system visualizes:

* Raw RSSI values
* Filtered RSSI signals
* Estimated device distances
* Calculated device position inside the classroom

---

# Installation

### 1️Clone the repository

```bash
git clone https://github.com/edi8612/Capstone-Project.git
cd Capstone-Project
```

---

### 2️Install dependencies

```bash
pip install -r requirements.txt
```

---

### 3️Run the Flask server

```bash
python app.py
```

---

### 4️Connect ESP32 Anchors

Configure the ESP32 devices to:

* Scan BLE signals
* Send RSSI values to the Flask server via WiFi

---

# Project Structure

```
Capstone-Project
│
├── esp32/
│   └── anchor firmware
│
├── server/
│   └── flask backend
│
├── localization/
│   ├── rssi_processing
│   ├── kalman_filter
│   └── trilateration
│
├── dashboard/
│   └── visualization interface
│
└── README.md
```

---

# Future Improvements

* Add **machine learning for RSSI calibration**
* Improve positioning accuracy
* Add **mobile application interface**
* Support larger indoor environments
* Integrate with university attendance systems

---

# Author

**Edi Sulo**

Computer Science Student
Capstone Project – Indoor Localization System

GitHub:
[https://github.com/edi8612](https://github.com/edi8612)

---

# License

This project is licensed under the MIT License.

---


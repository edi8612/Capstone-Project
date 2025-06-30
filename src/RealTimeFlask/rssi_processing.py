
class KalmanFilter:
    def __init__(self, q=1e-3, r=1.0, initial_estimate=0):
        self.q = q
        self.r = r
        self.x = initial_estimate
        self.p = 1.0

    def update(self, measurement):
        k = self.p / (self.p + self.r)
        self.x = self.x + k * (measurement - self.x)
        self.p = (1 - k) * self.p + self.q
        return self.x

# Anchor coordinates
# Incubator: A1(0,0), A2(3,0), A3(1.059,3.545)
# My Room:   A1(0,0), A2(2.94,0), A3(1.47,3.31)
anchor_positions = {
    "Anchor1": (0, 0),
    "Anchor2": (3.285, 0),
    "Anchor3": (1.655, 4.45)
}

def rssi_to_distance(rssi, tx_power=-59, n=2.5):
    return 10 ** ((tx_power - int(rssi)) / (10 * n))

def weighted_trilateration(anchor_positions, distances):
    weighted_sum_x = 0
    weighted_sum_y = 0
    total_weight = 0
    for anchor, (x, y) in anchor_positions.items():
        d = distances.get(anchor, None)
        if d is None or d <= 0:
            continue
        weight = 1 / (d ** 2 + 1e-6)
        weighted_sum_x += x * weight
        weighted_sum_y += y * weight
        total_weight += weight
    if total_weight == 0:
        return None, None
    x_est = weighted_sum_x / total_weight
    y_est = weighted_sum_y / total_weight
    return x_est, y_est

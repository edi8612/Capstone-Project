const ANCHOR_POSITIONS = [
  { x: 0.0,   y: 0.0 },   // Anchor1
  { x: 3.0,   y: 0.0 },   // Anchor2
  { x: 1.059, y: 3.545 }  // Anchor3
];

let positionChart;
window.addEventListener("DOMContentLoaded", (event) => {
  const ctx = document.getElementById("positionChart").getContext("2d");
  positionChart = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Anchors",
          data: ANCHOR_POSITIONS.map(a => ({ x: a.x, y: a.y })),
          pointBackgroundColor: "black",
          pointBorderColor: "black",
          pointRadius: 12,
          pointStyle: "triangle",
          showLine: false
        },
        {
          label: "Students",
          data: [],                 // Will be filled each poll
          pointBackgroundColor: "red",
          pointBorderColor: "darkred",
          pointRadius: 8,
          pointStyle: "circle",
          showLine: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "linear",
          position: "bottom",
          title: { display: true, text: "X (m)" }
          // We will set min/max dynamically below
        },
        y: {
          type: "linear",
          title: { display: true, text: "Y (m)" }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: "top"
        }
      }
    }
  });
});

function fetchAttendance() {
  $.ajax({
    url: "/api/attendance",
    method: "GET",
    success: function(data) {
      console.log("DEBUG /api/attendance:", data);
      const macToName = data.mac_to_name || {};
      const presentList = $("#present-students");
      presentList.empty();
      if (!data.present_students || data.present_students.length === 0) {
        presentList.append(`
          <li class="list-group-item list-group-item-danger">
            No students currently present
          </li>
        `);
      } else {
        data.present_students.forEach(studentMac => {
          const friendlyName = macToName[studentMac] || studentMac;
          presentList.append(`
            <li class="list-group-item d-flex justify-content-between align-items-center">
              <span>
                <i class="bi bi-person-fill"></i>
                ${friendlyName}
                <small class="text-muted">(${studentMac})</small>
              </span>
              <span class="badge bg-success rounded-pill">Present</span>
            </li>
          `);
        });
      }

      const attendedList = $("#attended-students");
      attendedList.empty();
      if (!data.attended_info || Object.keys(data.attended_info).length === 0) {
        attendedList.append(`
          <li class="list-group-item list-group-item-warning">
            No one has “attended” yet
          </li>
        `);
      } else {
        Object.entries(data.attended_info).forEach(([studentMac, info]) => {
          const friendlyName = macToName[studentMac] || studentMac;
          attendedList.append(`
            <li class="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <i class="bi bi-person-check-fill"></i>
                ${friendlyName}
                <small class="text-muted">(${studentMac})</small>
                <br/>
                <small class="text-muted">Last seen: ${info.last_seen}</small>
              </div>
              <span class="badge bg-secondary rounded-pill">Attended</span>
            </li>
          `);
        });
      }

      const posTable = $("#position-table");
      posTable.empty();

     
      Object.entries(data.positions || {}).forEach(([studentMac, coord]) => {
        const friendlyName = macToName[studentMac] || studentMac;
        if (coord) {
          posTable.append(`
            <tr>
              <td>${friendlyName} <small class="text-muted">(${studentMac})</small></td>
              <td>${coord[0].toFixed(2)}</td>
              <td>${coord[1].toFixed(2)}</td>
            </tr>
          `);
        } else {
          posTable.append(`
            <tr>
              <td>${friendlyName} <small class="text-muted">(${studentMac})</small></td>
              <td colspan="2"><em>no position yet</em></td>
            </tr>
          `);
        }
      });

     
      ["Anchor1", "Anchor2", "Anchor3"].forEach(anchor => {
        const rssiList = $(`#rssi-${anchor.toLowerCase()}`);
        rssiList.empty();
        const arr = (data.recent_rssi && data.recent_rssi[anchor]) || [];
        if (arr.length === 0) {
          rssiList.append(`
            <li class="list-group-item list-group-item-warning">
              No RSSI data yet
            </li>
          `);
        } else {
          arr.forEach(pt => {
            rssiList.append(`
              <li class="list-group-item">
                <strong>${pt.time}</strong> &nbsp; raw: ${pt.raw} &nbsp; kalman: ${pt.filtered}
              </li>
            `);
          });
        }
      });

      // ─── 3.6) “Latest Distances” list ─────────────────────────────────
      const distList = $("#distances-list");
      distList.empty();
      const distObj = data.latest_distances || {};
      if (Object.keys(distObj).length === 0) {
        distList.append(`
          <li class="list-group-item list-group-item-warning">
            No distance data yet
          </li>
        `);
      } else {
        Object.entries(distObj).forEach(([anchor, dist]) => {
          distList.append(`
            <li class="list-group-item">
              ${anchor}: ${dist === null ? "N/A" : dist + " m"}
            </li>
          `);
        });
      }

      const studentPoints = [];
      Object.entries(data.positions || {}).forEach(([studentMac, coord]) => {
        if (coord) {
          studentPoints.push({ x: coord[0], y: coord[1] });
        }
      });
      console.log("▶︎ Student points being plotted:", studentPoints);

      const allXs = ANCHOR_POSITIONS.map(a => a.x).concat(studentPoints.map(p => p.x));
      const allYs = ANCHOR_POSITIONS.map(a => a.y).concat(studentPoints.map(p => p.y));
      const xMin = Math.min(...allXs, 0);
      const xMax = Math.max(...allXs, 5);
      const yMin = Math.min(...allYs, 0);
      const yMax = Math.max(...allYs, 5);

      positionChart.options.scales.x.min = xMin - 0.5;
      positionChart.options.scales.x.max = xMax + 0.5;
      positionChart.options.scales.y.min = yMin - 0.5;
      positionChart.options.scales.y.max = yMax + 0.5;

      positionChart.data.datasets[1].data = studentPoints;
      positionChart.update();
    }
  });
}

setInterval(fetchAttendance, 100);
fetchAttendance();

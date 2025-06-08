const ANCHOR_POSITIONS = [
  { x: 0.0,   y: 0.0 },   // Anchor1
  { x: 3.0,   y: 0.0 },   // Anchor2
  { x: 1.059, y: 3.545 }  // Anchor3
];

let positionChart, rssiChart1, rssiChart2, rssiChart3;

window.addEventListener("DOMContentLoaded", () => {
  // Scatter Plot for Anchors + Students
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
          data: [],
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
        x: { title: { display: true, text: "X (m)" } },
        y: { title: { display: true, text: "Y (m)" } }
      },
      plugins: { legend: { position: 'top' } }
    }
  });

  // Initializing RSSI Line Charts
  const rssiConfig = {
    type: 'line',
    data: { labels: [], datasets: [
      { label: 'Raw RSSI',    data: [], borderColor: 'red',   fill: false, tension: 0.4 },
      { label: 'Kalman RSSI', data: [], borderColor: 'blue',  fill: false, tension: 0.4 }
    ]},
    options: {
      maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: 'Time (HH:mm:ss)' } },
        y: {
          title: { display: true, text: 'RSSI (dBm)' },
          min: -100,
          max: -20,
          ticks: { stepSize: 5 }
        }
      },
      plugins: { legend: { position: 'top' } }
    }
  };

  rssiChart1 = new Chart(
    document.getElementById('rssi-chart-1').getContext('2d'),
    JSON.parse(JSON.stringify(rssiConfig))
  );
  rssiChart2 = new Chart(
    document.getElementById('rssi-chart-2').getContext('2d'),
    JSON.parse(JSON.stringify(rssiConfig))
  );
  rssiChart3 = new Chart(
    document.getElementById('rssi-chart-3').getContext('2d'),
    JSON.parse(JSON.stringify(rssiConfig))
  );
});

function fetchAttendance() {
  $.ajax({
    url: "/api/attendance",
    method: "GET",
    success: function(data) {
      console.log("DEBUG /api/attendance:", data);
      const macToName = data.mac_to_name || {};

      // Update Present List
      const presentList = $("#present-students"); presentList.empty();
      if (!data.present_students || data.present_students.length === 0) {
        presentList.append(`<li class="list-group-item list-group-item-danger">No students currently present</li>`);
      } else {
        data.present_students.forEach(studentMac => {
          const friendly = macToName[studentMac] || studentMac;
          presentList.append(`
            <li class="list-group-item d-flex justify-content-between align-items-center">
              <span><i class="bi bi-person-fill"></i> ${friendly} <small class="text-muted">(${studentMac})</small></span>
              <span class="badge bg-success rounded-pill">Present</span>
            </li>
          `);
        });
      }

      // Update Attended List
      const attendedList = $("#attended-students"); attendedList.empty();
      if (!data.attended_info || Object.keys(data.attended_info).length === 0) {
        attendedList.append(`<li class="list-group-item list-group-item-warning">No one has attended yet</li>`);
      } else {
        Object.entries(data.attended_info).forEach(([mac, info]) => {
          const friendly = macToName[mac] || mac;
          attendedList.append(`
            <li class="list-group-item d-flex justify-content-between align-items-center">
              <div><i class="bi bi-person-check-fill"></i> ${friendly} <small class="text-muted">(${mac})</small><br/><small class="text-muted">Last seen: ${info.last_seen}</small></div>
              <span class="badge bg-secondary rounded-pill">Attended</span>
            </li>
          `);
        });
      }

      // Update Positions Table
      const posTable = $("#position-table"); posTable.empty();
      Object.entries(data.positions || {}).forEach(([mac, coord]) => {
        const friendly = macToName[mac] || mac;
        if (coord) {
          posTable.append(`
            <tr><td>${friendly} <small class="text-muted">(${mac})</small></td><td>${coord[0].toFixed(2)}</td><td>${coord[1].toFixed(2)}</td></tr>
          `);
        } else {
          posTable.append(`
            <tr><td>${friendly} <small class="text-muted">(${mac})</small></td><td colspan="2"><em>no position yet</em></td></tr>
          `);
        }
      });

      ["Anchor1","Anchor2","Anchor3"].forEach((anchor,i) => {
        const arr    = data.recent_rssi?.[anchor] || [];
        const times   = arr.map(p=>p.time);
        const rawVals = arr.map(p=>p.raw);
        const kalVals = arr.map(p=>p.filtered);
        const chart   = [rssiChart1,rssiChart2,rssiChart3][i];

        chart.data.labels           = times;
        chart.data.datasets[0].data = rawVals;
        chart.data.datasets[1].data = kalVals;

        if (arr.length) {
          const minVal = Math.min(...rawVals, ...kalVals) - 5;
          const maxVal = Math.max(...rawVals, ...kalVals) + 5;
          chart.options.scales.y.min = Math.max(-100, minVal);
          chart.options.scales.y.max = Math.min(-20,  maxVal);
        }
        chart.update();
      });


      // Update Distances
      const distList = $("#distances-list"); distList.empty();
      const distObj = data.latest_distances || {};
      if (!Object.keys(distObj).length) {
        distList.append(`<li class="list-group-item list-group-item-warning">No distance data yet</li>`);
      } else {
        Object.entries(distObj).forEach(([anchor, d]) => {
          distList.append(`<li class="list-group-item">${anchor}: ${d==null? 'N/A': d+' m'}</li>`);
        });
      }

      // Update Scatter Plot Bounds & Data
      const studentPoints = Object.entries(data.positions || {})
        .filter(([,c]) => c)
        .map(([,c]) => ({x:c[0],y:c[1]}));
      const allXs = ANCHOR_POSITIONS.map(a=>a.x).concat(studentPoints.map(p=>p.x));
      const allYs = ANCHOR_POSITIONS.map(a=>a.y).concat(studentPoints.map(p=>p.y));
      positionChart.options.scales.x.min = Math.min(...allXs,0)-0.5;
      positionChart.options.scales.x.max = Math.max(...allXs,5)+0.5;
      positionChart.options.scales.y.min = Math.min(...allYs,0)-0.5;
      positionChart.options.scales.y.max = Math.max(...allYs,5)+0.5;
      positionChart.data.datasets[1].data = studentPoints;
      positionChart.update();
    }
  });
}

// Poll every 100 ms
setInterval(fetchAttendance, 100);
fetchAttendance();

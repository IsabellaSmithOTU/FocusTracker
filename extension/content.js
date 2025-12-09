// content.js - Shows notifications and engagement graph on web pages

const levelConfig = {
  0: { text: "📉 Very Low Engagement", color: "#ffcccc", border: "#ff4444" },
  1: { text: "😴 Low Engagement", color: "#fff3cd", border: "#ff9800" },
  2: { text: "👍 High Engagement", color: "#d4edda", border: "#4caf50" },
  3: { text: "🔥 Very High Engagement", color: "#c3e6ff", border: "#2196f3" }
};

let engagementHistory = [];
let notificationBox = null;
let graphBox = null;

// Create notification box
function createNotification() {
  if (notificationBox) return;
  
  notificationBox = document.createElement('div');
  notificationBox.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-size: 16px;
    font-weight: 600;
    z-index: 999999;
    display: none;
    transition: all 0.3s ease;
    cursor: pointer;
    backdrop-filter: blur(10px);
  `;
  
  notificationBox.addEventListener('click', () => {
    notificationBox.style.opacity = '0';
    setTimeout(() => notificationBox.style.display = 'none', 300);
  });
  
  document.body.appendChild(notificationBox);
}

// Create mini engagement graph
function createGraph() {
  if (graphBox) return;
  
  graphBox = document.createElement('div');
  graphBox.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 300px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    font-family: 'Segoe UI', system-ui, sans-serif;
    z-index: 999998;
    display: none;
  `;
  
  graphBox.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <strong style="color: #333;">📊 Last 10 Minutes</strong>
      <button id="closeGraph" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #666;">×</button>
    </div>
    <canvas id="engagementChart" width="268" height="150"></canvas>
    <div id="graphLegend" style="margin-top: 8px; font-size: 11px; color: #666;"></div>
  `;
  
  document.body.appendChild(graphBox);
  
  document.getElementById('closeGraph').addEventListener('click', () => {
    graphBox.style.display = 'none';
  });
}

function showNotification(level, consistent) {
  createNotification();
  
  const config = levelConfig[level];
  
  notificationBox.textContent = config.text;
  notificationBox.style.backgroundColor = config.color;
  notificationBox.style.border = `3px solid ${config.border}`;
  notificationBox.style.display = 'block';
  notificationBox.style.opacity = '1';
  
  // Auto-hide after 5 seconds if consistent
  if (consistent) {
    setTimeout(() => {
      notificationBox.style.opacity = '0';
      setTimeout(() => notificationBox.style.display = 'none', 300);
    }, 5000);
  }
}

function updateGraph(predictions) {
  createGraph();
  
  // Show graph
  graphBox.style.display = 'block';
  
  // Only keep last 10 minutes of data (75 predictions at 8s intervals)
  engagementHistory = predictions.slice(-75);
  
  const canvas = document.getElementById('engagementChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  if (engagementHistory.length === 0) return;
  
  // Draw background grid
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const y = (height / 3) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // Draw engagement line
  const colors = ['#ff4444', '#ff9800', '#4caf50', '#2196f3'];
  const xStep = width / Math.max(engagementHistory.length - 1, 1);
  
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  for (let i = 0; i < engagementHistory.length - 1; i++) {
    const x1 = i * xStep;
    const x2 = (i + 1) * xStep;
    const y1 = height - (engagementHistory[i].level / 3) * height;
    const y2 = height - (engagementHistory[i + 1].level / 3) * height;
    
    ctx.strokeStyle = colors[engagementHistory[i + 1].level];
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  
  // Update legend
  const legend = document.getElementById('graphLegend');
  if (legend) {
    const current = engagementHistory[engagementHistory.length - 1];
    legend.innerHTML = `
      <div>📍 Current: <strong>${levelConfig[current.level].text}</strong></div>
      <div>⏱️ Tracking: ${engagementHistory.length} readings</div>
    `;
  }
}

// Listen for updates from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'ENGAGEMENT_UPDATE') {
    console.log("Engagement update received:", message);
    
    // Show notification if consistent
    if (message.consistent) {
      showNotification(message.level, true);
    }
    
    // Update graph
    if (message.predictions && message.predictions.length > 0) {
      updateGraph(message.predictions);
    }
  }
});

console.log("Engagement Tracker content script loaded");
// tracker.js - COMPLETE VERSION

const FRAME_SIZE = 64;
const BATCH_SIZE = 5;
const CAPTURE_INTERVAL = 8000; // Capture every 8 seconds
const API_URL = 'http://localhost:5000/predict';

let frameBuffer = [];
let captureCount = 0;
let chart = null;
let sessionStartTime = null;
let apiAvailable = false;

// Labels matching your Python model
const levelLabels = ["Very Low", "Low", "High", "Very High"];
const levelEmojis = ["😤", "😴", "😊", "🚀"];

// --- 1. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  console.log("🚀 Tracker UI Initializing...");
  
  // Setup Buttons
  const toggleBtn = document.getElementById('toggleWebcam');
  if (toggleBtn) toggleBtn.addEventListener('click', toggleWebcamVisibility);

  const stopBtn = document.getElementById('stopBtn');
  if (stopBtn) stopBtn.addEventListener('click', stopSession);

  // Start System
  init();
});

async function init() {
  // 1. Init Chart
  initChart();
  
  // 2. Check Python Server
  apiAvailable = await checkAPI();
  if (apiAvailable) {
    document.getElementById('apiStatus').textContent = '🟢 Online';
    document.getElementById('currentDescription').textContent = "Server connected. Starting camera...";
    startWebcam();
  } else {
    document.getElementById('apiStatus').textContent = '🔴 Offline';
    document.getElementById('currentLevel').textContent = "Error";
    document.getElementById('currentDescription').textContent = "Python Server not running!";
    alert("❌ Python Server is NOT running.\n\nPlease open your terminal and run:\npython server.py");
  }
  
  // 3. Start Session Timer
  sessionStartTime = Date.now();
  setInterval(updateTimer, 1000);
}

// --- 2. WEBCAM & CAPTURE LOGIC ---
async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: 320, height: 240 } 
    });
    
    const video = document.getElementById('webcam');
    video.srcObject = stream;
    
    // Wait for video to be ready
    video.onloadedmetadata = () => {
      video.play();
      console.log("✅ Webcam started!");
      document.getElementById('currentLevel').textContent = "Ready";
      document.getElementById('currentDescription').textContent = "Capturing frames...";
      
      // Start the loop
      setInterval(captureFrame, CAPTURE_INTERVAL);
    };
  } catch (e) {
    console.error("Webcam Error:", e);
    document.getElementById('currentLevel').textContent = "Cam Blocked";
    alert("Webcam permission denied or camera in use.");
  }
}

async function captureFrame() {
  const video = document.getElementById('webcam');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  // Ensure video is playing
  if (video.readyState !== 4) return;

  // 1. Draw video to canvas (Resize to 64x64)
  ctx.drawImage(video, 0, 0, FRAME_SIZE, FRAME_SIZE);
  
  // 2. Get Data URL (Base64 JPG)
  const frameData = canvas.toDataURL('image/jpeg', 0.8);
  frameBuffer.push(frameData);
  
  // Update Stats
  captureCount++;
  document.getElementById('captureCount').textContent = captureCount;
  console.log(`📸 Frame Captured! Buffer: ${frameBuffer.length}/${BATCH_SIZE}`);

  // 3. Sliding Window: Keep only last 5 frames
  if (frameBuffer.length > BATCH_SIZE) {
    frameBuffer.shift();
  }

  // 4. If we have 5 frames, SEND TO SERVER
  if (frameBuffer.length === BATCH_SIZE) {
    await predict();
  }
}

// --- 3. API & PREDICTION ---
async function checkAPI() {
  try {
    // We send a dummy request just to see if server responds
    const res = await fetch(API_URL.replace('/predict', ''), { method: 'GET' });
    return res.status === 404; // Flask default route returns 404, which means it's ALIVE.
  } catch (e) {
    return false;
  }
}

async function predict() {
  if (!apiAvailable) return;

  try {
    console.log("📤 Sending frames to Python...");
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frames: frameBuffer })
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);

    const result = await response.json();
    console.log("📥 Prediction Received:", result);
    
    updateUI(result.level);

  } catch (e) {
    console.error("Prediction Failed:", e);
    document.getElementById('apiStatus').textContent = '⚠️ Error';
  }
}

// --- 4. UI UPDATES ---
function updateUI(level) {
  // Update Text
  document.getElementById('currentLevel').textContent = `${levelEmojis[level]} ${levelLabels[level]}`;
  
  // Update Description
  const descriptions = [
    "Distracted / Unfocused", // 0
    "Low Energy / Passive",   // 1
    "Engaged / Attentive",    // 2
    "Highly Focused! 🚀"      // 3
  ];
  document.getElementById('currentDescription').textContent = descriptions[level];

  // Update Progress Bar Color
  const fill = document.getElementById('levelFill');
  fill.className = 'level-fill'; // Reset
  fill.classList.add(`level-${level}`); // Add new class (css handles color)
  
  // Update Chart
  updateChart(level);
}

// --- 5. CHART LOGIC ---
function initChart() {
  const ctx = document.getElementById('engagementChart');
  if (!ctx || typeof Chart === 'undefined') return;

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Engagement',
        data: [],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#3b82f6'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { 
          beginAtZero: true, 
          max: 3,
          ticks: { callback: (val) => levelEmojis[val] || val }
        },
        x: { display: false } // Hide time labels for clean look
      },
      plugins: { legend: { display: false } }
    }
  });
}

function updateChart(level) {
  if (!chart) return;
  
  const now = new Date().toLocaleTimeString();
  chart.data.labels.push(now);
  chart.data.datasets[0].data.push(level);

  // Keep chart from getting too crowded (last 20 points)
  if (chart.data.labels.length > 20) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
  chart.update();
}

// --- 6. UTILS ---
function toggleWebcamVisibility() {
  const container = document.getElementById('webcamContainer');
  const btnText = document.getElementById('webcamBtnText');
  
  if (container.classList.contains('hidden')) {
    container.classList.remove('hidden');
    btnText.textContent = '📷 Hide Webcam';
  } else {
    container.classList.add('hidden');
    btnText.textContent = '📷 Show Webcam';
  }
}

function stopSession() {
  if (confirm("Stop Tracking?")) {
    window.close();
  }
}

function updateTimer() {
  const diff = Math.floor((Date.now() - sessionStartTime) / 1000);
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  document.getElementById('sessionTime').textContent = `${m}:${s.toString().padStart(2, '0')}`;
}
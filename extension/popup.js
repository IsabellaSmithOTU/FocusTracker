// popup.js - Modern Dashboard Logic

const levelLabels = {
  0: { text: "📉 Very Low", emoji: "😤" },
  1: { text: "😴 Low", emoji: "😴" },
  2: { text: "👍 High", emoji: "😊" },
  3: { text: "🔥 Very High", emoji: "🚀" }
};

let isTracking = false;
let sessionStartTime = null;
let sessionTimer = null;

// Load tracking state
chrome.storage.local.get(['isTracking', 'sessionStartTime', 'lastEngagement'], (result) => {
  isTracking = result.isTracking || false;
  sessionStartTime = result.sessionStartTime || null;
  
  updateUI();
  
  if (result.lastEngagement !== undefined) {
    updateEngagement(result.lastEngagement);
  }
  
  if (isTracking && sessionStartTime) {
    startSessionTimer();
  }
});

// Listen for real-time updates
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'ENGAGEMENT_UPDATE') {
    updateEngagement(message.level);
    chrome.storage.local.set({ lastEngagement: message.level });
  }
  
  if (message.type === 'TRACKING_STOPPED') {
    isTracking = false;
    sessionStartTime = null;
    updateUI();
    stopSessionTimer();
  }
});

function updateUI() {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const statusIndicator = document.getElementById('statusIndicator');
  const quickStats = document.getElementById('quickStats');
  
  if (isTracking) {
    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    statusIndicator.classList.remove('inactive');
    quickStats.style.display = 'grid';
  } else {
    startBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');
    statusIndicator.classList.add('inactive');
    quickStats.style.display = 'none';
    
    document.getElementById('engagementLevel').textContent = 'Ready to Start';
    document.getElementById('confidenceText').textContent = 'Click Start to begin tracking';
    document.getElementById('engagementFill').className = 'engagement-fill';
  }
}

function updateEngagement(level) {
  const levelDiv = document.getElementById('engagementLevel');
  const confidenceDiv = document.getElementById('confidenceText');
  const fillDiv = document.getElementById('engagementFill');
  
  const levelInfo = levelLabels[level];
  levelDiv.textContent = `${levelInfo.emoji} ${levelInfo.text} Engagement`;
  confidenceDiv.textContent = 'Tracking your focus in real-time';
  
  fillDiv.className = `engagement-fill level-${level}`;
  
  // Update average
  chrome.storage.local.get(['engagementHistory'], (result) => {
    const history = result.engagementHistory || [];
    if (history.length > 0) {
      const avg = history.reduce((a, b) => a + b, 0) / history.length;
      document.getElementById('avgEngagement').textContent = avg.toFixed(1);
    }
  });
}

function startSessionTimer() {
  if (sessionTimer) clearInterval(sessionTimer);
  
  sessionTimer = setInterval(() => {
    if (!sessionStartTime) return;
    
    const elapsed = Date.now() - sessionStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    document.getElementById('sessionTime').textContent = 
      `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, 1000);
}

function stopSessionTimer() {
  if (sessionTimer) {
    clearInterval(sessionTimer);
    sessionTimer = null;
  }
  document.getElementById('sessionTime').textContent = '0:00';
  document.getElementById('avgEngagement').textContent = '--';
}

// Start button
document.getElementById('startBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'START_TRACKING' }, (response) => {
    if (response && response.success) {
      isTracking = true;
      sessionStartTime = Date.now();
      
      chrome.storage.local.set({ 
        isTracking: true, 
        sessionStartTime: sessionStartTime,
        engagementHistory: []
      });
      
      updateUI();
      startSessionTimer();
      
      // Open tracker page
      chrome.tabs.create({ url: chrome.runtime.getURL('tracker.html') });
      window.close();
    }
  });
});

// Stop button
document.getElementById('stopBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'STOP_TRACKING' }, (response) => {
    isTracking = false;
    sessionStartTime = null;
    
    chrome.storage.local.set({ 
      isTracking: false,
      sessionStartTime: null
    });
    
    updateUI();
    stopSessionTimer();
  });
});

// Info button
document.getElementById('infoBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('info.html') });
  window.close();
});

// Settings link
document.getElementById('settingsLink').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  window.close();
});

// Stats link
document.getElementById('statsLink').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL('stats.html') });
  window.close();
});
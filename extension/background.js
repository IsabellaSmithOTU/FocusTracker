// background.js - Service Worker with Session Management

console.log("Focus Tracker - Background Service Worker Started");

let trackerTabId = null;
let isTracking = false;

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
  chrome.storage.local.set({ isTracking: false });
});

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_TRACKING') {
    startTracking();
    sendResponse({ success: true });
    return true;
  }
  
  if (message.type === 'STOP_TRACKING') {
    stopTracking();
    sendResponse({ success: true });
    return true;
  }
  
  if (message.type === 'ENGAGEMENT_UPDATE') {
    console.log("Engagement update:", message.level);
    
    // Broadcast to all tabs except tracker
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id !== trackerTabId && tab.id !== sender.tab?.id) {
          chrome.tabs.sendMessage(tab.id, message).catch(() => {});
        }
      });
    });
    
    // Show notification if consistent
    if (message.consistent) {
      showNotification(message.level);
    }
  }
  
  if (message.type === 'TRACKER_READY') {
    console.log("Tracker is ready!");
    isTracking = true;
    if (sender.tab) {
      trackerTabId = sender.tab.id;
    }
  }
});

function startTracking() {
  isTracking = true;
  chrome.storage.local.set({ 
    isTracking: true,
    sessionStartTime: Date.now()
  });
  console.log("Tracking started");
}

function stopTracking() {
  isTracking = false;
  chrome.storage.local.set({ 
    isTracking: false,
    sessionStartTime: null
  });
  
  // Close tracker tab if open
  if (trackerTabId) {
    chrome.tabs.remove(trackerTabId).catch(() => {});
    trackerTabId = null;
  }
  
  // Notify all tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { type: 'TRACKING_STOPPED' }).catch(() => {});
    });
  });
  
  console.log("Tracking stopped");
}

function showNotification(level) {
  const messages = {
    0: { title: "📉 Low Engagement", message: "You seem distracted. Take a break?" },
    1: { title: "😴 Low Energy", message: "Consider switching tasks or taking a break" },
    2: { title: "👍 Good Focus", message: "You're doing great! Keep it up!" },
    3: { title: "🚀 Excellent Focus", message: "You're crushing it! Maximum productivity!" }
  };
  
  const notification = messages[level] || messages[2];
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon48.png',
    title: notification.title,
    message: notification.message,
    priority: 1,
    requireInteraction: false
  });
}

// Clean up if tracker tab is closed manually
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === trackerTabId) {
    console.log("Tracker tab was closed");
    stopTracking();
  }
});
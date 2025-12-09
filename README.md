#  Focus Tracker 

**Focus Tracker** is a hybrid AI-powered Google Chrome Extension designed to monitor student engagement and emotional state in real-time. Built to run alongside Learning Management Systems (like Canvas), it uses a local deep learning model to analyze webcam feed data without ever sending video to the cloud, ensuring 100% privacy.

![Project Status](https://img.shields.io/badge/Status-Active-brightgreen)
![Python](https://img.shields.io/badge/Backend-Flask%20%2B%20PyTorch-blue)
![Frontend](https://img.shields.io/badge/Frontend-Chrome%20Extension-yellow)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

---

##  Features

* **Real-time Engagement Tracking:** Detects 4 levels of engagement (Very Low to Very High).
* **Emotion Recognition:** Identifies 7 distinct emotional states (Happy, Confused, Frustrated, etc.).
* **Privacy-First Architecture:** All video processing happens locally on your machine. No video data leaves your computer.
* **Live Dashboard:** Interactive graph showing engagement trends over time.
* **Smart Notifications:** Gentle nudges when low focus or high distraction is detected.
* **Hybrid Deployment:** Lightweight Chrome Extension UI + Powerful Python Backend.

---

##  Architecture

This project uses a **Hybrid Architecture** to bypass browser limitations:

1.  **Frontend (Chrome Extension):** Handles the UI, captures webcam frames, and displays the dashboard.
2.  **Backend (Python Flask):** A local server (`localhost:5000`) that hosts the AI model.
3.  **The AI Brain:** A Multi-Task Learning (MTL) ResNet-18 model trained on:
    * **FER-2013:** For facial emotion features.
    * **DAiSEE:** For engagement intensity levels.

---

##  Installation

### 1. Clone the Repository
```bash
git clone [https://github.com/IsabellaSmithOTU/FocusTracker.git](https://github.com/IsabellaSmithOTU/FocusTracker.git)
cd FocusTracker
````

### 2\. Set Up the Backend (Python)

You need Python 3.8+ installed.

```bash
# Create a virtual environment (Optional but recommended)
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install flask flask-cors torch torchvision numpy pillow onnxruntime
```

### 3\. Download the Model & Datasets

Because the training datasets and model files are large, they are hosted externally.

  * **Download Link:** [https://drive.google.com/drive/folders/1wPj1YhyqnHTAK6ftynMvQp9_7gpO7WMk?usp=sharing]
  * **Instructions:**
  If you want to retrain the model, download the `DAiSEE` and `FER-2013` folders and place them in the root directory.

### 4\. Load the Chrome Extension

1.  Open Google Chrome and navigate to `chrome://extensions`.
2.  Toggle **Developer mode** (top right corner).
3.  Click **Load unpacked**.
4.  Select the `extension` folder inside this repository.

-----

##  Usage

### Step 1: Start the AI Server

Open your terminal/command prompt in the project folder and run:

```bash
python server.py
```

*You should see: ` Server running on http://localhost:5000`*

### Step 2: Launch the Tracker

1.  Click the **Focus Tracker icon** in your Chrome toolbar.
2.  Click **"Start Tracking"**.
3.  A dashboard will open showing your live engagement graph.
4.  Navigate to Canvas (or any website) and study\! The extension will notify you if your focus drops.

-----

##  Model Training (Optional)

If you wish to retrain the model or experiment with the architecture:

1.  Ensure you have downloaded the **FER-2013** and **DAiSEE** datasets from the Google Drive link above.
2.  Open `notebook1.ipynb` in Jupyter Notebook or VS Code.
3.  Run the training cells.
4.  The script will export a new `.pth` file.

-----

## Privacy

This tool was designed with privacy as the \#1 priority.

  * **Local Processing:** Your webcam feed is processed entirely on your `localhost`.
  * **No Cloud Storage:** Images are converted to mathematical tensors in memory and immediately discarded.
  * **Open Source:** You can inspect `server.py` and `tracker.js` to verify that no data is being sent to external servers.

-----

## License

Distributed under the MIT License. See `LICENSE` for more information.

-----

**University Project** *Developed by Isabella Smith @ Ontario Tech University*

```
```

import base64
import io
import json
import numpy as np
import onnxruntime as ort
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image

app = Flask(__name__)
CORS(app)  # Allow Chrome Extension to talk to this server

# Load your ONNX Model
print("Loading Model...")
session = ort.InferenceSession("focus_tracker.onnx")
input_name = session.get_inputs()[0].name

def preprocess_image(image_data):
    # Convert Base64 string to Image
    image_data = image_data.split(",")[1]
    image = Image.open(io.BytesIO(base64.b64decode(image_data)))
    
    # Resize to 64x64 (Model expectation)
    image = image.resize((64, 64))
    
    # Normalize (Standard ImageNet stats)
    img_array = np.array(image).astype(np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    img_array = (img_array - mean) / std
    
    # Transpose to (Channels, Height, Width) -> (3, 64, 64)
    img_array = img_array.transpose(2, 0, 1)
    return img_array

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        frames = data.get('frames', [])
        
        if len(frames) < 5:
            return jsonify({"error": "Need 5 frames"}), 400

        # Process 5 frames
        processed_frames = []
        for f in frames:
            processed_frames.append(preprocess_image(f))
            
        # Stack into batch: (1, 5, 3, 64, 64)
        input_tensor = np.array([processed_frames], dtype=np.float32)
        
        # Run Inference
        outputs = session.run(None, {input_name: input_tensor})
        scores = outputs[0][0]  # Get logits
        level = int(np.argmax(scores))
        probs = (np.exp(scores) / np.sum(np.exp(scores))).tolist()
        
        return jsonify({
            "level": level,
            "probabilities": probs
        })

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Server running on http://localhost:5000")
    app.run(port=5000)
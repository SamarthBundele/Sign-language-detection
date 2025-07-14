import numpy as np
import tensorflow as tf
import pickle
import cv2
from fastapi import FastAPI, HTTPException, Request as FastAPIRequest
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError
from typing import List

# --- Configuration ---
MODEL_PATH = "gesture_landmark_model.h5"  # Model expects 63 landmark features
LABEL_ENCODER_PATH = "label_encoder.pkl"  # Saved from training

# --- Load Model and Label Encoder ---
try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print(f"Model '{MODEL_PATH}' loaded successfully.")
except Exception as e:
    print(f"Error loading model '{MODEL_PATH}': {e}")
    model = None

try:
    with open(LABEL_ENCODER_PATH, 'rb') as f:
        label_encoder = pickle.load(f)
    print(f"Label encoder '{LABEL_ENCODER_PATH}' loaded successfully.")
except Exception as e:
    print(f"Error loading label encoder '{LABEL_ENCODER_PATH}': {e}")
    label_encoder = None

# --- FastAPI App Initialization ---
app = FastAPI(title="Sign Language Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend's domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global Camera Variables ---
camera = cv2.VideoCapture(0)  # Open default webcam
detecting = False            # Toggle detection ON/OFF


# --- Request and Response Models ---
class LandmarkRequest(BaseModel):
    landmarks: List[float]  # Flat list of 63 features

class PredictionResponse(BaseModel):
    prediction: str | None
    confidence: float | None
    error: str | None = None

class ToggleRequest(BaseModel):
    detect: bool


# --- Helper Functions ---
def predict_from_landmarks(landmarks: List[float]):
    """
    Run prediction on landmark features and return label + confidence
    """
    if model is None or label_encoder is None:
        return None, None

    try:
        landmark_array = np.array(landmarks).reshape(1, 63)
        raw_model_output = model.predict(landmark_array, verbose=0)
        classification_probs = raw_model_output[0]
        predicted_index = np.argmax(classification_probs)
        confidence = float(classification_probs[predicted_index])
        predicted_label = label_encoder.inverse_transform([predicted_index])[0]
        return predicted_label, confidence
    except Exception as e:
        print(f"Prediction error: {e}")
        return None, None


def process_frame(frame):
    """
    Process video frame: draw landmarks + prediction if detection is active
    """
    frame = cv2.resize(frame, (640, 480))

    if detecting:
        # --- Your landmark detection logic here ---
        # For demo, we use placeholder random landmarks
        fake_landmarks = np.random.rand(63).tolist()

        predicted_label, confidence = predict_from_landmarks(fake_landmarks)

        # Draw prediction on frame
        text = f"{predicted_label} ({confidence*100:.1f}%)" if predicted_label else "No Hand Detected"
        color = (0, 255, 0) if predicted_label else (0, 0, 255)
        cv2.putText(frame, text, (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
    else:
        cv2.putText(frame, "Detection Paused", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

    return frame


def generate_frames():
    """
    Continuously capture frames from webcam and yield as MJPEG stream
    """
    while True:
        success, frame = camera.read()
        if not success:
            break

        frame = process_frame(frame)

        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
        frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')


# --- API Endpoints ---

@app.get("/video_feed")
def video_feed():
    """
    Streams live video with landmarks and prediction
    """
    return StreamingResponse(generate_frames(),
                             media_type="multipart/x-mixed-replace; boundary=frame")


@app.post("/toggle_detection")
def toggle_detection(toggle: ToggleRequest):
    """
    Toggle detection ON/OFF
    """
    global detecting
    detecting = toggle.detect
    state = "started" if detecting else "stopped"
    print(f"Detection {state}.")
    return {"success": True, "message": f"Detection {state}."}


@app.post("/predict", response_model=PredictionResponse)
async def predict_landmarks(fastapi_request: FastAPIRequest):
    """
    Predict sign from landmarks POSTed by frontend
    """
    try:
        body = await fastapi_request.json()
        print(f"Received raw request body: {body}")
    except Exception as e:
        print(f"Error reading JSON body: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid JSON body: {e}")

    try:
        request_data = LandmarkRequest(**body)
    except ValidationError as e:
        print(f"Pydantic validation failed: {e.errors()}")
        raise HTTPException(status_code=422, detail=f"Validation error: {e.errors()}")

    if model is None or label_encoder is None:
        raise HTTPException(status_code=503, detail="Model or Label Encoder not loaded.")

    if len(request_data.landmarks) != 63:
        return PredictionResponse(
            prediction=None,
            confidence=None,
            error=f"Expected 63 landmark features, got {len(request_data.landmarks)}."
        )

    predicted_label, confidence = predict_from_landmarks(request_data.landmarks)

    if predicted_label is None:
        return PredictionResponse(prediction=None, confidence=None, error="Prediction failed.")

    return PredictionResponse(prediction=predicted_label, confidence=confidence)


# --- To run this app ---
# uvicorn app:app --reload --host 0.0.0.0 --port 5000

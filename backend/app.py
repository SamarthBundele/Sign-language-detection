import numpy as np
import tensorflow as tf
import pickle
from fastapi import FastAPI, HTTPException, Request as FastAPIRequest
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError
from typing import List

# --- Configuration ---
MODEL_PATH = "gesture_landmark_model.h5"  # Model expects 63 landmark features
LABEL_ENCODER_PATH = "label_encoder.pkl" # Saved from training/training.py

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
app = FastAPI(title="Sign Language Landmark-Based Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend's domain
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["*"],
)

# --- Request and Response Models ---
class LandmarkRequest(BaseModel):
    landmarks: List[float]  # Expecting a flat list of 63 landmark features

class PredictionResponse(BaseModel):
    prediction: str | None
    confidence: float | None
    error: str | None = None

# --- API Endpoint ---
@app.post("/predict", response_model=PredictionResponse)
async def predict_landmarks(fastapi_request: FastAPIRequest): # Changed parameter
    try:
        body = await fastapi_request.json()
        print(f"Received raw request body (attempt 2): {body}") # Log the raw body
    except Exception as e:
        print(f"Error reading or parsing JSON body (attempt 2): {e}")
        raise HTTPException(status_code=400, detail=f"Invalid JSON body: {e}")

    try:
        request_data = LandmarkRequest(**body)
    except ValidationError as e: # Catch Pydantic's ValidationError specifically
        print(f"Pydantic validation failed (attempt 2): {e.errors()}") # Log detailed errors
        raise HTTPException(status_code=422, detail=f"Validation error: {e.errors()}")
    except Exception as e:
        print(f"Some other error during Pydantic validation (attempt 2): {e}")
        raise HTTPException(status_code=422, detail=f"Unexpected validation error: {str(e)}")

    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Server is not ready.")
    if label_encoder is None:
        raise HTTPException(status_code=503, detail="Label encoder not loaded. Server is not ready.")

    if len(request_data.landmarks) != 63: # Use request_data
        return PredictionResponse(
            prediction=None,
            confidence=None,
            error=f"Invalid input: Expected 63 landmark features, got {len(request_data.landmarks)}."
        )

    try:
        # Prepare landmarks for the model (needs to be a NumPy array with batch dimension)
        landmark_array = np.array(request_data.landmarks).reshape(1, 63) # (1 sample, 63 features) # Use request_data

        # Get model prediction (probabilities for each class)
        raw_model_output = model.predict(landmark_array)
        
        # Process classification output
        classification_probs = raw_model_output[0]  # Output for the first (and only) sample
        predicted_index = np.argmax(classification_probs)
        confidence = float(classification_probs[predicted_index])
        
        # Decode the predicted index to the actual label string
        predicted_label = label_encoder.inverse_transform([predicted_index])[0]
        
        return PredictionResponse(
            prediction=predicted_label,
            confidence=confidence
        )
    except Exception as e:
        print(f"Prediction endpoint error: {e}")
        # import traceback
        # traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error during prediction: {e}")

# --- To run this application (from the directory containing this file): ---
# uvicorn app:app --reload --host 0.0.0.0 --port 5000
# Ensure 'gesture_landmark_model.h5' and 'label_encoder.pkl' are in the same directory
# or paths are correctly updated.

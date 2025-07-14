import numpy as np
import tensorflow as tf
import pickle
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

# --- Load Model and Label Encoder (runs once per cold start) ---
model = tf.keras.models.load_model("gesture_landmark_model.h5")
with open("label_encoder.pkl", "rb") as f:
    label_encoder = pickle.load(f)

# --- FastAPI App ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Request Model ---
class LandmarkRequest(BaseModel):
    landmarks: List[float]  # Expecting flat list of 63 numbers

@app.post("/api/predict")
async def predict(request: Request):
    data = await request.json()
    landmarks = data.get("landmarks", [])

    if len(landmarks) != 63:
        raise HTTPException(status_code=400, detail="Expected 63 landmarks.")

    landmarks_np = np.array(landmarks).reshape(1, -1)
    preds = model.predict(landmarks_np)
    pred_idx = np.argmax(preds)
    confidence = float(preds[0][pred_idx])
    label = label_encoder.inverse_transform([pred_idx])[0]

    return {
        "prediction": label,
        "confidence": confidence
    }

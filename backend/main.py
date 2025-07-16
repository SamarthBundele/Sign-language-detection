import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from tensorflow.keras.models import load_model
import pickle
import os

app = FastAPI()

# Load model and label encoder
MODEL_PATH = os.path.join(os.path.dirname(__file__), '../training/gesture_landmark_model01.h5')
ENCODER_PATH = os.path.join(os.path.dirname(__file__), '../training/label_encoder.pkl')

model = load_model(MODEL_PATH)
with open(ENCODER_PATH, 'rb') as f:
    label_encoder = pickle.load(f)

class LandmarkRequest(BaseModel):
    landmarks: list

@app.post('/predict')
def predict_landmark(req: LandmarkRequest):
    if len(req.landmarks) != 63:
        raise HTTPException(status_code=400, detail='Landmark array must have 63 values.')
    arr = np.array(req.landmarks).reshape(1, -1)
    pred = model.predict(arr)
    label_idx = np.argmax(pred, axis=1)[0]
    label = label_encoder.inverse_transform([label_idx])[0]
    confidence = float(np.max(pred))
    return {'label': label, 'confidence': confidence}

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from tensorflow.keras.models import load_model
import pickle
import os
from PIL import Image
import io
import base64

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"]
)

# Use absolute paths for Vercel deployment
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'gesture_landmark_model01.h5')
ENCODER_PATH = os.path.join(os.path.dirname(__file__), 'label_encoder.pkl')

model = load_model(MODEL_PATH)
with open(ENCODER_PATH, 'rb') as f:
    label_encoder = pickle.load(f)

class FrameRequest(BaseModel):
    image_base64: str  # base64 encoded image

@app.post('/predict')
def predict_frame(req: FrameRequest):
    try:
        # Decode base64 image
        image_data = base64.b64decode(req.image_base64)
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        # Preprocess: resize to model input size (update as needed)
        image = image.resize((224, 224))  # Change to your model's expected size
        arr = np.array(image) / 255.0  # Normalize
        arr = arr.reshape(1, 224, 224, 3)  # Update shape as per your model
        pred = model.predict(arr)
        label_idx = np.argmax(pred, axis=1)[0]
        label = label_encoder.inverse_transform([label_idx])[0]
        confidence = float(np.max(pred))
        return {'label': label, 'confidence': confidence}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f'Error processing image: {str(e)}')

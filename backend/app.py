import streamlit as st
import numpy as np
from PIL import Image
import base64
import io
import pickle
from tensorflow.keras.models import load_model
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'gesture_landmark_model01.h5')
ENCODER_PATH = os.path.join(os.path.dirname(__file__), 'label_encoder.pkl')

model = load_model(MODEL_PATH)
with open(ENCODER_PATH, 'rb') as f:
    label_encoder = pickle.load(f)

st.title("Sign Language Detection")

uploaded_file = st.file_uploader("Upload an image", type=["jpg", "jpeg", "png"])
if uploaded_file is not None:
    image = Image.open(uploaded_file).convert('RGB')
    st.image(image, caption="Uploaded Image", use_column_width=True)
    # Preprocess: resize to model input size (update as needed)
    image = image.resize((224, 224))  # Change to your model's expected size
    arr = np.array(image) / 255.0  # Normalize
    arr = arr.reshape(1, 224, 224, 3)  # Update shape as per your model
    pred = model.predict(arr)
    label_idx = np.argmax(pred, axis=1)[0]
    label = label_encoder.inverse_transform([label_idx])[0]
    confidence = float(np.max(pred))
    st.write(f"Prediction: {label}")
    st.write(f"Confidence: {confidence:.2f}")

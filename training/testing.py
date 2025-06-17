# test_landmark_model.py

import cv2
import mediapipe as mp
import numpy as np
from tensorflow.keras.models import load_model
import pickle

mp_hands = mp.solutions.hands

model = load_model("gesture_landmark_model.h5")
with open("label_encoder.pkl", "rb") as f:
    label_encoder = pickle.load(f)

def extract_landmarks(hand_landmarks):
    if not hand_landmarks:
        return None
    return [coord for lm in hand_landmarks.landmark for coord in (lm.x, lm.y, lm.z)]

cap = cv2.VideoCapture(0)
with mp_hands.Hands(static_image_mode=False, max_num_hands=1) as hands:
    while True:
        ret, frame = cap.read()
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(image_rgb)

        if results.multi_hand_landmarks:
            hand_landmarks = results.multi_hand_landmarks[0]
            mp.solutions.drawing_utils.draw_landmarks(
                frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

            features = extract_landmarks(hand_landmarks)
            if features:
                prediction = model.predict(np.array([features]))
                gesture = label_encoder.inverse_transform([np.argmax(prediction)])[0]
                cv2.putText(frame, f"Gesture: {gesture}", (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        cv2.imshow("Gesture Test", frame)
        if cv2.waitKey(10) & 0xFF == ord("q"):
            break

cap.release()
cv2.destroyAllWindows()

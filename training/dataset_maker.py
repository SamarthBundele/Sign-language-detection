# dataset_creator_landmarks.py

import cv2
import mediapipe as mp
import numpy as np
import os
import json

mp_hands = mp.solutions.hands

gestures = ['Hello', 'Love', 'ILoveYou', 'Peace', 'ThumbsUp', 'ThumbsDown']
data_dir = 'landmark_dataset'
os.makedirs(data_dir, exist_ok=True)

def extract_landmarks(hand_landmarks):
    if not hand_landmarks:
        return None
    return [coord for lm in hand_landmarks.landmark for coord in (lm.x, lm.y, lm.z)]

cap = cv2.VideoCapture(0)
with mp_hands.Hands(static_image_mode=False, max_num_hands=1) as hands:
    for gesture in gestures:
        gesture_data = []
        input(f"Perform '{gesture}' gesture and press Enter to start collecting data...")

        count = 0
        while count < 100:
            ret, frame = cap.read()
            image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(image_rgb)

            if results.multi_hand_landmarks:
                landmarks = extract_landmarks(results.multi_hand_landmarks[0])
                if landmarks:
                    gesture_data.append(landmarks)
                    count += 1

                # Visual feedback
                mp.solutions.drawing_utils.draw_landmarks(
                    frame, results.multi_hand_landmarks[0], mp_hands.HAND_CONNECTIONS)
                cv2.putText(frame, f"{gesture}: {count}/100", (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            cv2.imshow('Capture', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        # Save to file
        with open(os.path.join(data_dir, f"{gesture}.json"), 'w') as f:
            json.dump(gesture_data, f)

cap.release()
cv2.destroyAllWindows()

# train_landmark_model.py

import numpy as np
import os
import json
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.utils import to_categorical

data_dir = 'landmark_dataset'
X = []
y = []

# Load and augment data
for filename in os.listdir(data_dir):
    label = filename.split('.')[0]
    with open(os.path.join(data_dir, filename), 'r') as f:
        samples = json.load(f)
        for sample in samples:
            X.append(sample)
            y.append(label)

            # Add noise-based augmentation
            for _ in range(2):  # generate 2 variations
                noisy = np.array(sample) + np.random.normal(0, 0.01, size=63)
                X.append(noisy.tolist())
                y.append(label)

X = np.array(X)
y = np.array(y)

# Encode labels
label_encoder = LabelEncoder()
y_encoded = to_categorical(label_encoder.fit_transform(y))

# Train/Test split
X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)

# Model
model = Sequential([
    Dense(128, activation='relu', input_shape=(63,)),
    Dropout(0.3),
    Dense(64, activation='relu'),
    Dropout(0.3),
    Dense(len(label_encoder.classes_), activation='softmax')
])

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
model.fit(X_train, y_train, epochs=30, validation_data=(X_test, y_test), batch_size=32)

model.save("gesture_landmark_model01.h5")

# Save label encoder
import pickle
with open("label_encoder.pkl", "wb") as f:
    pickle.dump(label_encoder, f)

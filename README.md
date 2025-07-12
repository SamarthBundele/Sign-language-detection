# ✋ Sign Language Detection Web App

An AI-powered web application that detects and interprets **American Sign Language (ASL)** hand gestures in real-time using **MediaPipe**, **TensorFlow**, and **React**. This project aims to bridge the communication gap for the hearing and speech impaired using computer vision and machine learning.

🌐 **Live Demo**: [sign-language-detection-plum.vercel.app](https://sign-language-detection-plum.vercel.app)

---

## 📌 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Model Training](#model-training)
- [Folder Structure](#folder-structure)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## 🧠 Overview

This project captures real-time webcam input, detects hand landmarks using **MediaPipe**, and classifies gestures with a trained **KNN or TensorFlow** model. It's designed to be lightweight, fast, and accessible from any device with a browser.

---

## ✨ Features

- 🎥 Real-time hand tracking using webcam
- 🧠 Gesture classification using trained ML model
- 📦 TensorFlow.js model integration (or KNN model)
- ⚙️ Option to train custom gestures
- 🌍 Deployed as a serverless web app (Vercel)

---

## 🛠 Tech Stack

- **Frontend**: React.js, Tailwind CSS
- **ML**: MediaPipe Hands, TensorFlow.js / scikit-learn (KNN)
- **Deployment**: Vercel
- **Languages**: JavaScript, Python (for training)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/SamarthBundele/Sign-language-detection#
cd sign-language-detection

"use client";

import Image from "next/image";
import styles from "./page.module.css";
import React, { useRef, useEffect, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [prediction, setPrediction] = useState<string>("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);

  useEffect(() => {
    let camera: Camera | null = null;
    if (videoRef.current) {
      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });
      hands.onResults(async (results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          setProcessing(true);
          const landmarks = results.multiHandLandmarks[0]
            .map((lm) => [lm.x, lm.y, lm.z])
            .flat(); // 21 landmarks * 3 = 63
          // Send to backend
          const res = await fetch("/api/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ landmarks }),
          });
          const data = await res.json();
          setPrediction(data.label);
          setConfidence(data.confidence);
          setProcessing(false);
        }
      });
      camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current! });
        },
        width: 400,
        height: 300,
      });
      camera.start();
    }
    return () => {
      if (camera) camera.stop();
    };
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol>
          <li>
            Get started by editing <code>app/page.tsx</code>.
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className={styles.logo}
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondary}
          >
            Read our docs
          </a>
        </div>

        <h1>Sign Language Detection</h1>
        <video
          ref={videoRef}
          autoPlay
          width={400}
          height={300}
          style={{ border: "1px solid #ccc" }}
        />
        {processing && <p>Detecting...</p>}
        {prediction && (
          <div style={{ marginTop: 20 }}>
            <h2>Prediction: {prediction}</h2>
            <p>Confidence: {confidence?.toFixed(2)}</p>
          </div>
        )}
        <p style={{ marginTop: 40, color: "#888" }}>
          (Show your hand to the camera for real-time detection)
        </p>
      </main>
      <footer className={styles.footer}>
        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}

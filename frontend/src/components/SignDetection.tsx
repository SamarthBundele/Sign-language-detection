import { useEffect, useRef, useState } from "react";
import * as mpHands from "@mediapipe/hands";
import * as cam from "@mediapipe/camera_utils";

export default function SignDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const hands = new mpHands.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(async (results) => {
      const ctx = canvasRef.current!.getContext("2d")!;
      ctx.save();
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      ctx.drawImage(results.image, 0, 0, canvasRef.current!.width, canvasRef.current!.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0]
          .flatMap(lm => [lm.x, lm.y, lm.z]); // Flatten to 63 numbers

        // Call backend API
        const res = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ landmarks }),
        });
        const data = await res.json();
        setPrediction(data.prediction);
        setConfidence(data.confidence);
      } else {
        setPrediction(null);
        setConfidence(null);
      }

      ctx.restore();
    });

    const camera = new cam.Camera(videoRef.current, {
      onFrame: async () => {
        await hands.send({ image: videoRef.current! });
      },
      width: 640,
      height: 480,
    });
    camera.start();
  }, []);

  return (
    <div className="relative">
      <video ref={videoRef} className="rounded-lg" autoPlay muted playsInline width={640} height={480} />
      <canvas ref={canvasRef} className="absolute top-0 left-0" width={640} height={480} />
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-4 py-2 rounded text-white">
        {prediction ? (
          <>
            <p className="text-xl font-bold">{prediction}</p>
            <p className="text-sm">Confidence: {(confidence! * 100).toFixed(1)}%</p>
          </>
        ) : (
          <p className="text-sm">No hand detected</p>
        )}
      </div>
    </div>
  );
}

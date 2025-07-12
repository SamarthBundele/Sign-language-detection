import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Camera, CameraOff, Hand } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import DetectedSign from "./DetectedSign";
import * as mpHands from "@mediapipe/hands";
import * as drawingUtils from "@mediapipe/drawing_utils";

interface Landmark {
  x: number;
  y: number;
  z?: number;
}

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17]
];

const SignDetection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [detectedSign, setDetectedSign] = useState<string | null>(null);
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const [handLandmarks, setHandLandmarks] = useState<Landmark[] | null>(null);
  const { toast } = useToast();

  const handsRef = useRef<mpHands.Hands | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        toast({
          title: "Camera activated",
          description: "Position your hand in the frame to begin detection.",
        });
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera access error",
        description: "Unable to access your camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsDetecting(false);
    setDetectedSign(null);
    setHandLandmarks(null);
    clearOverlay();
  };

  const clearOverlay = () => {
    const container = overlayRef.current;
    if (!container) return;
    const elements = container.querySelectorAll(".hand-marker, .finger-connection");
    elements.forEach((el) => el.remove());
  };

  const sendFrameToBackend = async (landmarks: Landmark[]) => {
    const flattenedLandmarks = landmarks.reduce((acc, lm) => {
      acc.push(lm.x, lm.y, lm.z || 0);
      return acc;
    }, [] as number[]);

    try {
      const res = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landmarks: flattenedLandmarks }),
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("Backend error:", err);
      toast({
        title: "Prediction Error",
        description: "Failed to contact backend.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleResults = async (results: mpHands.Results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0].map((lm) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
      }));
      setHandLandmarks(landmarks);

      const prediction = await sendFrameToBackend(landmarks);
      if (prediction) {
        setDetectedSign(prediction.prediction || null);
        setDetectionConfidence(prediction.confidence ? prediction.confidence * 100 : 0);
      }
    } else {
      setHandLandmarks(null);
      setDetectedSign(null);
      clearOverlay();
    }
  };

  const toggleDetection = () => {
    if (!cameraActive) {
      startCamera();
      return;
    }
    setIsDetecting((prev) => {
      if (!prev) {
        toast({
          title: "Detection started",
          description: "Analyzing hand gestures...",
        });
      }
      return !prev;
    });
  };

  useEffect(() => {
    if (isDetecting && !handsRef.current) {
      const hands = new mpHands.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });
      hands.onResults(handleResults);
      handsRef.current = hands;

      const camera = new mpHands.Camera(videoRef.current!, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current! });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }
  }, [isDetecting]);

  useEffect(() => {
    if (!overlayRef.current || !handLandmarks) return;
    const container = overlayRef.current;
    clearOverlay();

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Draw landmarks
    handLandmarks.forEach((lm) => {
      const marker = document.createElement("div");
      marker.className = "hand-marker";
      marker.style.position = "absolute";
      marker.style.left = `${lm.x * containerWidth - 5}px`;
      marker.style.top = `${lm.y * containerHeight - 5}px`;
      marker.style.width = "10px";
      marker.style.height = "10px";
      marker.style.backgroundColor = "rgba(0, 255, 0, 0.7)";
      marker.style.borderRadius = "50%";
      marker.style.zIndex = "10";
      container.appendChild(marker);
    });

    // Draw connections
    HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const start = handLandmarks[startIdx];
      const end = handLandmarks[endIdx];

      const line = document.createElement("div");
      line.className = "finger-connection";
      line.style.position = "absolute";

      const x1 = start.x * containerWidth;
      const y1 = start.y * containerHeight;
      const x2 = end.x * containerWidth;
      const y2 = end.y * containerHeight;

      const length = Math.hypot(x2 - x1, y2 - y1);
      const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

      line.style.width = `${length}px`;
      line.style.height = "2px";
      line.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
      line.style.left = `${x1}px`;
      line.style.top = `${y1}px`;
      line.style.transformOrigin = "0 50%";
      line.style.transform = `rotate(${angle}deg)`;
      line.style.zIndex = "9";

      container.appendChild(line);
    });
  }, [handLandmarks]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="bg-white shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="video-container bg-gray-900 aspect-video relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div ref={overlayRef} className="video-overlay" />
                {!cameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70">
                    <div className="text-center text-white">
                      <AlertCircle size={48} className="mx-auto mb-2" />
                      <h3 className="text-xl font-semibold">Camera not active</h3>
                      <p className="text-gray-300 mt-2">
                        Click the button below to activate your camera
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-between mt-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => (cameraActive ? stopCamera() : startCamera())}
                >
                  {cameraActive ? <CameraOff size={20} /> : <Camera size={20} />}
                </Button>
                <Button
                  variant={isDetecting ? "destructive" : "default"}
                  onClick={toggleDetection}
                  className="px-6"
                  disabled={!cameraActive}
                >
                  {isDetecting ? "Stop Detection" : "Start Detection"}
                </Button>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <Hand className="mr-2" size={24} />
                Sign Detection
              </h2>
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-1">DETECTED SIGN</h3>
                <DetectedSign
                  signName={detectedSign}
                  confidence={detectionConfidence}
                  isDetecting={isDetecting}
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">INSTRUCTIONS</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="bg-primary/10 text-primary font-medium rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">1</span>
                    Position your hand clearly in the camera frame
                  </li>
                  <li className="flex items-start">
                    <span className="bg-primary/10 text-primary font-medium rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">2</span>
                    Make sure there is good lighting on your hand
                  </li>
                  <li className="flex items-start">
                    <span className="bg-primary/10 text-primary font-medium rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">3</span>
                    Hold each sign for 1–2 seconds for better recognition
                  </li>
                  <li className="flex items-start">
                    <span className="bg-primary/10 text-primary font-medium rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">4</span>
                    For best results, avoid rapid movements
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignDetection;

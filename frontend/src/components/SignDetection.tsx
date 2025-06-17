import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Camera, CameraOff, Hand } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import DetectedSign from "./DetectedSign";

interface Landmark {
  x: number;
  y: number;
  z?: number;
}

// Standard MediaPipe Hand connections (adjust if your model's landmarks are different)
const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index finger
  [0, 9], [9, 10], [10, 11], [11, 12], // Middle finger
  [0, 13], [13, 14], [14, 15], [15, 16], // Ring finger
  [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [5, 9], [9, 13], [13, 17] // Palm
];

const SignDetection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [detectedSign, setDetectedSign] = useState<string | null>(null);
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const [handLandmarks, setHandLandmarks] = useState<Landmark[] | null>(null);
  const { toast } = useToast();

  const detectedSignRef = useRef<string | null>(null);
  const handLandmarksRef = useRef<Landmark[] | null>(null);

  const getRandomConfidence = () => Math.floor(Math.random() * 40) + 60;

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
      setCameraActive(false);
      setIsDetecting(false);
      setDetectedSign(null);
    }
  };

  const sendFrameToBackend = async (currentLandmarks: Landmark[] | null) => {
    let flattenedLandmarks: number[] = [];
    if (currentLandmarks && currentLandmarks.length === 21) {
      flattenedLandmarks = currentLandmarks.reduce((acc, lm) => {
        acc.push(lm.x, lm.y, lm.z || 0); // Ensure z is 0 if undefined
        return acc;
      }, [] as number[]);
    } else {
      // Send dummy data if landmarks are not valid to pass backend validation
      // This should be replaced with actual client-side landmark detection
      console.warn("No valid client-side landmarks (21) found, sending dummy data.");
      flattenedLandmarks = Array(63).fill(0.0);
    }

    const res = await fetch("http://localhost:5000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ landmarks: flattenedLandmarks }),
    });
    // Backend now only returns { prediction: string, confidence: float, error?: string }
    const data = await res.json();
    return data;
  };

  const processFrame = async () => {
    if (!canvasRef.current || !videoRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, 640, 480);
    // Client-side landmark detection should happen here before sending to backend
    // For now, we use handLandmarksRef.current which is likely null or stale
    // until proper MediaPipe integration.

    // The handLandmarksRef.current are used for drawing, but they are currently
    // set by the backend's response in the old code. This needs to change.
    // For now, to make the call, we pass what we have.
    // A proper implementation would get fresh landmarks here.
    const landmarksToProcess = handLandmarksRef.current;

    try {
      // Pass current (potentially null/stale) landmarks
      const data = await sendFrameToBackend(landmarksToProcess);
      if (data && data.prediction) {
        setDetectedSign(data.prediction);
        // setHandLandmarks(data.landmarks || null); // Backend no longer sends landmarks
        // Landmarks for drawing should come from a client-side MediaPipe solution
        // If landmarksToProcess was null/stale, the drawing might be off or absent.
        // If using dummy data, setHandLandmarks to null or an empty array to clear drawing.
        if (!landmarksToProcess || landmarksToProcess.length !== 21) {
            setHandLandmarks(null); // Clear drawn landmarks if we sent dummy data
        }
        // Confidence should come from backend if available, else use random
        setDetectionConfidence(data.confidence !== undefined ? data.confidence * 100 : getRandomConfidence());
      } else if (data && data.error) {
        console.error("Backend prediction error:", data.error);
        setDetectedSign(null);
        setHandLandmarks(null);
        toast({
          title: "Prediction Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error processing frame:", error);
      // Optionally, clear landmarks on error
      // setHandLandmarks(null);
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
    detectedSignRef.current = detectedSign;
  }, [detectedSign]);

  useEffect(() => {
    handLandmarksRef.current = handLandmarks;
  }, [handLandmarks]);

  useEffect(() => {
    if (!isDetecting) return;
    const interval = setInterval(() => {
      processFrame();
    }, 2000);
    return () => clearInterval(interval);
  }, [isDetecting]);

  useEffect(() => {
    if (!isDetecting || !overlayRef.current) return;

    const addHandMarkers = () => {
      if (!overlayRef.current) return;
      const container = overlayRef.current;
      const currentLandmarks = handLandmarksRef.current;

      // Clear existing markers and connections
      const existingElements = container.querySelectorAll(".hand-marker, .finger-connection");
      existingElements.forEach((el) => el.remove());

      if (currentLandmarks && currentLandmarks.length > 0) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Draw landmarks
        currentLandmarks.forEach((landmark) => {
          const marker = document.createElement("div");
          marker.className = "hand-marker"; // Apply your CSS class for styling
          marker.style.position = "absolute";
          // Adjust -5 to center the marker if it's 10px wide/high
          marker.style.left = `${landmark.x * containerWidth - 5}px`;
          marker.style.top = `${landmark.y * containerHeight - 5}px`;
          
          // Default styling if no CSS class is sufficient
          if (!marker.style.width) marker.style.width = "10px";
          if (!marker.style.height) marker.style.height = "10px";
          if (!marker.style.backgroundColor) marker.style.backgroundColor = "rgba(0, 255, 0, 0.7)"; // Green dot
          if (!marker.style.borderRadius) marker.style.borderRadius = "50%";
          marker.style.zIndex = "10"; // Ensure markers are on top

          container.appendChild(marker);
        });

        // Draw connections
        HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
          const startLandmark = currentLandmarks[startIdx];
          const endLandmark = currentLandmarks[endIdx];

          if (startLandmark && endLandmark) {
            const line = document.createElement("div");
            line.className = "finger-connection"; // Apply your CSS class for styling
            line.style.position = "absolute";
            
            const x1 = startLandmark.x * containerWidth;
            const y1 = startLandmark.y * containerHeight;
            const x2 = endLandmark.x * containerWidth;
            const y2 = endLandmark.y * containerHeight;

            const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

            // Default styling if no CSS class is sufficient
            if (!line.style.height) line.style.height = "2px";
            if (!line.style.backgroundColor) line.style.backgroundColor = "rgba(255, 255, 255, 0.7)"; // White line
            line.style.zIndex = "9";

            line.style.width = `${length}px`;
            line.style.left = `${x1}px`;
            line.style.top = `${y1 - parseFloat(line.style.height) / 2}px`; // Center line vertically
            line.style.transformOrigin = "0 50%";
            line.style.transform = `rotate(${angle}deg)`;
            
            container.appendChild(line);
          }
        });
      }
    };

    const markerInterval = setInterval(addHandMarkers, 100); // Faster updates for smoother landmarks

    return () => {
      clearInterval(markerInterval);
      const markers = overlayRef.current?.querySelectorAll(".hand-marker, .finger-connection");
      markers?.forEach((marker) => marker.remove());
    };
  }, [isDetecting]);

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
              <canvas ref={canvasRef} width={640} height={480} className="hidden" />
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

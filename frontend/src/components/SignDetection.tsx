import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Camera, CameraOff, Hand } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import DetectedSign from "./DetectedSign";

const SignDetection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedSign, setDetectedSign] = useState<string | null>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      // Assuming backend streams video at http://localhost:5000/video_feed
      if (videoRef.current) {
        videoRef.current.src = "http://localhost:5000/video_feed";
        videoRef.current.play();
        setCameraActive(true);
        toast({
          title: "Camera activated",
          description: "Live video feed from backend started.",
        });
      }
    } catch (err) {
      console.error("Error starting video stream:", err);
      toast({
        title: "Video stream error",
        description: "Unable to connect to backend video stream.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
    }
    setCameraActive(false);
    setIsDetecting(false);
    setDetectedSign(null);
    toast({
      title: "Camera stopped",
      description: "Live video feed has been stopped.",
    });
  };

  const toggleDetection = async () => {
    if (!cameraActive) {
      toast({
        title: "Camera not active",
        description: "Please start the camera first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/toggle_detection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ detect: !isDetecting }),
      });

      const data = await response.json();
      if (data.success) {
        setIsDetecting(!isDetecting);
        toast({
          title: isDetecting ? "Detection stopped" : "Detection started",
          description: data.message,
        });
        if (data.prediction) {
          setDetectedSign(data.prediction);
        }
      } else {
        toast({
          title: "Backend error",
          description: "Failed to toggle detection.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error toggling detection:", err);
      toast({
        title: "Detection toggle error",
        description: "Could not communicate with backend.",
        variant: "destructive",
      });
    }
  };

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
              <DetectedSign
                signName={detectedSign}
                confidence={isDetecting ? "Processing..." : ""}
                isDetecting={isDetecting}
              />
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">INSTRUCTIONS</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="bg-primary/10 text-primary font-medium rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">1</span>
                    Start the camera to view live video from backend
                  </li>
                  <li className="flex items-start">
                    <span className="bg-primary/10 text-primary font-medium rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">2</span>
                    Click "Start Detection" to let backend analyze frames
                  </li>
                  <li className="flex items-start">
                    <span className="bg-primary/10 text-primary font-medium rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">3</span>
                    Prediction will be overlaid directly on the video
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

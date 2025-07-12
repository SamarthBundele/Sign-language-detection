import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface DetectedSignProps {
  signName: string | null;
  confidence: number;
  isDetecting: boolean;
}

const DetectedSign = ({ signName, confidence, isDetecting }: DetectedSignProps) => {
  const safeConfidence = Math.max(0, Math.min(100, isFinite(confidence) ? confidence : 0));
  const confidenceLevel =
    safeConfidence >= 80 ? "high" :
    safeConfidence >= 50 ? "moderate" :
    "low";

  if (!isDetecting || !signName) {
    return (
      <Card className="p-4 border-dashed border-2 border-gray-200 bg-gray-50 flex flex-col items-center justify-center min-h-[100px]">
        {isDetecting ? (
          <>
            <div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-2"></div>
            <p className="text-gray-500">Analyzing hand gestures...</p>
          </>
        ) : (
          <p className="text-gray-500 text-center">Detection not active</p>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex flex-col">
        <div className="flex justify-between items-baseline mb-1">
          <h4 className="text-2xl font-bold text-primary">{signName}</h4>
          <span className="text-sm text-gray-500">{safeConfidence}% match</span>
        </div>
        <Progress value={safeConfidence} className="h-2 mb-3" />
        <p className="text-sm text-gray-600">
          Sign detected with {confidenceLevel} confidence
        </p>
      </div>
    </Card>
  );
};

export default DetectedSign;

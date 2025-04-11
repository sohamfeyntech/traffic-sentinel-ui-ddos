
import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AlertBannerProps {
  visible: boolean;
  attackType: string;
  targetIp: string;
  severity: "low" | "medium" | "high";
  timestamp: string;
}

const AlertBanner = ({ visible, attackType, targetIp, severity, timestamp }: AlertBannerProps) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  const handleClose = () => {
    setIsVisible(false);
  };
  
  if (!isVisible) return null;
  
  const getSeverityColor = () => {
    switch (severity) {
      case "high":
        return "border-red-500 bg-red-900/20";
      case "medium":
        return "border-amber-500 bg-amber-900/20";
      case "low":
        return "border-yellow-500 bg-yellow-900/20";
      default:
        return "border-red-500 bg-red-900/20";
    }
  };

  return (
    <Alert className={`border-l-4 ${getSeverityColor()} text-white animate-fade-in`}>
      <AlertTriangle className="h-5 w-5 text-red-500" />
      <div className="flex-1">
        <AlertTitle className="text-red-500">DDoS Attack Detected</AlertTitle>
        <AlertDescription>
          <div className="text-sm text-gray-300">
            <strong>Type:</strong> {attackType} <br />
            <strong>Target:</strong> {targetIp} <br />
            <strong>Severity:</strong>{" "}
            <span className={`font-medium ${
              severity === "high" ? "text-red-500" : 
              severity === "medium" ? "text-amber-500" : 
              "text-yellow-500"
            }`}>
              {severity.toUpperCase()}
            </span> <br />
            <strong>Time:</strong> {timestamp}
          </div>
        </AlertDescription>
      </div>
      <button
        onClick={handleClose}
        className="p-1 rounded-full hover:bg-gray-700"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
};

export default AlertBanner;

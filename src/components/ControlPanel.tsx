
import { Play, Shield, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ControlPanelProps {
  onStartDDoS: () => void;
  onStartDetection: () => void;
  onReset: () => void;
  ddosActive: boolean;
  detectionActive: boolean;
}

const ControlPanel = ({
  onStartDDoS,
  onStartDetection,
  onReset,
  ddosActive,
  detectionActive
}: ControlPanelProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 bg-gray-800 p-4 rounded-lg border border-gray-700">
      <Button
        variant={ddosActive ? "destructive" : "default"}
        className={`flex-1 ${ddosActive ? "bg-red-700 hover:bg-red-800" : "bg-red-600 hover:bg-red-700"}`}
        onClick={onStartDDoS}
      >
        <Play className="mr-2 h-4 w-4" />
        {ddosActive ? "Stop Attack" : "Start DDoS Attack"}
      </Button>
      
      <Button
        variant={detectionActive ? "outline" : "default"}
        className={`flex-1 ${detectionActive ? "border-blue-500 text-blue-500" : "bg-blue-600 hover:bg-blue-700"}`}
        onClick={onStartDetection}
      >
        <Shield className="mr-2 h-4 w-4" />
        {detectionActive ? "Stop Detection" : "Start Detection"}
      </Button>
      
      <Button
        variant="outline"
        className="flex-1 border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 hover:bg-gray-700"
        onClick={onReset}
      >
        <RotateCw className="mr-2 h-4 w-4" />
        Reset Simulation
      </Button>
    </div>
  );
};

export default ControlPanel;

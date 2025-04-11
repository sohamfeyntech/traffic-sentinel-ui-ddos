
import { useState } from "react";
import { Shield, Server, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface MachineCardProps {
  type: "attacker" | "target";
  name: string;
  ip: string;
  status: "idle" | "active" | "attacking" | "under-attack" | "detecting" | "protected" | "blocked";
  cpuUsage?: number;
  networkUsage?: number;
}

const MachineCard = ({
  type,
  name,
  ip,
  status,
  cpuUsage = 0,
  networkUsage = 0,
}: MachineCardProps) => {
  const getStatusColor = () => {
    switch (status) {
      case "idle":
        return "bg-gray-400";
      case "active":
        return "bg-green-400";
      case "attacking":
        return "bg-red-500";
      case "under-attack":
        return "bg-red-500";
      case "detecting":
        return "bg-yellow-500";
      case "protected":
        return "bg-blue-500";
      case "blocked":
        return "bg-red-600";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "idle":
        return "Idle";
      case "active":
        return "Active";
      case "attacking":
        return "Attacking";
      case "under-attack":
        return "Under Attack";
      case "detecting":
        return "Detecting";
      case "protected":
        return "Protected";
      case "blocked":
        return "Blocked";
      default:
        return "Unknown";
    }
  };

  const Icon = type === "attacker" ? Server : Shield;
  const bgColor = type === "attacker" ? "bg-gray-800" : "bg-gray-800";
  const borderColor = type === "attacker" 
    ? status === "attacking" ? "border-red-500" : "border-gray-700" 
    : status === "under-attack" ? "border-red-500" : status === "protected" ? "border-blue-500" : "border-gray-700";

  return (
    <Card className={`${bgColor} text-white border-2 ${borderColor} transition-all duration-300`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Icon className={`h-5 w-5 ${type === "attacker" ? "text-red-400" : "text-blue-400"}`} />
          {name}
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${getStatusColor()}`}></span>
          <span className="text-xs text-gray-300">{getStatusText()}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-gray-400 mb-4">IP: {ip}</div>
        
        {(status === "attacking" || status === "under-attack") && (
          <div className="mb-2 flex items-center text-xs gap-1 text-red-400">
            <AlertTriangle className="h-3 w-3" />
            {status === "attacking" ? "Sending attack traffic" : "Receiving attack traffic"}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>CPU Usage</span>
              <span>{cpuUsage}%</span>
            </div>
            <Progress value={cpuUsage} className="h-1 bg-gray-700" indicatorColor={cpuUsage > 70 ? "bg-red-500" : "bg-blue-500"} />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Network Traffic</span>
              <span>{networkUsage}%</span>
            </div>
            <Progress value={networkUsage} className="h-1 bg-gray-700" indicatorColor={networkUsage > 70 ? "bg-red-500" : "bg-blue-500"} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MachineCard;

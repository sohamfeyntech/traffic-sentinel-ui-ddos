
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, Network, Upload, Timer } from "lucide-react";

interface StatisticCardProps {
  title: string;
  value: string | number;
  icon: "cpu" | "network" | "packets" | "time";
  change?: {
    value: number;
    positive: boolean;
  };
}

const StatisticCard = ({ title, value, icon, change }: StatisticCardProps) => {
  const getIcon = () => {
    switch (icon) {
      case "cpu":
        return <Cpu className="h-5 w-5 text-blue-400" />;
      case "network":
        return <Network className="h-5 w-5 text-green-400" />;
      case "packets":
        return <Upload className="h-5 w-5 text-amber-400" />;
      case "time":
        return <Timer className="h-5 w-5 text-purple-400" />;
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700 text-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-300">{title}</CardTitle>
        {getIcon()}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs mt-2 ${change.positive ? "text-green-500" : "text-red-500"}`}>
            {change.positive ? "+" : "-"}{change.value}% from previous
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatisticCard;

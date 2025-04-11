
import { useMemo } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Area,
  ComposedChart
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TrafficChartProps {
  data: Array<{
    time: string;
    normal: number;
    attack?: number;
    threshold?: number;
  }>;
  attackDetected: boolean;
}

const TrafficChart = ({ data, attackDetected }: TrafficChartProps) => {
  const chartData = useMemo(() => {
    return data.slice(-20); // Show only the latest 20 data points for better visualization
  }, [data]);

  return (
    <Card className="bg-gray-800 border-gray-700 text-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Network Traffic</CardTitle>
          {attackDetected && (
            <div className="flex items-center">
              <span className="h-3 w-3 rounded-full bg-red-500 mr-2 animate-pulse"></span>
              <span className="text-sm text-red-400 font-medium">Attack Detected</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="normalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="attackGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                tick={{ fill: '#9CA3AF' }} 
                stroke="#4B5563" 
              />
              <YAxis 
                tick={{ fill: '#9CA3AF' }} 
                stroke="#4B5563" 
                label={{ 
                  value: 'Packets/s', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fill: '#9CA3AF' } 
                }} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  color: 'white',
                  borderRadius: '0.375rem' 
                }} 
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Legend wrapperStyle={{ color: '#D1D5DB' }} />
              <Area 
                type="monotone" 
                dataKey="normal" 
                stroke="#3B82F6" 
                fillOpacity={1} 
                fill="url(#normalGradient)" 
                name="Normal Traffic" 
              />
              {data.some(entry => entry.attack !== undefined) && (
                <Area 
                  type="monotone" 
                  dataKey="attack" 
                  stroke="#EF4444" 
                  fillOpacity={1} 
                  fill="url(#attackGradient)" 
                  name="Attack Traffic" 
                />
              )}
              {data.some(entry => entry.threshold !== undefined) && (
                <ReferenceLine 
                  y={data.find(entry => entry.threshold !== undefined)?.threshold} 
                  stroke="#FBBF24" 
                  strokeDasharray="3 3" 
                  label={{ 
                    value: 'Threshold',
                    position: 'insideBottomRight',
                    style: { fill: '#FBBF24' }
                  }} 
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrafficChart;

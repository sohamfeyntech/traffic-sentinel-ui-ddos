
import { Shield } from "lucide-react";

const DashboardHeader = () => {
  return (
    <header className="flex justify-between items-center p-6 bg-gray-900 text-white border-b border-gray-800">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-blue-400" />
        <h1 className="text-2xl font-bold">DDoS Sentinel</h1>
      </div>
      <div className="flex items-center gap-4">
        <span className="px-3 py-1 bg-gray-800 rounded-full text-sm">Simulation Mode</span>
      </div>
    </header>
  );
};

export default DashboardHeader;

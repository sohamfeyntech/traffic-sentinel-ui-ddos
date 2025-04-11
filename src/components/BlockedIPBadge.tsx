
import { Ban } from "lucide-react";

interface BlockedIPBadgeProps {
  ip: string;
  timestamp: string;
}

const BlockedIPBadge = ({ ip, timestamp }: BlockedIPBadgeProps) => {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-950/30 border border-red-500/50 rounded-md text-sm animate-fade-in">
      <Ban className="h-4 w-4 text-red-500" />
      <div className="flex-1">
        <div className="font-medium text-red-500">IP Blocked</div>
        <div className="text-xs text-gray-300">{ip} • {timestamp}</div>
      </div>
    </div>
  );
};

export default BlockedIPBadge;

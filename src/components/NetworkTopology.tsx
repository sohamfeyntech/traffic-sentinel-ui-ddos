
import { useState, useEffect } from "react";
import { Server, Shield, Router, Activity } from "lucide-react";

interface Node {
  id: string;
  x: number;
  y: number;
  type: "attacker" | "target" | "router";
  status: "idle" | "active" | "attacking" | "under-attack" | "detecting" | "protected";
}

interface Edge {
  source: string;
  target: string;
  trafficLevel: number;
  isAttack: boolean;
}

interface NetworkTopologyProps {
  nodes: Node[];
  edges: Edge[];
  attackActive: boolean;
  detectionActive: boolean;
}

const NetworkTopology = ({ nodes, edges, attackActive, detectionActive }: NetworkTopologyProps) => {
  const [packets, setPackets] = useState<Array<{
    id: string;
    sourceId: string;
    targetId: string;
    x: number;
    y: number;
    progress: number;
    isAttack: boolean;
    size: number;
  }>>([]);
  
  const [showDetails, setShowDetails] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  
  // Enhanced packet generation and movement
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate packet movement
      setPackets(prevPackets => {
        // Move existing packets with variable speed
        const movedPackets = prevPackets
          .map(packet => ({
            ...packet,
            progress: packet.progress + (packet.isAttack ? 0.03 : 0.02) // Attack packets move faster
          }))
          .filter(packet => packet.progress < 1);
          
        // Add new packets if attack is active or normal traffic exists
        if (attackActive || edges.some(e => e.trafficLevel > 0)) {
          const activeEdges = edges.filter(e => attackActive ? true : e.trafficLevel > 0);
          // More packets when attack is active
          const newPacketsCount = attackActive ? Math.floor(Math.random() * 5) + 3 : Math.floor(Math.random() * 2) + 1;
          
          if (activeEdges.length > 0) {
            const newPackets = Array.from({ length: newPacketsCount }).map(() => {
              const edge = activeEdges[Math.floor(Math.random() * activeEdges.length)];
              const sourceNode = nodes.find(n => n.id === edge.source)!;
              const targetNode = nodes.find(n => n.id === edge.target)!;
              
              // Randomize starting position slightly around the source node
              const offsetX = (Math.random() - 0.5) * 5;
              const offsetY = (Math.random() - 0.5) * 5;
              
              return {
                id: `packet-${Date.now()}-${Math.random()}`,
                sourceId: edge.source,
                targetId: edge.target,
                x: sourceNode.x + offsetX,
                y: sourceNode.y + offsetY,
                progress: 0,
                isAttack: edge.isAttack,
                size: edge.isAttack ? Math.random() * 2 + 2 : Math.random() * 1 + 1.5 // Variable size
              };
            });
            
            return [...movedPackets, ...newPackets];
          }
        }
        
        return movedPackets;
      });
    }, 40); // Faster interval for smoother animation
    
    return () => clearInterval(interval);
  }, [nodes, edges, attackActive]);
  
  // Get node color based on type and status
  const getNodeColor = (node: Node) => {
    if (node.type === "attacker") {
      return node.status === "attacking" ? "#ef4444" : "#6b7280";
    } else if (node.type === "target") {
      if (node.status === "under-attack") {
        return "#ef4444";
      } else if (node.status === "protected") {
        return "#3b82f6";
      } else if (detectionActive) {
        return "#60a5fa";
      }
      return "#6b7280";
    } else {
      return "#6b7280"; // router
    }
  };
  
  // Get glow effect for nodes
  const getNodeGlow = (node: Node): string => {
    if (node.type === "attacker" && node.status === "attacking") {
      return "drop-shadow(0 0 5px rgba(239, 68, 68, 0.7))";
    } else if (node.type === "target" && node.status === "under-attack") {
      return "drop-shadow(0 0 5px rgba(239, 68, 68, 0.7))";
    } else if (node.type === "target" && node.status === "protected") {
      return "drop-shadow(0 0 5px rgba(59, 130, 246, 0.7))";
    }
    return "";
  };

  // Get icon for node type
  const getNodeIcon = (node: Node) => {
    switch (node.type) {
      case "attacker":
        return <Server className={`h-5 w-5 ${node.status === "attacking" ? "text-red-400" : "text-gray-400"}`} />;
      case "target":
        return <Shield className={`h-5 w-5 ${node.status === "under-attack" ? "text-red-400" : node.status === "protected" ? "text-blue-400" : "text-gray-400"}`} />;
      case "router":
        return <Router className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="relative h-72 bg-gray-900 rounded-md border border-gray-800 overflow-hidden">
      {/* Network visualization controls */}
      <div className="absolute top-2 right-2 z-10 flex space-x-2">
        <button 
          onClick={() => setShowDetails(!showDetails)} 
          className="bg-gray-800 p-1 rounded text-xs text-gray-300 hover:bg-gray-700"
        >
          {showDetails ? "Hide Details" : "Show Details"}
        </button>
        <button 
          onClick={() => setShowLegend(!showLegend)} 
          className="bg-gray-800 p-1 rounded text-xs text-gray-300 hover:bg-gray-700"
        >
          {showLegend ? "Hide Legend" : "Show Legend"}
        </button>
      </div>
      
      {/* Legend */}
      {showLegend && (
        <div className="absolute bottom-2 right-2 bg-gray-800/80 p-2 rounded text-xs z-10 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span>Normal Traffic</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span>Attack Traffic</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3 text-blue-400" />
            <span>Protected</span>
          </div>
        </div>
      )}
      
      {attackActive && (
        <div className="absolute top-2 left-2 bg-red-500/20 text-red-400 text-xs font-medium p-1 px-2 rounded-sm flex items-center gap-1 animate-pulse z-10">
          <Activity className="h-3 w-3" />
          DDoS Attack in Progress
        </div>
      )}
      
      {detectionActive && attackActive && (
        <div className="absolute top-10 left-2 bg-blue-500/20 text-blue-400 text-xs font-medium p-1 px-2 rounded-sm flex items-center gap-1 z-10">
          <Shield className="h-3 w-3" />
          DDoS Detection Active
        </div>
      )}
      
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-gray-900 to-gray-950" />
      
      {/* Grid pattern background */}
      <div className="absolute inset-0" 
        style={{
          backgroundImage: 'radial-gradient(circle, #2d3748 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          opacity: 0.15
        }} 
      />
      
      <svg width="100%" height="100%" className="overflow-visible relative z-1">
        {/* Draw edges with animated gradient for attack paths */}
        {edges.map(edge => {
          const sourceNode = nodes.find(n => n.id === edge.source)!;
          const targetNode = nodes.find(n => n.id === edge.target)!;
          
          return (
            <g key={`${edge.source}-${edge.target}`}>
              <defs>
                <linearGradient 
                  id={`gradient-${edge.source}-${edge.target}`} 
                  x1="0%" y1="0%" x2="100%" y2="0%"
                >
                  <stop offset="0%" stopColor={edge.isAttack ? "#ef4444" : "#3b82f6"} />
                  <stop offset="100%" stopColor={edge.isAttack ? "#ef4444" : "#3b82f6"} stopOpacity="0.2" />
                  <animate 
                    attributeName="x1" 
                    from="0%" 
                    to="100%" 
                    dur="1.5s" 
                    repeatCount="indefinite"
                  />
                  <animate 
                    attributeName="x2" 
                    from="0%" 
                    to="100%" 
                    dur="1.5s" 
                    repeatCount="indefinite"
                  />
                </linearGradient>
              </defs>
              
              <line
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke={edge.isAttack ? "#ef444430" : "#3b82f620"}
                strokeWidth={(edge.trafficLevel > 0 ? 3 + edge.trafficLevel * 0.8 : 2)}
                strokeDasharray={edge.isAttack ? "8 4" : ""}
                className="transition-all duration-300"
              />
              
              <line
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke={`url(#gradient-${edge.source}-${edge.target})`}
                strokeWidth={(edge.trafficLevel > 0 ? 1 + edge.trafficLevel * 0.5 : 1)}
                strokeOpacity={0.7}
                strokeDasharray={edge.isAttack ? "5 3" : ""}
                className="transition-all duration-300"
              />
              
              {showDetails && (
                <text
                  x={(sourceNode.x + targetNode.x) / 2}
                  y={(sourceNode.y + targetNode.y) / 2 - 10}
                  textAnchor="middle"
                  fontSize="9"
                  fill={edge.isAttack ? "#ef4444" : "#3b82f6"}
                  className="select-none pointer-events-none"
                >
                  {edge.isAttack ? `${Math.floor(100 + edge.trafficLevel * 200)} pkts/s` : `${Math.floor(10 + edge.trafficLevel * 3)} pkts/s`}
                </text>
              )}
            </g>
          );
        })}
        
        {/* Draw packets */}
        {packets.map(packet => {
          const sourceNode = nodes.find(n => n.id === packet.sourceId)!;
          const targetNode = nodes.find(n => n.id === packet.targetId)!;
          
          const x = sourceNode.x + (targetNode.x - sourceNode.x) * packet.progress;
          const y = sourceNode.y + (targetNode.y - sourceNode.y) * packet.progress;
          
          return (
            <circle
              key={packet.id}
              cx={x}
              cy={y}
              r={packet.size}
              fill={packet.isAttack ? "#ef4444" : "#3b82f6"}
              opacity={0.8}
              className={packet.isAttack ? "animate-pulse" : ""}
            >
              {packet.isAttack && (
                <animate 
                  attributeName="opacity"
                  values="0.5;0.8;0.5"
                  dur="0.8s"
                  repeatCount="indefinite"
                />
              )}
            </circle>
          );
        })}
        
        {/* Draw nodes */}
        {nodes.map(node => (
          <g key={node.id} style={{ transform: `translate(${node.x}px, ${node.y}px)` }} className="transition-all duration-300">
            {/* Node highlight/glow effect */}
            {(node.status === "attacking" || node.status === "under-attack" || node.status === "protected") && (
              <circle
                cx={0}
                cy={0}
                r={node.type === "router" ? 10 : 14}
                fill={node.status === "protected" ? "rgba(59, 130, 246, 0.2)" : "rgba(239, 68, 68, 0.2)"}
                className={`animate-pulse`}
              />
            )}
            
            {/* Node background */}
            <circle
              cx={0}
              cy={0}
              r={node.type === "router" ? 8 : 12}
              fill={getNodeColor(node)}
              stroke={(node.type === "attacker" && node.status === "attacking") || 
                     (node.type === "target" && node.status === "under-attack")
                       ? "#ef4444" 
                       : node.status === "protected" ? "#3b82f6" : "#1f2937"}
              strokeWidth={2}
              style={{ filter: typeof getNodeGlow(node) === 'string' ? getNodeGlow(node) : undefined }}
              className="transition-all duration-300"
            />
            
            {/* Node icon */}
            <foreignObject
              x={-6}
              y={-6}
              width="12"
              height="12"
              className="overflow-visible pointer-events-none flex items-center justify-center"
            >
              <div className="flex items-center justify-center">
                {getNodeIcon(node)}
              </div>
            </foreignObject>
            
            {/* Node label */}
            <text
              y={node.type === "router" ? 24 : 28}
              textAnchor="middle"
              fontSize="10"
              fontWeight="500"
              fill="#d1d5db"
              className="select-none"
            >
              {node.type === "attacker" ? "Attacker" : node.type === "target" ? "Target" : "Router"}
            </text>
            
            {/* Status indicator */}
            {showDetails && (
              <text
                y={node.type === "router" ? 36 : 40}
                textAnchor="middle"
                fontSize="8"
                fill={
                  node.status === "attacking" || node.status === "under-attack" 
                    ? "#ef4444" 
                    : node.status === "protected" 
                    ? "#3b82f6" 
                    : "#9ca3af"
                }
                className="select-none transition-all duration-300"
              >
                {node.status === "attacking" ? "Attacking" : 
                  node.status === "under-attack" ? "Under Attack" :
                  node.status === "protected" ? "Protected" :
                  node.status === "idle" ? "Idle" : "Active"}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};

export default NetworkTopology;

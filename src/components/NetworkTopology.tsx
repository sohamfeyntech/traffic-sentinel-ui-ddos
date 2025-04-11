
import { useState, useEffect } from "react";

interface Node {
  id: string;
  x: number;
  y: number;
  type: "attacker" | "target" | "router";
  status: "idle" | "active" | "attacking" | "under-attack";
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
  const [packets, setPackets] = useState<Array<{id: string; sourceId: string; targetId: string; x: number; y: number; progress: number; isAttack: boolean }>>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate packet movement
      setPackets(prevPackets => {
        // Move existing packets
        const movedPackets = prevPackets
          .map(packet => ({
            ...packet,
            progress: packet.progress + 0.02
          }))
          .filter(packet => packet.progress < 1);
          
        // Add new packets if attack is active
        if (attackActive || edges.some(e => e.trafficLevel > 0)) {
          const activeEdges = edges.filter(e => attackActive ? true : e.trafficLevel > 0);
          const newPacketsCount = attackActive ? 3 : 1;
          
          if (activeEdges.length > 0) {
            const newPackets = Array.from({ length: newPacketsCount }).map(() => {
              const edge = activeEdges[Math.floor(Math.random() * activeEdges.length)];
              const sourceNode = nodes.find(n => n.id === edge.source)!;
              const targetNode = nodes.find(n => n.id === edge.target)!;
              
              return {
                id: `packet-${Date.now()}-${Math.random()}`,
                sourceId: edge.source,
                targetId: edge.target,
                x: sourceNode.x,
                y: sourceNode.y,
                progress: 0,
                isAttack: edge.isAttack
              };
            });
            
            return [...movedPackets, ...newPackets];
          }
        }
        
        return movedPackets;
      });
    }, 50);
    
    return () => clearInterval(interval);
  }, [nodes, edges, attackActive]);
  
  const getNodeColor = (node: Node) => {
    if (node.type === "attacker") {
      return node.status === "attacking" ? "#ef4444" : "#6b7280";
    } else if (node.type === "target") {
      if (node.status === "under-attack") {
        return "#ef4444";
      } else if (detectionActive) {
        return "#3b82f6";
      }
      return "#6b7280";
    } else {
      return "#6b7280"; // router
    }
  };
  
  return (
    <div className="relative h-64 bg-gray-900 rounded-md border border-gray-800">
      <svg width="100%" height="100%" className="overflow-visible">
        {/* Draw edges */}
        {edges.map(edge => {
          const sourceNode = nodes.find(n => n.id === edge.source)!;
          const targetNode = nodes.find(n => n.id === edge.target)!;
          
          return (
            <line
              key={`${edge.source}-${edge.target}`}
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={targetNode.x}
              y2={targetNode.y}
              stroke={edge.isAttack ? "#ef4444" : "#374151"}
              strokeWidth={edge.trafficLevel > 0 ? 1 + edge.trafficLevel * 0.5 : 1}
              strokeOpacity={0.7}
            />
          );
        })}
        
        {/* Draw nodes */}
        {nodes.map(node => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.type === "router" ? 6 : 10}
              fill={getNodeColor(node)}
              stroke={
                (node.type === "attacker" && node.status === "attacking") || 
                (node.type === "target" && node.status === "under-attack")
                  ? "#ef4444" 
                  : "#1f2937"
              }
              strokeWidth={2}
            />
            <text
              x={node.x}
              y={node.y + 20}
              textAnchor="middle"
              fontSize="10"
              fill="#d1d5db"
            >
              {node.type === "attacker" ? "Attacker" : node.type === "target" ? "Target" : "Router"}
            </text>
          </g>
        ))}
        
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
              r={packet.isAttack ? 3 : 2}
              fill={packet.isAttack ? "#ef4444" : "#3b82f6"}
              opacity={0.8}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default NetworkTopology;

import { useState, useEffect, useMemo } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import MachineCard from "@/components/MachineCard";
import TrafficChart from "@/components/TrafficChart";
import ControlPanel from "@/components/ControlPanel";
import AlertBanner from "@/components/AlertBanner";
import StatisticCard from "@/components/StatisticCard";
import NetworkTopology from "@/components/NetworkTopology";

// Utility function to get current time in HH:MM:SS format
const getCurrentTime = () => {
  const now = new Date();
  return now.toTimeString().slice(0, 8);
};

// Generate random number between min and max
const getRandomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const Index = () => {
  // State for control buttons
  const [ddosActive, setDdosActive] = useState(false);
  const [detectionActive, setDetectionActive] = useState(false);
  const [attackDetected, setAttackDetected] = useState(false);

  // Machine states
  const [attackerState, setAttackerState] = useState<{
    status: "idle" | "active" | "attacking" | "under-attack" | "detecting" | "protected";
    cpuUsage: number;
    networkUsage: number;
  }>({
    status: "idle",
    cpuUsage: 10,
    networkUsage: 8
  });
  
  const [targetState, setTargetState] = useState<{
    status: "idle" | "active" | "attacking" | "under-attack" | "detecting" | "protected";
    cpuUsage: number;
    networkUsage: number;
  }>({
    status: "active",
    cpuUsage: 20,
    networkUsage: 15
  });

  // Traffic chart data
  const [trafficData, setTrafficData] = useState<Array<{
    time: string;
    normal: number;
    attack?: number;
    threshold?: number;
  }>>([]);

  // Detection threshold
  const detectionThreshold = 150;

  // Timing states
  const [simulationStartTime, setSimulationStartTime] = useState<Date | null>(null);
  const [detectionTime, setDetectionTime] = useState<Date | null>(null);
  
  // Alert states
  const [alertInfo, setAlertInfo] = useState({
    visible: false,
    attackType: "SYN Flood",
    targetIp: "192.168.1.100",
    severity: "high" as const,
    timestamp: ""
  });

  // Network topology data
  const topologyNodes = [
    { id: "attacker1", x: 50, y: 50, type: "attacker" as const, status: attackerState.status },
    { id: "router1", x: 150, y: 100, type: "router" as const, status: "active" as const },
    { id: "target1", x: 250, y: 50, type: "target" as const, status: targetState.status }
  ];
  
  const [topologyEdges, setTopologyEdges] = useState<Array<{
    source: string;
    target: string;
    trafficLevel: number;
    isAttack: boolean;
  }>>([
    { source: "attacker1", target: "router1", trafficLevel: 0, isAttack: false },
    { source: "router1", target: "target1", trafficLevel: 0, isAttack: false }
  ]);

  // Initialize traffic data
  useEffect(() => {
    const initialData = Array.from({ length: 20 }, (_, i) => {
      const time = new Date();
      time.setSeconds(time.getSeconds() - (20 - i));
      return {
        time: time.toTimeString().slice(0, 8),
        normal: getRandomNumber(10, 30)
      };
    });
    setTrafficData(initialData);
    
    // Update time every second
    const interval = setInterval(() => {
      if (simulationStartTime) {
        const elapsedMs = new Date().getTime() - simulationStartTime.getTime();
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        
        // Format as MM:SS
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [simulationStartTime]);

  // Handle traffic data updates
  useEffect(() => {
    if (!ddosActive && !detectionActive) return;
    
    const interval = setInterval(() => {
      setTrafficData(prevData => {
        const normalTraffic = getRandomNumber(10, 30);
        let attackTraffic = 0;
        
        if (ddosActive) {
          // Gradually increase attack traffic
          const lastAttackTraffic = prevData[prevData.length - 1]?.attack || 0;
          if (lastAttackTraffic < 200) {
            attackTraffic = lastAttackTraffic + getRandomNumber(10, 25);
          } else {
            attackTraffic = lastAttackTraffic + getRandomNumber(-10, 10);
          }
        }
        
        const newDataPoint = {
          time: getCurrentTime(),
          normal: normalTraffic,
          ...(ddosActive && { attack: attackTraffic }),
          ...(detectionActive && { threshold: detectionThreshold })
        };
        
        // Check if the attack should be detected
        if (detectionActive && ddosActive && attackTraffic > detectionThreshold && !attackDetected) {
          setAttackDetected(true);
          setDetectionTime(new Date());
          setAlertInfo({
            visible: true,
            attackType: "SYN Flood DDoS",
            targetIp: "192.168.1.100",
            severity: "high",
            timestamp: getCurrentTime()
          });
          
          // Update target machine status
          setTargetState(prev => ({
            ...prev, 
            status: "protected"
          }));
        }
        
        // Keep only the latest 20 data points
        return [...prevData.slice(-19), newDataPoint];
      });
      
      // Update machine states
      if (ddosActive) {
        setAttackerState(prev => ({
          status: "attacking",
          cpuUsage: Math.min(95, prev.cpuUsage + getRandomNumber(1, 3)),
          networkUsage: Math.min(98, prev.networkUsage + getRandomNumber(2, 5))
        }));
        
        if (!attackDetected) {
          setTargetState(prev => ({
            status: "under-attack",
            cpuUsage: Math.min(100, prev.cpuUsage + getRandomNumber(3, 7)),
            networkUsage: Math.min(100, prev.networkUsage + getRandomNumber(5, 10))
          }));
        }
      }
      
      // Update topology edges
      setTopologyEdges([
        { 
          source: "attacker1", 
          target: "router1", 
          trafficLevel: ddosActive ? getRandomNumber(7, 10) : getRandomNumber(0, 1), 
          isAttack: ddosActive 
        },
        { 
          source: "router1", 
          target: "target1", 
          trafficLevel: ddosActive ? getRandomNumber(7, 10) : getRandomNumber(0, 1), 
          isAttack: ddosActive 
        }
      ]);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [ddosActive, detectionActive, attackDetected]);

  // Calculate time taken for detection
  const detectionTimeElapsed = useMemo(() => {
    if (!simulationStartTime || !detectionTime) return null;
    const elapsedMs = detectionTime.getTime() - simulationStartTime.getTime();
    return (elapsedMs / 1000).toFixed(2); // In seconds
  }, [simulationStartTime, detectionTime]);

  // Handler for starting DDoS attack
  const handleStartDDoS = () => {
    if (!ddosActive && !simulationStartTime) {
      setSimulationStartTime(new Date());
    }
    
    setDdosActive(!ddosActive);
    
    if (ddosActive) {
      // Stop attack
      setAttackerState(prev => ({
        ...prev,
        status: "idle",
        cpuUsage: getRandomNumber(5, 15),
        networkUsage: getRandomNumber(3, 10)
      }));
      
      if (!attackDetected) {
        setTargetState(prev => ({
          ...prev,
          status: "active",
          cpuUsage: getRandomNumber(10, 25),
          networkUsage: getRandomNumber(8, 20)
        }));
      }
      
      setTopologyEdges(prevEdges => 
        prevEdges.map(edge => ({ ...edge, trafficLevel: 0, isAttack: false }))
      );
    } else {
      // Start attack
      setAttackerState(prev => ({
        ...prev,
        status: "attacking"
      }));
      
      if (!attackDetected) {
        setTargetState(prev => ({
          ...prev,
          status: "under-attack"
        }));
      }
    }
  };

  // Handler for starting detection
  const handleStartDetection = () => {
    if (!detectionActive && !simulationStartTime) {
      setSimulationStartTime(new Date());
    }
    
    setDetectionActive(!detectionActive);
    
    // If turning off detection and attack was detected, reset the detection
    if (detectionActive && attackDetected) {
      setAttackDetected(false);
      setAlertInfo(prev => ({ ...prev, visible: false }));
      
      if (ddosActive) {
        setTargetState(prev => ({
          ...prev,
          status: "under-attack"
        }));
      }
    }
  };

  // Handler for resetting the simulation
  const handleReset = () => {
    setDdosActive(false);
    setDetectionActive(false);
    setAttackDetected(false);
    setSimulationStartTime(null);
    setDetectionTime(null);
    
    setAttackerState({
      status: "idle",
      cpuUsage: 10,
      networkUsage: 8
    });
    
    setTargetState({
      status: "active",
      cpuUsage: 20,
      networkUsage: 15
    });
    
    setAlertInfo(prev => ({ ...prev, visible: false }));
    
    // Reset traffic data
    const initialData = Array.from({ length: 20 }, () => ({
      time: getCurrentTime(),
      normal: getRandomNumber(10, 30)
    }));
    setTrafficData(initialData);
    
    // Reset topology
    setTopologyEdges([
      { source: "attacker1", target: "router1", trafficLevel: 0, isAttack: false },
      { source: "router1", target: "target1", trafficLevel: 0, isAttack: false }
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-6">
        {/* Alert Banner */}
        <div className="mb-6">
          <AlertBanner {...alertInfo} />
        </div>
        
        {/* Control Panel */}
        <div className="mb-6">
          <ControlPanel
            onStartDDoS={handleStartDDoS}
            onStartDetection={handleStartDetection}
            onReset={handleReset}
            ddosActive={ddosActive}
            detectionActive={detectionActive}
          />
        </div>
        
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatisticCard
            title="Packets Sent"
            value={ddosActive ? "2.3K/s" : "12/s"}
            icon="packets"
            change={ddosActive ? { value: 1250, positive: true } : undefined}
          />
          <StatisticCard
            title="Network Load"
            value={ddosActive ? "92%" : "23%"}
            icon="network"
            change={ddosActive ? { value: 69, positive: true } : undefined}
          />
          <StatisticCard
            title="CPU Usage"
            value={targetState.cpuUsage + "%"}
            icon="cpu"
            change={ddosActive ? { value: targetState.cpuUsage - 20, positive: true } : undefined}
          />
          <StatisticCard
            title={detectionTimeElapsed ? "Detection Time" : "Simulation Time"}
            value={detectionTimeElapsed ? `${detectionTimeElapsed}s` : simulationStartTime ? "Running" : "Ready"}
            icon="time"
          />
        </div>
        
        {/* Network Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Machine Cards */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-2">Network Machines</h2>
            <MachineCard
              type="attacker"
              name="Attack Machine"
              ip="192.168.1.50"
              status={attackerState.status}
              cpuUsage={attackerState.cpuUsage}
              networkUsage={attackerState.networkUsage}
            />
            <MachineCard
              type="target"
              name="Target Server"
              ip="192.168.1.100"
              status={targetState.status}
              cpuUsage={targetState.cpuUsage}
              networkUsage={targetState.networkUsage}
            />
          </div>
          
          {/* Network Topology */}
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold mb-2">Network Topology</h2>
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 h-full">
              <NetworkTopology 
                nodes={topologyNodes} 
                edges={topologyEdges} 
                attackActive={ddosActive}
                detectionActive={detectionActive}
              />
            </div>
          </div>
          
          {/* Traffic Chart */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-2">Traffic Analysis</h2>
            <TrafficChart data={trafficData} attackDetected={attackDetected} />
          </div>
        </div>
        
        {/* Technical Details Section */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
          <h2 className="text-xl font-semibold mb-4">DDoS Attack Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3 text-blue-400">Attack Characteristics</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                <li>SYN Flood - Exploits TCP handshake process</li>
                <li>High packet rate (1000+ packets per second)</li>
                <li>Distributed attack pattern from multiple sources</li>
                <li>Targets web server application layer</li>
                <li>Causes CPU & memory exhaustion on target</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-3 text-blue-400">Detection Techniques</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                <li>Traffic threshold monitoring</li>
                <li>Statistical anomaly detection</li>
                <li>TCP SYN-ACK ratio analysis</li>
                <li>Source IP address entropy measurement</li>
                <li>Connection rate monitoring</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;

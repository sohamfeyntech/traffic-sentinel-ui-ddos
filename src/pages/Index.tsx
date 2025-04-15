import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase"; // Import Firestore instance
import { collection, addDoc, Timestamp } from "firebase/firestore"; // Import Firestore functions
import DashboardHeader from "@/components/DashboardHeader";
import MachineCard from "@/components/MachineCard";
import TrafficChart from "@/components/TrafficChart";
import ControlPanel from "@/components/ControlPanel";
import AlertBanner from "@/components/AlertBanner";
import StatisticCard from "@/components/StatisticCard";
import NetworkTopology from "@/components/NetworkTopology";
import BlockedIPBadge from "@/components/BlockedIPBadge";
import AttackHistory from "@/components/AttackHistory"; // Import the new component
import {
  AlertDialog,
  AlertDialogAction,
  // AlertDialogCancel, // No longer needed if only using Action
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose // Import DialogClose if needed for a close button inside
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"; // Import Button
import { MaximizeIcon } from "lucide-react"; // Import an icon for the button

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
  const [showDetectionModal, setShowDetectionModal] = useState(false); // State for detection modal visibility
  const [showChartModal, setShowChartModal] = useState(false); // State for chart modal visibility
  
  // State for blocked IP
  const [blockedIP, setBlockedIP] = useState<{
    ip: string;
    timestamp: string;
    isBlocked: boolean;
  }>({
    ip: "",
    timestamp: "",
    isBlocked: false
  });

  // Machine states
  const [attackerState, setAttackerState] = useState<{
    status: "idle" | "active" | "attacking" | "under-attack" | "detecting" | "protected" | "blocked";
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
        
        const lastDataPoint = prevData[prevData.length - 1];
        const lastAttackTraffic = lastDataPoint?.attack || 0;

        if (ddosActive) {
          if (attackDetected) {
            // Attack detected and blocked - gradually decrease attack traffic
            attackTraffic = Math.max(0, lastAttackTraffic - getRandomNumber(20, 40));
          } else {
            // Attack ongoing, not yet detected - increase or maintain attack traffic
            if (lastAttackTraffic < 200) {
              attackTraffic = lastAttackTraffic + getRandomNumber(10, 25);
            } else {
              attackTraffic = lastAttackTraffic + getRandomNumber(-10, 10); // Fluctuate around peak
            }
            attackTraffic = Math.max(0, attackTraffic); // Ensure it doesn't go below 0
          }
        }

        const newDataPoint = {
          time: getCurrentTime(),
          normal: normalTraffic,
          // Only include attack traffic if ddos is active OR if it was active and is now decreasing
          ...((ddosActive || (lastAttackTraffic > 0 && attackDetected)) && { attack: attackTraffic }),
          ...(detectionActive && { threshold: detectionThreshold })
        };
        
        // Check if the attack should be detected
        if (detectionActive && ddosActive && attackTraffic > detectionThreshold && !attackDetected) {
          setAttackDetected(true);
          setShowDetectionModal(true); // Show the modal on detection
          const detectionTimestamp = new Date(); // Capture detection time precisely
          setDetectionTime(detectionTimestamp);
          const currentTime = getCurrentTime(); // For display purposes

          const currentAlertInfo = {
            visible: true,
            attackType: "SYN Flood DDoS",
            targetIp: "192.168.1.100",
            severity: "high" as const,
            timestamp: currentTime
          };
          setAlertInfo(currentAlertInfo);

          // Update target machine status
          setTargetState(prev => ({
            ...prev,
            status: "protected"
          }));

          // Block the attacker's IP
          setAttackerState(prev => ({
            ...prev,
            status: "blocked"
          }));

          // Set blocked IP information
          const blockedIpInfo = {
            ip: "192.168.1.50", // Attacker's IP
            timestamp: currentTime, // Use display time here
            isBlocked: true
          };
          setBlockedIP(blockedIpInfo);

          // --- Save attack data to Firestore ---
          const saveAttackData = async () => {
            // Calculate detection time elapsed *before* saving
            let elapsedSeconds = null;
            if (simulationStartTime) {
               const elapsedMs = detectionTimestamp.getTime() - simulationStartTime.getTime();
               elapsedSeconds = parseFloat((elapsedMs / 1000).toFixed(2));
            }

            try {
              const attackData = {
                timestamp: Timestamp.fromDate(detectionTimestamp), // Use precise Firestore Timestamp
                attackType: currentAlertInfo.attackType,
                targetIp: currentAlertInfo.targetIp,
                attackerIp: blockedIpInfo.ip,
                severity: currentAlertInfo.severity,
                detectionTimeElapsed: elapsedSeconds, // Save calculated elapsed time
              };
              await addDoc(collection(db, "attacks"), attackData);
              console.log("Attack data saved to Firestore:", attackData);
            } catch (error) {
              console.error("Error saving attack data to Firestore: ", error);
            }
          };
          saveAttackData();
          // --- End Firestore save ---

          // Automatically stop the DDoS attack simulation when detected
          setDdosActive(false);
        }
        
        // Keep only the latest 20 data points
        return [...prevData.slice(-19), newDataPoint];
      });
      
      // Update machine states based on attack status
      if (ddosActive) {
        if (attackDetected) {
          // Attack detected: Attacker is blocked, Target recovers
          setAttackerState(prev => ({
            status: "blocked", // Keep status as blocked
            cpuUsage: Math.max(5, prev.cpuUsage - getRandomNumber(2, 5)), // Decrease usage
            networkUsage: Math.max(2, prev.networkUsage - getRandomNumber(3, 7)) // Decrease usage
          }));
          setTargetState(prev => ({
            status: "protected", // Keep status as protected
            cpuUsage: Math.max(20, prev.cpuUsage - getRandomNumber(4, 8)), // Recover usage
            networkUsage: Math.max(15, prev.networkUsage - getRandomNumber(6, 12)) // Recover usage
          }));
        } else {
          // Attack ongoing, not detected: Attacker attacks, Target is under attack
          setAttackerState(prev => ({
            status: "attacking",
            cpuUsage: Math.min(95, prev.cpuUsage + getRandomNumber(1, 3)),
            networkUsage: Math.min(98, prev.networkUsage + getRandomNumber(2, 5))
          }));
          setTargetState(prev => ({
            status: "under-attack",
            cpuUsage: Math.min(100, prev.cpuUsage + getRandomNumber(3, 7)),
            networkUsage: Math.min(100, prev.networkUsage + getRandomNumber(5, 10))
          }));
        }
      } else if (attackDetected) {
          // DDoS stopped manually AFTER detection, ensure recovery continues/completes
          setAttackerState(prev => ({
            status: "blocked", // Remain blocked until reset
            cpuUsage: Math.max(5, prev.cpuUsage - getRandomNumber(2, 5)),
            networkUsage: Math.max(2, prev.networkUsage - getRandomNumber(3, 7))
          }));
          setTargetState(prev => ({
            status: "protected", // Remain protected until reset
            cpuUsage: Math.max(20, prev.cpuUsage - getRandomNumber(4, 8)),
            networkUsage: Math.max(15, prev.networkUsage - getRandomNumber(6, 12))
          }));
      }
      
      // Update topology edges based on attack status
      setTopologyEdges(prevEdges => {
        const currentAttackTraffic = trafficData[trafficData.length - 1]?.attack ?? 0;
        let attackTrafficLevel = 0;
        if (ddosActive || (attackDetected && currentAttackTraffic > 0)) {
           // Scale traffic level roughly based on actual attack traffic (0-10 scale)
           attackTrafficLevel = Math.min(10, Math.max(0, Math.ceil(currentAttackTraffic / 25)));
        }
        
        return [
          {
            source: "attacker1",
            target: "router1",
            // Show decreasing traffic level even if ddosActive is false but attack was detected
            trafficLevel: attackTrafficLevel,
            isAttack: ddosActive || (attackDetected && currentAttackTraffic > 0)
          },
          {
            source: "router1",
            target: "target1",
            trafficLevel: attackTrafficLevel,
            isAttack: ddosActive || (attackDetected && currentAttackTraffic > 0)
          }
        ];
      });
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
    
    // Reset blocked IP
    setBlockedIP({
      ip: "",
      timestamp: "",
      isBlocked: false
    });
    
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
        {/* Alert Banner & Blocked IP */}
        <div className="mb-6 space-y-2"> {/* Group alert and badge with consistent spacing */}
          <AlertBanner {...alertInfo} />
          {blockedIP.isBlocked && (
             <BlockedIPBadge ip={blockedIP.ip} timestamp={blockedIP.timestamp} />
          )}
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
          <div className="space-y-4"> {/* Column 1: Machines */}
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
          
          {/* Column 2: Topology */}
          <div className="flex flex-col">
             <div className="flex justify-between items-center mb-2"> {/* Ensure title has bottom margin */}
               <h2 className="text-xl font-semibold">Network Topology</h2>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setShowChartModal(true)}
                 className="border-blue-500 text-blue-400 hover:bg-blue-900/50 hover:text-blue-300"
               >
                 <MaximizeIcon className="h-4 w-4 mr-1" />
                 Expand Chart
               </Button>
             </div>
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 h-full">
              <NetworkTopology 
                nodes={topologyNodes} 
                edges={topologyEdges} 
                attackActive={ddosActive}
                detectionActive={detectionActive}
              />
            </div>
          </div>
          
          {/* Column 3: Traffic Chart */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-2">Traffic Analysis</h2> {/* Ensure title has bottom margin */}
            <TrafficChart data={trafficData} attackDetected={attackDetected} />
          </div>
        </div>
        
        {/* Technical Details Section - Ensure consistent top margin */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mt-6">
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

        {/* Attack History */}
        <div className="mt-6"> {/* Add margin top */}
          <AttackHistory />
        </div>

        {/* Attack Detection Modal */}
        <AlertDialog open={showDetectionModal} onOpenChange={setShowDetectionModal}>
          <AlertDialogContent className="bg-gray-800 border-red-500 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-400">🚨 Attack Detected!</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                Abnormal traffic pattern detected exceeding the defined threshold.
                <br />
                Attack Type: {alertInfo.attackType}
                <br />
                Target IP: {alertInfo.targetIp}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div>
              <h4 className="font-semibold mb-2 text-blue-400">Mitigation Action:</h4>
              <p className="text-gray-300">
                The suspected attacker IP address (<code className="bg-gray-700 px-1 rounded">{blockedIP.ip}</code>) has been automatically blocked to protect the target server.
              </p>
            </div>
            <AlertDialogFooter>
              <AlertDialogAction className="bg-blue-600 hover:bg-blue-700">Acknowledge</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Traffic Chart Modal */}
        <Dialog open={showChartModal} onOpenChange={setShowChartModal}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white sm:max-w-[80vw] h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-blue-400">Traffic Analysis (Expanded)</DialogTitle>
            </DialogHeader>
            <div className="flex-grow overflow-hidden p-4">
              {/* Added padding and flex-grow */}
              <TrafficChart data={trafficData} attackDetected={attackDetected} />
            </div>
             {/* Optional: Add a close button if needed, otherwise clicking outside closes it */}
             {/* <DialogFooter>
               <DialogClose asChild>
                 <Button type="button" variant="secondary">Close</Button>
               </DialogClose>
             </DialogFooter> */}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Index;

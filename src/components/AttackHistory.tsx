import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea

// Interface for the attack data stored in Firestore
interface AttackLog {
  id: string;
  timestamp: Timestamp;
  attackType: string;
  targetIp: string;
  attackerIp: string;
  severity: string;
  detectionTimeElapsed: number | null;
}

const AttackHistory: React.FC = () => {
  const [attackHistory, setAttackHistory] = useState<AttackLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const attacksCollectionRef = collection(db, 'attacks');
    // Order by timestamp in descending order to show the latest attacks first
    const q = query(attacksCollectionRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const history: AttackLog[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Basic validation to ensure data matches expected structure
        if (data.timestamp && data.attackType && data.targetIp && data.attackerIp && data.severity) {
          history.push({
            id: doc.id,
            timestamp: data.timestamp,
            attackType: data.attackType,
            targetIp: data.targetIp,
            attackerIp: data.attackerIp,
            severity: data.severity,
            detectionTimeElapsed: data.detectionTimeElapsed ?? null, // Handle potentially missing field
          });
        } else {
          console.warn("Skipping document with missing fields:", doc.id, data);
        }
      });
      setAttackHistory(history);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching attack history: ", err);
      setError("Failed to load attack history.");
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs once on mount

  const formatTimestamp = (timestamp: Timestamp | null): string => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate().toLocaleString(); // Adjust format as needed
  };

  return (
    <Card className="bg-gray-800 border-gray-700 text-white">
      <CardHeader>
        <CardTitle>Past Attack History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <p>Loading history...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <ScrollArea className="h-[300px] w-full"> {/* Wrap Table in ScrollArea */}
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-gray-700 border-gray-600">
                  <TableHead className="text-gray-300">Timestamp</TableHead>
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">Target IP</TableHead>
                  <TableHead className="text-gray-300">Attacker IP</TableHead>
                  <TableHead className="text-gray-300">Severity</TableHead>
                  <TableHead className="text-gray-300">Detection Time (s)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attackHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-400">No past attacks recorded.</TableCell>
                  </TableRow>
                ) : (
                  attackHistory.map((attack) => (
                    <TableRow key={attack.id} className="hover:bg-gray-700 border-gray-600">
                      <TableCell>{formatTimestamp(attack.timestamp)}</TableCell>
                      <TableCell>{attack.attackType}</TableCell>
                      <TableCell>{attack.targetIp}</TableCell>
                      <TableCell>{attack.attackerIp}</TableCell>
                      <TableCell>{attack.severity}</TableCell>
                      <TableCell>{attack.detectionTimeElapsed !== null ? attack.detectionTimeElapsed.toFixed(2) : 'N/A'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default AttackHistory;
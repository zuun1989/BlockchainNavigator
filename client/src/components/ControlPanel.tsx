import { useState, useEffect } from "react";
import {
  Hammer,
  AlertTriangle,
  RotateCcw,
  Box,
  Database,
  ArrowLeft,
  ArrowRight,
  Scale,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

interface ControlPanelProps {
  onMineBlock: (
    direction: "positive" | "negative",
    data: any,
    difficulty: number
  ) => void;
  onTamperBlock: () => void;
  onResetChain: () => void;
  blocksCount: {
    total: number;
    negative: number;
    positive: number;
  };
  isChainValid: boolean;
}

interface BalanceStatus {
  isBalanced: boolean;
  recommendedDirection: "positive" | "negative" | null;
  positiveCount: number;
  negativeCount: number;
  timeDifference: number;
}

export default function ControlPanel({
  onMineBlock,
  onTamperBlock,
  onResetChain,
  blocksCount,
  isChainValid,
}: ControlPanelProps) {
  const [blockDirection, setBlockDirection] = useState<"positive" | "negative">("negative");
  const [blockData, setBlockData] = useState<string>('{"transaction": "new transaction", "amount": 5000}');
  const [miningDifficulty, setMiningDifficulty] = useState<number>(2);
  
  // State for blockchain connection
  const [externalBlockchainJson, setExternalBlockchainJson] = useState<string>('');
  const [connectDirection, setConnectDirection] = useState<"positive" | "negative">("positive");
  
  // Function to handle blockchain connection
  const handleConnectBlockchain = async () => {
    try {
      let externalBlocks;
      try {
        externalBlocks = JSON.parse(externalBlockchainJson);
        if (!Array.isArray(externalBlocks)) {
          alert("Invalid format: expected an array of blocks");
          return;
        }
      } catch (error) {
        alert("Invalid JSON: Please provide valid JSON representing an array of blocks");
        return;
      }

      const response = await fetch('/api/blockchain/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          externalBlocks,
          direction: connectDirection
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`Successfully connected ${result.connectedBlocksCount} blocks from external blockchain!`);
      } else {
        alert(`Connection failed: ${result.message}`);
      }
    } catch (error) {
      console.error("Error connecting blockchains:", error);
      alert("Failed to connect blockchains. Check console for details.");
    }
  };
  
  // Query to fetch blockchain balance status
  const { data: balanceStatus } = useQuery<BalanceStatus>({
    queryKey: ["/api/blockchain/balance"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const handleMineBlock = () => {
    try {
      const parsedData = JSON.parse(blockData);
      onMineBlock(blockDirection, parsedData, miningDifficulty);
    } catch (error) {
      alert("Invalid JSON data. Please check the format.");
    }
  };

  // Calculate blockchain size (approximation)
  const blockchainSize = (blocksCount.total * 0.5).toFixed(1);

  return (
    <section className="bg-white border-t border-gray-200 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Control Panel</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Connect Blockchain Panel */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-8">
            <h3 className="text-lg font-medium text-blue-900 mb-4">Connect External Blockchain</h3>
            
            <div className="mb-4">
              <Label htmlFor="connectDirection" className="block text-sm font-medium text-gray-700 mb-1">
                Connection Direction:
              </Label>
              <RadioGroup 
                defaultValue="positive" 
                onValueChange={(value) => setConnectDirection(value as "positive" | "negative")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="negative" id="connect-negative" />
                  <Label htmlFor="connect-negative" className="text-sm text-gray-700">Negative</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="positive" id="connect-positive" />
                  <Label htmlFor="connect-positive" className="text-sm text-gray-700">Positive</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="mb-4">
              <Label htmlFor="externalBlockchain" className="block text-sm font-medium text-gray-700 mb-1">
                External Blockchain (JSON Array of Blocks):
              </Label>
              <Textarea
                id="externalBlockchain"
                rows={5}
                className="font-mono text-xs"
                value={externalBlockchainJson}
                onChange={(e) => setExternalBlockchainJson(e.target.value)}
                placeholder='[{"index": 0, "timestamp": 1619000000000, "data": {"genesis": true}, "previousHash": "", "hash": "abc123", "nonce": 0}, ...]'
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste the JSON array of blocks from another blockchain. Must include a genesis block (index: 0).
              </p>
            </div>
            
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => handleConnectBlockchain()}
            >
              <Database className="mr-2 h-4 w-4" />
              Connect Blockchain
            </Button>
          </div>
          
          {/* Add New Block Panel */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Block</h3>

            <div className="mb-4">
              <Label htmlFor="blockDirection" className="block text-sm font-medium text-gray-700 mb-1">
                Direction:
              </Label>
              <RadioGroup 
                value={blockDirection} 
                onValueChange={(value) => setBlockDirection(value as "positive" | "negative")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="negative" id="negative" />
                  <Label htmlFor="negative" className="text-sm text-gray-700">Negative</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="positive" id="positive" />
                  <Label htmlFor="positive" className="text-sm text-gray-700">Positive</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="mb-4">
              <Label htmlFor="blockData" className="block text-sm font-medium text-gray-700 mb-1">
                Block Data (JSON):
              </Label>
              <Textarea
                id="blockData"
                rows={3}
                className="font-mono"
                value={blockData}
                onChange={(e) => setBlockData(e.target.value)}
                placeholder='{"transaction": "data", "amount": 1000}'
              />
            </div>

            <div className="mb-4">
              <Label htmlFor="miningDifficulty" className="block text-sm font-medium text-gray-700 mb-1">
                Mining Difficulty:
              </Label>
              <div className="flex items-center">
                <Slider
                  id="miningDifficulty"
                  min={1}
                  max={5}
                  step={1}
                  value={[miningDifficulty]}
                  onValueChange={(values) => setMiningDifficulty(values[0])}
                  className="w-full h-2"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">{miningDifficulty}</span>
              </div>
            </div>

            <Button
              className="w-full bg-gray-800 hover:bg-gray-700 text-white"
              onClick={handleMineBlock}
            >
              <Hammer className="mr-2 h-4 w-4" />
              Mine Block
            </Button>
          </div>

          {/* Blockchain Status Panel */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Blockchain Status</h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="bg-white p-4 rounded-md border border-gray-200">
                <div className="text-sm text-gray-500">Total Blocks</div>
                <div className="text-2xl font-semibold mt-1 flex items-center">
                  <Box className="text-gray-400 mr-2 h-5 w-5" />
                  <span>{blocksCount.total}</span>
                </div>
              </Card>

              <Card className="bg-white p-4 rounded-md border border-gray-200">
                <div className="text-sm text-gray-500">Blockchain Size</div>
                <div className="text-2xl font-semibold mt-1 flex items-center">
                  <Database className="text-gray-400 mr-2 h-5 w-5" />
                  <span>{blockchainSize} KB</span>
                </div>
              </Card>

              <Card className="bg-white p-4 rounded-md border border-gray-200">
                <div className="text-sm text-gray-500">Negative Blocks</div>
                <div className="text-2xl font-semibold mt-1 flex items-center text-negative">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  <span>{blocksCount.negative}</span>
                </div>
              </Card>

              <Card className="bg-white p-4 rounded-md border border-gray-200">
                <div className="text-sm text-gray-500">Positive Blocks</div>
                <div className="text-2xl font-semibold mt-1 flex items-center text-positive">
                  <ArrowRight className="mr-2 h-5 w-5" />
                  <span>{blocksCount.positive}</span>
                </div>
              </Card>
            </div>
            
            {/* Chain Balance Status */}
            {balanceStatus && (
              <Card className="bg-white p-4 rounded-md border border-gray-200 mb-4">
                <div className="flex items-center mb-2">
                  <Scale className={`mr-2 h-5 w-5 ${balanceStatus.isBalanced ? 'text-green-500' : 'text-orange-500'}`} />
                  <div className="text-sm font-medium">Chain Balance Status</div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="text-xs text-gray-500">Status:</div>
                  <div className={`text-xs font-medium ${balanceStatus.isBalanced ? 'text-green-500' : 'text-orange-500'}`}>
                    {balanceStatus.isBalanced ? 'Balanced' : 'Unbalanced'}
                  </div>
                  
                  <div className="text-xs text-gray-500">Time Difference:</div>
                  <div className="text-xs font-medium">
                    {Math.floor(balanceStatus.timeDifference / 1000)} seconds
                  </div>
                  
                  {balanceStatus.recommendedDirection && (
                    <>
                      <div className="text-xs text-gray-500">Recommended:</div>
                      <div className="text-xs font-medium text-blue-500">
                        Mine in {balanceStatus.recommendedDirection} direction
                      </div>
                    </>
                  )}
                </div>
                
                {/* Balance Visualization */}
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <div 
                    className="absolute top-0 left-1/2 h-full w-1 bg-gray-400 z-10"
                    style={{ transform: 'translateX(-50%)' }}
                  ></div>
                  <div 
                    className="absolute top-0 left-0 h-full bg-negative rounded-l-full"
                    style={{ 
                      width: `${(balanceStatus.negativeCount / (balanceStatus.positiveCount + balanceStatus.negativeCount)) * 50}%`,
                      right: '50%'
                    }}
                  ></div>
                  <div 
                    className="absolute top-0 right-0 h-full bg-positive rounded-r-full"
                    style={{ 
                      width: `${(balanceStatus.positiveCount / (balanceStatus.positiveCount + balanceStatus.negativeCount)) * 50}%`,
                      left: '50%'
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Negative: {balanceStatus.negativeCount}</span>
                  <span>Positive: {balanceStatus.positiveCount}</span>
                </div>
              </Card>
            )}

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Test Chain Integrity</h4>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={onTamperBlock}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Tamper Block
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={onResetChain}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Chain
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

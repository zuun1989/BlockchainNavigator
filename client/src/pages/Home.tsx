import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlockchainVisualization from "@/components/BlockchainVisualization";
import ControlPanel from "@/components/ControlPanel";
import { MiningModal } from "@/components/ui/mining-modal";
import { Notification } from "@/components/ui/notification";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Block, BlockchainState } from "@/lib/blockchain";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export default function Home() {
  const [isChainValid, setIsChainValid] = useState(true);
  const [isMining, setIsMining] = useState(false);
  const [miningProgress, setMiningProgress] = useState(0);
  const [currentHashAttempt, setCurrentHashAttempt] = useState("");
  const [notification, setNotification] = useState<{
    show: boolean;
    type: "success" | "error" | "warning";
    title: string;
    message: string;
  }>({
    show: false,
    type: "success",
    title: "",
    message: "",
  });

  // Query to fetch blockchain data
  const { data: blockchain, refetch } = useQuery<BlockchainState>({
    queryKey: ["/api/blockchain"],
  });

  // Mutation to add a new block
  const addBlockMutation = useMutation({
    mutationFn: async ({
      direction,
      data,
      difficulty,
    }: {
      direction: "positive" | "negative";
      data: any;
      difficulty: number;
    }) => {
      return apiRequest("POST", "/api/blockchain/mine", {
        direction,
        data,
        difficulty,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blockchain"] });
      showNotification(
        "success",
        "Block Mined!",
        "New block successfully added to the blockchain."
      );
    },
    onError: (error) => {
      showNotification(
        "error",
        "Mining Failed",
        `Failed to mine block: ${error.message}`
      );
    },
  });

  // Mutation to validate the chain
  const validateChainMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("GET", "/api/blockchain/validate");
    },
    onSuccess: async (response) => {
      const data = await response.json();
      setIsChainValid(data.valid);
      
      if (data.valid) {
        showNotification(
          "success",
          "Chain Valid",
          "The blockchain is intact and all blocks are valid."
        );
      } else {
        showNotification(
          "error",
          "Chain Invalid",
          "The blockchain integrity has been compromised."
        );
      }
    },
  });

  // Mutation to tamper with a block
  const tamperBlockMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/blockchain/tamper");
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blockchain"] });
      setIsChainValid(false);
      showNotification(
        "warning",
        "Block Tampered",
        "A block has been modified, breaking the chain integrity."
      );
    },
  });

  // Mutation to reset the chain
  const resetChainMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/blockchain/reset");
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blockchain"] });
      setIsChainValid(true);
      showNotification(
        "success",
        "Chain Reset",
        "The blockchain has been reset to a valid state."
      );
    },
  });

  const showNotification = (
    type: "success" | "error" | "warning",
    title: string,
    message: string
  ) => {
    setNotification({
      show: true,
      type,
      title,
      message,
    });

    // Hide notification after 5 seconds
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 5000);
  };

  const handleMineBlock = (
    direction: "positive" | "negative",
    data: any,
    difficulty: number
  ) => {
    setIsMining(true);
    setMiningProgress(0);

    // Simulate mining progress
    const interval = setInterval(() => {
      setMiningProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        
        // Generate random hash attempt for visual effect
        const randomHash = Array(64)
          .fill(0)
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join("");
        setCurrentHashAttempt(randomHash);
        
        return prev + 5;
      });
    }, 100);

    // Start the actual mining process when progress reaches 50%
    setTimeout(() => {
      addBlockMutation.mutate({ direction, data, difficulty });
      
      // When mining is done (or almost done)
      setTimeout(() => {
        clearInterval(interval);
        setIsMining(false);
        setMiningProgress(100);
      }, 2000);
    }, 1000);
  };

  const handleValidateChain = () => {
    validateChainMutation.mutate();
  };

  const handleTamperBlock = () => {
    if (!isChainValid) {
      showNotification(
        "warning",
        "Chain Already Invalid",
        "Please reset the chain first to demonstrate tampering."
      );
      return;
    }
    tamperBlockMutation.mutate();
  };

  const handleResetChain = () => {
    resetChainMutation.mutate();
  };

  // Initialize blockchain on first load
  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header isChainValid={isChainValid} onValidateChain={handleValidateChain} />
      
      <main className="flex-1 flex flex-col">
        <BlockchainVisualization blockchain={blockchain} />
        
        <ControlPanel 
          onMineBlock={handleMineBlock}
          onTamperBlock={handleTamperBlock}
          onResetChain={handleResetChain}
          blocksCount={{
            total: blockchain ? blockchain.blocks.length : 0,
            negative: blockchain ? blockchain.negativeCount : 0,
            positive: blockchain ? blockchain.positiveCount : 0,
          }}
          isChainValid={isChainValid}
        />
      </main>
      
      <Footer />
      
      <MiningModal 
        isOpen={isMining}
        progress={miningProgress}
        hashAttempt={currentHashAttempt}
      />
      
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}

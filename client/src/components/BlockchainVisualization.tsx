import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Block from "@/components/Block";
import { BlockchainState } from "@/lib/blockchain";
import { Button } from "@/components/ui/button";

interface BlockchainVisualizationProps {
  blockchain?: BlockchainState;
}

export default function BlockchainVisualization({ blockchain }: BlockchainVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [centeredOnLoad, setCenteredOnLoad] = useState(false);

  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  // Center on Genesis block on initial load
  useEffect(() => {
    if (blockchain && containerRef.current && !centeredOnLoad) {
      const genesisElement = document.querySelector('[data-block-index="0"]');
      if (genesisElement) {
        genesisElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
        setCenteredOnLoad(true);
      }
    }
  }, [blockchain, centeredOnLoad]);

  if (!blockchain) {
    return (
      <section className="py-6 flex-1 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-[300px]">
            <div className="animate-pulse">Loading blockchain...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 flex-1 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Blockchain Visualization</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
              <span className="text-sm">Genesis Block</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-positive mr-2"></div>
              <span className="text-sm">Positive Direction</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-negative mr-2"></div>
              <span className="text-sm">Negative Direction</span>
            </div>
          </div>
        </div>

        <div className="relative">
          {/* Blockchain Chain Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-300 transform -translate-y-1/2 z-0"></div>
          
          {/* Blockchain Blocks Container */}
          <div 
            ref={containerRef}
            className="relative flex items-center justify-center overflow-x-auto py-8 min-h-[300px]"
          >
            {/* Negative Blocks */}
            <div className="flex flex-row-reverse mr-4">
              {blockchain.blocks
                .filter(block => block.index < 0)
                .sort((a, b) => b.index - a.index) // Sort in descending order for negative blocks
                .map(block => (
                  <Block key={block.index} block={block} type="negative" />
                ))}
            </div>
            
            {/* Genesis Block */}
            {blockchain.blocks
              .filter(block => block.index === 0)
              .map(block => (
                <Block key={block.index} block={block} type="genesis" />
              ))}
            
            {/* Positive Blocks */}
            <div className="flex ml-4">
              {blockchain.blocks
                .filter(block => block.index > 0)
                .sort((a, b) => a.index - b.index) // Sort in ascending order for positive blocks
                .map(block => (
                  <Block key={block.index} block={block} type="positive" />
                ))}
            </div>
          </div>
          
          {/* Navigation Controls */}
          <Button 
            variant="outline"
            className="absolute top-1/2 left-4 transform -translate-y-1/2 z-30 rounded-full p-2 shadow-md hover:bg-gray-100"
            onClick={scrollLeft}
          >
            <ArrowLeft className="text-gray-700" />
          </Button>
          <Button 
            variant="outline"
            className="absolute top-1/2 right-4 transform -translate-y-1/2 z-30 rounded-full p-2 shadow-md hover:bg-gray-100"
            onClick={scrollRight}
          >
            <ArrowRight className="text-gray-700" />
          </Button>
        </div>
      </div>
    </section>
  );
}

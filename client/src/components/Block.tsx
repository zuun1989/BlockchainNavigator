import { Block as BlockType } from "@/lib/blockchain";

interface BlockProps {
  block: BlockType;
  type: "genesis" | "positive" | "negative";
}

export default function Block({ block, type }: BlockProps) {
  const getBlockStyles = () => {
    switch (type) {
      case "genesis":
        return {
          container: "block-card bg-white border-2 border-primary rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow w-[240px] z-20",
          header: "bg-primary/10 text-primary rounded-md px-2 py-1 text-xs font-semibold mb-2",
          title: "Genesis Block",
          prevHash: "text-gray-400"
        };
      case "positive":
        return {
          container: `block-card bg-white border ${block.tampered ? "border-2 border-orange-500" : "border-positive/30"} rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow w-[220px] mx-2 relative z-10`,
          header: "bg-positive/10 text-positive rounded-md px-2 py-1 text-xs font-semibold mb-2",
          title: `Block ${block.index}`,
          prevHash: "text-positive"
        };
      case "negative":
        return {
          container: `block-card bg-white border ${block.tampered ? "border-2 border-orange-500" : "border-negative/30"} rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow w-[220px] mx-2 relative z-10`,
          header: "bg-negative/10 text-negative rounded-md px-2 py-1 text-xs font-semibold mb-2",
          title: `Block ${block.index}`,
          prevHash: "text-negative"
        };
    }
  };

  const styles = getBlockStyles();

  return (
    <div className={styles.container} data-block-index={block.index}>
      <div className={styles.header}>{styles.title}</div>
      <div className="text-xs text-gray-500 mb-1">Timestamp:</div>
      <div className="text-sm font-mono mb-3">{new Date(block.timestamp).toLocaleString()}</div>
      <div className="text-xs text-gray-500 mb-1">Data:</div>
      <div className={`text-sm font-mono mb-3 truncate ${block.tampered ? "text-orange-500" : ""}`}>
        {JSON.stringify(block.data)}
      </div>
      <div className="text-xs text-gray-500 mb-1">Previous Hash:</div>
      <div className={`text-sm font-mono mb-3 truncate ${styles.prevHash}`}>
        {block.previousHash.substring(0, 12)}...
      </div>
      <div className="text-xs text-gray-500 mb-1">Hash:</div>
      <div className="text-sm font-mono truncate">
        {block.hash.substring(0, 12)}...
      </div>
    </div>
  );
}

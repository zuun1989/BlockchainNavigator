import { Block, BlockchainState } from "@shared/schema";
import crypto from "crypto";

// Interface for blockchain storage
export interface IStorage {
  getBlockchain(): Promise<BlockchainState> | BlockchainState;
  mineBlock(direction: "positive" | "negative", data: any, difficulty: number): Promise<Block> | Block;
  validateChain(): Promise<boolean> | boolean;
  tamperWithBlock(): Promise<Block> | Block;
  resetBlockchain(): Promise<void> | void;
  getBalanceStatus(): Promise<{
    isBalanced: boolean;
    recommendedDirection: "positive" | "negative" | null;
    positiveCount: number;
    negativeCount: number;
    timeDifference: number;
  }> | {
    isBalanced: boolean;
    recommendedDirection: "positive" | "negative" | null;
    positiveCount: number;
    negativeCount: number;
    timeDifference: number;
  };
  connectBlockchain(externalBlocks: Block[], direction: "positive" | "negative"): Promise<Block[]> | Block[];
}

export class MemStorage implements IStorage {
  private blocks: Block[];
  private isValid: boolean;
  private lastPositiveBlockTime: number;
  private lastNegativeBlockTime: number;
  private balanceThreshold: number = 3; // Maximum difference between positive and negative blocks
  
  connectBlockchain(externalBlocks: Block[], direction: "positive" | "negative"): Block[] {
    throw new Error("Connect blockchain not implemented for memory storage");
  }

  constructor() {
    this.blocks = [];
    this.isValid = true;
    this.lastPositiveBlockTime = Date.now();
    this.lastNegativeBlockTime = Date.now();
    this.initializeBlockchain();
  }

  private initializeBlockchain() {
    // Create genesis block
    const genesisBlock: Block = {
      id: 1, // Auto-increment ID for DB (not used in memory storage)
      index: 0,
      timestamp: Date.now(),
      data: { genesis: "block" },
      previousHash: "0000000000000000000000000000000000000000000000000000000000000000",
      hash: this.calculateHash(0, "0000000000000000000000000000000000000000000000000000000000000000", Date.now(), { genesis: "block" }, 0),
      nonce: 0,
      tampered: false
    };
    
    this.blocks.push(genesisBlock);
    
    // Add some initial blocks in both directions for demonstration
    // Positive direction blocks
    for (let i = 1; i <= 2; i++) {
      const prevBlock = this.getBlockByIndex(i - 1);
      if (prevBlock) {
        const timestamp = Date.now() + i * 1000; // Ensure different timestamps
        const block = this.generateNextBlock(
          i, 
          prevBlock.hash, 
          timestamp, 
          { transaction: `data${i}` },
          2 // Initial difficulty
        );
        this.blocks.push(block);
      }
    }
    
    // Negative direction blocks
    for (let i = 1; i <= 2; i++) {
      const prevBlock = this.getBlockByIndex(-i + 1);
      if (prevBlock) {
        const timestamp = Date.now() + i * 1000; // Ensure different timestamps
        const block = this.generateNextBlock(
          -i, 
          prevBlock.hash, 
          timestamp, 
          { transaction: `data-${i}` },
          2 // Initial difficulty
        );
        this.blocks.push(block);
      }
    }
  }

  private calculateHash(index: number, previousHash: string, timestamp: number, data: any, nonce: number): string {
    const blockString = JSON.stringify({
      index,
      previousHash,
      timestamp,
      data,
      nonce
    });
    return crypto.createHash("sha256").update(blockString).digest("hex");
  }

  private findBlock(index: number, previousHash: string, timestamp: number, data: any, difficulty: number): Block {
    let nonce = 0;
    while (true) {
      const hash = this.calculateHash(index, previousHash, timestamp, data, nonce);
      
      // Check if hash satisfies difficulty (starts with n zeroes)
      if (hash.substring(0, difficulty) === Array(difficulty + 1).join("0")) {
        return {
          id: this.blocks.length + 1, // Auto-increment ID for DB
          index,
          timestamp,
          data,
          previousHash,
          hash,
          nonce,
          tampered: false
        };
      }
      nonce++;
    }
  }

  private generateNextBlock(index: number, previousHash: string, timestamp: number, data: any, difficulty: number): Block {
    return this.findBlock(index, previousHash, timestamp, data, difficulty);
  }

  private getBlockByIndex(index: number): Block | undefined {
    return this.blocks.find(block => block.index === index);
  }

  private getLatestBlockInDirection(direction: "positive" | "negative"): Block {
    if (direction === "positive") {
      // Find the block with the highest positive index
      const positiveBlocks = this.blocks.filter(block => block.index >= 0);
      return positiveBlocks.reduce((max, block) => (block.index > max.index ? block : max), positiveBlocks[0]);
    } else {
      // Find the block with the lowest negative index
      const negativeBlocks = this.blocks.filter(block => block.index <= 0);
      return negativeBlocks.reduce((min, block) => (block.index < min.index ? block : min), negativeBlocks[0]);
    }
  }

  public getBlockchain(): BlockchainState {
    const negativeCount = this.blocks.filter(block => block.index < 0).length;
    const positiveCount = this.blocks.filter(block => block.index > 0).length;
    
    return {
      blocks: [...this.blocks].sort((a, b) => a.index - b.index),
      isValid: this.isValid,
      negativeCount,
      positiveCount
    };
  }

  public mineBlock(direction: "positive" | "negative", data: any, difficulty: number): Block {
    // Check balance status and recommend a direction if needed
    const balanceStatus = this.getBalanceStatus();
    
    // If the blockchain is unbalanced and user tries to mine in the wrong direction, suggest the recommended direction
    if (!balanceStatus.isBalanced && balanceStatus.recommendedDirection && direction !== balanceStatus.recommendedDirection) {
      // Allow mining in any direction, but add a note in the mined block's data
      data = {
        ...data,
        balanceWarning: `Chain is becoming unbalanced. Recommended to mine in ${balanceStatus.recommendedDirection} direction next.`
      };
    }
    
    const previousBlock = this.getLatestBlockInDirection(direction);
    if (!previousBlock) {
      throw new Error("Previous block not found");
    }

    const nextIndex = direction === "positive" 
      ? previousBlock.index + 1 
      : previousBlock.index - 1;
    
    const timestamp = Date.now();
    const newBlock = this.generateNextBlock(nextIndex, previousBlock.hash, timestamp, data, difficulty);
    
    if (this.isValidNewBlock(newBlock, previousBlock)) {
      this.blocks.push(newBlock);
      
      // Update the last block time for the respective direction
      if (direction === "positive") {
        this.lastPositiveBlockTime = timestamp;
      } else {
        this.lastNegativeBlockTime = timestamp;
      }
      
      return newBlock;
    } else {
      throw new Error("Invalid block");
    }
  }
  
  public getBalanceStatus(): {
    isBalanced: boolean;
    recommendedDirection: "positive" | "negative" | null;
    positiveCount: number;
    negativeCount: number;
    timeDifference: number;
  } {
    const positiveBlocks = this.blocks.filter(block => block.index > 0);
    const negativeBlocks = this.blocks.filter(block => block.index < 0);
    
    const positiveCount = positiveBlocks.length;
    const negativeCount = negativeBlocks.length;
    
    // Calculate the time difference between the latest blocks in each direction
    const timeDifference = Math.abs(this.lastPositiveBlockTime - this.lastNegativeBlockTime);
    
    // Check if the chain is balanced based on count difference and time
    const countDifference = Math.abs(positiveCount - negativeCount);
    const isBalanced = countDifference <= this.balanceThreshold;
    
    // Determine the recommended direction based on both count and time
    let recommendedDirection: "positive" | "negative" | null = null;
    
    if (!isBalanced) {
      // If one side has significantly more blocks, recommend mining in the other direction
      recommendedDirection = positiveCount > negativeCount ? "negative" : "positive";
    } else if (timeDifference > 1000 * 60 * 2) { // 2 minutes threshold
      // If timing is significantly different, recommend the direction that hasn't been mined recently
      recommendedDirection = this.lastPositiveBlockTime > this.lastNegativeBlockTime ? "negative" : "positive";
    }
    
    return {
      isBalanced,
      recommendedDirection,
      positiveCount,
      negativeCount,
      timeDifference
    };
  }

  public validateChain(): boolean {
    // Check genesis block
    const genesisBlock = this.getBlockByIndex(0);
    if (!genesisBlock) {
      this.isValid = false;
      return false;
    }

    // Validate all positive blocks
    let isValid = true;
    
    // Check blocks in positive direction
    let currentIndex = 1;
    let currentBlock = this.getBlockByIndex(currentIndex);
    let previousBlock = genesisBlock;
    
    while (currentBlock) {
      if (!this.isValidNewBlock(currentBlock, previousBlock)) {
        isValid = false;
        break;
      }
      
      previousBlock = currentBlock;
      currentIndex++;
      currentBlock = this.getBlockByIndex(currentIndex);
    }
    
    // Check blocks in negative direction
    currentIndex = -1;
    currentBlock = this.getBlockByIndex(currentIndex);
    previousBlock = genesisBlock;
    
    while (currentBlock && isValid) {
      if (!this.isValidNewBlock(currentBlock, previousBlock)) {
        isValid = false;
        break;
      }
      
      previousBlock = currentBlock;
      currentIndex--;
      currentBlock = this.getBlockByIndex(currentIndex);
    }
    
    this.isValid = isValid;
    return isValid;
  }

  public tamperWithBlock(): Block {
    // Pick a random block that is not the genesis block
    const nonGenesisBlocks = this.blocks.filter(block => block.index !== 0);
    if (nonGenesisBlocks.length === 0) {
      throw new Error("No blocks to tamper with");
    }
    
    const randomIndex = Math.floor(Math.random() * nonGenesisBlocks.length);
    const blockToTamper = nonGenesisBlocks[randomIndex];
    
    // Modify the data
    const originalBlock = { ...blockToTamper };
    const tamperedData = { tampered: true };
    
    // Find the block in our array and modify it
    const blockIndex = this.blocks.findIndex(b => b.index === blockToTamper.index);
    if (blockIndex !== -1) {
      this.blocks[blockIndex] = {
        ...this.blocks[blockIndex],
        data: tamperedData,
        tampered: true
      };
      
      // Chain is now invalid
      this.isValid = false;
      
      return this.blocks[blockIndex];
    }
    
    return originalBlock;
  }

  public resetBlockchain(): void {
    this.blocks = [];
    this.isValid = true;
    this.initializeBlockchain();
  }

  private isValidNewBlock(newBlock: Block, previousBlock: Block): boolean {
    // If previous block is the genesis block, check the index
    if (previousBlock.index === 0) {
      // Check if the new block has a valid index (either 1 or -1)
      if (newBlock.index !== 1 && newBlock.index !== -1) {
        return false;
      }
    } else {
      // For non-genesis blocks, check if the index is consecutive
      if (
        (previousBlock.index > 0 && newBlock.index !== previousBlock.index + 1) ||
        (previousBlock.index < 0 && newBlock.index !== previousBlock.index - 1)
      ) {
        return false;
      }
    }

    // Check if previous hash matches
    if (previousBlock.hash !== newBlock.previousHash) {
      return false;
    }

    // Verify the hash of the new block
    const calculatedHash = this.calculateHash(
      newBlock.index,
      newBlock.previousHash,
      newBlock.timestamp,
      newBlock.data,
      newBlock.nonce
    );

    if (calculatedHash !== newBlock.hash) {
      return false;
    }

    return true;
  }
}

export const storage = new MemStorage();

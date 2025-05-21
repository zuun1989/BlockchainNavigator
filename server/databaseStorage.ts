import { Block, BlockchainState, blocks } from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, desc, asc, lte, gte } from "drizzle-orm";
import crypto from "crypto";

export class DatabaseStorage implements IStorage {
  private isValid: boolean;
  private lastPositiveBlockTime: number;
  private lastNegativeBlockTime: number;
  private balanceThreshold: number = 3; // Maximum difference between positive and negative blocks

  constructor() {
    this.isValid = true;
    this.lastPositiveBlockTime = Date.now();
    this.lastNegativeBlockTime = Date.now();
    this.initializeBlockchain();
  }

  private async initializeBlockchain() {
    // Check if the genesis block exists
    const existingBlocks = await db.select().from(blocks);
    
    if (existingBlocks.length === 0) {
      // Create genesis block
      const genesisBlock: Omit<Block, "id"> = {
        index: 0,
        timestamp: Date.now(),
        data: { genesis: "block" },
        previousHash: "0000000000000000000000000000000000000000000000000000000000000000",
        hash: this.calculateHash(0, "0000000000000000000000000000000000000000000000000000000000000000", Date.now(), { genesis: "block" }, 0),
        nonce: 0,
        tampered: false
      };
      
      await db.insert(blocks).values({
        ...genesisBlock,
        timestamp: genesisBlock.timestamp.toString()
      });
      
      // Add some initial blocks in both directions for demonstration
      // Positive direction blocks
      for (let i = 1; i <= 2; i++) {
        const prevBlock = await this.getBlockByIndex(i - 1);
        if (prevBlock) {
          const timestamp = Date.now() + i * 1000; // Ensure different timestamps
          const block = this.generateNextBlock(
            i, 
            prevBlock.hash, 
            timestamp, 
            { transaction: `data${i}` },
            2 // Initial difficulty
          );
          await db.insert(blocks).values(block);
        }
      }
      
      // Negative direction blocks
      for (let i = 1; i <= 2; i++) {
        const prevBlock = await this.getBlockByIndex(-i + 1);
        if (prevBlock) {
          const timestamp = Date.now() + i * 1000; // Ensure different timestamps
          const block = this.generateNextBlock(
            -i, 
            prevBlock.hash, 
            timestamp, 
            { transaction: `data-${i}` },
            2 // Initial difficulty
          );
          await db.insert(blocks).values(block);
        }
      }
    } else {
      // Update timestamps from existing blocks
      const positiveBlocks = existingBlocks.filter(block => block.index > 0);
      const negativeBlocks = existingBlocks.filter(block => block.index < 0);
      
      if (positiveBlocks.length > 0) {
        // Find the latest positive block
        const latestPositive = positiveBlocks.reduce((latest, block) => 
          block.timestamp > latest.timestamp ? block : latest, positiveBlocks[0]);
        this.lastPositiveBlockTime = latestPositive.timestamp;
      }
      
      if (negativeBlocks.length > 0) {
        // Find the latest negative block
        const latestNegative = negativeBlocks.reduce((latest, block) => 
          block.timestamp > latest.timestamp ? block : latest, negativeBlocks[0]);
        this.lastNegativeBlockTime = latestNegative.timestamp;
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

  private findBlock(index: number, previousHash: string, timestamp: number, data: any, difficulty: number): Omit<Block, "id"> {
    let nonce = 0;
    while (true) {
      const hash = this.calculateHash(index, previousHash, timestamp, data, nonce);
      
      // Check if hash satisfies difficulty (starts with n zeroes)
      if (hash.substring(0, difficulty) === Array(difficulty + 1).join("0")) {
        return {
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

  private generateNextBlock(index: number, previousHash: string, timestamp: number, data: any, difficulty: number): Omit<Block, "id"> {
    return this.findBlock(index, previousHash, timestamp, data, difficulty);
  }

  private async getBlockByIndex(index: number): Promise<Block | undefined> {
    const [block] = await db.select().from(blocks).where(eq(blocks.index, index));
    return block;
  }

  private async getLatestBlockInDirection(direction: "positive" | "negative"): Promise<Block | undefined> {
    if (direction === "positive") {
      // Find the block with the highest positive index
      const [positiveBlock] = await db
        .select()
        .from(blocks)
        .where(gte(blocks.index, 0))
        .orderBy(desc(blocks.index))
        .limit(1);
      
      return positiveBlock;
    } else {
      // Find the block with the lowest negative index
      const [negativeBlock] = await db
        .select()
        .from(blocks)
        .where(lte(blocks.index, 0))
        .orderBy(asc(blocks.index))
        .limit(1);
      
      return negativeBlock;
    }
  }

  public async getBlockchain(): Promise<BlockchainState> {
    const allBlocks = await db.select().from(blocks).orderBy(asc(blocks.index));
    const negativeCount = allBlocks.filter(block => block.index < 0).length;
    const positiveCount = allBlocks.filter(block => block.index > 0).length;
    
    return {
      blocks: allBlocks,
      isValid: this.isValid,
      negativeCount,
      positiveCount
    };
  }

  public async mineBlock(direction: "positive" | "negative", data: any, difficulty: number): Promise<Block> {
    // Check balance status and recommend a direction if needed
    const balanceStatus = await this.getBalanceStatus();
    
    // If the blockchain is unbalanced and user tries to mine in the wrong direction, suggest the recommended direction
    if (!balanceStatus.isBalanced && balanceStatus.recommendedDirection && direction !== balanceStatus.recommendedDirection) {
      // Allow mining in any direction, but add a note in the mined block's data
      data = {
        ...data,
        balanceWarning: `Chain is becoming unbalanced. Recommended to mine in ${balanceStatus.recommendedDirection} direction next.`
      };
    }
    
    const previousBlock = await this.getLatestBlockInDirection(direction);
    if (!previousBlock) {
      throw new Error("Previous block not found");
    }

    const nextIndex = direction === "positive" 
      ? previousBlock.index + 1 
      : previousBlock.index - 1;
    
    const timestamp = Date.now();
    const newBlock = this.generateNextBlock(nextIndex, previousBlock.hash, timestamp, data, difficulty);
    
    if (await this.isValidNewBlock(newBlock, previousBlock)) {
      const [insertedBlock] = await db.insert(blocks).values(newBlock).returning();
      
      // Update the last block time for the respective direction
      if (direction === "positive") {
        this.lastPositiveBlockTime = timestamp;
      } else {
        this.lastNegativeBlockTime = timestamp;
      }
      
      return insertedBlock;
    } else {
      throw new Error("Invalid block");
    }
  }
  
  public async getBalanceStatus(): Promise<{
    isBalanced: boolean;
    recommendedDirection: "positive" | "negative" | null;
    positiveCount: number;
    negativeCount: number;
    timeDifference: number;
  }> {
    const allBlocks = await db.select().from(blocks);
    const positiveBlocks = allBlocks.filter(block => block.index > 0);
    const negativeBlocks = allBlocks.filter(block => block.index < 0);
    
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

  public async validateChain(): Promise<boolean> {
    const allBlocks = await db.select().from(blocks).orderBy(asc(blocks.index));
    
    // Check genesis block
    const genesisBlock = allBlocks.find(block => block.index === 0);
    if (!genesisBlock) {
      this.isValid = false;
      return false;
    }

    // Validate all blocks
    let isValid = true;
    
    // Check blocks in positive direction
    let currentIndex = 1;
    let currentBlock = allBlocks.find(block => block.index === currentIndex);
    let previousBlock = genesisBlock;
    
    while (currentBlock) {
      if (!await this.isValidNewBlock(currentBlock, previousBlock)) {
        isValid = false;
        break;
      }
      
      previousBlock = currentBlock;
      currentIndex++;
      currentBlock = allBlocks.find(block => block.index === currentIndex);
    }
    
    // Check blocks in negative direction
    currentIndex = -1;
    currentBlock = allBlocks.find(block => block.index === currentIndex);
    previousBlock = genesisBlock;
    
    while (currentBlock && isValid) {
      if (!await this.isValidNewBlock(currentBlock, previousBlock)) {
        isValid = false;
        break;
      }
      
      previousBlock = currentBlock;
      currentIndex--;
      currentBlock = allBlocks.find(block => block.index === currentIndex);
    }
    
    this.isValid = isValid;
    return isValid;
  }

  public async tamperWithBlock(): Promise<Block> {
    // Pick a random block that is not the genesis block
    const allBlocks = await db.select().from(blocks);
    const nonGenesisBlocks = allBlocks.filter(block => block.index !== 0);
    
    if (nonGenesisBlocks.length === 0) {
      throw new Error("No blocks to tamper with");
    }
    
    const randomIndex = Math.floor(Math.random() * nonGenesisBlocks.length);
    const blockToTamper = nonGenesisBlocks[randomIndex];
    
    // Modify the data
    const tamperedData = { tampered: true };
    
    // Update the block in the database
    const [updatedBlock] = await db
      .update(blocks)
      .set({ 
        data: tamperedData,
        tampered: true
      })
      .where(eq(blocks.id, blockToTamper.id))
      .returning();
    
    // Chain is now invalid
    this.isValid = false;
    
    return updatedBlock;
  }

  public async resetBlockchain(): Promise<void> {
    // Delete all blocks
    await db.delete(blocks);
    
    // Reset state
    this.isValid = true;
    this.lastPositiveBlockTime = Date.now();
    this.lastNegativeBlockTime = Date.now();
    
    // Reinitialize
    await this.initializeBlockchain();
  }

  async connectBlockchain(externalBlocks: Block[], direction: "positive" | "negative"): Promise<Block[]> {
    // Make sure we have some blocks to connect
    if (!externalBlocks || externalBlocks.length === 0) {
      throw new Error("No external blocks provided for connection");
    }

    // Find the external genesis block (index 0)
    const externalGenesis = externalBlocks.find(block => block.index === 0);
    if (!externalGenesis) {
      throw new Error("External blockchain must contain a genesis block (index 0)");
    }
    
    // Find our genesis block
    const ourGenesis = await this.getBlockByIndex(0);
    if (!ourGenesis) {
      throw new Error("Our blockchain is missing a genesis block");
    }
    
    // Get our latest block in the specified direction
    const latestBlock = await this.getLatestBlockInDirection(direction);
    if (!latestBlock) {
      throw new Error("Cannot find latest block in specified direction");
    }
    
    // Create a connection block that links our chain to the external chain
    const connectionData = {
      connection: true,
      sourceGenesisHash: ourGenesis.hash,
      targetGenesisHash: externalGenesis.hash,
      connectionTimestamp: Date.now()
    };
    
    // Calculate the next index based on the direction
    const nextIndex = direction === "positive" 
      ? latestBlock.index + 1 
      : latestBlock.index - 1;
    
    const timestamp = Date.now();
    
    // Create a special connection block
    const connectionBlock = this.generateNextBlock(
      nextIndex,
      latestBlock.hash,
      timestamp,
      connectionData,
      3 // Higher difficulty for connection blocks
    );
    
    // Insert the connection block into our database
    const [insertedConnectionBlock] = await db.insert(blocks).values({
      ...connectionBlock,
      timestamp: connectionBlock.timestamp.toString()
    }).returning();
    
    // Now, begin adding all external blocks, but adjust their indices
    // based on our connection point and direction
    const insertedBlocks = [insertedConnectionBlock];
    const indexOffset = nextIndex - 0; // Calculate the offset from external genesis (0) to our connection point
    
    // Get all external blocks except their genesis block (we create our own connection instead)
    const externalNonGenesisBlocks = externalBlocks.filter(block => block.index !== 0);
    
    // Sort the blocks by index to ensure they're connected in the right order
    const sortedExternalBlocks = direction === "positive"
      ? externalNonGenesisBlocks.sort((a, b) => a.index - b.index)
      : externalNonGenesisBlocks.sort((a, b) => b.index - a.index);
    
    // Connect each external block, adjusting its index and previous hash
    let previousHash = insertedConnectionBlock.hash;
    
    for (const externalBlock of sortedExternalBlocks) {
      // Calculate the new index based on direction and offset
      let newIndex;
      
      if (direction === "positive") {
        newIndex = indexOffset + externalBlock.index;
      } else {
        newIndex = indexOffset - externalBlock.index;
      }
      
      // Create a new block with adjusted parameters
      const adjustedBlock = {
        index: newIndex,
        timestamp: Date.now().toString(),
        data: {
          originalData: externalBlock.data,
          originalIndex: externalBlock.index,
          originalHash: externalBlock.hash,
          connectionSourceId: insertedConnectionBlock.id
        },
        previousHash: previousHash,
        hash: this.calculateHash(
          newIndex,
          previousHash,
          Date.now(),
          externalBlock.data,
          externalBlock.nonce
        ),
        nonce: externalBlock.nonce,
        tampered: false
      };
      
      // Insert the adjusted block
      const [insertedBlock] = await db.insert(blocks).values(adjustedBlock).returning();
      insertedBlocks.push(insertedBlock);
      
      // Update previousHash for next iteration
      previousHash = insertedBlock.hash;
    }
    
    return insertedBlocks;
  }

  private async isValidNewBlock(newBlock: Omit<Block, "id">, previousBlock: Block): Promise<boolean> {
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
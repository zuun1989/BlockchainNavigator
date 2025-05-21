import type { Express } from "express";
import { createServer, type Server } from "http";
import { DatabaseStorage } from "./databaseStorage";

// Initialize database storage
const storage = new DatabaseStorage();

export async function registerRoutes(app: Express): Promise<Server> {
  // Get the entire blockchain
  app.get("/api/blockchain", async (req, res) => {
    try {
      const blockchain = await storage.getBlockchain();
      res.json(blockchain);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get blockchain balance status
  app.get("/api/blockchain/balance", async (req, res) => {
    try {
      const balanceStatus = await storage.getBalanceStatus();
      res.json(balanceStatus);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Mine a new block
  app.post("/api/blockchain/mine", async (req, res) => {
    const { direction, data, difficulty } = req.body;
    
    if (!direction || !data || !difficulty) {
      return res.status(400).json({ message: "Missing required parameters" });
    }
    
    try {
      // Get balance status before mining
      const balanceStatus = await storage.getBalanceStatus();
      
      const newBlock = await storage.mineBlock(direction, data, difficulty);
      
      // Add balance recommendation if applicable
      const response: any = { 
        message: "Block mined successfully", 
        block: newBlock 
      };
      
      if (!balanceStatus.isBalanced) {
        response.balanceWarning = `Chain balance is at risk. Recommended to mine in ${balanceStatus.recommendedDirection} direction next.`;
        response.balanceStatus = balanceStatus;
      }
      
      res.json(response);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Validate the blockchain
  app.get("/api/blockchain/validate", async (req, res) => {
    try {
      const isValid = await storage.validateChain();
      res.json({ valid: isValid });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Tamper with a random block
  app.post("/api/blockchain/tamper", async (req, res) => {
    try {
      const tamperedBlock = await storage.tamperWithBlock();
      res.json({ message: "Block tampered", block: tamperedBlock });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Reset the blockchain to its initial state
  app.post("/api/blockchain/reset", async (req, res) => {
    try {
      await storage.resetBlockchain();
      res.json({ message: "Blockchain reset successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Connect with another blockchain
  app.post("/api/blockchain/connect", async (req, res) => {
    try {
      const { externalBlocks, direction } = req.body;
      
      if (!externalBlocks || !Array.isArray(externalBlocks) || !direction) {
        return res.status(400).json({ 
          message: "Invalid request. Please provide externalBlocks array and direction ('positive' or 'negative')" 
        });
      }
      
      const connectedBlocks = await storage.connectBlockchain(externalBlocks, direction);
      res.json({
        message: "Blockchains connected successfully",
        connectedBlocksCount: connectedBlocks.length,
        connectionBlock: connectedBlocks[0]
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

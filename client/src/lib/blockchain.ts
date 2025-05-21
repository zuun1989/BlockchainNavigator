export interface Block {
  index: number;
  timestamp: number;
  data: any;
  previousHash: string;
  hash: string;
  nonce: number;
  tampered?: boolean;
}

export interface BlockchainState {
  blocks: Block[];
  isValid: boolean;
  negativeCount: number;
  positiveCount: number;
}

// Helper functions for client-side blockchain operations
export const calculateHash = (block: Omit<Block, 'hash'>): string => {
  const blockString = JSON.stringify(block);
  // This is a mock implementation since we can't import crypto-js
  // In a real implementation, we would use SHA-256
  let hash = '';
  for (let i = 0; i < blockString.length; i++) {
    hash += blockString.charCodeAt(i).toString(16);
  }
  return hash;
};

export const isValidBlockStructure = (block: Block): boolean => {
  return (
    typeof block.index === 'number' &&
    typeof block.timestamp === 'number' &&
    typeof block.previousHash === 'string' &&
    typeof block.hash === 'string' &&
    typeof block.nonce === 'number'
  );
};

export const isValidNewBlock = (newBlock: Block, previousBlock: Block): boolean => {
  if (!isValidBlockStructure(newBlock)) {
    console.log('Invalid block structure');
    return false;
  }

  // If previous block is the genesis block, check the index
  if (previousBlock.index === 0) {
    // Check if the new block has a valid index (either 1 or -1)
    if (newBlock.index !== 1 && newBlock.index !== -1) {
      console.log('Invalid block index for next block after genesis');
      return false;
    }
  } else {
    // For non-genesis blocks, check if the index is consecutive
    if (
      (previousBlock.index > 0 && newBlock.index !== previousBlock.index + 1) ||
      (previousBlock.index < 0 && newBlock.index !== previousBlock.index - 1)
    ) {
      console.log('Invalid block index');
      return false;
    }
  }

  // Check if previous hash matches
  if (previousBlock.hash !== newBlock.previousHash) {
    console.log('Invalid previous hash');
    return false;
  }

  // Verify the hash of the new block
  const calculatedHash = calculateHash({
    index: newBlock.index,
    timestamp: newBlock.timestamp,
    data: newBlock.data,
    previousHash: newBlock.previousHash,
    nonce: newBlock.nonce,
  });

  if (calculatedHash !== newBlock.hash) {
    console.log('Invalid hash');
    return false;
  }

  return true;
};

export const findBlock = (
  index: number,
  previousHash: string,
  timestamp: number,
  data: any,
  difficulty: number
): Block => {
  let nonce = 0;
  while (true) {
    const hash = calculateHash({
      index,
      timestamp,
      data,
      previousHash,
      nonce,
    });

    // Check if hash satisfies difficulty (starts with n zeroes)
    if (hash.substring(0, difficulty) === Array(difficulty + 1).join('0')) {
      return {
        index,
        timestamp,
        data,
        previousHash,
        hash,
        nonce,
      };
    }
    nonce++;
  }
};

import { pgTable, text, serial, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Block schema
export const blocks = pgTable("blocks", {
  id: serial("id").primaryKey(),
  index: integer("index").notNull(), // Can be negative or positive
  timestamp: text("timestamp").notNull(), // Store as text to avoid integer range issues
  data: jsonb("data").notNull(),
  previousHash: text("previous_hash").notNull(),
  hash: text("hash").notNull(),
  nonce: integer("nonce").notNull(),
  tampered: boolean("tampered").notNull().default(false),
});

export const insertBlockSchema = createInsertSchema(blocks).omit({ id: true });
export type InsertBlock = z.infer<typeof insertBlockSchema>;
export type Block = typeof blocks.$inferSelect;

// For blockchain state (needed for APIs)
export const blockchainState = z.object({
  blocks: z.array(z.object({
    index: z.number(),
    timestamp: z.string(),
    data: z.any(),
    previousHash: z.string(),
    hash: z.string(),
    nonce: z.number(),
    tampered: z.boolean().optional(),
  })),
  isValid: z.boolean(),
  negativeCount: z.number(),
  positiveCount: z.number(),
});

export type BlockchainState = z.infer<typeof blockchainState>;

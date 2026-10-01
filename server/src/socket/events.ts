import { z } from "zod";

export const createRoomSchema = z.object({
  username: z.string().trim().min(1).max(20),
  avatarUrl: z.string().optional(),
});

export const joinRoomSchema = z.object({
  roomCode: z.string().trim().min(4).max(8),
  username: z.string().trim().min(1).max(20),
  avatarUrl: z.string().optional(),
});

export const submitStepSchema = z.object({
  bookId: z.string().min(1),
  type: z.enum(["TEXT", "AUDIO"]),
  content: z.string(),
  mimeType: z.string().min(1).max(80).optional(),
});

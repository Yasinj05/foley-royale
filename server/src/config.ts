import "dotenv/config";

const clientOriginEnv = process.env.CLIENT_ORIGIN ?? "*";

export const config = {
  port: Number(process.env.PORT ?? 3001),
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/foley-royale",
  /** Gameplay is in-memory; Mongo is opt-in for future telemetry/suggestions. */
  enableMongo: process.env.ENABLE_MONGO === "true",
  /** Use "*" to allow tunnel / LAN shares (reflects request Origin). */
  clientOrigin: clientOriginEnv === "*" ? true : clientOriginEnv,
  maxAudioBytes: 100 * 1024,
  maxPayloadBytes: 200 * 1024,
  initialPromptSeconds: 35,
  audioStepSeconds: 20,
  textStepSeconds: 20,
  audioRecordMaxMs: 20000,
  inactiveRoomMs: 15 * 60 * 1000,
} as const;

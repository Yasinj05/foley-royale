export type GameState =
  | "LOBBY"
  | "INITIAL_PROMPT"
  | "AUDIO_STEP"
  | "TEXT_STEP"
  | "SHOWCASE"
  | "GAME_OVER";

export type StepType = "TEXT" | "AUDIO";

export interface Player {
  id: string;
  username: string;
  avatarUrl: string;
  isHost: boolean;
  connected: boolean;
  hasSubmitted: boolean;
}

export interface ChainStep {
  stepIndex: number;
  type: StepType;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  mimeType?: string;
  isPlaceholder?: boolean;
}

export interface Book {
  id: string;
  creatorId: string;
  creatorName: string;
  steps: ChainStep[];
}

export interface RoomState {
  code: string;
  hostId: string;
  state: GameState;
  players: Player[];
  currentStepIndex: number;
  totalSteps: number;
  timeLeft: number;
  timerMax: number;
  submittedCount: number;
  playerCount: number;
  showcase: { bookIndex: number; stepIndex: number };
  books: Array<{
    id: string;
    creatorId: string;
    creatorName: string;
    stepCount: number;
  }>;
}

export interface TurnPayload {
  bookId: string;
  stepIndex: number;
  type: StepType;
  previousStep: ChainStep | null;
  recordMaxMs: number;
}

export interface ShowcasePayload {
  bookIndex: number;
  stepIndex: number;
  totalBooks: number;
  book: Book | null;
  step: ChainStep | null;
}

export type AckResponse<T = unknown> =
  | ({ ok: true; room?: RoomState } & T)
  | { ok: false; error: string };

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

export interface ShowcaseCursor {
  bookIndex: number;
  stepIndex: number;
}

export interface Room {
  code: string;
  hostId: string;
  state: GameState;
  players: Map<string, Player>;
  playerOrder: string[];
  books: Book[];
  currentStepIndex: number;
  /** Steps per book this game (N players → N, except 2 players → 3). */
  totalSteps: number;
  /** playerId -> bookId for the active step */
  playerBookMap: Map<string, string>;
  /** players who have submitted for the current step */
  playerSubmissions: Set<string>;
  timer: ReturnType<typeof setInterval> | null;
  timeLeft: number;
  timerMax: number;
  phaseEndsAt: number | null;
  lastActivityAt: number;
  showcase: ShowcaseCursor;
}

export interface SanitizedPlayer {
  id: string;
  username: string;
  avatarUrl: string;
  isHost: boolean;
  connected: boolean;
  hasSubmitted: boolean;
}

export interface SanitizedRoomState {
  code: string;
  hostId: string;
  state: GameState;
  players: SanitizedPlayer[];
  currentStepIndex: number;
  totalSteps: number;
  timeLeft: number;
  timerMax: number;
  submittedCount: number;
  playerCount: number;
  showcase: ShowcaseCursor;
  /** Book metadata only during play; full steps during SHOWCASE */
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

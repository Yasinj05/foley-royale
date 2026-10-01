import { useGameSocket } from "./hooks/useGameSocket";
import { AudioTurnView } from "./views/AudioTurnView";
import { GameOverView } from "./views/GameOverView";
import { GuessTurnView } from "./views/GuessTurnView";
import { HomeView } from "./views/HomeView";
import { LobbyView } from "./views/LobbyView";
import { PromptInputView } from "./views/PromptInputView";
import { ShowcaseView } from "./views/ShowcaseView";

export default function App() {
  const game = useGameSocket();
  const { room, selfId, turn, showcase, gameOverBooks } = game;

  if (gameOverBooks || room?.state === "GAME_OVER") {
    return <GameOverView books={gameOverBooks} onHome={game.resetToHome} />;
  }

  if (!room) {
    return (
      <HomeView
        connected={game.connected}
        error={game.error}
        onCreate={game.createRoom}
        onJoin={game.joinRoom}
      />
    );
  }

  if (room.state === "LOBBY") {
    return (
      <LobbyView
        room={room}
        selfId={selfId}
        error={game.error}
        onStart={game.startGame}
      />
    );
  }

  if (room.state === "SHOWCASE") {
    return (
      <ShowcaseView
        room={room}
        selfId={selfId}
        showcase={showcase}
        error={game.error}
        onNext={game.showcaseNext}
      />
    );
  }

  if (!turn) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Waiting for your turn packet…
      </div>
    );
  }

  if (room.state === "INITIAL_PROMPT") {
    return (
      <PromptInputView
        key={`${turn.bookId}-${turn.stepIndex}`}
        room={room}
        selfId={selfId}
        turn={turn}
        error={game.error}
        onSubmit={async (text) =>
          game.submitStep({
            bookId: turn.bookId,
            type: "TEXT",
            content: text,
          })
        }
      />
    );
  }

  if (room.state === "AUDIO_STEP") {
    return (
      <AudioTurnView
        key={`${turn.bookId}-${turn.stepIndex}`}
        room={room}
        selfId={selfId}
        turn={turn}
        error={game.error}
        onSubmit={async (audioData, mimeType) =>
          game.submitStep({
            bookId: turn.bookId,
            type: "AUDIO",
            content: audioData,
            mimeType,
          })
        }
      />
    );
  }

  if (room.state === "TEXT_STEP") {
    return (
      <GuessTurnView
        key={`${turn.bookId}-${turn.stepIndex}`}
        room={room}
        selfId={selfId}
        turn={turn}
        error={game.error}
        onSubmit={async (text) =>
          game.submitStep({
            bookId: turn.bookId,
            type: "TEXT",
            content: text,
          })
        }
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center text-muted">
      Loading studio…
    </div>
  );
}

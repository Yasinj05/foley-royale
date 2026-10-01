import type { Player } from "../lib/types";

interface PlayerListProps {
  players: Player[];
  selfId?: string | null;
  waitingLabel?: string;
}

function statusLabel(player: Player, waitingLabel: string): string {
  if (!player.connected) return "Away";
  if (player.hasSubmitted) return "Done";
  return waitingLabel;
}

export function PlayerList({
  players,
  selfId,
  waitingLabel = "Not yet",
}: PlayerListProps) {
  return (
    <ul className="space-y-2">
      {players.map((player) => {
        const isSelf = player.id === selfId;
        const done = player.connected && player.hasSubmitted;
        return (
          <li
            key={player.id}
            className="flex items-center gap-3 rounded-2xl bg-studio/80 px-3 py-3"
          >
            <img
              src={player.avatarUrl}
              alt=""
              className="h-11 w-11 rounded-full bg-panel"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-base font-extrabold">
                  {player.username}
                </span>
                {isSelf ? (
                  <span className="rounded-full bg-wave/20 px-2 py-0.5 text-xs font-bold text-wave">
                    You
                  </span>
                ) : null}
                {player.isHost ? (
                  <span className="rounded-full bg-amber/20 px-2 py-0.5 text-xs font-bold text-amber">
                    Host
                  </span>
                ) : null}
              </div>
              <p className={`mt-0.5 text-sm font-semibold ${done ? "text-wave" : "text-muted"}`}>
                {statusLabel(player, waitingLabel)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

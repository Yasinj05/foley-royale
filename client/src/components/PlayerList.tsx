import type { Player } from "../lib/types";

interface PlayerListProps {
  players: Player[];
  selfId?: string | null;
}

export function PlayerList({ players, selfId }: PlayerListProps) {
  return (
    <ul className="space-y-2">
      {players.map((player) => {
        const isSelf = player.id === selfId;
        return (
          <li
            key={player.id}
            className="flex items-center gap-3 rounded-xl bg-panel/80 px-3 py-2"
          >
            <img
              src={player.avatarUrl}
              alt=""
              className="h-9 w-9 rounded-full bg-studio"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">
                {player.username}
                {isSelf ? <span className="text-muted"> (you)</span> : null}
                {player.isHost ? (
                  <span className="ml-2 text-[10px] uppercase tracking-wider text-amber">
                    host
                  </span>
                ) : null}
              </div>
              <div className="font-mono text-xs text-muted">
                {!player.connected
                  ? "offline"
                  : player.hasSubmitted
                    ? "submitted ✓"
                    : "waiting…"}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

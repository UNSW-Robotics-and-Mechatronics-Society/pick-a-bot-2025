// components/TopThree.tsx
type LeaderboardEntry = {
  name: string;
  tokens: number;
  rank: number;
};

type TopThreeProps = {
  entries: LeaderboardEntry[];
};

export default function TopThree({ entries }: TopThreeProps) {
  const topThree = entries.filter((e) => e.rank <= 3);

  const medalMap: Record<number, string> = {
    1: "🥇",
    2: "🥈",
    3: "🥉",
  };

  return (
    <div className="flex justify-center gap-4 mb-6">
      {topThree.map((entry) => (
        <div
          key={entry.name}
          className={`flex flex-col items-center p-3 rounded-xl shadow-md ${
            entry.rank === 1 ? "bg-yellow-400 text-black" : "bg-zinc-800 text-white"
          } w-24`}
        >
          <span className="text-2xl">{medalMap[entry.rank]}</span>
          <span className="text-sm text-center font-semibold truncate">
            {entry.name}
          </span>
          <span className="text-xs">{entry.tokens} 🪙</span>
        </div>
      ))}
    </div>
  );
}

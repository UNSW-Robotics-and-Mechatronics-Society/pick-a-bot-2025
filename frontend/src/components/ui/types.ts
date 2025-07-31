export type LeaderboardEntry = {
  name: string;
  points: number;
  rank: number;
};

export type LeaderboardData = {
  top: LeaderboardEntry[];
  self: LeaderboardEntry;
};

export type LeaderboardProps = {
  data: LeaderboardData;
  isLoading?: boolean;
  error?: string | null;
};

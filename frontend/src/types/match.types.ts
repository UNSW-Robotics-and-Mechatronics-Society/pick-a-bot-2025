export interface PreviousMatchResult {
  matchId: string | null; // Match ID of the previous match, null if not available
  winner: string | null;
  tokenUsed: number; // Number of tokens used in the match
  tokenDelta: number; // Change in tokens from the previous match
  newTokenBalance: number; // New token balance after the match
  botChosen: string | null;
}

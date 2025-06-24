interface ParsedMatch {
	challonge_match_id: number;
	bot1: string;
	bot2: string;
	winner: string;
	score_bot1: number | null;
	score_bot2: number | null;
	round: number;
	state: string;
	start_time: string | null;
	ordering: number;
	tournament_id: string;
}

export function parseChallongeMatches(tournamentId: string, matches: any[], participants: any[]): ParsedMatch[] {
	const getParticipantName = (id: string | null): string => {
		if (!id) {
			return 'unknown';
		}
		const p = participants.find((p) => String(p.id) === id);

		if (!p) {
			console.log(`Participant with ID ${id} not found`);
			return `unknown(${id})`;
		}
		return p.attributes?.name || `unknown(${id})`;
	};

	const parsedMatches = matches
		.map((match) => {
			const { id, attributes, relationships } = match;

			const player1Id = relationships.player1?.data.id;
			const player2Id = relationships.player2?.data.id;
			const winnerId = attributes.winners?.toString() || '';

			const lastScoreIndex = attributes.scoreInSets ? attributes.scoreInSets.length - 1 : -1;
			const [score1, score2] = lastScoreIndex >= 0 ? attributes.scoreInSets[lastScoreIndex] : [null, null];

			const parsedMatch: ParsedMatch = {
				challonge_match_id: Number(id),
				bot1: getParticipantName(player1Id),
				bot2: getParticipantName(player2Id),
				winner: getParticipantName(winnerId),
				score_bot1: score1 ?? null,
				score_bot2: score2 ?? null,
				round: attributes.round,
				state: attributes.state,
				start_time: attributes.timestamps?.startedAt || null,
				ordering: attributes.suggestedPlayOrder,
				tournament_id: tournamentId,
			};
			return parsedMatch;
		})
		.sort((a, b) => a.ordering - b.ordering);
	return parsedMatches;
}

export const getChallongeMatches = async (env: Env, tournamentId: string) => {
	const response = await fetch(`https://api.challonge.com/v2/tournaments/${tournamentId}/matches.json`, {
		headers: {
			Authorization: env.CHALLONGE_API_KEY,
			'Content-Type': 'application/vnd.api+json',
			Accept: 'application/json',
			'Authorization-Type': 'v1',
		},
	});
	if (!response.ok) {
		console.error(`Failed to fetch matches: ${response.statusText}`);
		throw new Error(`Failed to fetch matches: ${response.statusText}`);
	}

	const data = (await response.json()) as { data: any[]; included: any[]; meta: any; links: any[] };
	const matches = data.data;
	const participants = data.included;

	const parsed = parseChallongeMatches(tournamentId, matches, participants);
	return parsed;
};

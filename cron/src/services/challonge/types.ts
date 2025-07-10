export interface ParsedMatch {
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

export interface ChallongeParticipant {
	id: string;
	attributes: {
		name: string;
	};
}

export interface ChallongeMatch {
	id: string;
	attributes: {
		round: number;
		state: string;
		suggestedPlayOrder: number;
		scoreInSets?: number[][];
		winners?: string | number;
		timestamps?: {
			startedAt?: string;
		};
	};
	relationships: {
		player1?: {
			data?: {
				id?: string;
			};
		};
		player2?: {
			data?: {
				id?: string;
			};
		};
	};
}

export interface ChallongeApiResponse {
	data: ChallongeMatch[];
	included: ChallongeParticipant[];
	meta?: any;
	links?: {
		self?: string;
		next?: string;
		prev?: string;
	};
}

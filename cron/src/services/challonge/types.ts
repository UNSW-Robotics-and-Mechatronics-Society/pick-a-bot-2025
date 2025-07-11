export interface ParsedMatch {
	challonge_match_id: number;
	bot1: string;
	bot2: string;
	winner: string;
	score_bot1: number | null;
	score_bot2: number | null;
	round: number;
	state: 'pending' | 'open' | 'complete';
	underway_time: string | null;
	ordering: number;
	tournament_id: string;
	is_final: boolean;
}

export type ParsedCurrentMatch = {
	match_id: string;
	bot1: string;
	bot2: string;
	winner: string | null;
	score_bot1: number | null;
	score_bot2: number | null;
	round: number;
	state: 'pending' | 'open' | 'complete';
	underway_time: string | null;
	ordering: number;
	tournament_id: string;
	updated_time: string | null;
	is_final: boolean;
};

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
		timestamps: {
			startedAt: string;
			createdAt: string;
			updatedAt: string;
			underwayAt: string | null;
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

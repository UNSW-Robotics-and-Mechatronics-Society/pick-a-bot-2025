import { ValidationError } from '@/exceptions';
import { matchSchema, participantSchema } from '@/schemas/challonge';
import { ChallongeMatch, ChallongeParticipant, ParsedMatch } from './types';

export class ChallongeMatchParser {
	private participants: Map<string, string>;

	constructor(participants: ChallongeParticipant[]) {
		this.participants = this.createParticipantMap(participants);
	}

	private createParticipantMap(participants: ChallongeParticipant[]): Map<string, string> {
		const map = new Map<string, string>();

		for (const participant of participants) {
			try {
				participantSchema.validateSync(participant);
				map.set(participant.id, participant.attributes.name);
			} catch (error) {
				console.warn(`Invalid participant data:`, participant);
			}
		}

		return map;
	}

	private getParticipantName(id: string | null | undefined): string {
		if (!id) return 'unknown';

		const name = this.participants.get(id);
		if (!name) {
			console.warn(`Participant with ID ${id} not found`);
			return `unknown(${id})`;
		}

		return name;
	}

	private extractScores(scoreInSets?: number[][]): [number | null, number | null] {
		if (!scoreInSets || scoreInSets.length === 0) {
			return [null, null];
		}

		const lastScore = scoreInSets[scoreInSets.length - 1];
		return [lastScore[0] ?? null, lastScore[1] ?? null];
	}

	private isFinalMatch(numMatches: number, currentMatchOrder: number): boolean {
		if (numMatches < 2) return false; // Not enough matches to determine final
		return currentMatchOrder === numMatches;
	}

	public parseMatch(match: ChallongeMatch, numMatches: number, tournamentId: string): ParsedMatch {
		try {
			matchSchema.validateSync(match);
		} catch (error) {
			throw new ValidationError(`Invalid match data: ${error}`);
		}

		const { id, attributes, relationships } = match;
		const player1Id = relationships.player1?.data?.id;
		const player2Id = relationships.player2?.data?.id;
		const winnerId = attributes.winners?.toString() || '';
		const [score1, score2] = this.extractScores(attributes.scoreInSets);

		return {
			challonge_match_id: Number(id),
			bot1: this.getParticipantName(player1Id),
			bot2: this.getParticipantName(player2Id),
			winner: this.getParticipantName(winnerId),
			score_bot1: score1,
			score_bot2: score2,
			round: attributes.round,
			state: attributes.state,
			underway_time: attributes.timestamps?.underwayAt || null,
			ordering: attributes.suggestedPlayOrder,
			tournament_id: tournamentId,
			is_final: this.isFinalMatch(numMatches, attributes.suggestedPlayOrder),
		};
	}

	public parseMatches(matches: ChallongeMatch[], numMatches: number, tournamentId: string): ParsedMatch[] {
		return matches
			.map((match) => {
				try {
					return this.parseMatch(match, numMatches, tournamentId);
				} catch (error) {
					console.error(`Failed to parse match ${match.id}:`, error);
					return null;
				}
			})
			.filter((match): match is ParsedMatch => match !== null)
			.sort((a, b) => a.ordering - b.ordering);
	}
}

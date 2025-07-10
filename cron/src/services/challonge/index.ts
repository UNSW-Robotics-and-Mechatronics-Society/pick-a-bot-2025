import { ChallongeApiClient } from './api-client';
import { ChallongeMatchParser } from './parser';
import { ParsedMatch } from './types';

export class ChallongeService {
	private apiClient: ChallongeApiClient;

	constructor(apiKey: string) {
		this.apiClient = new ChallongeApiClient(apiKey);
	}

	async getMatches(tournamentId: string): Promise<ParsedMatch[]> {
		const response = await this.apiClient.getMatches(tournamentId);
		const parser = new ChallongeMatchParser(response.included);
		return parser.parseMatches(response.data, tournamentId);
	}
}

export { ChallongeApiClient } from './api-client';
export { ChallongeMatchParser } from './parser';
export * from './types';

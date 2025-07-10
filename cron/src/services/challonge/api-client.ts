import { ChallongeApiError, ValidationError } from '@/exceptions';
import { loggers } from '@/lib/logger';
import { challongeMatchSchema } from '@/schemas';
import axios, { AxiosError } from 'axios';
import { ChallongeApiResponse } from './types';

export class ChallongeApiClient {
	private logger = loggers.challonge.child({ component: 'api-client' });

	constructor(private apiKey: string) {
		if (!apiKey) {
			throw new ChallongeApiError('Challonge API key is required');
		}
	}

	async getMatches(tournamentId: string): Promise<ChallongeApiResponse> {
		if (!tournamentId?.trim()) {
			throw new ValidationError('Tournament ID is required');
		}

		const startTime = Date.now();
		const url = `https://api.challonge.com/v2/tournaments/${encodeURIComponent(tournamentId)}/matches.json`;

		this.logger.info('Fetching matches from Challonge', { tournamentId });

		try {
			const response = await axios.get<ChallongeApiResponse>(url, {
				headers: {
					Authorization: this.apiKey,
					'Content-Type': 'application/vnd.api+json',
					Accept: 'application/json',
					'Authorization-Type': 'v1',
				},
			});

			const duration = Date.now() - startTime;

			if (response.status !== 200) {
				this.logger.logApiCall('GET', url, response.status, duration, { tournamentId });
				throw new ChallongeApiError(`Failed to fetch matches: ${response.statusText}`, response.status);
			}

			const data = response.data;

			// Validate response structure
			try {
				challongeMatchSchema.validateSync(data);
			} catch (validationError: any) {
				this.logger.error('Invalid API response format', {
					tournamentId,
					validationError: validationError.message,
				});
				throw new ValidationError(`Invalid API response format: ${validationError.message}`);
			}

			this.logger.logApiCall('GET', url, response.status, duration, {
				tournamentId,
				matchCount: data.data.length,
				participantCount: data.included.length,
			});

			return data;
		} catch (error: any) {
			const duration = Date.now() - startTime;

			if (error instanceof AxiosError) {
				const status = error.response?.status;
				const message = error.response?.data?.message || error.message;

				this.logger.logApiCall('GET', url, status, duration, {
					tournamentId,
					error: message,
				});

				throw new ChallongeApiError(`API request failed: ${message}`, status);
			}

			if (error instanceof ChallongeApiError || error instanceof ValidationError) {
				throw error;
			}

			this.logger.error('Unexpected error fetching matches', {
				tournamentId,
				error: error.message,
				duration,
			});

			throw new ChallongeApiError(`Unexpected error fetching matches: ${error}`);
		}
	}
}

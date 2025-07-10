import { loggers } from '@/lib/logger';
import { loadConfig } from '@/utils/storage';
import { ChallongeService } from './challonge';
import { SupabaseAPIService } from './supabase/api-client';

export class MatchService {
	private challongeService: ChallongeService;
	private supabaseService: SupabaseAPIService;
	private logger = loggers.scheduler.child({ service: 'match-service' });

	constructor(env: Env) {
		this.challongeService = new ChallongeService(env.CHALLONGE_API_KEY);
		this.supabaseService = new SupabaseAPIService(env);
	}

	/**
	 * Process matches for the configured tournament (same logic as cronHandler)
	 */
	async processMatches(env: Env, scheduledTime: number): Promise<void> {
		const config = await loadConfig(env);
		if (!config.tournamentId) {
			this.logger.error('Tournament ID is not set in config');
			return;
		}

		const executer = env.JOB_TRIGGER === 'local' ? 'manual' : 'cron';

		try {
			this.logger.info('Processing tournament matches', {
				tournamentId: config.tournamentId,
				executer,
			});

			// 1. Fetch matches from Challonge
			const matches = await this.challongeService.getMatches(config.tournamentId);

			if (!matches || matches.length === 0) {
				this.logger.info('No matches found, cleaning up match table', {
					tournamentId: config.tournamentId,
				});

				// Use your existing cleanup logic or implement in SupabaseAPIService
				await this.cleanupMatches(config.tournamentId);

				await this.logCronResult(env, executer, scheduledTime, 'SUCCESS', {
					tournamentId: config.tournamentId,
					action: 'cleanup',
					numMatches: 0,
					matches: [],
				});
				return;
			}

			// 2. Replace matches using SupabaseAPIService
			await this.supabaseService.replaceMatches(config.tournamentId, matches);

			this.logger.info('Tournament matches processed successfully', {
				tournamentId: config.tournamentId,
				matchesProcessed: matches.length,
			});

			await this.logCronResult(env, executer, scheduledTime, 'SUCCESS', {
				tournamentId: config.tournamentId,
				action: 'upsert',
				numMatches: matches.length,
				matches: matches.map((m) => m.challonge_match_id),
			});
		} catch (error: any) {
			this.logger.logError(error, 'Match processing failed', {
				tournamentId: config.tournamentId,
			});

			await this.logCronResult(env, executer, scheduledTime, 'FAILURE', error.message);
			throw error;
		}
	}

	private async cleanupMatches(tournamentId: string): Promise<void> {
		// You can either add this method to SupabaseAPIService or implement here
		// For now, using the existing SupabaseAPIService pattern:
		await this.supabaseService.replaceMatches(tournamentId, []);
	}

	private async logCronResult(env: Env, executer: string, scheduledTime: number, status: string, payload: any): Promise<void> {
		try {
			const { createClient } = await import('@supabase/supabase-js');
			const supabaseUrl = (await env.CONFIG_KV.get('SUPABASE_URL')) || env.DEFAULT_SUPABASE_URL;
			const supabase = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);

			const { error } = await supabase.from('cron_log').insert([
				{
					run_at: new Date(scheduledTime).toISOString(),
					by: executer,
					status,
					payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
				},
			]);

			if (error) {
				this.logger.error('Failed to insert cron log', { error: error.message });
			} else {
				this.logger.debug('Cron log inserted', { status });
			}
		} catch (error: any) {
			this.logger.error('Failed to log cron result', { error: error.message });
		}
	}
}

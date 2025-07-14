import { getCurrentMatchSchema } from '@/schemas/database';
import { createClient } from '@supabase/supabase-js';
import { loggers } from '../../lib/logger';
import { ParsedCurrentMatch, ParsedMatch } from '../challonge/types';

export class SupabaseAPIService {
	private supabase;
	private logger = loggers.database.child({ component: 'supabase-client' });

	constructor(env: Env) {
		this.supabase = createClient(env.DEFAULT_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
	}

	public sortMatches(matches: ParsedMatch[]): ParsedMatch[] {
		return matches.sort((a, b) => a.ordering - b.ordering);
	}

	async getCurrentMatch(tournamentId: string): Promise<ParsedCurrentMatch | null> {
		this.logger.info('Fetching current match for tournament', { tournamentId });
		const { data, error } = await this.supabase
			.from('match')
			.select('*')
			.eq('state', 'open')
			.not('underway_time', 'is', null)
			.order('ordering', { ascending: true })
			.limit(1)
			.single();

		if (error) {
			if (error.code === 'PGRST116') {
				// No rows returned - this is normal
				this.logger.info('No current match found', { tournamentId });
				return null;
			}
			this.logger.logError(error, 'Failed to fetch current match', { tournamentId });
			return null;
		}

		try {
			const validatedMatch = getCurrentMatchSchema.validateSync({
				match_id: data.id,
				bot1: data.bot1,
				bot2: data.bot2,
				winner: data.winner,
				score_bot1: data.score_bot1,
				score_bot2: data.score_bot2,
				round: data.round,
				state: data.state,
				underway_time: data.underway_time,
				ordering: data.ordering,
				tournament_id: data.tournament_id,
				is_final: data.is_final,
			}) as ParsedCurrentMatch;
			this.logger.info('Fetched current match', {
				tournamentId,
				matchId: validatedMatch.match_id,
			});
			return validatedMatch;
		} catch (error) {
			this.logger.error('Failed to validate current match data', { error });
			throw error;
		}
	}

	async replaceCurrentMatch(tournamentId: string, match: ParsedCurrentMatch | null): Promise<void> {
		this.logger.info('Replacing current match for tournament', {
			tournamentId,
			matchId: match?.match_id,
		});

		try {
			const { error: deleteError } = await this.supabase.from('current_match').delete().gt('ordering', 0);

			if (deleteError) {
				throw new Error(`Failed to delete existing current matches: ${deleteError.message}`);
			}

			this.logger.info('Deleted existing current matches', { tournamentId });

			// Insert new current match if provided
			if (match) {
				const { error: insertError } = await this.supabase.from('current_match').insert([match]);

				if (insertError) {
					throw new Error(`Failed to insert current match: ${insertError.message}`);
				}

				this.logger.info('Successfully replaced current match', {
					tournamentId,
					matchId: match.match_id,
				});
			} else {
				this.logger.info('Cleared current match table (no current match to insert)', { tournamentId });
			}
		} catch (error: any) {
			this.logger.logError(error, 'Failed to replace current match', { tournamentId });
			throw error;
		}
	}

	async replaceMatches(tournamentId: string, matches: ParsedMatch[]): Promise<void> {
		this.logger.info('Replacing matches for tournament', {
			tournamentId,
			matchCount: matches.length,
		});

		try {
			// the where clause is a quick hack to delete the entire table ;)
			const { error: deleteError } = await this.supabase.from('match').delete().gt('ordering', 0);

			if (deleteError) {
				throw new Error(`Failed to delete existing matches: ${deleteError.message}`);
			}

			this.logger.debug('Deleted existing matches', { tournamentId });

			const sortedMatches = this.sortMatches(matches);

			// Insert new matches
			if (sortedMatches.length > 0) {
				const { error: insertError } = await this.supabase.from('match').insert(sortedMatches);

				if (insertError) {
					throw new Error(`Failed to insert new matches: ${insertError.message}`);
				}

				this.logger.debug('Inserted new matches', {
					tournamentId,
					count: sortedMatches.length,
				});
			}

			this.logger.info('Successfully replaced matches', {
				tournamentId,
				matchCount: sortedMatches.length,
			});
		} catch (error: any) {
			this.logger.logError(error, 'Failed to replace matches', { tournamentId });
			throw error;
		}
	}
}

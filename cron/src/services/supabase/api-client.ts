import { createClient } from '@supabase/supabase-js';
import { loggers } from '../../lib/logger';
import { ParsedMatch } from '../challonge/types';

export class SupabaseAPIService {
	private supabase;
	private logger = loggers.database.child({ component: 'supabase-client' });

	constructor(env: Env) {
		this.supabase = createClient(env.DEFAULT_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
	}

	public sortMatches(matches: ParsedMatch[]): ParsedMatch[] {
		return matches.sort((a, b) => a.ordering - b.ordering);
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

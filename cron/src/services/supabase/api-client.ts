import { loggers } from '@/lib/logger';
import { getCurrentMatchSchema } from '@/schemas/database';
import { createClient } from '@supabase/supabase-js';
import { ParsedMatch } from '../challonge';
import { Database, Tables } from './database.types';

export class SupabaseAPIService {
	private supabase;
	private logger = loggers.database.child({ component: 'supabase-client' });

	constructor(env: Env) {
		this.supabase = createClient<Database>(env.DEFAULT_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
	}

	public sortMatches(matches: ParsedMatch[]): ParsedMatch[] {
		return matches.sort((a, b) => a.ordering - b.ordering);
	}

	async getCurrentMatch(tournamentId: string): Promise<Omit<Tables<'current_match'>, 'id'> | null> {
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
			});
			return validatedMatch;
		} catch (error) {
			this.logger.error('Failed to validate current match data', { error });
			throw error;
		}
	}

	async syncCurrentMatch(tournamentId: string): Promise<Omit<Tables<'current_match'>, 'id'> | null> {
		this.logger.info('Syncing current match for tournament', {
			tournamentId,
		});

		try {
			const currentMatch = await this.getCurrentMatch(tournamentId);
			const existingRows = await this.fetchCurrentMatchRows(tournamentId);

			if (!existingRows || existingRows.length !== 1) {
				await this.deleteAllCurrentMatchRows(tournamentId);
				if (currentMatch) {
					await this.insertCurrentMatchRow(currentMatch, tournamentId);
					return currentMatch;
				} else {
					this.logger.info('Cleared current match table (no current match to insert)', { tournamentId });
				}
			} else {
				const row = existingRows[0];
				if (currentMatch) {
					await this.updateCurrentMatchRow(row.id, currentMatch, tournamentId);
					return currentMatch;
				} else {
					await this.deleteCurrentMatchRow(row.id, tournamentId);
				}
			}
			return null;
		} catch (error: any) {
			this.logger.logError(error, 'Failed to replace current match', { tournamentId });
			throw error;
		}
	}

	private async fetchCurrentMatchRows(tournamentId: string) {
		const { data, error } = await this.supabase.from('current_match').select().eq('tournament_id', tournamentId);
		if (error) throw new Error(`Failed to fetch current_match rows: ${error.message}`);
		return data ?? [];
	}

	private async deleteAllCurrentMatchRows(tournamentId: string) {
		const { error } = await this.supabase.from('current_match').delete().eq('tournament_id', tournamentId);
		if (error) throw new Error(`Failed to delete current_match rows: ${error.message}`);
		this.logger.info('Deleted all current_match rows', { tournamentId });
	}

	private async insertCurrentMatchRow(match: Omit<Tables<'current_match'>, 'id'>, tournamentId: string) {
		const { error } = await this.supabase.from('current_match').insert([match]);
		if (error) throw new Error(`Failed to insert current match: ${error.message}`);
		this.logger.info('Inserted new current match', {
			tournamentId,
			matchId: match.match_id,
		});
	}

	private async updateCurrentMatchRow(id: string, match: Omit<Tables<'current_match'>, 'id'>, tournamentId: string) {
		const { error } = await this.supabase.from('current_match').update(match).eq('id', id);
		if (error) throw new Error(`Failed to update current match: ${error.message}`);
		this.logger.info('Updated existing current match', {
			tournamentId,
			matchId: match.match_id,
		});
	}

	private async deleteCurrentMatchRow(id: string, tournamentId: string) {
		const { error } = await this.supabase.from('current_match').delete().eq('id', id);
		if (error) throw new Error(`Failed to delete current match row: ${error.message}`);
		this.logger.info('Cleared current match table (removed existing row)', { tournamentId });
	}

	private async fetchExistingMatches(tournamentId: string) {
		const { data, error } = await this.supabase
			.from('match')
			.select()
			.eq('tournament_id', tournamentId)
			.order('ordering', { ascending: true });
		if (error) throw new Error(`Failed to fetch existing matches: ${error.message}`);
		return data ?? [];
	}

	private needsReplace(existing: Tables<'match'>[], sorted: ParsedMatch[]): boolean {
		if (existing.length !== sorted.length) return true;
		return existing.some((em, i) => em.challonge_match_id !== sorted[i]?.challonge_match_id);
	}

	private async deleteMatches(tournamentId: string) {
		const { error } = await this.supabase.from('match').delete().eq('tournament_id', tournamentId);
		if (error) throw new Error(`Failed to delete existing matches: ${error.message}`);
		this.logger.info('Deleted existing matches', { tournamentId });
	}

	private async insertMatches(sortedMatches: ParsedMatch[], tournamentId: string) {
		if (sortedMatches.length > 0) {
			const { error } = await this.supabase.from('match').insert(sortedMatches);
			if (error) throw new Error(`Failed to insert new matches: ${error.message}`);
			this.logger.info('Inserted new matches', {
				tournamentId,
				count: sortedMatches.length,
			});
		}
	}

	private async updateMatches(existing: Tables<'match'>[], sorted: ParsedMatch[]) {
		for (let i = 0; i < existing.length; i++) {
			const matchId = existing[i].id;
			const { error } = await this.supabase.from('match').update(sorted[i]).eq('id', matchId);
			if (error) throw new Error(`Failed to update match ${matchId}: ${error.message}`);
		}
		this.logger.info('Updated existing matches', { count: existing.length });
	}

	async syncMatches(tournamentId: string, matches: ParsedMatch[]): Promise<void> {
		this.logger.info('Syncing matches for tournament', {
			tournamentId,
			matchCount: matches.length,
		});

		try {
			const existingMatches = await this.fetchExistingMatches(tournamentId);
			const sortedMatches = this.sortMatches(matches);

			if (this.needsReplace(existingMatches, sortedMatches)) {
				await this.deleteMatches(tournamentId);
				await this.insertMatches(sortedMatches, tournamentId);
			} else {
				await this.updateMatches(existingMatches, sortedMatches);
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

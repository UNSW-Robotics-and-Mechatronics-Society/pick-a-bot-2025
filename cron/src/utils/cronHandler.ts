import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getChallongeMatches } from './challonge';
import { loadConfig } from './storage';

const cleanupMatchTable = async (supabase: SupabaseClient, tournamentId: string) => {
	console.log('[CRON] No matches found. Cleaning up match table.');
	const { data, error } = await supabase.from('match').delete().neq('tournament_id', tournamentId).select();

	if (error) {
		console.error('[CRON] Failed to clean up match table:', error.message);
		return { success: false, deletedCount: 0 };
	}

	console.log(`[CRON] Successfully erased ${data?.length || 0} matches.`);
	return { success: true, deletedCount: data?.length || 0 };
};

const upsertMatches = async (supabase: SupabaseClient, matches: any[]) => {
	const { data, error } = await supabase.from('match').upsert(matches, { onConflict: 'ordering' }).select();

	if (error) {
		console.error('[CRON] Failed to upsert matches:', error.message);
		throw error;
	}

	console.log(`[CRON] Successfully upserted ${data?.length || 0} matches.`);
	return data ?? [];
};

const logCronResult = async (by: string, supabase: SupabaseClient, scheduledTime: number, status: string, payload: any) => {
	const { error } = await supabase.from('cron_log').insert([
		{
			run_at: new Date(scheduledTime).toISOString(),
			by,
			status,
			payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
		},
	]);

	if (error) {
		console.error('[CRON] Failed to insert log:', error.message);
	} else {
		console.log(`[CRON] Log inserted with status '${status}'`);
	}
};

/**
 * Handles the cron job for updating matches.
 * @param env The environment variables.
 * @param scheduledTime The time the job was scheduled.
 * @returns {Promise<void>}
 */
const cronHandler = async (env: Env, scheduledTime: number): Promise<void> => {
	const config = await loadConfig(env);
	if (!config.tournamentId) {
		console.error('[CRON] Tournament ID is not set.');
		return;
	}
	const executer = env.JOB_TRIGGER === 'local' ? 'manual' : 'cron';

	const supabaseUrl = (await env.CONFIG_KV.get('SUPABASE_URL')) || env.DEFAULT_SUPABASE_URL;
	const supabase = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);

	try {
		const matches = await getChallongeMatches(env, config.tournamentId);

		if (!matches || matches.length === 0) {
			await cleanupMatchTable(supabase, config.tournamentId);
			await logCronResult(executer, supabase, scheduledTime, 'SUCCESS', {
				tournamentId: config.tournamentId,
				supabaseUrl,
				action: 'cleanup',
				numMatches: 0,
				matches: [],
			});
			return;
		}

		const upserted = await upsertMatches(supabase, matches);

		const matchIds = upserted.map((m: { id: any }) => m.id);
		await logCronResult(executer, supabase, scheduledTime, 'SUCCESS', {
			tournamentId: config.tournamentId,
			supabaseUrl,
			action: 'upsert',
			numMatches: matchIds.length,
			matches: matchIds,
		});
	} catch (err: any) {
		console.error('[CRON] Error during match update:', err.message);
		await logCronResult(executer, supabase, scheduledTime, 'FAILURE', err.message);
	}
};

export default cronHandler;

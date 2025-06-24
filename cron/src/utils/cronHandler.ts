import { createClient } from '@supabase/supabase-js';
import { getChallongeMatches } from './challonge';
import { loadConfig } from './storage';

const cleanupMatchTable = async (supabase: any, tournamentId: string) => {
	console.log('[CRON] No matches found. Cleaning up match table.');
	const { data, error } = await supabase.from('match').delete().neq('tournament_id', tournamentId).select();

	if (error) {
		console.error('[CRON] Failed to clean up match table:', error.message);
		return { success: false, deletedCount: 0 };
	}

	console.log(`[CRON] Successfully erased ${data?.length || 0} matches.`);
	return { success: true, deletedCount: data?.length || 0 };
};

const upsertMatches = async (supabase: any, matches: any[]) => {
	const { data, error } = await supabase.from('match').upsert(matches, { onConflict: 'ordering' }).select();

	if (error) {
		console.error('[CRON] Failed to upsert matches:', error.message);
		throw error;
	}

	console.log(`[CRON] Successfully upserted ${data?.length || 0} matches.`);
	return data ?? [];
};

const logCronResult = async (supabase: any, scheduledTime: number, status: string, payload: any) => {
	const { error } = await supabase.from('cron_logs').insert([
		{
			run_at: new Date(scheduledTime).toISOString(),
			by: 'cron',
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

const cronHandler = async (env: Env, scheduledTime: number) => {
	const config = await loadConfig(env);
	if (!config.tournamentId) {
		console.error('[CRON] Tournament ID is not set.');
		return;
	}

	const supabaseUrl = (await env.CONFIG_KV.get('SUPABASE_URL')) || env.DEFAULT_SUPABASE_URL;
	const supabase = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);

	try {
		const matches = await getChallongeMatches(env, config.tournamentId);

		if (!matches || matches.length === 0) {
			await cleanupMatchTable(supabase, config.tournamentId);
			await logCronResult(supabase, scheduledTime, 'SUCCESS', {
				tournamentId: config.tournamentId,
				supabaseUrl,
				numUpdatedMatches: 0,
				UpdatedMatches: [],
			});
			return;
		}

		const upserted = await upsertMatches(supabase, matches);

		const updatedIds = upserted.map((m) => m.id);
		await logCronResult(supabase, scheduledTime, 'SUCCESS', {
			tournamentId: config.tournamentId,
			supabaseUrl,
			numUpdatedMatches: updatedIds.length,
			UpdatedMatches: updatedIds,
		});
	} catch (err: any) {
		await logCronResult(supabase, scheduledTime, 'FAILURE', err.message);
	}
};

export default cronHandler;

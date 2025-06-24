import { createClient } from '@supabase/supabase-js';
import { getChallongeMatches } from './challonge';
import { loadConfig } from './storage';

const cronHandler = async (env: Env, scheduledTime: number) => {
	const config = await loadConfig(env);
	if (!config.tournamentId) {
		console.error('[CRON] Tournament ID is not set in the configuration.');
		return;
	}
	const supabaseUrl = (await env.CONFIG_KV.get('SUPABASE_URL')) || env.DEFAULT_SUPABASE_URL;
	const supabase = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);

	try {
		console.log(`[CRON] Fetching matches for tournament ID: ${config.tournamentId}`);
		const parsedMatches = await getChallongeMatches(env, config.tournamentId);

		console.log(`[CRON] Updating match table at ${supabaseUrl}`);
		const { data: upsertedData, error: upsertError } = await supabase
			.from('match')
			.upsert(parsedMatches, { onConflict: 'ordering' })
			.select();
		if (upsertError) {
			console.error('[CRON] Failed to upsert matches:', upsertError.message);
			throw upsertError;
		} else {
			console.log(`[CRON] Successfully upserted ${upsertedData?.length || 0} matches.`);
		}

		console.log(`[CRON] Matches upserted successfully at ${supabaseUrl}`);
		if (!upsertedData || upsertedData.length === 0) {
			console.log('[CRON] No matches were updated.');
			return;
		}

		const updatedMatchIds: number[] = upsertedData.map((match) => match.id);

		console.log(`[CRON] Logging ${updatedMatchIds.length} updated matches for tournament ID: ${config.tournamentId}`);
		const { error: logError } = await supabase.from('cron_logs').insert([
			{
				run_at: new Date(scheduledTime).toISOString(),
				by: 'cron',
				status: 'SUCCESS',
				payload: JSON.stringify({
					tournamentId: config.tournamentId,
					supabaseUrl: supabaseUrl,
					numUpdatedMatches: updatedMatchIds.length,
					UpdatedMatches: updatedMatchIds,
				}),
			},
		]);
		if (logError) {
			console.error('[CRON] Failed to insert log:', logError.message);
		} else {
			console.log(`[CRON] Log inserted successfully to 'cron_logs' table at ${supabaseUrl}`);
		}
	} catch (err: any) {
		await supabase.from('cron_logs').insert([
			{
				run_at: new Date(scheduledTime).toISOString(),
				by: 'cron',
				status: 'FAILURE',
				payload: err.message,
			},
		]);
	}
};

export default cronHandler;

import { createClient } from '@supabase/supabase-js';
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
		// TODO: add cron logic here...
		const updatedMatcheIds: number[] = []; // TODO: Replace with actual logic to fetch updated matches
		console.log(`[CRON] Running cron job for tournament ID: ${config.tournamentId}`);
		const { error } = await supabase.from('cron_logs').insert([
			{
				run_at: new Date(scheduledTime).toISOString(),
				by: 'cron',
				status: 'SUCCESS',
				payload: JSON.stringify({
					tournamentId: config.tournamentId,
					supabaseUrl: supabaseUrl,
					numUpdatedMatches: updatedMatcheIds.length,
					UpdatedMatches: updatedMatcheIds,
				}),
			},
		]);
		if (error) {
			console.error('[CRON] Failed to insert log:', error.message);
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

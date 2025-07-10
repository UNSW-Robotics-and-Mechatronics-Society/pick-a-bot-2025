export const loadConfig = async (env: Env) => {
	return {
		tournamentId: (await env.CONFIG_KV.get('TOURNAMENT_ID')) || '',
		supabaseUrl: (await env.CONFIG_KV.get('SUPABASE_URL')) || env.DEFAULT_SUPABASE_URL,
		environment: env.ENVIRONMENT,
	};
};

export const saveConfig = async (env: Env, form: URLSearchParams) => {
	await env.CONFIG_KV.put('TOURNAMENT_ID', form.get('tournamentId') || '');
};

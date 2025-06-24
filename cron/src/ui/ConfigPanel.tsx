import { env } from 'cloudflare:workers';
import { FC } from 'hono/jsx/dom';

interface ConfigPanelProps {
	tournamentId: string;
	supabaseUrl: string;
}

const ConfigPanel: FC<ConfigPanelProps> = ({ tournamentId, supabaseUrl }) => {
	return (
		<main style="padding: 2rem; font-family: sans-serif;">
			<a href="/" style="margin-bottom: 1rem; display: inline-block;">
				← Back
			</a>

			<h1>Pick-a-Bot Config Panel</h1>

			<form method="post" action="/api/config" style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px;">
				<div>
					<input type="hidden" name="token" value={env.ADMIN_API_KEY} />
					<label htmlFor="tournamentId">
						<strong>Tournament ID:</strong>
					</label>
					<input id="tournamentId" name="tournamentId" value={tournamentId} required style="width: 100%;" />
				</div>

				<div>
					<label htmlFor="supabaseUrl">
						<strong>Supabase URL:</strong>
					</label>
					<input id="supabaseUrl" name="supabaseUrl" value={supabaseUrl} required style="width: 100%;" />
				</div>

				<button type="submit">Save Config</button>
			</form>
			<h2>Current Config</h2>
			<pre>{JSON.stringify({ tournamentId, supabaseUrl }, null, 2)}</pre>
		</main>
	);
};

export default ConfigPanel;

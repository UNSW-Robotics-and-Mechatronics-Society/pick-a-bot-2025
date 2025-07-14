import { env } from 'cloudflare:workers';
import { FC } from 'hono/jsx/dom';

interface ConfigPanelProps {
	tournamentId: string;
	supabaseUrl: string;
	environment?: string;
}

const ConfigPanel: FC<ConfigPanelProps> = ({ tournamentId, supabaseUrl, environment }) => {
	return (
		<main style="padding: 2rem; display: flex; flex-direction: column; gap: 1rem; max-width: 800px; margin: auto;">
			<a href="/" style="margin-bottom: 1rem; display: inline-block;">
				← Back
			</a>

			<div style="display: inline-flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
				<h1>Pick-a-Bot Config Panel</h1>
				<p style="color: #999999; font-weight: bold; background-color: #222222; padding: 0.5rem; border-radius: 4px; width: fit-content;">
					{environment}
				</p>
			</div>

			<form method="post" action="/api/config" style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px;">
				<div>
					<input type="hidden" name="token" value={env.ADMIN_API_KEY} />
					<label htmlFor="tournamentId">
						<strong>Tournament ID:</strong>
					</label>
					<input id="tournamentId" name="tournamentId" value={tournamentId} required style="width: 100%;" />
				</div>

				<button type="submit">Save Config</button>
			</form>
			<div>
				<h2>Current Config</h2>
				<div style="padding: 1rem; border-radius: 4px; overflow: auto; background-color: #191919;">
					<pre>{JSON.stringify({ tournamentId, supabaseUrl }, null, 2)}</pre>
				</div>
			</div>
		</main>
	);
};

export default ConfigPanel;

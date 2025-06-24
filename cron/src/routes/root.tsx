import { Hono } from 'hono';
import ConfigPanel from '../ui/ConfigPanel';
import Dashboard from '../ui/Dashboard';
import Layout from '../ui/Layout';
import { loadConfig } from '../utils/storage';

export const app = new Hono<{ Bindings: Env }>();

const root = new Hono<{ Bindings: Env }>();

root.get('/', (c) => {
	const props = {
		title: 'PICK-A-BOTS | Cron Admin',
		description: 'Admin dashboard for Pick-a-Bot cron jobs',
	};

	return c.html(
		<Layout {...props}>
			<Dashboard />
		</Layout>
	);
});

root.get('/config', async (c) => {
	const config = await loadConfig(c.env);
	if (!config?.tournamentId) {
		return c.text('Tournament ID missing', 400);
	}

	const props = {
		title: 'PICK-A-BOTS | Cron Admin - Config',
		description: 'Manage cron configuration for Pick-a-Bot',
	};

	return c.html(
		<Layout {...props}>
			<ConfigPanel tournamentId={config.tournamentId} supabaseUrl={config.supabaseUrl} />
		</Layout>
	);
});

export default root;

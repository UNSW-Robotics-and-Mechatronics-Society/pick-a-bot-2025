import { loadConfig } from '@/services/kv-storage';
import ConfigPanel from '@/ui/ConfigPanel';
import Dashboard, { Environment } from '@/ui/Dashboard';
import Layout from '@/ui/Layout';
import { Hono } from 'hono';

export const app = new Hono<{ Bindings: Env }>();

const root = new Hono<{ Bindings: Env }>();

root.get('/', async (c) => {
	const config = await loadConfig(c.env);

	const props = {
		title: 'PICK-A-BOTS | Cron Admin',
		description: 'Admin dashboard for Pick-a-Bot cron jobs',
	};

	return c.html(
		<Layout {...props}>
			<Dashboard environment={config.environment as Environment} />
		</Layout>
	);
});

root.get('/config', async (c) => {
	const config = await loadConfig(c.env);

	const props = {
		title: 'PICK-A-BOTS | Cron Admin - Config',
		description: 'Manage cron configuration for Pick-a-Bot',
	};

	return c.html(
		<Layout {...props}>
			<ConfigPanel tournamentId={config.tournamentId} supabaseUrl={config.supabaseUrl} environment={config.environment} />
		</Layout>
	);
});

export default root;

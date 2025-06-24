import { Hono } from 'hono';
import { tokenAuth } from '../../middleware/apiAuth';
import PATH from '../path';
import { saveConfig } from '../utils/storage';

const api = new Hono<{ Bindings: Env }>();

api.use('*', tokenAuth);

api.get('/status', (c) => {
	return c.json({ ok: true, message: 'API is live' });
});

api.post('/config', async (c) => {
	const form = await c.req.parseBody();
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(form)) {
		if (typeof value === 'string') params.set(key, value);
	}

	await saveConfig(c.env, params);
	return c.redirect(PATH.config, 303);
});

export default api;

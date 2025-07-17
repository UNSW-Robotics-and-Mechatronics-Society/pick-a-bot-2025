import { MiddlewareHandler } from 'hono';

export const tokenAuth: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
	const auth = c.req.header('Authorization');
	const body = await c.req.parseBody();

	if (auth !== `Bearer ${c.env.ADMIN_API_KEY}` && body?.token !== c.env.ADMIN_API_KEY) {
		return c.text('Unauthorized', 401);
	}

	await next();
};

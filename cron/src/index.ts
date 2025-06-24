import { app } from './app';
import cronHandler from './utils/cronHandler';

export default {
	fetch: app.fetch,
	scheduled: async (event: ScheduledEvent, env: Env, ctx: ExecutionContext) => {
		ctx.waitUntil(cronHandler(env, event.scheduledTime));
	},
};

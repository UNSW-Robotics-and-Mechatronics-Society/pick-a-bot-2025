import { app } from './app';
import { matchProcessorHandler } from './cron-handlers/match-processor';

export default {
	fetch: app.fetch,
	scheduled: async (event: ScheduledEvent, env: Env, ctx: ExecutionContext) => {
		ctx.waitUntil(matchProcessorHandler(env, event.scheduledTime));
	},
};

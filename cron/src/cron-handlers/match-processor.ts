import { loggers } from '@/lib/logger';
import { MatchService } from '../services/match';

export async function matchProcessorHandler(env: Env, scheduledTime: number): Promise<void> {
	const logger = loggers.scheduler.child({ handler: 'match-processor' });

	logger.info('Match processor started', { scheduledTime });

	try {
		const matchService = new MatchService(env);
		await matchService.processMatches(env, scheduledTime);

		logger.info('Match processor completed successfully');
	} catch (error: any) {
		logger.logError(error, 'Match processor failed');
		throw error;
	}
}

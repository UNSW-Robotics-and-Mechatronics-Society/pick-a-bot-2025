import { Tables } from '@/services/supabase/database.types';
import * as yup from 'yup';

const matchStateValues = ['pending', 'open', 'complete'] as const;

export const getCurrentMatchSchema = yup.object({
	match_id: yup.string().uuid().required(),
	bot1: yup.string().required(),
	bot2: yup.string().required(),
	winner: yup.string().nullable().default(null),
	score_bot1: yup.number().integer().min(0).max(32767).nullable().default(0), // smallint range
	score_bot2: yup.number().integer().min(0).max(32767).nullable().default(0), // smallint range
	round: yup.number().integer().required(),
	state: yup.string().oneOf(matchStateValues).required().default('pending'),
	underway_time: yup.string().nullable().defined(), // ISO timestamp string
	ordering: yup.number().integer().required(),
	tournament_id: yup.string().required(),
	updated_time: yup
		.string()
		.nullable()
		.default(() => new Date().toISOString()),
	is_final: yup.boolean().required().default(false),
}) satisfies yup.ObjectSchema<Omit<Tables<'current_match'>, 'id'>>;

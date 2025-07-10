import * as yup from 'yup';

export const participantSchema = yup.object({
	id: yup.string().required(),
	attributes: yup
		.object({
			name: yup.string().required(),
		})
		.required(),
});

export const matchSchema = yup.object({
	id: yup.string().required(),
	attributes: yup
		.object({
			round: yup.number().required(),
			state: yup.string().required(),
			suggestedPlayOrder: yup.number().required(),
			scoreInSets: yup.array().of(yup.array().of(yup.number().nullable())).nullable(),
			winners: yup.mixed().nullable(),
			timestamps: yup
				.object({
					startedAt: yup.string().nullable(),
				})
				.nullable(),
		})
		.required(),
	relationships: yup
		.object({
			player1: yup
				.object({
					data: yup
						.object({
							id: yup.string().nullable(),
						})
						.nullable(),
				})
				.nullable(),
			player2: yup
				.object({
					data: yup
						.object({
							id: yup.string().nullable(),
						})
						.nullable(),
				})
				.nullable(),
		})
		.required(),
});

export const challongeMatchSchema = yup.object({
	data: yup.array().of(matchSchema).required(),
	included: yup.array().of(participantSchema).required(),
	meta: yup.mixed().nullable(),
	links: yup
		.object({
			self: yup.string().nullable(),
			next: yup.string().nullable(),
			prev: yup.string().nullable(),
		})
		.nullable(),
});

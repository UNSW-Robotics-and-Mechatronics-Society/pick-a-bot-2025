export class ChallongeApiError extends Error {
	constructor(message: string, public statusCode?: number) {
		super(message);
		this.name = 'ChallongeApiError';
	}
}

export class ParticipantNotFoundError extends Error {
	constructor(participantId: string) {
		super(`Participant with ID ${participantId} not found`);
		this.name = 'ParticipantNotFoundError';
	}
}

export class ValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ValidationError';
	}
}

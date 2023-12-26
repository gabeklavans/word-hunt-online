import { SERVER_URL, DEBUG } from "./env";

export async function getBoardData(sessionId: string) {
	return await fetch(`${SERVER_URL}/who/board/${sessionId}`, {
		method: "GET",
		mode: "cors",
	});
}

export async function getSessionInfo(sessionId: string) {
	return await fetch(`${SERVER_URL}/who/session/${sessionId}`, {
		method: "GET",
		mode: "cors",
	});
}

export async function sendResults(
	sessionId: string,
	userId: string,
	data: { partial: boolean; score: number; words: string[] }
) {
	try {
		return await fetch(`${SERVER_URL}/result/${sessionId}/${userId}`, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			mode: "cors",
			body: JSON.stringify(data),
		});
	} catch (error) {
		if (DEBUG) {
			console.error(`sessionId: ${sessionId}`);
			console.error(`userId: ${userId}`);
			console.error("data:");
			console.error(data);
			console.error(error);
		}
	}
}

export async function notifyPlayerStarted(sessionId: string, userId: string) {
	try {
		return await fetch(`${SERVER_URL}/start-game/${sessionId}/${userId}`, {
			method: "PATCH",
			mode: "cors",
		});
	} catch (error) {
		if (DEBUG) {
			console.error(`notifyPlayerStarted, sessionId: ${sessionId}, userId: ${userId}`);
			console.error(error);
		}
	}
}

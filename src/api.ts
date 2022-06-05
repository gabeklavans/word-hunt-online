const SERVER_URL = "http://leet.dabe.tech:3000";

export async function getBoardData(sessionId: string) {
    return await fetch(`${SERVER_URL}/who/board/${sessionId}`, {
        method: "GET",
    });
}

export async function getSessionInfo(sessionId: string) {
    return await fetch(`${SERVER_URL}/who/session/${sessionId}`, {
        method: "GET",
    });
}

export async function sendResults(
    sessionId: string,
    userId: string,
    data: { score: number; words: string[] }
) {
    return await fetch(`${SERVER_URL}/result/${sessionId}/${userId}`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

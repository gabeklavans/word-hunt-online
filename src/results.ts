import { getSessionInfo } from "./api";
import { getWordScore } from "./utils";

const urlParams = new URLSearchParams(window.location.search);
export const SESSION_ID = urlParams.get("session");
export const USER_ID = urlParams.get("user");

async function init() {
	const res = await getSessionInfo(SESSION_ID ?? "");
	const session = (await res.json()) as SessionView;

	if (!session) {
		console.error(`session not retrieved`);
		return;
	}
	if (!session.board) {
		console.error(`board not found for session ${session}`);
		return;
	}
	if (!SESSION_ID || !USER_ID) {
		console.error(`Url param error, SESSION_ID: ${SESSION_ID}, USER_ID: ${USER_ID}`);
		return;
	}

	// descending score order, else ascending alphabetical order
	const sortedBoardWords = session.board.words.sort((a, b) =>
		a.length !== b.length ? b.length - a.length : a.localeCompare(b)
	);
	const wordsFoundByPlayers = new Set(
		Object.values(session.scoredUsers)
			.map((scoredUser) => scoredUser.words)
			.flat()
	);
	console.log(`sorted words: ${sortedBoardWords}
    found words:`);
	console.log(wordsFoundByPlayers);

	// fill in main player score column
	const mainPlayer = session.scoredUsers[USER_ID];
	const mainPlayerCol = document.getElementById("mainPlayer");
	if (!mainPlayerCol) {
		console.error("Could not find main player column");
		return;
	}
	(mainPlayerCol?.childNodes[1] as HTMLHeadingElement).innerHTML = mainPlayer.name;
	const mainPlayerScore = mainPlayer.score;
	(mainPlayerCol?.childNodes[3] as HTMLHeadingElement).innerHTML = mainPlayerScore
		? mainPlayerScore.toString()
		: "waiting...";

	populateColumnWords(sortedBoardWords, wordsFoundByPlayers, mainPlayer, mainPlayerCol);

	delete session.scoredUsers[USER_ID];

	// fill in the second col with some other player's score
	let otherPlayerIdx = 0;
	const otherPlayerCol = document.getElementById("otherPlayer");
	if (!otherPlayerCol) {
		console.error("Could not find other player column");
		return;
	}
	const otherPlayer = Object.values(session.scoredUsers)[otherPlayerIdx];
	(otherPlayerCol.childNodes[1] as HTMLHeadElement).innerHTML = otherPlayer.name;
	(otherPlayerCol.childNodes[3] as HTMLHeadElement).innerHTML = otherPlayer.score
		? otherPlayer.score.toString()
		: "watiing...";

	populateColumnWords(sortedBoardWords, wordsFoundByPlayers, otherPlayer, otherPlayerCol);
}

function populateColumnWords(
	sortedBoardWords: string[],
	wordsFoundByPlayers: Set<string>,
	player: ScoredPlayer,
	scoreCol: HTMLElement
) {
	for (const word of sortedBoardWords) {
		if (wordsFoundByPlayers.has(word)) {
			const wordRow = document.createElement("span");
			const wordRowWord = document.createElement("p");
			wordRowWord.innerHTML = word;
			const wordRowScore = document.createElement("p");
			wordRowScore.innerHTML = `${getWordScore(word)}`;

			if (!player.words.includes(word)) {
				wordRow.style.opacity = "0.3";
			}

			wordRow.append(wordRowWord, wordRowScore);
			(scoreCol.childNodes[5] as HTMLDivElement).appendChild(wordRow);
		}
	}
}

init().catch(console.error);

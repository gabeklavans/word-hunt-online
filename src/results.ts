import { isEqual } from "lodash";
import { getSessionInfo } from "./api";
import { getWordScore } from "./utils";
import { DEBUG } from "./env";

const urlParams = new URLSearchParams(window.location.search);
export const SESSION_ID = urlParams.get("session");
export const USER_ID = urlParams.get("user");

const CHECK_UPDATE_INTERVAL_MS = 1000;

let session: SessionView;
let sortedBoardWords: string[];
let wordsFoundByPlayers: Set<string>;
let otherPlayers: {
	[key: string]: ScoredPlayer;
};
let otherPlayerIdx = 0;

setInterval(checkForUpdatedSession, CHECK_UPDATE_INTERVAL_MS);

document.getElementById("left-button")?.addEventListener("pointerdown", (event) => {
	if (otherPlayerIdx <= 0) {
		console.warn("Somehow tried to reduce below first player");
		return;
	}

	otherPlayerIdx--;
	updateOtherPlayerColumn();
});

document.getElementById("right-button")?.addEventListener("pointerdown", (event) => {
	if (otherPlayerIdx >= Object.keys(session.scoredUsers).length - 1) {
		console.warn("Somehow tried to increase past the last player");
		return;
	}

	otherPlayerIdx++;

	updateOtherPlayerColumn();
});

document.getElementById("mainPlayerScrollDiv")?.addEventListener("scroll", (event) => {
	const otherPlayerScroller = document.getElementById("otherPlayerScrollDiv");
	if (!otherPlayerScroller) {
		return;
	}
	otherPlayerScroller.scrollTop = (event.target as HTMLDivElement).scrollTop;
});

document.getElementById("otherPlayerScrollDiv")?.addEventListener("scroll", (event) => {
	const otherPlayerScroller = document.getElementById("mainPlayerScrollDiv");
	if (!otherPlayerScroller) {
		return;
	}
	otherPlayerScroller.scrollTop = (event.target as HTMLDivElement).scrollTop;
});

async function init() {
	const res = await getSessionInfo(SESSION_ID ?? "");
	session = (await res.json()) as SessionView;
	if (DEBUG) {
		console.debug("Game session:");
		console.debug(session);
	}

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
	sortedBoardWords = session.board.words.sort((a, b) =>
		a.length !== b.length ? b.length - a.length : a.localeCompare(b)
	);
	wordsFoundByPlayers = new Set(
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
	(mainPlayerCol?.childNodes[3] as HTMLHeadingElement).innerHTML =
		mainPlayer.score !== undefined ? mainPlayer.score.toString() : "waiting...";

	populateColumnWords(mainPlayer, mainPlayerCol);

	otherPlayers = { ...session.scoredUsers };
	delete otherPlayers[USER_ID];
	if (DEBUG) {
		console.debug("Other players:");
		console.debug(otherPlayers);
	}

	// fill in the second col with some other player's score
	updateOtherPlayerColumn();
}

function updateOtherPlayerColumn() {
	(document.getElementById("left-button") as HTMLButtonElement).disabled = otherPlayerIdx === 0;
	(document.getElementById("right-button") as HTMLButtonElement).disabled =
		otherPlayerIdx === Object.keys(otherPlayers).length - 1;

	const otherPlayerCol = document.getElementById("otherPlayer");
	if (!otherPlayerCol) {
		console.error("Could not find other player column");
		return;
	}

	const otherPlayer = Object.values(otherPlayers)[otherPlayerIdx];
	if (!otherPlayer) {
		console.warn("Other player not found");
		return;
	}

	(otherPlayerCol.childNodes[1] as HTMLHeadElement).innerHTML = otherPlayer.name;
	(otherPlayerCol.childNodes[3] as HTMLHeadElement).innerHTML =
		otherPlayer.score !== undefined ? otherPlayer.score.toString() : "waiting...";

	populateColumnWords(otherPlayer, otherPlayerCol);
}

function populateColumnWords(player: ScoredPlayer, scoreCol: HTMLElement) {
	for (const word of sortedBoardWords) {
		if (wordsFoundByPlayers.has(word)) {
			const wordRow = document.createElement("span");
			const wordRowWord = document.createElement("p");
			wordRowWord.innerHTML = word;
			const wordRowScore = document.createElement("p");
			wordRowScore.innerHTML = `${getWordScore(word)}`;

			if (!player.words.includes(word)) {
				wordRow.style.opacity = "0.15";
			}

			wordRow.append(wordRowWord, wordRowScore);
			(scoreCol.childNodes[5] as HTMLDivElement).appendChild(wordRow);
		}
	}
}

async function checkForUpdatedSession() {
	const res = await getSessionInfo(SESSION_ID ?? "");
	const newSession: SessionView = await res.json();

	if (!session) {
		console.error("Session not initialized yet!");
		return;
	}

	if (!isEqual(newSession.scoredUsers, session.scoredUsers)) {
		location.reload();
	}
}

init().catch(console.error);

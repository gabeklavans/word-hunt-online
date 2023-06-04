import { isEqual } from "lodash";
import { getSessionInfo } from "./api";
import { getWordScore } from "./utils";
import { DEBUG } from "./env";

const urlParams = new URLSearchParams(window.location.search);
export const SESSION_ID = urlParams.get("session");
export const USER_ID = urlParams.get("user");
const SHOW_ALL_WORDS_COOKIE = "showAllWords";
const WORD_NOT_FOUND_OPACITY = 0.15;

const CHECK_UPDATE_INTERVAL_MS = 1000;

let session: SessionView;
let sortedBoardWords: string[];
let wordsFoundByPlayers: Set<string>;
let otherPlayers: {
	[key: string]: ScoredPlayer;
};
let otherPlayerIdx = 0;

let showAllWords: boolean;

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

const showAllWordsToggle = document.getElementById("showAllWords") as HTMLInputElement;
if (showAllWordsToggle) {
	showAllWordsToggle.addEventListener("change", () => {
		document.cookie = `${SHOW_ALL_WORDS_COOKIE}=${showAllWordsToggle.checked}`;
		showAllWords = showAllWordsToggle.checked;
		updateAllScoreColWords();
	});
}

async function init() {
	showAllWords = checkShowAllWords();
	if (DEBUG) {
		console.debug(`Show all words: ${showAllWords}`);
	}
	showAllWordsToggle.checked = showAllWords;

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
	const mainPlayerScoreDiv = document.getElementById("mainPlayerScrollDiv") as HTMLDivElement;
	if (!mainPlayerScoreDiv) {
		console.error("Could not find main player scroll div");
		return;
	}
	(document.getElementById("mainPlayerName") as HTMLHeadingElement).innerHTML = mainPlayer.name;
	(document.getElementById("mainPlayerScore") as HTMLHeadingElement).innerHTML =
		mainPlayer.score !== undefined ? mainPlayer.score.toString() : "waiting...";

	populateColumnWords(mainPlayerScoreDiv);
	updateScoreColWords(mainPlayer, mainPlayerScoreDiv);

	otherPlayers = { ...session.scoredUsers };
	delete otherPlayers[USER_ID];
	if (DEBUG) {
		console.debug("Other players:");
		console.debug(otherPlayers);
	}

	// fill in the second col with some other player's score
	populateColumnWords(document.getElementById("otherPlayerScrollDiv") as HTMLDivElement);
	updateOtherPlayerColumn();
}

function updateOtherPlayerColumn() {
	(document.getElementById("left-button") as HTMLButtonElement).disabled = otherPlayerIdx === 0;
	(document.getElementById("right-button") as HTMLButtonElement).disabled =
		otherPlayerIdx === Object.keys(otherPlayers).length - 1;

	const otherPlayerScoreDiv = document.getElementById("otherPlayerScrollDiv") as HTMLDivElement;
	if (!otherPlayerScoreDiv) {
		console.error("Could not find other player scroll div");
		return;
	}

	const otherPlayer = Object.values(otherPlayers)[otherPlayerIdx];
	if (!otherPlayer) {
		console.warn("Other player not found");
		return;
	}

	(document.getElementById("otherPlayerName") as HTMLHeadElement).innerHTML = otherPlayer.name;
	(document.getElementById("otherPlayerScore") as HTMLHeadElement).innerHTML =
		otherPlayer.score !== undefined ? otherPlayer.score.toString() : "waiting...";

	updateScoreColWords(otherPlayer, otherPlayerScoreDiv);
}

function populateColumnWords(scoreCol: HTMLDivElement) {
	console.log(sortedBoardWords);
	for (const word of sortedBoardWords) {
		const wordRow = document.createElement("span");
		const wordRowWord = document.createElement("p");
		wordRowWord.innerHTML = word;
		const wordRowScore = document.createElement("p");
		wordRowScore.innerHTML = `${getWordScore(word)}`;

		wordRow.append(wordRowWord, wordRowScore);
		wordRow.style.display = "none"; // hide it by default
		scoreCol.appendChild(wordRow);
	}
}

function updateScoreColWords(player: ScoredPlayer, scoreCol: HTMLDivElement) {
	for (const wordScoreRowSpan of scoreCol.children) {
		const [word, score] = Array.from(wordScoreRowSpan.children).map((child) => child.innerHTML);

		if (!showAllWords && !wordsFoundByPlayers.has(word)) {
			(wordScoreRowSpan as HTMLSpanElement).style.display = "none";
			continue;
		}

		(wordScoreRowSpan as HTMLSpanElement).style.display = "flex";
		if (!player.words.includes(word)) {
			(wordScoreRowSpan as HTMLSpanElement).style.opacity = `${WORD_NOT_FOUND_OPACITY}`;
		}
	}
}

function updateAllScoreColWords() {
	const mainPlayer = session.scoredUsers[USER_ID as string];
	const mainPlayerScoreDiv = document.getElementById("mainPlayerScrollDiv") as HTMLDivElement;
	updateScoreColWords(mainPlayer, mainPlayerScoreDiv);

	const otherPlayer = Object.values(otherPlayers)[otherPlayerIdx];
	if (!otherPlayer) {
		console.warn("updateAllScoreColWords: other player not found");
		return;
	}
	const otherPlayerScoreDiv = document.getElementById("otherPlayerScrollDiv") as HTMLDivElement;
	updateScoreColWords(otherPlayer, otherPlayerScoreDiv);
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

function checkShowAllWords() {
	const showAllWordsCookie = document.cookie
		.split("; ")
		.find((cookie) => cookie.startsWith(`${SHOW_ALL_WORDS_COOKIE}=`));

	if (!showAllWordsCookie) {
		console.warn("show all words cookie not found!");
		return false;
	}

	return showAllWordsCookie.split("=")[1] === "true";
}

init().catch(console.error);

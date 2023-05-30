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

	Object.values(session.scoredUsers)
		.filter((scoredPlayer) => scoredPlayer.score !== undefined)
		.forEach((scoredPlayer) => {
			createScoreColumn(scoredPlayer, sortedBoardWords, wordsFoundByPlayers);
		});
}

function createScoreColumn(
	scoredPlayer: ScoredPlayer,
	sortedBoardWords: string[],
	wordsFoundByPlayers: Set<string>
) {
	const scoreColSection = document.getElementById("scoreCols");
	if (!scoreColSection) {
		console.error("Could not find scoreCols section in document");
		return;
	}

	const scoreCol = document.createElement("article");

	const scoreColPlayerName = document.createElement("h4");
	scoreColPlayerName.innerHTML = scoredPlayer.name;

	const scoreColPlayerScore = document.createElement("h3");
	scoreColPlayerScore.innerHTML = scoredPlayer.score
		? scoredPlayer.score.toString()
		: "waiting...";

	const scoreColWordsDiv = document.createElement("div");

	scoreCol.append(scoreColPlayerName, scoreColPlayerScore, scoreColWordsDiv);
	scoreColSection.appendChild(scoreCol);

	for (const word of sortedBoardWords) {
		if (wordsFoundByPlayers.has(word)) {
			const wordRow = document.createElement("span");
			const wordRowWord = document.createElement("p");
			wordRowWord.innerHTML = word;
			const wordRowScore = document.createElement("p");
			wordRowScore.innerHTML = `${getWordScore(word)}`;

			if (!scoredPlayer.words.includes(word)) {
				wordRow.style.opacity = "0.3";
			}

			wordRow.append(wordRowWord, wordRowScore);
			scoreColWordsDiv.appendChild(wordRow);
		}
	}
}

init().catch(console.error);

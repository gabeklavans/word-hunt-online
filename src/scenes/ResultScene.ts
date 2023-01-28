import { getSessionInfo } from "../api";
import { SESSION_ID } from "../Main";
import { getWordScore } from "../utils";
import { isEqual } from "lodash";

export default class ResultScene extends Phaser.Scene {
    readonly FONT_SIZE = 30;
    readonly COLOR_PRIMARY = 0x4e342e;
    readonly COLOR_LIGHT = 0x7b5e57;
    readonly COLOR_DARK = 0x260e04;
    readonly MAX_DISPLAYED_WORDS = 11;

    padding!: number;

    resultRefreshTimer!: Phaser.Time.TimerEvent;
    waitTextTimer!: Phaser.Time.TimerEvent;
    waitingText!: Phaser.GameObjects.BitmapText;
    curScoreStartIdx = 0;

    doneButton!: Phaser.GameObjects.Rectangle;
    leftangle!: Phaser.GameObjects.Rectangle;
    rightangle!: Phaser.GameObjects.Rectangle;
    prevScoresButton!: Phaser.GameObjects.Image;
    nextScoresButton!: Phaser.GameObjects.Image;
    textGroup!: Phaser.GameObjects.Group;

    session?: SessionView;

    constructor() {
        super({ key: "result", active: false });
    }

    async create() {
        const halfCanvasWidth = this.game.canvas.width / 2;
        this.padding = halfCanvasWidth * 0.1;

        const topPanelHeight = this.game.canvas.height * 0.04;
        const bottomPanelHeight = this.game.canvas.height * 0.08;

        this.textGroup = this.add.group();

        /******** Status text ********/
        let numDots = 0;

        const res = await getSessionInfo(SESSION_ID ?? "");
        this.session = await res.json();

        this.waitingText = this.add
            .bitmapText(
                this.cameras.main.centerX,
                this.padding / 2,
                "gothic",
                "Waiting for results",
                topPanelHeight
            )
            .setTintFill(0x000000)
            .setOrigin(0.5, 0)
            .setDepth(2);

        if (!this.session?.done) {
            this.resultRefreshTimer = this.time.addEvent({
                delay: 3 * 1000,
                callback: this.checkForUpdatedSession,
                callbackScope: this,
                loop: true,
                startAt: 2.5 * 1000,
            });

            this.waitTextTimer = this.time.addEvent({
                delay: 1 * 1000,
                callback: () => {
                    numDots = (numDots + 1) % 4;
                    this.waitingText.setText(
                        `Waiting for results${".".repeat(numDots)}` // I love that js just has a repeat method
                    );
                },
                loop: true,
                callbackScope: this,
            });
        } else {
            this.waitingText.setText("Results!");
        }

        /******** Score cards ********/
        const cardWidth = halfCanvasWidth - this.padding * 1.5;
        const cardHeight =
            this.game.canvas.height -
            this.padding * 2 -
            (bottomPanelHeight + this.padding * 2) -
            topPanelHeight;

        this.leftangle = this.add
            .rectangle(
                this.padding,
                this.padding + topPanelHeight,
                cardWidth,
                cardHeight,
                this.COLOR_LIGHT
            )
            .setOrigin(0);

        this.rightangle = this.add
            .rectangle(
                this.game.canvas.width / 2 + this.padding / 2,
                this.padding + topPanelHeight,
                cardWidth,
                cardHeight,
                this.COLOR_LIGHT
            )
            .setOrigin(0);

        /******** Arrows ********/
        this.prevScoresButton = this.add
            .image(
                halfCanvasWidth - this.padding,
                this.game.canvas.height - this.padding,
                "arrow-right"
            )
            .setOrigin(1, 1)
            .setDisplaySize(bottomPanelHeight * 2, bottomPanelHeight * 1.5)
            .setFlipX(true)
            .setInteractive()
            .on("pointerdown", () => {
                this.decCurScoreStart();
                this.displayScores(this.curScoreStartIdx);
            });

        this.nextScoresButton = this.add
            .image(
                halfCanvasWidth + this.padding,
                this.game.canvas.height - this.padding,
                "arrow-right"
            )
            .setOrigin(0, 1)
            .setDisplaySize(bottomPanelHeight * 2, bottomPanelHeight * 1.5)
            .setInteractive()
            .on("pointerdown", () => {
                this.incCurScoreStart();
                this.displayScores(this.curScoreStartIdx);
            });

        this.displayScores(0);
    }

    // doneButtonHandler() {
    //     window.close();
    // }

    async checkForUpdatedSession() {
        const res = await getSessionInfo(SESSION_ID ?? "");
        const newSession: SessionView = await res.json();

        if (!this.session) {
            console.error("Session not initialized yet!");
            return;
        }

        if (!isEqual(newSession.scoredUsers, this.session.scoredUsers)) {
            this.scene.restart();
        }
    }

    decCurScoreStart(): void {
        this.curScoreStartIdx = Math.max(0, this.curScoreStartIdx - 1);
    }

    incCurScoreStart(): void {
        if (!this.session) {
            console.warn(
                "Tried to change pages with out session initialized..."
            );
            return;
        }

        this.curScoreStartIdx = Math.min(
            Math.max(0, Object.values(this.session.scoredUsers).length - 1),
            this.curScoreStartIdx + 1
        );
    }

    displayScores(startIdx: number) {
        if (!this.session) {
            console.error("Session not initialized yet!");
            return;
        }

        this.textGroup.destroy(true, true);
        this.textGroup = this.add.group();

        Object.values(this.session.scoredUsers)
            .sort(this.sortScores)
            .slice(startIdx, startIdx + 2)
            .forEach((wordScore, idx) => {
                const targetCard = [this.leftangle, this.rightangle][idx];

                const nameText = this.add
                    .bitmapText(0, 0, "gothic", [
                        wordScore.name,
                        wordScore.score?.toString() ?? "waiting...",
                    ])
                    .setCenterAlign()
                    .setFontSize(this.FONT_SIZE);
                this.textGroup.add(nameText);

                Phaser.Display.Align.In.TopCenter(
                    nameText,
                    targetCard,
                    undefined,
                    -10
                );

                const wordScores = wordScore.words
                    .map((word) => {
                        return {
                            word: word,
                            score: getWordScore(word).toString(),
                        };
                    })
                    .sort(this.sortWordScores)
                    .slice(0, this.MAX_DISPLAYED_WORDS);

                const scoreTexts = this.add
                    .bitmapText(
                        0,
                        0,
                        "gothic",
                        wordScores.map(
                            (wScore) => `${wScore.word}  -  ${wScore.score}`
                        ),
                        this.FONT_SIZE
                    )
                    .setLeftAlign();
                this.textGroup.add(scoreTexts);

                Phaser.Display.Align.To.BottomLeft(
                    scoreTexts,
                    nameText,
                    undefined,
                    this.padding / 2
                );
                scoreTexts.setX(targetCard.x + this.padding / 2);
            });
    }

    sortWordScores(a: WordScore, b: WordScore) {
        // descending score order else ascending alphabetical order
        const aScore = parseInt(a.score) ?? Number.MIN_SAFE_INTEGER;
        const bScore = parseInt(b.score) ?? Number.MIN_SAFE_INTEGER;
        if (aScore !== bScore) {
            return bScore - aScore;
        } else {
            return a.word.localeCompare(b.word);
        }
    }

    sortScores(a: Scores, b: Scores) {
        if (!a.score && !b.score) return 0;
        else if (!a.score) return 1;
        else if (!b.score) return -1;

        return b.score - a.score;
    }
}

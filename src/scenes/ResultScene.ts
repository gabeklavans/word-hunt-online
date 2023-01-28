import { getSessionInfo } from "../api";
import { SESSION_ID } from "../Main";
import { getWordScore } from "../utils";
import { ceil, isEqual } from "lodash";

import {
    ScrollablePanel,
    RoundRectangle,
    Sizer,
    GridTable,
} from "phaser3-rex-plugins/templates/ui/ui-components";

export default class ResultScene extends Phaser.Scene {
    readonly FONT_SIZE = 30;
    readonly COLOR_PRIMARY = 0x4e342e;
    readonly COLOR_LIGHT = 0x7b5e57;
    readonly COLOR_DARK = 0x260e04;
    readonly MAX_DISPLAYED_WORDS = 11;

    doneButton!: Phaser.GameObjects.Rectangle;
    resultRefreshTimer!: Phaser.Time.TimerEvent;
    waitTextTimer!: Phaser.Time.TimerEvent;
    waitingText!: Phaser.GameObjects.BitmapText;

    padding!: number;

    leftangle!: Phaser.GameObjects.Rectangle;
    rightangle!: Phaser.GameObjects.Rectangle;
    prevScoresButton!: Phaser.GameObjects.Image;
    nextScoresButton!: Phaser.GameObjects.Image;

    session?: SessionView;
    panel!: ScrollablePanel;

    constructor() {
        super({ key: "result", active: false });
    }

    async create() {
        const halfCanvasWidth = this.game.canvas.width / 2;
        const halfCanvasHeight = this.game.canvas.height / 2;
        this.padding = halfCanvasWidth * 0.1;

        const topPanelHeight = this.game.canvas.height * 0.04;
        const bottomPanelHeight = this.game.canvas.height * 0.08;

        /******** Status text ********/
        let numDots = 0;

        const res = await getSessionInfo(SESSION_ID ?? "");
        this.session = await res.json();

        this.waitingText = this.add
            .bitmapText(
                this.cameras.main.centerX,
                this.padding / 2, // fun lil hack
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
            .on("pointerdown", console.log);

        this.nextScoresButton = this.add
            .image(
                halfCanvasWidth + this.padding,
                this.game.canvas.height - this.padding,
                "arrow-right"
            )
            .setOrigin(0, 1)
            .setDisplaySize(bottomPanelHeight * 2, bottomPanelHeight * 1.5)
            .setInteractive()
            .on("pointerdown", console.log);

        this.displayScores(0);
    }

    // doneButtonHandler() {
    //     window.close();
    // }

    createScoreRow(
        word?: Phaser.GameObjects.Text,
        score?: Phaser.GameObjects.Text,
        bg?: RoundRectangle
    ) {
        const background = bg ?? new RoundRectangle(this, 0, 0, 20, 20, 0);
        this.add.existing(background);

        const wordText =
            word ?? this.add.text(0, 0, "").setFontSize(this.FONT_SIZE);
        const scoreText =
            score ?? this.add.text(0, 0, "").setFontSize(this.FONT_SIZE);

        const sizer = new Sizer(this, {
            width: 260, // parent panel width - this.padding
            height: background.displayHeight,
            orientation: "x",
        })
            .addBackground(background)
            .add(wordText, 0, "center", { left: 10 }, false, "word")
            .addSpace()
            .add(scoreText, 0, "center", { right: 10 }, false, "score");
        this.add.existing(sizer);
        return sizer;
    }

    createScoreCard(userName: string, score: string, wordScores?: WordScore[]) {
        const background = new RoundRectangle(
            this,
            0,
            0,
            300,
            600,
            15,
            this.COLOR_PRIMARY
        );
        this.add.existing(background);

        const headerBg = new RoundRectangle(
            this,
            0,
            0,
            20,
            40,
            0,
            this.COLOR_DARK
        );
        this.add.existing(headerBg);

        const gridTable = new GridTable(this, {
            x: 0,
            y: 0,
            width: background.displayWidth,
            height: background.displayHeight,
            scrollMode: 0,
            background,
            header: this.createScoreRow(
                this.add
                    .text(0, 0, userName)
                    .setFontSize(this.FONT_SIZE)
                    .setStroke("white", 1),
                this.add
                    .text(0, 0, score)
                    .setFontSize(this.FONT_SIZE)
                    .setStroke("white", 1),
                headerBg
            ),
            // TODO: Add "scroll for more" footer maybe
            table: {
                cellHeight: 30,
                columns: 1,
                mask: {
                    padding: 2,
                },
                reuseCellContainer: true,
            },
            space: {
                left: 20,
                right: 20,
                top: 20,
                bottom: 20,

                table: 10,
                header: 10,
            },
            createCellContainerCallback: (cell, cellContainer: any) => {
                const item = cell.item as WordScore;
                if (!cellContainer) {
                    cellContainer = this.createScoreRow();
                    console.log(cell.index + ": create new cell-container");
                } else {
                    console.log(cell.index + ": reuse cell-container");
                }

                cellContainer.getElement("word").setText(item.word);
                cellContainer.getElement("score").setText(item.score);
                return cellContainer;
            },
            items: wordScores ?? [],
        });

        return gridTable;
    }

    createScrollPanel() {
        const panel = new Sizer(this, {
            orientation: "x",
            space: { item: 50, top: 20, bottom: 20 },
        });
        this.add.existing(panel);

        return panel;
    }

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

    displayScores(startIdx: number) {
        if (!this.session) {
            console.error("Session not initialized yet!");
            return;
        }

        Object.values(this.session.scoredUsers)
            .sort((wScoreA, wScoreB) => {
                if (!wScoreA.score && !wScoreB.score) return 0;
                else if (!wScoreA.score) return 1;
                else if (!wScoreB.score) return -1;

                return wScoreB.score - wScoreA.score;
            })
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

                console.log(scoreTexts.originX);

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
        // descending score order else ascending albabetical order
        const aScore = parseInt(a.score) ?? Number.MIN_SAFE_INTEGER;
        const bScore = parseInt(b.score) ?? Number.MIN_SAFE_INTEGER;
        if (aScore !== bScore) {
            return bScore - aScore;
        } else {
            return a.word.localeCompare(b.word);
        }
    }
}

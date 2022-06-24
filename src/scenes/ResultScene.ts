import { getSessionInfo } from "../api";
import { SESSION_ID } from "../Main";
import { getWordScore } from "../utils";

import {
    ScrollablePanel,
    RoundRectangle,
    Label,
    Sizer,
} from "phaser3-rex-plugins/templates/ui/ui-components";

const COLOR_PRIMARY = 0x4e342e;
const COLOR_LIGHT = 0x7b5e57;
const COLOR_DARK = 0x260e04;

export default class ResultScene extends Phaser.Scene {
    doneButton!: Phaser.GameObjects.Rectangle;
    resultRefreshTimer!: Phaser.Time.TimerEvent;
    waitTextTimer!: Phaser.Time.TimerEvent;
    waitingText!: Phaser.GameObjects.BitmapText;

    session?: SessionView;
    panel!: ScrollablePanel;

    constructor() {
        super({ key: "result", active: false });
    }

    async create() {
        const track = new RoundRectangle(this, 0, 0, 20, 10, 10, COLOR_DARK);
        this.add.existing(track);
        const thumb = new RoundRectangle(this, 0, 0, 0, 0, 13, COLOR_LIGHT);
        this.add.existing(thumb);
        this.panel = new ScrollablePanel(this, {
            x: 400,
            y: 300,
            width: 600,

            scrollMode: 1,

            panel: {
                child: this.createScrollPanel(),
            },

            slider: {
                track,
                thumb,
            },
        }).layout();
        this.add.existing(this.panel);

        this.waitingText = this.add
            .bitmapText(
                this.cameras.main.centerX,
                50,
                "gothic",
                "Waiting for results",
                25
            )
            .setTintFill(0x000000)
            .setOrigin(0.5)
            .setDepth(2);
        let numDots = 0;

        this.resultRefreshTimer = this.time.addEvent({
            delay: 3 * 1000,
            callback: this.setSessionInfo,
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

        // const buttonContainer = this.add.container(
        //     this.cameras.main.centerX,
        //     Math.floor(this.cameras.main.height * 0.75)
        // );
        // buttonContainer.add(
        //     this.add
        //         .rectangle(
        //             0,
        //             0,
        //             this.cameras.main.width * 0.3,
        //             this.cameras.main.height * 0.1,
        //             GOOD_COLOR
        //         )
        //         .setInteractive()
        //         .on("pointerdown", this.doneButtonHandler, this)
        // );
        // buttonContainer.add(
        //     this.add
        //         .text(0, 0, "Exit", {
        //             fontSize: `${this.cameras.main.height * 0.07}px`,
        //             color: "black",
        //         })
        //         .setOrigin(0.5)
        // );
    }

    // doneButtonHandler() {
    //     window.close();
    // }

    createScoreCard(content: string | string[]) {
        // TODO: Add a vertical scolling container here with a header
        const bg = new RoundRectangle(this, 0, 0, 200, 400, 20, COLOR_PRIMARY);
        this.add.existing(bg);

        const label = new Label(this, {
            orientation: "y",
            width: bg.displayWidth,
            height: bg.displayHeight,
            space: { top: 10, bottom: 10, left: 10, right: 10 },
            background: bg,
            text: this.add.bitmapText(0, 0, "gothic", content).setFontSize(15),

            align: "top",
        });
        return label;
    }

    createScrollPanel() {
        var panel = new Sizer(this, {
            orientation: "x",
            space: { item: 50, top: 20, bottom: 20 },
        });
        this.add.existing(panel);

        return panel;
    }

    async setSessionInfo() {
        const res = await getSessionInfo(SESSION_ID ?? "");
        const newSession: SessionView = await res.json();

        // if the session changed by having more scores, then update
        if (
            !this.session ||
            Object.keys(this.session.scoredUsers).length !=
                Object.keys(newSession.scoredUsers).length
        ) {
            this.session = newSession;
            const scoredUsers = Object.keys(this.session.scoredUsers);

            const displayWordList = (
                user: string,
                xOffset: number,
                xOrigin: number
            ) => {
                let words: string[] = [];
                const userInfo = this.session!.scoredUsers[user];
                if (user) {
                    const scoreText = userInfo.score
                        ? userInfo.score!.toString()
                        : "waiting...";

                    words.push(
                        ...[
                            userInfo.name + " - " + scoreText,
                            "--------", //
                        ]
                    );
                    words = words.concat(
                        this.session!.scoredUsers[user].words.map(
                            (word) => word + " - " + getWordScore(word)
                        )
                    );

                    // this.add
                    //     .text(xOffset, 100, words, {
                    //         color: "black",
                    //         fontSize: "25px",
                    //     })
                    //     .setDepth(1)
                    //     .setResolution(10)
                    //     .setOrigin(xOrigin, 0);

                    (
                        this.panel.getElement(
                            "panel"
                        ) as Phaser.GameObjects.Container
                    ).add(this.createScoreCard(words));
                    this.panel.layout();
                }
            };

            displayWordList(scoredUsers[0], 100, 0);
            displayWordList(scoredUsers[1], this.cameras.main.width - 100, 1);

            if (this.session.done) {
                this.resultRefreshTimer.remove();
                this.waitTextTimer.remove();
                this.waitingText.setText("Results!");
            }
        }
    }
}

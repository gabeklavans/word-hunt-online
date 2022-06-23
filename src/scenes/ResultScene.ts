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
    waitingText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: "result", active: false });
    }

    async create() {
        const track = new RoundRectangle(this, 0, 0, 20, 10, 10, COLOR_DARK);
        this.add.existing(track);
        const thumb = new RoundRectangle(this, 0, 0, 0, 0, 13, COLOR_LIGHT);
        this.add.existing(thumb);
        var panel = new ScrollablePanel(this, {
            x: 400,
            y: 300,
            width: 600,

            scrollMode: 1,

            panel: {
                child: this.CreatePanel(),
            },

            slider: {
                track,
                thumb,
            },
        }).layout();
        this.add.existing(panel);

        // Add new child
        const bg = new RoundRectangle(this, 0, 0, 200, 400, 20, COLOR_PRIMARY);
        this.add.existing(bg);
        (panel.getElement("panel") as Phaser.GameObjects.Container).add(
            this.CreatePaper("GGGG", bg)
        );
        // Layout scrollable panel again
        panel.layout();

        this.waitingText = this.add
            .text(this.cameras.main.centerX, 50, "Waiting for results", {
                color: "black",
                fontSize: "25px",
            })
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

        this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            this.cameras.main.width,
            this.cameras.main.height,
            0xffffff,
            Math.floor(255 * 0.2)
        );

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

    CreatePaper(content: string | string[], background: any) {
        const label = new Label(this, {
            orientation: "y",
            width: background.displayWidth,
            height: background.displayHeight,

            background: background,
            text: this.add.text(0, 0, content),

            align: "center",
        });
        return label;
    }

    CreatePanel() {
        var panel = new Sizer(this, {
            orientation: "x",
            space: { item: 50, top: 20, bottom: 20 },
        });
        this.add.existing(panel);

        var contentList = [
            ["AAAA", "ASDASD"],
            "BBBB",
            "CCCC",
            "DDDDD",
            "EEEEE",
            "FFFFF",
        ];
        for (var i = 0, cnt = contentList.length; i < cnt; i++) {
            const ting = new RoundRectangle(
                this,
                0,
                0,
                200,
                400,
                20,
                COLOR_PRIMARY
            );
            this.add.existing(ting);
            panel.add(this.CreatePaper(contentList[i], ting));
        }

        return panel;
    }

    async setSessionInfo() {
        const res = await getSessionInfo(SESSION_ID ?? "");
        const session: SessionView = await res.json();

        const scoredUsers = Object.keys(session.scoredUsers);

        const displayWordList = (
            user: string,
            xOffset: number,
            xOrigin: number
        ) => {
            let words: string[] = [];
            const userInfo = session.scoredUsers[user];
            if (user) {
                const scoreText = userInfo.score
                    ? userInfo.score!.toString()
                    : "waiting...";

                words.push(
                    ...[
                        userInfo.name + "\t-\t" + scoreText,
                        "",
                        "--------",
                        "", //
                    ]
                );
                words = words.concat(
                    session.scoredUsers[user].words.map(
                        (word) => word + "\t-\t" + getWordScore(word)
                    )
                );

                this.add
                    .text(xOffset, 100, words, {
                        color: "black",
                        fontSize: "25px",
                    })
                    .setDepth(1)
                    .setResolution(10)
                    .setOrigin(xOrigin, 0);
            }
        };

        displayWordList(scoredUsers[0], 100, 0);
        displayWordList(scoredUsers[1], this.cameras.main.width - 100, 1);

        if (session.done) {
            this.resultRefreshTimer.remove();
            this.waitTextTimer.remove();
            this.waitingText.setText("Results!");
        }
    }
}

import { getSessionInfo } from "../api";
import { SESSION_ID } from "../Main";
import { getWordScore } from "../utils";

export default class ResultScene extends Phaser.Scene {
    doneButton!: Phaser.GameObjects.Rectangle;
    resultRefreshTimer!: Phaser.Time.TimerEvent;
    waitTextTimer!: Phaser.Time.TimerEvent;
    waitingText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: "result", active: false });
    }

    async create() {
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

    async setSessionInfo() {
        const res = await getSessionInfo(SESSION_ID ?? "");
        const session: SessionView = await res.json();

        const scoredUsers = Object.keys(session.scores);

        const displayWordList = (
            user: string,
            xOffset: number,
            xOrigin: number
        ) => {
            let words: string[] = [];
            if (user) {
                words.push(
                    ...[
                        user + "\t-\t" + session.scores[user].score,
                        "",
                        "--------",
                        "",
                    ]
                );
                words = words.concat(
                    session.scores[user].words.map(
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

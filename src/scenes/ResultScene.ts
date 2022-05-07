import { GOOD_COLOR } from "../Main";

export default class ResultScene extends Phaser.Scene {
    doneButton!: Phaser.GameObjects.Rectangle;

    constructor() {
        super({ key: "result", active: false });
    }

    create() {
        this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            this.cameras.main.width,
            this.cameras.main.height,
            0xffffff,
            Math.floor(255 * 0.2)
        );

        this.add
            .text(
                this.cameras.main.centerX,
                this.cameras.main.centerY,
                "You're done.",
                {
                    color: "black",
                    fontSize: "10vh",
                }
            )
            .setOrigin(0.5);

        const buttonContainer = this.add.container(
            this.cameras.main.centerX,
            Math.floor(this.cameras.main.height * 0.75)
        );
        buttonContainer.add(
            this.add
                .rectangle(
                    0,
                    0,
                    this.cameras.main.width * 0.3,
                    this.cameras.main.height * 0.1,
                    GOOD_COLOR
                )
                .setInteractive()
                .on("pointerdown", this.doneButtonHandler, this)
        );
        buttonContainer.add(
            this.add
                .text(0, 0, "Exit", {
                    fontSize: `${this.cameras.main.height * 0.07}px`,
                    color: "black",
                })
                .setOrigin(0.5)
        );
    }

    doneButtonHandler() {
        // TODO: Exit the webpage
    }
}

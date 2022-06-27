import { BAD_COLOR, GOOD_COLOR, IS_SPECTATE } from "../Main";
import eventsCenter, { WHOEvents } from "../WHOEvents";

export default class SplashScene extends Phaser.Scene {
    boardDone = false;

    startButtonContainer!: Phaser.GameObjects.Container;
    startButton!: Phaser.GameObjects.Rectangle;
    startButtonText!: Phaser.GameObjects.BitmapText;

    constructor() {
        super({ key: "splash" });
    }

    create() {
        eventsCenter.on(WHOEvents.BoardDone, this.boardDoneHandler, this);

        this.add
            .bitmapText(
                this.cameras.main.centerX,
                300,
                "gothic",
                "Connect letters together to make as many words as you can."
            )
            .setOrigin(0.5)
            .setDepth(3)
            .setTintFill(0x000000)
            .setMaxWidth(600)
            .setCenterAlign()
            .setFontSize(30);

        this.add
            .rectangle(
                this.cameras.main.centerX,
                this.cameras.main.centerY,
                this.cameras.main.width,
                this.cameras.main.height,
                0xffffff
            )
            .setDepth(2)
            .setInteractive();

        this.startButton = this.add
            .rectangle(
                0,
                0,
                this.cameras.main.width * 0.3,
                this.cameras.main.height * 0.1,
                BAD_COLOR
            )
            .setName("button")
            .on("pointerdown", this.startButtonHandler, this);
        this.startButtonText = this.add
            .bitmapText(0, 0, "gothic", "Start!")
            .setOrigin(0.5);

        this.startButtonContainer = this.add
            .container(
                this.cameras.main.centerX,
                Math.floor(this.cameras.main.height * 0.75)
            )
            .add(this.startButton)
            .add(this.startButtonText)
            .setDepth(3);

        if (!IS_SPECTATE) {
            this.scene.launch("board");
        } else {
            this.scene.switch("result");
        }
    }

    startButtonHandler() {
        eventsCenter.emit(WHOEvents.GameStart);
        this.scene.stop();
    }

    boardDoneHandler() {
        this.startButtonContainer.getByName("button").setInteractive();
        if (this.startButtonContainer) {
            this.startButton.fillColor = GOOD_COLOR;
        }
        this.boardDone = true;
    }
}

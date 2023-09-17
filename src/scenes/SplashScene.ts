import { Scene, GameObjects } from "phaser";

import { BAD_COLOR, GOOD_COLOR, SESSION_ID, USER_ID } from "../Main";
import eventsCenter, { WHOEvents } from "../WHOEvents";
import { notifyPlayerStarted } from "../api";
import CircleBars from "../spinners/basic/CircleBars";

export class SplashScene extends Scene {
	boardDone = false;

	startButtonContainer!: GameObjects.Container;
	startButton!: GameObjects.Rectangle;
	startButtonText!: GameObjects.BitmapText;
	circleBarsSpinner!: CircleBars;

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
		this.startButtonText = this.add.bitmapText(0, 0, "gothic", "Start!").setOrigin(0.5);

		this.startButtonContainer = this.add
			.container(this.cameras.main.centerX, Math.floor(this.cameras.main.height * 0.75))
			.add(this.startButton)
			.add(this.startButtonText)
			.setDepth(3);

		this.circleBarsSpinner = CircleBars.create(
			this,
			this.cameras.main.centerX,
			this.cameras.main.centerY,
			50,
			0x000000
		).play();

		this.scene.launch("board");
	}

	async startButtonHandler() {
		eventsCenter.emit(WHOEvents.GameStart);
		// TODO: null handle
		await notifyPlayerStarted(SESSION_ID as string, USER_ID as string);
		this.scene.stop();
	}

	boardDoneHandler() {
		this.startButtonContainer.getByName("button").setInteractive();
		if (this.startButtonContainer) {
			this.startButton.fillColor = GOOD_COLOR;
		}
		this.boardDone = true;
		// "delete" the spinner
		this.circleBarsSpinner.setPosition(2000, 2000);
	}
}

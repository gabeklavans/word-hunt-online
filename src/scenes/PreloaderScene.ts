import { Scene } from "phaser";

export class PreloaderScene extends Scene {
	constructor() {
		super("preloader");
	}

	preload(): void {
		this.load.image("acho", "assets/acho.png");
		this.load.bitmapFont(
			"gothic",
			"https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/assets/fonts/gothic.png",
			"https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/assets/fonts/gothic.xml"
		);

		this.load.audio("drag", "assets/sfx/drag.mp3");
		this.load.audio("good", "assets/sfx/bing.mp3");
		this.load.audio("bad", "assets/sfx/bonk.mp3");
		this.load.audio("found", "assets/sfx/beng.mp3");
	}

	create(): void {
		const graphics = this.add.graphics();
		graphics.fillStyle(0xffffff, 1);
		//  32px radius on the corners
		graphics.fillRoundedRect(10, 10, 180, 180, 32);
		graphics.generateTexture("tile", 200, 200);

		this.add.text(0, 0, "loading...", {
			fontFamily: "Interstate",
		});

		this.scene.start("splash");
	}
}

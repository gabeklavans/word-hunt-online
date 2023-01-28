export default class Preloader extends Phaser.Scene {
    constructor() {
        super("preloader");
    }

    preload(): void {
        this.load.image("acho", "assets/acho.png");
        this.load.image("arrow-right", "assets/arrow.png");
        this.load.bitmapFont(
            "gothic",
            "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/assets/fonts/gothic.png",
            "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/assets/fonts/gothic.xml"
        );
    }

    create(): void {
        const graphics = this.add.graphics();
        graphics.fillStyle(0xffffff, 1);
        //  32px radius on the corners
        graphics.fillRoundedRect(10, 10, 180, 180, 32);
        graphics.generateTexture("tile", 200, 200);
        
        // this is totally me when I force the site to load this font
        this.add.text(0, 0, "loading...", {
            fontFamily: "Interstate",
        });

        this.scene.start("splash");
    }
}

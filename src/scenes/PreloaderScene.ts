export default class Preloader extends Phaser.Scene {
    constructor() {
        super("preloader");
    }

    preload(): void {
        this.load.image("acho", "assets/acho.png");
        this.load.scenePlugin(
            "rexuiplugin",
            "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js",
            "rexUI",
            "rexUI"
        );
    }

    create(): void {
        const graphics = this.add.graphics();
        graphics.fillStyle(0xffffff, 1);
        //  32px radius on the corners
        graphics.fillRoundedRect(10, 10, 180, 180, 32);
        graphics.generateTexture("tile", 200, 200);

        this.scene.start("splash");
    }
}

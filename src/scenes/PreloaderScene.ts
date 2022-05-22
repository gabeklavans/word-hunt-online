export default class Preloader extends Phaser.Scene {
    constructor() {
        super("preloader");
    }

    preload(): void {
        this.load.image("acho", "assets/acho.png");
    }

    create(): void {
        this.scene.start("splash");
    }
}

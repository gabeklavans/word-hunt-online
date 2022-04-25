export default class SplashScene extends Phaser.Scene {
    constructor() {
        super({ key: 'splash' });
    }

    create() {
        this.scene.launch('board');
        this.scene.switch('board');

        const overlayGroup = this.add.group();
        overlayGroup.add(
            this.add.rectangle(
                this.cameras.main.centerX,
                this.cameras.main.centerY,
                this.cameras.main.width,
                this.cameras.main.height,
                0xffffff,
                254 / 2
            )
        );
        const overlayButton = this.add
            .rectangle(
                this.cameras.main.centerX,
                Math.floor(this.cameras.main.height * 0.75),
                80,
                30,
                0xff0000
            )
            .on('pointerdown', () => {
                overlayGroup.destroy(true, true);
            });
        overlayGroup.add(overlayButton);
        overlayGroup.setDepth(100);
    }
}

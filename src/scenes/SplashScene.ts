import eventsCenter, { WHOEvents } from '../WHOEvents';

export default class SplashScene extends Phaser.Scene {
    overlayButton!: Phaser.GameObjects.Rectangle;
    overlayGroup!: Phaser.GameObjects.Group;

    constructor() {
        super({ key: 'splash' });
    }

    create() {
        eventsCenter.on(WHOEvents.BoardDone, this.boardDoneHandler, this);

        this.overlayGroup = this.add.group();
        this.overlayGroup.add(
            this.add.rectangle(
                this.cameras.main.centerX,
                this.cameras.main.centerY,
                this.cameras.main.width,
                this.cameras.main.height,
                0xffffff,
                254 / 2
            )
        );
        this.overlayButton = this.add
            .rectangle(
                this.cameras.main.centerX,
                Math.floor(this.cameras.main.height * 0.75),
                80,
                30,
                0xff0000
            )
            .on('pointerdown', this.startButtonHandler, this);
        this.overlayGroup.add(this.overlayButton);
        this.overlayGroup.setDepth(100);

        this.scene.launch('board');
    }

    startButtonHandler() {
        eventsCenter.emit(WHOEvents.GameStart);
        this.scene.stop();
    }

    boardDoneHandler() {
        this.overlayGroup
            .getChildren()
            .forEach((child) => child.setInteractive());
        this.overlayButton.fillColor = 0x00ff00;
    }
}

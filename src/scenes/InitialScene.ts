export default class InitialScene extends Phaser.Scene {
    tileGroup!: Phaser.GameObjects.Group;
    currentChain!: [];

    readonly LETTER_SPRITE_SIZE = 70;
    isDragging = false;

    constructor() {
        super('initial');
    }

    create(): void {
        // listeners
        this.input.addListener('pointerup', () => this.endChain());

        // the rest
        this.tileGroup = this.add.group({
            classType: Phaser.GameObjects.Image,
        });

        const rowSize = 3;
        for (let i = 0; i < rowSize; i++) {
            this.tileGroup.add(
                this.add
                    .image(
                        this.cameras.main.width / 2 +
                            (i - Math.floor(rowSize / 2)) * 100,
                        200,
                        'acho'
                    )
                    .setDisplaySize(
                        this.LETTER_SPRITE_SIZE,
                        this.LETTER_SPRITE_SIZE
                    )
            );

            for (const child of this.tileGroup.getChildren()) {
                const childImage = child as Phaser.GameObjects.Image;
                childImage
                    .setInteractive(
                        new Phaser.Geom.Circle(
                            childImage.height / 2,
                            childImage.width / 2,
                            childImage.height / 2
                        ),
                        Phaser.Geom.Circle.Contains
                    )
                    .on('pointerover', () => this.addToChain(childImage))
                    .on('pointerdown', () => this.startChain(childImage));
            }
        }
    }

    startChain(tile: Phaser.GameObjects.Image) {
        this.isDragging = true;
        tile.setTint(0x00ff00);
    }

    addToChain(tile: Phaser.GameObjects.Image) {
        if (this.isDragging) {
            tile.setTint(0xff0000);
        }
    }

    endChain() {
        this.isDragging = false;
        this.tileGroup.setTint(0xffffff);
    }
}

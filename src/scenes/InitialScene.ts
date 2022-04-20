export default class InitialScene extends Phaser.Scene {
    readonly LETTER_SPRITE_SIZE = 70;
    isDragging = false;

    constructor() {
        super('initial');
    }

    create(): void {
        // listeners
        this.input.addListener('pointerup', () => {
            this.isDragging = false;
            console.log('ya up');
        });

        // the rest
        const tileGroup = this.add.group({
            classType: Phaser.GameObjects.Image,
        });
        console.log(this.cameras.main.width);

        const rowSize = 3;
        for (let i = 0; i < rowSize; i++) {
            tileGroup.add(
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

            for (const child of tileGroup.getChildren()) {
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
                    .on('pointerover', () => this.startChain(childImage))
                    .on('pointerdown', () => {
                        this.isDragging = true;
                        childImage.setTint(0x00ff00);
                    });
            }
        }
    }

    startChain(tile: Phaser.GameObjects.Image) {
        if (this.isDragging) {
            tile.setTint(0xff0000);
        }
    }
}

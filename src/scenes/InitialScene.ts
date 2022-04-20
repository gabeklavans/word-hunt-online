export default class InitialScene extends Phaser.Scene {
    imageGroup!: Phaser.GameObjects.Group;
    tileContainerGroup!: Phaser.GameObjects.Group;
    tileGrid: Tile[][] = [];

    currentChain: Tile[] = [];

    readonly LETTER_SPRITE_SIZE = 100;
    readonly GRID_SIZE = 5;
    isDragging = false;

    constructor() {
        super('initial');

        for (let i = 0; i < this.GRID_SIZE; i++) {
            this.tileGrid.push([]);
        }
    }

    create(): void {
        // listeners
        this.input.addListener('pointerup', () => this.endChain());

        // the rest
        this.imageGroup = this.add.group();
        this.tileContainerGroup = this.add.group();

        // create all images and add to containers
        for (let i = 0; i < this.GRID_SIZE; i++) {
            for (let col = 0; col < this.GRID_SIZE; col++) {
                const image = this.add
                    .image(0, 0, 'acho')
                    .setDisplaySize(
                        this.LETTER_SPRITE_SIZE,
                        this.LETTER_SPRITE_SIZE
                    )
                    .setName('image');
                const tileContainer = this.add.container(
                    this.cameras.main.width / 2 +
                        (i - Math.floor(this.GRID_SIZE / 2)) *
                            this.LETTER_SPRITE_SIZE,
                    this.cameras.main.height / 2 +
                        (col - Math.floor(this.GRID_SIZE / 2)) *
                            this.LETTER_SPRITE_SIZE,
                    image
                );
                this.tileGrid[i].push({
                    letter: 'A',
                    container: tileContainer,
                });
                this.imageGroup.add(image);
            }
        }

        // set up containers
        for (const tileRow of this.tileGrid) {
            for (const tile of tileRow) {
                const tileContainer = tile.container;
                const tileImage = tileContainer.getByName(
                    'image'
                ) as Phaser.GameObjects.Image;

                // enable interactions
                tileContainer
                    .setInteractive(
                        new Phaser.Geom.Circle(
                            0,
                            0,
                            tileImage.displayHeight / 2
                        ),
                        Phaser.Geom.Circle.Contains
                    )
                    .on('pointerover', () => this.addToChain(tile))
                    .on('pointerdown', () => this.startChain(tile));

                // draw on letters
                tileContainer.add(
                    this.add
                        .text(0, 0, tile.letter.toUpperCase(), {
                            color: 'black',
                            fontSize: `${this.LETTER_SPRITE_SIZE / 2}px`,
                        })
                        .setOrigin(0.5)
                );
            }
        }

        this.add
            .rectangle(
                this.tileGrid[0][0].container.getBounds().x,
                this.tileGrid[0][0].container.getBounds().y,
                this.LETTER_SPRITE_SIZE * this.GRID_SIZE,
                this.LETTER_SPRITE_SIZE * this.GRID_SIZE
            )
            .setOrigin(0, 0)
            .setStrokeStyle(2, 0x00ff00);
    }

    startChain(tile: Tile) {
        this.isDragging = true;
        const tileImage = tile.container.getByName(
            'image'
        ) as Phaser.GameObjects.Image;
        tileImage.setTint(0x00ff00);

        this.currentChain.push(tile);
    }

    addToChain(tile: Tile) {
        if (this.isDragging) {
            if (!this.currentChain.includes(tile)) {
                const tileImage = tile.container.getByName(
                    'image'
                ) as Phaser.GameObjects.Image;
                tileImage.setTint(0xff0000);
                this.currentChain.push(tile);
            } else {
                this.endChain();
            }
        }
    }

    endChain() {
        if (this.isDragging) {
            this.imageGroup.setTint(0xffffff);
            this.currentChain = [];
        }
        this.isDragging = false;
    }
}

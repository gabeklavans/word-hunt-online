const DEBUG = true;

export default class InitialScene extends Phaser.Scene {
    imageGroup!: Phaser.GameObjects.Group;
    tileContainerGroup!: Phaser.GameObjects.Group;
    tileGrid: Tile[][] = [];
    graphics!: Phaser.GameObjects.Graphics;

    currentChain: Tile[] = [];

    LETTER_SPRITE_SIZE!: number;
    readonly GRID_SIZE = 4;
    isDragging = false;

    constructor() {
        super('initial');

        for (let i = 0; i < this.GRID_SIZE; i++) {
            this.tileGrid.push([]);
        }
    }

    create(): void {
        const gameWidth = this.game.config.width;
        this.LETTER_SPRITE_SIZE =
            typeof gameWidth === 'string'
                ? parseInt(gameWidth) / (this.GRID_SIZE + 1)
                : gameWidth / (this.GRID_SIZE + 1);
        // listeners
        this.input.addListener('pointerup', () => {
            this.endChain();
        });

        // the rest
        this.imageGroup = this.add.group();
        this.tileContainerGroup = this.add.group();

        // create all images and add to containers
        for (let row = 0; row < this.GRID_SIZE; row++) {
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
                        (row - this.GRID_SIZE / 2) * this.LETTER_SPRITE_SIZE +
                        this.LETTER_SPRITE_SIZE / 2,
                    this.cameras.main.height / 2 +
                        (col - this.GRID_SIZE / 2) * this.LETTER_SPRITE_SIZE +
                        this.LETTER_SPRITE_SIZE / 2,
                    image
                );
                this.tileGrid[row].push({
                    letter: 'A',
                    container: tileContainer,
                    row: row,
                    col: col,
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
                    .on('pointerover', () => {
                        this.handleAddToChain(tile);
                    })
                    .on('pointerdown', () => {
                        this.startChain(tile);
                    });

                if (DEBUG) {
                    this.input.enableDebug(tileContainer, 0x0000ff);
                }
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

        this.graphics = this.add.graphics({
            lineStyle: { width: 4, color: 0xaa00aa },
        });

        // add the board boundary
        const boardBox = this.add
            .rectangle(
                this.tileGrid[0][0].container.getBounds().x,
                this.tileGrid[0][0].container.getBounds().y,
                this.LETTER_SPRITE_SIZE * this.GRID_SIZE,
                this.LETTER_SPRITE_SIZE * this.GRID_SIZE
            )
            .setOrigin(0, 0)
            .setInteractive(
                new Phaser.Geom.Rectangle(
                    this.tileGrid[0][0].container.getBounds().x,
                    this.tileGrid[0][0].container.getBounds().y,
                    this.LETTER_SPRITE_SIZE * this.GRID_SIZE,
                    this.LETTER_SPRITE_SIZE * this.GRID_SIZE
                ),
                this.pointExitRect
            )
            .on('pointerover', () => this.endChain())
            .setDepth(-1);

        if (DEBUG) {
            boardBox.setStrokeStyle(2, 0x00ff00);
            console.log(this.tileGrid);
        }
    }

    pointExitRect(rect: Phaser.Geom.Rectangle, x: number, y: number) {
        return x < 0 || y < 0 || x > rect.width || y > rect.height;
    }

    startChain(tile: Tile) {
        const tileImage = tile.container.getByName(
            'image'
        ) as Phaser.GameObjects.Image;
        tileImage.setTint(0x00ff00);
        this.currentChain.push(tile);
        this.isDragging = true;
    }

    handleAddToChain(tile: Tile) {
        if (this.isDragging) {
            if (!this.currentChain.includes(tile)) {
                // check for skipped tiles and fill them in for the player
                const lastTileInChain =
                    this.currentChain[this.currentChain.length - 1];
                if (
                    Phaser.Math.Distance.Between(
                        lastTileInChain.row,
                        lastTileInChain.col,
                        tile.row,
                        tile.col
                    ) > Math.sqrt(2)
                ) {
                    // skipped tiles detected!
                    // draw a line and fill in the intersected tiles
                    const intersectLine = new Phaser.Geom.Line(
                        lastTileInChain.container.x,
                        lastTileInChain.container.y,
                        tile.container.x,
                        tile.container.y
                    );

                    // loop thru all the tiles' hitboxes and check for intersect,
                    // cause I can't figure out a better way to do it using Phaser...
                    for (const childTile of this.tileGrid.flat()) {
                        const childContainer =
                            childTile.container as Phaser.GameObjects.Container;
                        if (
                            Phaser.Geom.Intersects.LineToCircle(
                                intersectLine,
                                new Phaser.Geom.Circle(
                                    childContainer.x,
                                    childContainer.y,
                                    (
                                        childContainer.input
                                            .hitArea as Phaser.Geom.Circle
                                    ).radius
                                )
                            )
                        ) {
                            this.addToChain(childTile);
                        }
                    }
                }

                // finally push the current tile to the chain
                this.addToChain(tile);
            } else if (this.currentChain.length > 1) {
                // needs a > 1 check cause touch events happen too fast
                this.endChain();
            }
        }
    }

    addToChain(tile: Tile) {
        if (!this.currentChain.includes(tile)) {
            const tileImage = tile.container.getByName(
                'image'
            ) as Phaser.GameObjects.Image;
            tileImage.setTint(0xff0000);

            this.currentChain.push(tile);
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

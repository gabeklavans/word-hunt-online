import eventsCenter, { WHOEvents } from "../WHOEvents";
import { DEBUG, SESSION_ID, USER_ID } from "../Main";
import { getWordScore, pointExitRect } from "../utils";

export default class BoardScene extends Phaser.Scene {
    imageGroup!: Phaser.GameObjects.Group;
    tileContainerGroup!: Phaser.GameObjects.Group;
    gameTimeText!: Phaser.GameObjects.Text;
    gameTimer?: Phaser.Time.TimerEvent;
    tileGrid: Tile[][] = [];

    currentChain: Tile[] = [];
    foundWords: Set<string> = new Set();

    isDragging = false;
    boardWords = new Set<string>();

    curScore = 0;

    LETTER_SPRITE_SIZE!: number;
    readonly GRID_SIZE = 4;
    readonly GAME_TIME_SECS = 5;
    readonly DRAG_COLOR = 0xffffff;
    readonly VALID_COLOR = 0x00ff00;
    readonly REPEAT_COLOR = 0xfcd303;
    readonly IDLE_COLOR = 0xad5100;

    constructor() {
        super({ key: "board", visible: false });

        for (let i = 0; i < this.GRID_SIZE; i++) {
            this.tileGrid.push([]);
        }
    }

    async create() {
        // events
        eventsCenter.on(WHOEvents.GameStart, this.handleGameStart, this);

        // initialize variables
        const gameWidth = this.game.config.width;
        this.LETTER_SPRITE_SIZE =
            typeof gameWidth === "string"
                ? parseInt(gameWidth) / (this.GRID_SIZE + 1)
                : gameWidth / (this.GRID_SIZE + 1);
        this.imageGroup = this.add.group();
        this.tileContainerGroup = this.add.group();

        // global intput listeners
        this.input.addListener("pointerup", () => {
            this.endChain();
        });

        // get a board from API
        console.log(SESSION_ID);

        const response = await fetch(
            `http://localhost:3000/who/board/${SESSION_ID}`,
            {
                method: "GET",
            }
        );
        const boardData: BoardData = await response.json();
        if (DEBUG) {
            console.log("Board data:");
            console.log(boardData);
        }
        this.boardWords = new Set<string>(boardData.words);

        // draw objects
        this.drawBoard(boardData.board);
        console.log(this.tileGrid[0][0].container?.getBounds().y);

        this.gameTimeText = this.add
            .text(
                this.cameras.main.centerX,
                (this.tileGrid[0][0].container?.getBounds().y ?? 80) / 2,
                "Time remaining:",
                {
                    color: "black",
                    fontSize: `${Math.floor(
                        (this.tileGrid[0][0].container?.getBounds().y ?? 80) / 2
                    )}px`,
                }
            )
            .setOrigin(0.5)
            .setVisible(false);

        this.imageGroup.setTint(this.IDLE_COLOR);

        // tell splash screen we've got a valid board
        eventsCenter.emit(WHOEvents.BoardDone);
    }

    update(): void {
        if (this.gameTimer && this.gameTimeText.visible) {
            this.gameTimeText.setText(
                `Time remaining: ${Math.ceil(
                    this.gameTimer.getRemainingSeconds()
                )} seconds`
            );
        }
    }

    updateChainColors(color: number) {
        this.currentChain.forEach((tile) =>
            (
                tile.container?.getByName("image") as Phaser.GameObjects.Image
            ).setTint(color)
        );
    }

    handleGameStart() {
        this.gameTimeText.setVisible(true);
        this.gameTimer = this.time.delayedCall(
            this.GAME_TIME_SECS * 1000,
            this.handleGameEnd,
            [],
            this
        );
    }

    handleGameEnd() {
        if (DEBUG) {
            console.log("Game over!");
        }
        // send result to bot
        fetch(`http://localhost:3000/who/result/${SESSION_ID}/${USER_ID}`, {
            method: "POST",
            body: JSON.stringify({
                score: this.curScore,
                words: Array.from(this.foundWords),
            }),
        });
        // TODO: make sure this doesn't cut off the fetch above
        this.scene.switch("result");
    }

    drawBoard(board: BoardLetters) {
        for (let row = 0; row < this.GRID_SIZE; row++) {
            for (let col = 0; col < this.GRID_SIZE; col++) {
                const tileImage = this.add
                    .image(0, 0, "acho")
                    .setDisplaySize(
                        this.LETTER_SPRITE_SIZE,
                        this.LETTER_SPRITE_SIZE
                    )
                    .setName("image");
                const tileContainer = this.add
                    .container(
                        this.cameras.main.width / 2 +
                            (col - this.GRID_SIZE / 2) *
                                this.LETTER_SPRITE_SIZE +
                            this.LETTER_SPRITE_SIZE / 2,
                        this.cameras.main.height / 2 +
                            (row - this.GRID_SIZE / 2) *
                                this.LETTER_SPRITE_SIZE +
                            this.LETTER_SPRITE_SIZE / 2,
                        tileImage
                    )
                    .setVisible(false);

                const tile: Tile = {
                    letter: board[row * this.GRID_SIZE + col],
                    container: tileContainer,
                    row,
                    col,
                };

                // draw on letters
                tileContainer.add(
                    this.add
                        .text(0, 0, tile.letter.toUpperCase(), {
                            color: "black",
                            fontSize: `${this.LETTER_SPRITE_SIZE / 2}px`,
                        })
                        .setOrigin(0.5)
                );

                // add to structs
                this.tileGrid[row][col] = tile;
                this.imageGroup.add(tileImage);
                this.tileContainerGroup.add(tileContainer);

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
                    .on("pointerover", () => {
                        this.handleAddToChain(tile);
                    })
                    .on("pointerdown", () => {
                        this.startChain(tile);
                    });

                if (DEBUG) {
                    this.input.enableDebug(tileContainer, 0x0000ff);
                }

                tileContainer.setVisible(true);
            }
        }

        // add the board boundary
        const topLeftContainer = this.tileGrid[0][0].container;
        if (topLeftContainer) {
            const boardBox = this.add
                .rectangle(
                    topLeftContainer.getBounds().x,
                    topLeftContainer.getBounds().y,
                    this.LETTER_SPRITE_SIZE * this.GRID_SIZE,
                    this.LETTER_SPRITE_SIZE * this.GRID_SIZE
                )
                .setOrigin(0, 0)
                .setInteractive(
                    new Phaser.Geom.Rectangle(
                        topLeftContainer.getBounds().x,
                        topLeftContainer.getBounds().y,
                        this.LETTER_SPRITE_SIZE * this.GRID_SIZE,
                        this.LETTER_SPRITE_SIZE * this.GRID_SIZE
                    ),
                    pointExitRect
                )
                .on("pointerover", () => this.endChain())
                .setDepth(-1);

            if (DEBUG) {
                boardBox.setStrokeStyle(2, 0x00ff00);
            }
        } else {
            console.error("There was a timing issue...");
            console.error(
                "Bounding box tried to draw before top left container was defined"
            );

            // TODO: Replace with an error scene
            this.game.destroy(true, true);
        }

        this.scene.setVisible(true);
    }

    startChain(tile: Tile) {
        this.isDragging = true;
        this.handleAddToChain(tile);
    }

    handleAddToChain(tile: Tile) {
        if (this.isDragging) {
            if (!this.currentChain.includes(tile)) {
                // check for skipped tiles and fill them in for the player
                const lastTileInChain =
                    this.currentChain.length > 0
                        ? this.currentChain[this.currentChain.length - 1]
                        : undefined;
                if (
                    lastTileInChain &&
                    Phaser.Math.Distance.Between(
                        lastTileInChain.row,
                        lastTileInChain.col,
                        tile.row,
                        tile.col
                    ) > Math.sqrt(2)
                ) {
                    if (lastTileInChain.container && tile.container) {
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
                    } else {
                        console.error("Containers not initialized");
                        // TODO: Error scene
                        this.game.destroy(true, true);
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
            this.currentChain.push(tile);

            const word = this.currentChain.map((tile) => tile.letter).join("");
            if (this.foundWords.has(word)) {
                this.updateChainColors(this.REPEAT_COLOR);
            } else if (this.boardWords.has(word)) {
                this.updateChainColors(this.VALID_COLOR);
            } else {
                this.updateChainColors(this.DRAG_COLOR);
            }
        }
    }

    endChain() {
        if (this.isDragging) {
            this.imageGroup.setTint(this.IDLE_COLOR);

            const word = this.currentChain.map((tile) => tile.letter).join("");
            if (!this.foundWords.has(word)) {
                if (this.boardWords.has(word)) {
                    const wordScore = getWordScore(word);
                    if (DEBUG) {
                        console.log(
                            `Found word "${word}" of score: ${wordScore}`
                        );
                    }
                    this.curScore += wordScore;
                    this.foundWords.add(word);
                }
            } else {
                // TODO: do some already found effect on the chain
            }

            this.currentChain = [];
        }
        this.isDragging = false;
        console.log(`cur score: ${this.curScore}`);
    }
}

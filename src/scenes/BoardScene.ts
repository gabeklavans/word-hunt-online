import { TextFrequency } from 'correct-frequency-random-letters';
import eventsCenter, { WHOEvents } from '../WHOEvents';
const letterGenerator = new TextFrequency();
import { DEBUG } from '../Main';

export default class BoardScene extends Phaser.Scene {
    imageGroup!: Phaser.GameObjects.Group;
    tileContainerGroup!: Phaser.GameObjects.Group;
    tileGrid: Tile[][] = [];

    currentChain: Tile[] = [];

    isDragging = false;
    boardWords = new Set<string>();

    curScore = 0;

    LETTER_SPRITE_SIZE!: number;
    readonly GRID_SIZE = 4;

    constructor() {
        super({ key: 'board', visible: false });

        for (let i = 0; i < this.GRID_SIZE; i++) {
            this.tileGrid.push([]);
        }
    }

    create(): void {
        // events
        eventsCenter.on(WHOEvents.GameStart, this.drawBoard, this);

        // initialize variables
        const gameWidth = this.game.config.width;
        this.LETTER_SPRITE_SIZE =
            typeof gameWidth === 'string'
                ? parseInt(gameWidth) / (this.GRID_SIZE + 1)
                : gameWidth / (this.GRID_SIZE + 1);
        this.imageGroup = this.add.group();
        this.tileContainerGroup = this.add.group();

        // global intput listeners
        this.input.addListener('pointerup', () => {
            this.endChain();
        });

        this.generateGoodBoard().then(() => {
            // tell splash screen we've got a valid board
            eventsCenter.emit(WHOEvents.BoardDone);
        });
    }

    async generateGoodBoard() {
        while (this.boardWords.size < 1) {
            if (DEBUG) {
                console.log('generating new board...');
            }

            for (let row = 0; row < this.GRID_SIZE; row++) {
                for (let col = 0; col < this.GRID_SIZE; col++) {
                    this.tileGrid[row][col] = {
                        letter: letterGenerator.random(),
                        row: row,
                        col: col,
                    };
                }
            }

            // get all the words in the board
            // const foundWords = await this.getWordsTabulationBroken(
            //     this.tileGrid
            // );
            // this.boardWords = foundWords;
            await this.getWordsRecursion();
            if (DEBUG) {
                // eslint-disable-next-line no-console
                console.log(this.boardWords);
            }
        }

        if (DEBUG) {
            // eslint-disable-next-line no-console
            console.log(this.tileGrid);
        }
    }

    drawBoard() {
        for (const tileRow of this.tileGrid) {
            for (const tile of tileRow) {
                const tileImage = this.add
                    .image(0, 0, 'acho')
                    .setDisplaySize(
                        this.LETTER_SPRITE_SIZE,
                        this.LETTER_SPRITE_SIZE
                    )
                    .setName('image');
                const tileContainer = this.add
                    .container(
                        this.cameras.main.width / 2 +
                            (tile.col - this.GRID_SIZE / 2) *
                                this.LETTER_SPRITE_SIZE +
                            this.LETTER_SPRITE_SIZE / 2,
                        this.cameras.main.height / 2 +
                            (tile.row - this.GRID_SIZE / 2) *
                                this.LETTER_SPRITE_SIZE +
                            this.LETTER_SPRITE_SIZE / 2,
                        tileImage
                    )
                    .setVisible(false);

                tile.container = tileContainer;
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
                    this.pointExitRect
                )
                .on('pointerover', () => this.endChain())
                .setDepth(-1);

            if (DEBUG) {
                boardBox.setStrokeStyle(2, 0x00ff00);
            }
        } else {
            console.error('There was a timing issue...');
            console.error(
                'Bounding box tried to draw before top left container was defined'
            );

            // TODO: Replace with an error scene
            this.game.destroy(true, true);
        }

        this.scene.setVisible(true);
    }

    pointExitRect(rect: Phaser.Geom.Rectangle, x: number, y: number) {
        return x < 0 || y < 0 || x > rect.width || y > rect.height;
    }

    startChain(tile: Tile) {
        const tileImage = tile.container?.getByName(
            'image'
        ) as Phaser.GameObjects.Image;
        if (tileImage) {
            tileImage.setTint(0x00ff00);
            this.currentChain.push(tile);
            this.isDragging = true;
        } else {
            console.error('Container not initialized');
            // TODO: error scene
            this.game.destroy(true, true);
        }
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
                        console.error('Containers not initialized');
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
            const tileImage = tile.container?.getByName(
                'image'
            ) as Phaser.GameObjects.Image;
            if (tileImage) {
                tileImage.setTint(0xff0000);

                this.currentChain.push(tile);
            } else {
                console.error('Container not initialized...');
                // TODO: Error scene
                this.game.destroy(true, true);
            }
        }
    }

    endChain() {
        if (this.isDragging) {
            this.imageGroup.setTint(0xffffff);

            const word = this.currentChain.map((tile) => tile.letter).join('');
            if (this.boardWords.has(word)) {
                const wordScore = this.getWordScore(word);
                console.log(`word score: ${wordScore}`);
                this.curScore += wordScore;
            }

            this.currentChain = [];
        }
        this.isDragging = false;
        console.log(`cur score: ${this.curScore}`);
    }

    getWordScore(word: string) {
        let score = 0;
        for (let i = 3; i <= word.length; i++) {
            // trying to emulate what I'm seeing in the scores of word hunt
            switch (i) {
                case 3:
                    score += 100;
                    break;
                case 4:
                    score += 300;
                    break;
                case 6:
                    score += 600;
                    break;
                default:
                    score += 400;
            }
        }
        return score;
    }

    /**
     * follows method at https://www.geeksforgeeks.org/boggle-find-possible-words-board-characters/?ref=lbp
     */
    async getWordsRecursion() {
        this.boardWords = new Set();
        const dict = await this.loadSpellCheck();
        for (const destTile of this.tileGrid.flat()) {
            const foundWords = new Set<string>();
            this.getWordsRecursionHelper(
                destTile,
                new Set<Tile>(),
                '',
                foundWords,
                dict
            );
            console.log(`found for ${destTile.letter}:`);
            console.log(foundWords);
            foundWords.forEach((foundWord) => this.boardWords.add(foundWord));
        }
    }

    getWordsRecursionHelper(
        source: Tile,
        visited: Set<Tile>,
        word: string,
        foundWords: Set<string>,
        dict: Set<string>
    ) {
        visited.add(source);
        word += source.letter;
        if (word.length >= 3 && dict.has(word.toLowerCase())) {
            foundWords.add(word);
        }

        for (const neighbor of this.getTileNeighbors(source.row, source.col)) {
            if (!visited.has(neighbor)) {
                this.getWordsRecursionHelper(
                    neighbor,
                    visited,
                    word,
                    foundWords,
                    dict
                );
            }
        }

        word = word[word.length - 1];
        visited.delete(source);
    }

    /**
     * Get all words in board using (inefficient) \~tabulation\~ (NOT recursion)
     * @param board The 2D array of all tiles in the board
     */
    async getWordsTabulationBroken(board: Tile[][]) {
        const foundWords = new Set<string>();
        const dictionary = await this.loadSpellCheck();

        for (
            let offsetIdx = 0;
            offsetIdx < this.GRID_SIZE * this.GRID_SIZE;
            offsetIdx++
        ) {
            // Tile -> map of strings
            const pathMap = new Map<Tile, [string, Tile][]>();
            // init map for every tile with its letter as the string and itself origination tile
            for (const tile of board.flat()) {
                // strings -> origination Tiles
                const letterTuple: [string, Tile][] = [];
                letterTuple.push([tile.letter, tile]);
                pathMap.set(tile, letterTuple);
            }

            for (let i = 0; i < this.GRID_SIZE * this.GRID_SIZE; i++) {
                const tile =
                    board.flat()[i % (this.GRID_SIZE * this.GRID_SIZE)];
                const tileTuples = pathMap.get(tile);
                if (tileTuples != null) {
                    for (const neighborTile of this.getTileNeighbors(
                        tile.row,
                        tile.col
                    )) {
                        const neighborTuples = pathMap.get(neighborTile);
                        if (neighborTuples != null) {
                            for (const neighborMapEntry of neighborTuples) {
                                // make sure not to add a cycle
                                if (neighborMapEntry[1] !== tile) {
                                    tileTuples.push([
                                        neighborMapEntry[0] + tile.letter,
                                        // carry over the originator of the string to avoid cycles
                                        neighborMapEntry[1],
                                    ]);
                                }
                            }
                        }
                    }

                    // this letter map won't change anymore, so add its words to the dict set
                    for (const [potentialWord] of tileTuples) {
                        const potentialWordRev = potentialWord
                            .split('')
                            .reverse()
                            .join('');
                        if (
                            potentialWord.length >= 3 &&
                            dictionary.has(potentialWord.toLowerCase())
                        ) {
                            foundWords.add(potentialWord);
                        }
                        if (
                            potentialWordRev.length >= 3 &&
                            dictionary.has(potentialWordRev.toLowerCase())
                        ) {
                            foundWords.add(potentialWordRev);
                        }
                    }
                }
            }
        }

        // if (DEBUG) {
        //     console.log(pathMap);
        // }

        return foundWords;
    }

    // TODO: add a supplementary dict withwords such as:
    // TITS
    async loadSpellCheck() {
        const wordList = await fetch('assets/2of12.txt').then((response) =>
            response.text()
        );
        const wordArr = wordList.split('\r\n');

        return new Set(wordArr);
    }

    getTileNeighbors(row: number, col: number) {
        const neighbors: Tile[] = [];
        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
            for (let colOffset = -1; colOffset <= 1; colOffset++) {
                // don't add self as neighbor
                if (!(rowOffset == 0 && colOffset == 0)) {
                    const neighborRow = row + rowOffset;
                    const neighborCol = col + colOffset;
                    if (
                        neighborRow >= 0 &&
                        neighborRow < this.GRID_SIZE &&
                        neighborCol >= 0 &&
                        neighborCol < this.GRID_SIZE
                    ) {
                        neighbors.push(this.tileGrid[neighborRow][neighborCol]);
                    }
                }
            }
        }

        return neighbors;
    }
}

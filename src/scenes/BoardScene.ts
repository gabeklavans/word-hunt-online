import { DEBUG } from "../env";
import eventsCenter, { WHOEvents } from "../WHOEvents";
import { GOOD_COLOR, SESSION_ID, USER_ID } from "../Main";
import { getWordScore, pointExitRect } from "../utils";
import { getBoardData, sendResults } from "../api";

export default class BoardScene extends Phaser.Scene {
	imageGroup!: Phaser.GameObjects.Group;
	tileContainerGroup!: Phaser.GameObjects.Group;
	gameTimeText!: Phaser.GameObjects.BitmapText;
	chainText!: Phaser.GameObjects.BitmapText;
	gameTimeTextPrefix = "⏳";
	gameTimer?: Phaser.Time.TimerEvent;
	tileGrid: Tile[][] = [];

	currentChain: Tile[] = [];
	chainLineGraphic!: Phaser.GameObjects.Graphics;
	foundWords: Set<string> = new Set();

	isDragging = false;
	boardWords = new Set<string>();

	curScore = 0;

	// numbers
	TILE_SIZE!: number;
	readonly GRID_SIZE = 4;
	readonly GAME_TIME_SECS = 80;

	// visual
	readonly LINE_THICKNESS = 10;
	readonly DRAG_COLOR = 0xf5c398;
	readonly REPEAT_COLOR = 0xeddf3e;
	readonly IDLE_COLOR = 0xad5100;
	readonly NEUTRAL_LINE_COLOR = 0x7e7e7e;
	readonly BAD_LINE_COLOR = 0xbc0000;

	readonly LETTER_DEPTH = 50;
	readonly CHAIN_LINE_DEPTH = 100;

	// keys
	readonly TILE_IMAGE_KEY = "image";

	constructor() {
		super({ key: "board", visible: false });

		for (let i = 0; i < this.GRID_SIZE; i++) {
			this.tileGrid.push([]);
		}
	}

	async create() {
		// events
		eventsCenter.on(WHOEvents.GameStart, this.handleGameStart, this);
		if (DEBUG) {
			const keyObj = this.input.keyboard.addKey("E"); // Get key object
			keyObj.on("down", this.handleGameEnd, this);
		}

		// initialize variables
		const gameWidth = this.game.config.width;
		this.TILE_SIZE =
			typeof gameWidth === "string" // this is strange... I wonder why I did this - Gabe
				? parseInt(gameWidth) / (this.GRID_SIZE + 1)
				: gameWidth / (this.GRID_SIZE + 1);
		this.imageGroup = this.add.group();
		this.tileContainerGroup = this.add.group();

		// global input listeners
		this.input.addListener("pointerup", () => {
			this.endChain();
		});
		this.chainLineGraphic = this.add.graphics().setDepth(this.CHAIN_LINE_DEPTH);

		// get a board from API
		console.log(`Session ID: ${SESSION_ID}`);

		// TODO: handle null case
		const response = await getBoardData(SESSION_ID as string);
		const boardData: BoardData = await response.json();
		if (DEBUG) {
			console.debug("Board data:");
			console.debug(boardData);
		}
		this.boardWords = new Set<string>(boardData.words);

		// draw objects
		this.drawBoard(boardData.board);

		const approxGameTimeTextLength = 10;
		this.gameTimeText = this.add
			.bitmapText(
				this.cameras.main.centerX,
				0,
				"gothic",
				this.gameTimeTextPrefix,
				Math.floor(this.game.canvas.width / approxGameTimeTextLength)
			)
			.setTintFill(0x000000)
			.setOrigin(0.5, 0)
			.setVisible(false)
			.setDepth(2);

		this.chainText = this.add
			.bitmapText(
				this.cameras.main.centerX,
				160,
				"gothic",
				"",
				this.gameTimeText.fontSize / 2
			)
			.setTintFill(0x000000)
			.setOrigin(0.5, 0.5);

		if (DEBUG) {
			this.gameTimeText.setInteractive().on("pointerdown", this.handleGameEnd, this);
		}

		this.imageGroup.setTint(this.IDLE_COLOR);

		// tell splash screen we've got a valid board
		eventsCenter.emit(WHOEvents.BoardDone);
	}

	update(): void {
		if (this.gameTimer && this.gameTimeText.visible) {
			const timeRemaining = Math.ceil(this.gameTimer.getRemainingSeconds());
			this.gameTimeText.setText(`${timeRemaining}`);
		}
	}

	updateChainColors(color: number) {
		this.currentChain.forEach((tile) =>
			(tile.container.getByName(this.TILE_IMAGE_KEY) as Phaser.GameObjects.Image).setTint(
				color
			)
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

	async handleGameEnd() {
		if (DEBUG) {
			console.debug("Game over!");
		}
		// send result to bot
		await sendResults(SESSION_ID ?? "", USER_ID ?? "", {
			score: this.curScore,
			words: Array.from(this.foundWords),
		});

		window.location.href = `results.html?session=${SESSION_ID}&user=${USER_ID}`;
	}

	drawBoard(board: BoardLetters) {
		for (let row = 0; row < this.GRID_SIZE; row++) {
			for (let col = 0; col < this.GRID_SIZE; col++) {
				const tileImage = this.add
					.image(0, 0, "tile")
					.setDisplaySize(this.TILE_SIZE, this.TILE_SIZE)
					.setName(this.TILE_IMAGE_KEY);
				const tileContainer = this.add
					.container(
						this.cameras.main.width / 2 +
							(col - this.GRID_SIZE / 2) * this.TILE_SIZE +
							this.TILE_SIZE / 2,
						this.cameras.main.height / 2 +
							(row - this.GRID_SIZE / 2) * this.TILE_SIZE +
							this.TILE_SIZE / 2,
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
				tileContainer
					.add(
						this.add
							.text(0, 0, tile.letter.toUpperCase(), {
								color: "black",
								fontSize: `${this.TILE_SIZE / 2}px`,
								fontFamily: "Interstate",
							})
							.setOrigin(0.5)
					)
					.setDepth(this.LETTER_DEPTH);

				// add to structs
				this.tileGrid[row][col] = tile;
				this.imageGroup.add(tileImage);
				this.tileContainerGroup.add(tileContainer);

				// enable hitboxes on tiles
				const NUDGE = 2;
				// NOTE: The Point coords are relative to the CENTER of the tile image
				const topPoint = new Phaser.Geom.Point(0, -tileImage.displayHeight / 2 - NUDGE);
				const rightPoint = new Phaser.Geom.Point(tileImage.displayWidth / 2 + NUDGE, 0);
				const bottomPoint = new Phaser.Geom.Point(0, tileImage.displayHeight / 2 + NUDGE);
				const leftPoint = new Phaser.Geom.Point(-tileImage.displayWidth / 2 - NUDGE, 0);
				tileContainer
					.setInteractive(
						new Phaser.Geom.Polygon([topPoint, rightPoint, bottomPoint, leftPoint]),
						Phaser.Geom.Polygon.Contains
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
					this.TILE_SIZE * this.GRID_SIZE,
					this.TILE_SIZE * this.GRID_SIZE
				)
				.setOrigin(0, 0)
				.setInteractive(
					new Phaser.Geom.Rectangle(
						topLeftContainer.getBounds().x,
						topLeftContainer.getBounds().y,
						this.TILE_SIZE * this.GRID_SIZE,
						this.TILE_SIZE * this.GRID_SIZE
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
			console.error("Bounding box tried to draw before top left container was defined");

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
					if (!lastTileInChain.container || !tile.container) {
						console.error("Containers not initialized");
						// TODO: Error scene
						this.game.destroy(true, true);
						return;
					}

					if (DEBUG) {
						console.debug("Skipped tile detected!");
					}

					// just skip this tile, wait for user to hit a valid one
					return;

					/**
					 * NOTE: This auto-fill-skipped tiles code actually kinda works,
					 * but it has weird edge-cases that I think are not worth trying
					 * to figure out how to reconcile in an intuitive way.
					 * Now you can peruse it as a relic of a forlorn idea.
					 */
					/*
					// draw a line and fill in the intersected tiles
					const intersectLine = new Phaser.Geom.Line(
						lastTileInChain.container.x,
						lastTileInChain.container.y,
						tile.container.x,
						tile.container.y
					);
					console.log([intersectLine.getPointA(), intersectLine.getPointB()]);

					// loop thru all the tiles' hitboxes and check for intersect
					for (const childTile of this.tileGrid.flat()) {
						const childContainer =
							childTile.container as Phaser.GameObjects.Container;
						const relativeHitBox = childContainer.input
							.hitArea as Phaser.Geom.Polygon;
						const hitBox = new Phaser.Geom.Polygon([
							...relativeHitBox.points.map(
								(point) =>
									new Phaser.Geom.Point(
										point.x + childContainer.x,
										point.y + childContainer.y
									)
							),
						]);
						for (const linePoint of intersectLine.getPoints(10)) {
							if (hitBox.contains(linePoint.x, linePoint.y)) {
								this.addToChain(childTile);
								continue;
							}
						}
					}
					*/
				}

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
			this.chainText.setText(this.chainText.text + tile.letter);
			this.drawChainLine();

			const GROWTH = 15;
			this.tweens.add({
				targets: tile.container.getByName(this.TILE_IMAGE_KEY),
				props: {
					displayHeight: { value: this.TILE_SIZE + GROWTH, duration: 200 },
					displayWidth: { value: this.TILE_SIZE + GROWTH, duration: 200 },
				},
				ease: Phaser.Math.Easing.Bounce.Out,
				paused: false,
			});

			const word = this.currentChain.map((tile) => tile.letter).join("");
			if (this.foundWords.has(word)) {
				this.updateChainColors(this.REPEAT_COLOR);
				this.chainText.setTint(this.REPEAT_COLOR);
			} else if (this.boardWords.has(word)) {
				this.updateChainColors(GOOD_COLOR);
				this.chainText.setTint(GOOD_COLOR);
			} else {
				this.updateChainColors(this.DRAG_COLOR);
				this.chainText.setTint(0x000000);
			}
		}
	}

	drawChainLine() {
		this.chainLineGraphic.clear();
		this.chainLineGraphic.lineStyle(this.LINE_THICKNESS, this.NEUTRAL_LINE_COLOR);
		this.chainLineGraphic.fillStyle(this.NEUTRAL_LINE_COLOR);
		this.chainLineGraphic.setBlendMode(Phaser.BlendModes.DIFFERENCE);

		let prevTile: Tile;
		this.currentChain.forEach((tile) => {
			if (prevTile) {
				this.chainLineGraphic.lineBetween(
					prevTile.container.x,
					prevTile.container.y,
					tile.container.x,
					tile.container.y
				);
			}

			this.chainLineGraphic.fillCircle(
				tile.container.x,
				tile.container.y,
				this.LINE_THICKNESS / 2
			);
			prevTile = tile;
		});
	}

	endChain() {
		const fadeTween = this.tweens.add({
			targets: this.chainText,
			props: {
				alpha: {
					value: 0,
					duration: 100,
					ease: Phaser.Math.Easing.Linear,
				},
			},
			paused: true,
			onComplete: (tween, targets) => {
				(targets[0] as Phaser.GameObjects.BitmapText).setText("").setAlpha(1).setScale(1);
			},
		});

		let chainTextAnim = () => {
			fadeTween.play();
		};

		if (this.isDragging) {
			this.imageGroup.setTint(this.IDLE_COLOR);

			const word = this.currentChain.map((tile) => tile.letter).join("");
			if (!this.foundWords.has(word)) {
				if (this.boardWords.has(word)) {
					const wordScore = getWordScore(word);
					if (DEBUG) {
						console.debug(`Found word "${word}" of score: ${wordScore}`);
					}
					this.curScore += wordScore;
					this.foundWords.add(word);

					// found word animation
					chainTextAnim = () => {
						this.tweens.add({
							targets: this.chainText,
							props: {
								scale: {
									value: "+=0.3",
									duration: 100,
									ease: (v: number) => Phaser.Math.Easing.Back.Out(v, 5),
								},
							},
							onComplete: () => fadeTween.play(),
						});
					};
				}
			} else {
				// TODO: do some already found effect on the chain
			}

			this.currentChain = [];
		}
		this.isDragging = false;
		this.chainLineGraphic.clear();
		this.tweens.killAll();
		this.imageGroup.getChildren().forEach((tileImage) => {
			(tileImage as Phaser.GameObjects.Image).setDisplaySize(this.TILE_SIZE, this.TILE_SIZE);
		});

		chainTextAnim();

		if (DEBUG) {
			console.debug(`cur score: ${this.curScore}`);
		}
	}
}

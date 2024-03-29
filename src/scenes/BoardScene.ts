import * as Phaser from "phaser";

import { DEBUG } from "../env";
import eventsCenter, { WHOEvents } from "../WHOEvents";
import { GOOD_COLOR, SESSION_ID, USER_ID } from "../Main";
import { getWordScore, pointExitRect } from "../utils";
import { getBoardData, sendResults } from "../api";

export class BoardScene extends Phaser.Scene {
	imageGroup!: Phaser.GameObjects.Group;
	tileContainerGroup!: Phaser.GameObjects.Group;
	gameTimeText!: Phaser.GameObjects.BitmapText;
	chainText!: Phaser.GameObjects.BitmapText;
	scoreText!: Phaser.GameObjects.BitmapText;
	chainScoreText!: Phaser.GameObjects.BitmapText;
	gameTimeTextPrefix = "⏳";
	gameTimer?: Phaser.Time.TimerEvent;
	tileGrid: Tile[][] = [];

	currentChain: Tile[] = [];
	chainLineGraphic!: Phaser.GameObjects.Graphics;
	foundWords: Set<string> = new Set();

	isDragging = false;
	boardWords = new Set<string>();

	curScore = 0;

	// audio
	dragSfx!: Phaser.Sound.BaseSound;
	goodSfx!: Phaser.Sound.BaseSound;
	badSfx!: Phaser.Sound.BaseSound;
	foundSfx!: Phaser.Sound.BaseSound;

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
			if (!this.input.keyboard) {
				console.warn("Couldn't find keyboard!");
			} else {
				const keyObj = this.input.keyboard.addKey("E"); // Get key object
				keyObj.on("down", this.handleGameEnd, this);
			}
		}
		this.input.on("pointerdown", () => {
			this.isDragging = true;
		});

		// initialize variables
		const gameWidth = this.game.config.width;
		this.TILE_SIZE =
			typeof gameWidth === "string" // this is strange... I wonder why I did this - Gabe
				? parseInt(gameWidth) / (this.GRID_SIZE + 1)
				: gameWidth / (this.GRID_SIZE + 1);
		this.imageGroup = this.add.group();
		this.tileContainerGroup = this.add.group();
		this.dragSfx = this.sound.add("drag");
		this.goodSfx = this.sound.add("good");
		this.badSfx = this.sound.add("bad");
		this.foundSfx = this.sound.add("found");

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
				Math.floor(this.game.canvas.width / approxGameTimeTextLength),
			)
			.setTintFill(0x000000)
			.setOrigin(0.5, 0)
			.setVisible(false)
			.setDepth(2);

		this.chainText = this.add
			.bitmapText(
				this.cameras.main.centerX,
				130,
				"gothic",
				"",
				this.gameTimeText.fontSize / 2,
			)
			.setTintFill(0x000000)
			.setOrigin(0.5, 0.5);

		this.chainScoreText = this.add
			.bitmapText(0, 0, "gothic", "", this.chainText.fontSize / 2)
			.setTintFill(0x000000)
			.setOrigin(0.5, 0.5);
		Phaser.Display.Align.To.BottomCenter(this.chainScoreText, this.chainText, 0, 40);

		this.scoreText = this.add
			.bitmapText(0, 0, "gothic", "0", this.chainText.fontSize)
			.setTintFill(0x000000)
			.setOrigin(0.5, 0.5);
		Phaser.Display.Align.To.BottomCenter(this.scoreText, this.chainScoreText, 0, 10);

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
				color,
			),
		);
	}

	handleGameStart() {
		this.gameTimeText.setVisible(true);
		this.gameTimer = this.time.delayedCall(
			this.GAME_TIME_SECS * 1000,
			this.handleGameEnd,
			[],
			this,
		);
	}

	async handleGameEnd() {
		if (DEBUG) {
			console.debug("Game over!");
		}
		// send result to bot
		await sendResults(SESSION_ID ?? "", USER_ID ?? "", {
			partial: false,
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
						tileImage,
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
							.setOrigin(0.5),
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
				const topRightPoint = new Phaser.Geom.Point(
					tileImage.displayWidth * 0.37,
					-tileImage.displayHeight * 0.37,
				);
				const rightPoint = new Phaser.Geom.Point(tileImage.displayWidth / 2 + NUDGE, 0);
				const bottomRightPoint = new Phaser.Geom.Point(
					tileImage.displayWidth * 0.37,
					tileImage.displayHeight * 0.37,
				);
				const bottomPoint = new Phaser.Geom.Point(0, tileImage.displayHeight / 2 + NUDGE);
				const bottomLeftPoint = new Phaser.Geom.Point(
					-tileImage.displayWidth * 0.37,
					tileImage.displayHeight * 0.37,
				);
				const leftPoint = new Phaser.Geom.Point(-tileImage.displayWidth / 2 - NUDGE, 0);
				const topLeftPoint = new Phaser.Geom.Point(
					-tileImage.displayWidth * 0.37,
					-tileImage.displayHeight * 0.37,
				);
				tileContainer
					.setInteractive(
						new Phaser.Geom.Polygon([
							topPoint,
							topRightPoint,
							rightPoint,
							bottomRightPoint,
							bottomPoint,
							bottomLeftPoint,
							leftPoint,
							topLeftPoint,
						]),
						Phaser.Geom.Polygon.Contains,
					)
					.on("pointerdown", () => {
						this.isDragging = true;
						this.handleAddToChain(tile);
					})
					.on("pointerover", () => {
						this.handleAddToChain(tile);
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
					this.TILE_SIZE * this.GRID_SIZE,
				)
				.setOrigin(0, 0)
				.setInteractive(
					new Phaser.Geom.Rectangle(
						topLeftContainer.getBounds().x,
						topLeftContainer.getBounds().y,
						this.TILE_SIZE * this.GRID_SIZE,
						this.TILE_SIZE * this.GRID_SIZE,
					),
					pointExitRect,
				)
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
		if (!this.isDragging) {
			return;
		}

		if (this.currentChain.includes(tile)) {
			if (DEBUG) console.debug("Duplicate tile detected, ignoring...");
			return;
		}

		const lastTileInChain = this.currentChain.at(-1);

		const isTileReachable =
			lastTileInChain &&
			Phaser.Math.Distance.Between(
				lastTileInChain.row,
				lastTileInChain.col,
				tile.row,
				tile.col,
			) <= Math.sqrt(2);
		if (lastTileInChain && !isTileReachable) {
			if ((lastTileInChain && !lastTileInChain.container) || !tile.container) {
				console.error("Containers not initialized");
				// TODO: Error scene
				this.game.destroy(true, true);
				return;
			}

			if (DEBUG) console.debug("Skipped tile detected, ignoring...");

			// just skip this tile, wait for user to hit a valid one
			return;
		}

		this.addToChain(tile);
	}

	addToChain(tile: Tile) {
		if (!this.currentChain.includes(tile)) {
			this.currentChain.push(tile);
			const curWord = this.currentChain.map((tile) => tile.letter).join("");
			const curWordScore = getWordScore(curWord);
			this.chainText.setText(curWord);

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

			// found a new valid word
			if (this.boardWords.has(word) && !this.foundWords.has(word)) {
				this.updateChainColors(GOOD_COLOR);
				this.chainText.setTint(GOOD_COLOR);
				if (curWordScore > 0) {
					this.chainScoreText.setText(`+ ${curWordScore}`);
				}
				this.foundSfx.play({ volume: 0.1 });

				return;
			}

			// found something else
			if (this.foundWords.has(word)) {
				this.updateChainColors(this.REPEAT_COLOR);
				this.chainText.setTint(this.REPEAT_COLOR);
			} else {
				this.updateChainColors(this.DRAG_COLOR);
				this.chainText.setTint(0x000000);
			}

			this.chainScoreText.setText("");
			this.dragSfx.play({ volume: 0.08, rate: 1.5 });
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
					tile.container.y,
				);
			}

			this.chainLineGraphic.fillCircle(
				tile.container.x,
				tile.container.y,
				this.LINE_THICKNESS / 2,
			);
			prevTile = tile;
		});
	}

	endChain() {
		const tweenChain: Phaser.Types.Tweens.TweenBuilderConfig[] = [
			{
				targets: [this.chainText, this.chainScoreText],
				props: {
					alpha: {
						value: 0,
						duration: 100,
						ease: Phaser.Math.Easing.Linear,
					},
				},
				onComplete: (_tween, targets) => {
					targets.forEach((text: Phaser.GameObjects.BitmapText) =>
						text.setText("").setAlpha(1).setScale(1),
					);
				},
			},
		];

		if (this.isDragging) {
			this.imageGroup.setTint(this.IDLE_COLOR);

			const word = this.currentChain.map((tile) => tile.letter).join("");
			if (this.boardWords.has(word) && !this.foundWords.has(word)) {
				this.goodSfx.play({ volume: 0.15 });

				const wordScore = getWordScore(word);
				if (DEBUG) {
					console.debug(`Found word "${word}" of score: ${wordScore}`);
				}
				this.curScore += wordScore;
				this.scoreText.text = this.curScore.toString();
				this.foundWords.add(word);

				// found word animation
				tweenChain.unshift({
					targets: [this.chainText, this.chainScoreText],
					props: {
						scale: {
							value: "+=0.3",
							duration: 100,
							ease: (v: number) => Phaser.Math.Easing.Back.Out(v, 5),
						},
					},
				});
				
			sendResults(SESSION_ID ?? "", USER_ID ?? "", {
				partial: true,
				score: this.curScore,
				words: Array.from(this.foundWords),
			});
			} else {
				this.badSfx.play({ volume: 0.1, rate: 1.5 });
			}

			this.currentChain = [];
		}
		this.isDragging = false;
		this.chainLineGraphic.clear();
		this.tweens.killAll();
		this.imageGroup.getChildren().forEach((tileImage) => {
			(tileImage as Phaser.GameObjects.Image).setDisplaySize(this.TILE_SIZE, this.TILE_SIZE);
		});

		this.tweens.chain({
			tweens: tweenChain,
		});

		if (DEBUG) {
			console.debug(`cur score: ${this.curScore}`);
		}
	}
}

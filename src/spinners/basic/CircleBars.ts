import Phaser from "phaser";

interface IAnimationConfig {
	alpha?: number;
	alphaDuration?: number;
	spacing?: number;
}

export default class CircleBars {
	static create(scene: Phaser.Scene, x: number, y: number, radius = 64, color = 0xffffff) {
		return new CircleBars(scene, x, y, radius, color);
	}

	private scene: Phaser.Scene;
	private position = { x: 0, y: 0 };
	private radius = 64;
	private color = 0xffffff;

	protected bars: Phaser.GameObjects.Rectangle[] = [];
	private tweens: Phaser.Tweens.Tween[] = [];
	private timerEvent?: Phaser.Time.TimerEvent;

	get x() {
		return this.position.x;
	}

	set x(v: number) {
		this.position.x = v;
		this.layout();
	}

	get y() {
		return this.position.y;
	}

	set y(v: number) {
		this.position.y = v;
		this.layout();
	}

	constructor(scene: Phaser.Scene, x: number, y: number, radius = 64, color = 0xffffff) {
		this.scene = scene;
		this.position.x = x;
		this.position.y = y;
		this.radius = radius;
		this.color = color;
	}

	useColor(color: number) {
		this.color = color;
		return this;
	}

	setPosition(x: number, y: number) {
		this.position.x = x;
		this.position.y = y;
		this.layout();
		return this;
	}

	addToContainer(container: Phaser.GameObjects.Container, x?: number, y?: number) {
		if (!container) {
			return this;
		}

		if (this.bars.length <= 0) {
			this.make();
		}

		this.bars.forEach((bar) => {
			container.add(bar);
		});

		if (x !== undefined && y !== undefined) {
			this.setPosition(x, y);
		} else if (x !== undefined) {
			this.x = x;
		} else if (y !== undefined) {
			this.y = y;
		}

		return this;
	}

	make() {
		while (this.bars.length > 0) {
			this.bars.pop()!.destroy();
		}

		const height = this.radius * 0.5;
		const width = 10;
		const { x, y } = this.position;

		let angle = -90;

		for (let i = 0; i < 12; ++i) {
			const bar = this.scene.add
				.rectangle(x, y, width, height, this.color, 1)
				.setAngle(angle)
				.setAlpha(0.2)
				.setDepth(999);

			this.bars.push(bar);
			angle += 30;
		}

		this.layout();

		return this;
	}

	play(config: IAnimationConfig = {}) {
		if (this.bars.length <= 0) {
			this.make();
		}

		while (this.tweens.length > 0) {
			this.tweens.pop()!.remove();
		}

		if (this.timerEvent) {
			this.timerEvent.remove();
			this.timerEvent.destroy();
		}

		const { alpha = 0.2, alphaDuration = 400, spacing = 70 } = config;

		let i = 0;
		this.timerEvent = this.scene.time.addEvent({
			delay: spacing,
			loop: true,
			callback: () => {
				if (i < this.tweens.length) {
					const tween = this.tweens[i];
					tween.restart();
				} else {
					const bar = this.bars[i];

					const tween = this.scene.tweens.add({
						targets: bar,
						alpha,
						duration: alphaDuration,
						onStart: () => {
							bar.alpha = 1;
						},
					});

					this.tweens.push(tween);
				}

				++i;

				if (i >= this.bars.length) {
					i = 0;
				}
			},
		});

		return this;
	}

	private layout() {
		const height = this.radius * 0.5;
		const { x: sx, y: sy } = this.position;

		for (let i = 0; i < this.bars.length; ++i) {
			const bar = this.bars[i];
			const angle = bar.angle;
			const { x, y } = Phaser.Math.RotateAround(
				{ x: sx, y: sy - (this.radius - height * 0.5) },
				sx,
				sy,
				Phaser.Math.DEG_TO_RAD * angle
			);

			bar.x = x;
			bar.y = y;
		}
	}
}

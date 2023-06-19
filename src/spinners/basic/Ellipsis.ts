import Phaser from 'phaser'

export default class Ellipsis
{
	static create(scene: Phaser.Scene, x: number, y: number, color = 0xffffff)
	{
		return new Ellipsis(scene, x, y, color)
	}

	private scene: Phaser.Scene
	private position = { x: 0, y: 0 }
	private color = 0xffffff

	protected dots: Phaser.GameObjects.Arc[] = []
	private dotRadius = 12
	private gap = 16

	private timeline?: Phaser.Tweens.Timeline

	private cachedSpeedMultiplier = 1

	constructor(scene: Phaser.Scene, x: number, y: number, color = 0xffffff)
	{
		this.scene = scene
		this.position.x = x
		this.position.y = y
		this.color = color
	}

	useColor(color: number)
	{
		this.color = color
		return this
	}

	useRadiusForDots(radius: number)
	{
		this.dotRadius = radius
		return this
	}

	useGapForDots(gap: number)
	{
		this.gap = gap
		return this
	}

	setPosition(x: number, y: number)
	{
		this.position.x = x
		this.position.y = y
		this.layout()
		this.reconstructTimeline()
		return this
	}

	addToContainer(container: Phaser.GameObjects.Container, x?: number, y?: number)
	{
		if (!container)
		{
			return this
		}

		if (this.dots.length <= 0)
		{
			this.make()
		}

		this.dots.forEach(dot => {
			container.add(dot)
		})

		const last = this.dots[this.dots.length - 1]
		container.moveDown(last)

		if (x !== undefined && y !== undefined)
		{
			this.setPosition(x, y)
		}
		else if (x !== undefined)
		{
			this.position.x = x
			this.layout()
			this.reconstructTimeline()
		}
		else if (y !== undefined)
		{
			this.position.y = y
			this.layout()
			this.reconstructTimeline()
		}

		return this
	}

	make()
	{
		while (this.dots.length > 0)
		{
			this.dots.pop()!.destroy()
		}

		const { x, y } = this.position

		for (let i = 0; i < 4; ++i)
		{
			const dot = this.scene.add.circle(x, y, this.dotRadius, this.color)
			this.dots.push(dot)
		}

		this.dots[0].setScale(0)
		const last = this.dots[this.dots.length - 1]
		this.scene.children.moveDown(last)

		this.layout()

		return this
	}

	play(speedMultiplier = 1)
	{
		if (this.dots.length <= 0)
		{
			this.make()
		}

		this.cachedSpeedMultiplier = speedMultiplier

		this.constructTimeline(speedMultiplier)

		if (this.timeline)
		{
			this.timeline.play()
		}

		return this
	}

	private reconstructTimeline()
	{
		if (!this.timeline)
		{
			return
		}

		this.constructTimeline(this.cachedSpeedMultiplier)

		if (this.timeline)
		{
			this.timeline.play()
		}
	}

	private constructTimeline(speedMultiplier = 1)
	{
		let progress = 0
		if (this.timeline)
		{
			progress = this.timeline.progress
			this.timeline.stop()
			this.timeline.resetTweens(true)
			this.timeline.destroy()
		}

		this.timeline = this.scene.tweens.timeline({
			loop: -1
		})

		const duration = 500 / speedMultiplier
		const ease = Phaser.Math.Easing.Quadratic.InOut

		const newDot = this.dots[0]

		this.timeline.add({
			targets: newDot,
			scale: 1,
			duration,
			ease,
			offset: 0
		})

		const diameter = this.dotRadius * 2
		const size = this.dots.length - 1

		for (let i = 1; i < size; ++i)
		{
			const dot = this.dots[i]
			this.timeline.add({
				targets: dot,
				x: dot.x + diameter + this.gap,
				duration,
				ease,
				offset: 0
			})
		}

		const lastDot = this.dots[size]
		this.timeline.add({
			targets: lastDot,
			scale: 0,
			duration,
			ease,
			offset: 0
		})

		const obj = { count: 0 }
		this.timeline.add({
			targets: obj,
			count: 100,
			duration: 100,
			onComplete: () => {
				newDot.scale = 0
				lastDot.scale = 1
				for (let i = 1; i < size; ++i)
				{
					const dot = this.dots[i]
					dot.x -= diameter + this.gap
				}
				this.handleOnLoop(this.timeline!)
			}
		})

		this.timeline.progress = progress

		return this.timeline
	}

	protected handleOnLoop(timeline: Phaser.Tweens.Timeline)
	{
		// implement in subclasses
	}

	private layout()
	{
		if (this.dots.length < 1)
		{
			return
		}

		const diameter = this.dotRadius * 2
		const width = (diameter * 3) + (this.gap * 2)

		let x = this.position.x - (width * 0.5) + this.dotRadius

		const dot = this.dots[0]
		dot.x = x
		dot.y = this.position.y

		for (let i = 1; i < this.dots.length; ++i)
		{
			const dot = this.dots[i]
			dot.x = x
			dot.y = this.position.y

			x += this.gap + diameter
			
		}
	}
}

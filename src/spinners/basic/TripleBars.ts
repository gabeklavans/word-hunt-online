import Phaser from 'phaser'
import BezierEasing from 'bezier-easing'

interface AnimationConfig
{
	scaleY?: number,
	expand?: {
		duration?: number,
		hold?: number
	},
	contract?: {
		duration?: number
	}
}

export default class TripleBars
{
	static create(scene: Phaser.Scene, x: number, y: number, color: number = 0xffffff)
	{
		return new TripleBars(scene, x, y, color)
	}

	private scene: Phaser.Scene
	private position = { x: 0, y: 0 }

	private color: number = 0xffffff
	private barWidth = 30
	private barHeight = 70
	private gap = 10

	protected bars: Phaser.GameObjects.Rectangle[] = []

	private timeline!: Phaser.Tweens.Timeline

	set x(value: number)
	{
		this.position.x = value
		this.layout()
	}

	get x()
	{
		return this.position.x
	}

	set y(value: number)
	{
		this.position.y = value
		this.layout()
	}

	get y()
	{
		return this.position.y
	}

	constructor(scene: Phaser.Scene, x: number, y: number, color: number = 0xffffff)
	{
		this.scene = scene
		
		this.x = x
		this.y = y
		this.color = color
	}

	useBarWidth(width: number)
	{
		this.barWidth = width
		return this
	}

	useBarHeight(height: number)
	{
		this.barHeight = height
		return this
	}

	useBarGap(gap: number)
	{
		this.gap = gap
		return this
	}

	useBarColor(color: number)
	{
		this.color = color
		return this
	}

	addToContainer(container: Phaser.GameObjects.Container, x?: number, y?: number)
	{
		if (!container)
		{
			return this
		}

		if (!this.timeline)
		{
			this.make()
		}

		this.bars.forEach(bar => {
			container.add(bar)
			
			if (x !== undefined)
			{
				this.x = x
			}

			if (y !== undefined)
			{
				this.y = y
			}
		})

		return this
	}

	make(config: AnimationConfig = {})
	{
		this.bars.forEach(bar => bar.destroy())
		this.bars.length = 0

		for (let i = 0; i < 3; ++i)
		{
			this.bars.push(
				this.scene.add.rectangle(0, 0, this.barWidth,  this.barHeight, this.color)
			)
		}

		this.layout()

		this.timeline = this.scene.tweens.timeline({ loop: -1, loopDelay: 400 })

		const {
			expand = {},
			contract = {},
			scaleY = 1.6
		} = config

		const duration1 = expand.duration ?? 35
		const holdDelay = expand.hold ?? 120
		const duration2 = contract.duration ?? 450

		let offset1 = 0
		let offset2 = duration1
		this.bars.forEach((bar, i) => {
			this.timeline.add({
				targets: bar,
				scaleY,
				duration: duration1,
				ease: BezierEasing(0.0, 0.5, 0.5, 0.1),
				offset: offset1
			})
	
			this.timeline.add({
				targets: bar,
				scaleY: 1,
				duration: duration2,
				ease: Phaser.Math.Easing.Cubic.Out,
				offset: offset2
			})

			offset1 += duration1 + holdDelay
			offset2 += duration1 + holdDelay
		})

		return this
	}

	play()
	{
		if (!this.timeline)
		{
			this.make()
		}

		this.timeline.play()

		return this
	}

	private layout()
	{
		if (this.bars.length < 3)
		{
			return
		}

		const { x, y } = this.position

		const left = this.bars[0]
		left.x = x - this.barWidth - this.gap
		left.y = y

		const middle = this.bars[1]
		middle.x = x
		middle.y = y

		const right = this.bars[2]
		right.x = x + this.barWidth + this.gap
		right.y = y
	}
}

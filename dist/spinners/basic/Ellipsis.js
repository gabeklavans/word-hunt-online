import Phaser from "../../../_snowpack/pkg/phaser.js";
export default class Ellipsis {
  constructor(scene, x, y, color = 16777215) {
    this.position = {x: 0, y: 0};
    this.color = 16777215;
    this.dots = [];
    this.dotRadius = 12;
    this.gap = 16;
    this.cachedSpeedMultiplier = 1;
    this.scene = scene;
    this.position.x = x;
    this.position.y = y;
    this.color = color;
  }
  static create(scene, x, y, color = 16777215) {
    return new Ellipsis(scene, x, y, color);
  }
  useColor(color) {
    this.color = color;
    return this;
  }
  useRadiusForDots(radius) {
    this.dotRadius = radius;
    return this;
  }
  useGapForDots(gap) {
    this.gap = gap;
    return this;
  }
  setPosition(x, y) {
    this.position.x = x;
    this.position.y = y;
    this.layout();
    this.reconstructTimeline();
    return this;
  }
  addToContainer(container, x, y) {
    if (!container) {
      return this;
    }
    if (this.dots.length <= 0) {
      this.make();
    }
    this.dots.forEach((dot) => {
      container.add(dot);
    });
    const last = this.dots[this.dots.length - 1];
    container.moveDown(last);
    if (x !== void 0 && y !== void 0) {
      this.setPosition(x, y);
    } else if (x !== void 0) {
      this.position.x = x;
      this.layout();
      this.reconstructTimeline();
    } else if (y !== void 0) {
      this.position.y = y;
      this.layout();
      this.reconstructTimeline();
    }
    return this;
  }
  make() {
    while (this.dots.length > 0) {
      this.dots.pop().destroy();
    }
    const {x, y} = this.position;
    for (let i = 0; i < 4; ++i) {
      const dot = this.scene.add.circle(x, y, this.dotRadius, this.color);
      this.dots.push(dot);
    }
    this.dots[0].setScale(0);
    const last = this.dots[this.dots.length - 1];
    this.scene.children.moveDown(last);
    this.layout();
    return this;
  }
  play(speedMultiplier = 1) {
    if (this.dots.length <= 0) {
      this.make();
    }
    this.cachedSpeedMultiplier = speedMultiplier;
    this.constructTimeline(speedMultiplier);
    if (this.timeline) {
      this.timeline.play();
    }
    return this;
  }
  reconstructTimeline() {
    if (!this.timeline) {
      return;
    }
    this.constructTimeline(this.cachedSpeedMultiplier);
    if (this.timeline) {
      this.timeline.play();
    }
  }
  constructTimeline(speedMultiplier = 1) {
    let progress = 0;
    if (this.timeline) {
      progress = this.timeline.progress;
      this.timeline.stop();
      this.timeline.resetTweens(true);
      this.timeline.destroy();
    }
    this.timeline = this.scene.tweens.timeline({
      loop: -1
    });
    const duration = 500 / speedMultiplier;
    const ease = Phaser.Math.Easing.Quadratic.InOut;
    const newDot = this.dots[0];
    this.timeline.add({
      targets: newDot,
      scale: 1,
      duration,
      ease,
      offset: 0
    });
    const diameter = this.dotRadius * 2;
    const size = this.dots.length - 1;
    for (let i = 1; i < size; ++i) {
      const dot = this.dots[i];
      this.timeline.add({
        targets: dot,
        x: dot.x + diameter + this.gap,
        duration,
        ease,
        offset: 0
      });
    }
    const lastDot = this.dots[size];
    this.timeline.add({
      targets: lastDot,
      scale: 0,
      duration,
      ease,
      offset: 0
    });
    const obj = {count: 0};
    this.timeline.add({
      targets: obj,
      count: 100,
      duration: 100,
      onComplete: () => {
        newDot.scale = 0;
        lastDot.scale = 1;
        for (let i = 1; i < size; ++i) {
          const dot = this.dots[i];
          dot.x -= diameter + this.gap;
        }
        this.handleOnLoop(this.timeline);
      }
    });
    this.timeline.progress = progress;
    return this.timeline;
  }
  handleOnLoop(timeline) {
  }
  layout() {
    if (this.dots.length < 1) {
      return;
    }
    const diameter = this.dotRadius * 2;
    const width = diameter * 3 + this.gap * 2;
    let x = this.position.x - width * 0.5 + this.dotRadius;
    const dot = this.dots[0];
    dot.x = x;
    dot.y = this.position.y;
    for (let i = 1; i < this.dots.length; ++i) {
      const dot2 = this.dots[i];
      dot2.x = x;
      dot2.y = this.position.y;
      x += this.gap + diameter;
    }
  }
}

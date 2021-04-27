import TWEEN from '@tweenjs/tween.js';

import { ScenarioController, ScenarioView } from '../scenario';
import { BoxModelForScenario } from '../box-model-definition';
import { BoxModelEngine } from '../box-model';

export class BaseScenarioController implements ScenarioController {
  protected model: BoxModelForScenario;
  protected view: ScenarioView;
  protected engine: BoxModelEngine;

  constructor(model: BoxModelForScenario, view: ScenarioView) {
    this.model = model;
    this.view = view;
    this.engine = new BoxModelEngine(model);
  }

  setParameter(t: number) {
    if (typeof this.model.parameters[0] !== 'undefined') {
      const p = this.model.parameters[0];
      const tClamped = Math.min(1, Math.max(0, t));
      p.value = p.min + tClamped * (p.max - p.min);
    }
  }

  reset() {
    this.model.parameters.forEach((p) => (p.value = p.initialValue));
  }

  async start() {
    this.reset();
    this.play();
    await this.view.tweenIn();
  }

  play() {
    this.view.animate(true);
  }

  pause() {
    this.view.animate(false);
  }

  async stop() {
    await this.view.tweenOut();
    this.pause();
  }
}

export abstract class BaseScenarioView implements ScenarioView {
  protected model: BoxModelForScenario;
  protected container: HTMLDivElement;
  private animationFrameRequestId: number = 0;
  private tweenPromise: Promise<void> = Promise.resolve();

  protected constructor(elem, model) {
    this.container = elem;
    this.model = model;
  }

  abstract update();

  animate(on) {
    if (on) {
      if (this.animationFrameRequestId !== 0) {
        this.update();
        this.animationFrameRequestId = requestAnimationFrame(
          this.update.bind(this)
        );
      }
    } else {
      cancelAnimationFrame(this.animationFrameRequestId);
      this.animationFrameRequestId = 0;
    }
  }

  protected async tweenOpacity(targetOpacity: number): Promise<void> {
    await this.tweenPromise;
    this.tweenPromise = new Promise<void>((resolve) => {
      let done = false;
      const tween = new TWEEN.Tween(this.container.style)
        .to({ opacity: targetOpacity }, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(() => {
          done = true;
          resolve();
        })
        .start();
      const animate = (timeMs) => {
        if (!done) {
          tween.update(timeMs);
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    });
    return this.tweenPromise;
  }

  tweenIn() {
    return this.tweenOpacity(1.0);
  }

  tweenOut() {
    return this.tweenOpacity(0.0);
  }
}

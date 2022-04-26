import { EventEmitter } from 'events';
import { Scenario } from './scenario';

export default class ScenarioSwitcher extends EventEmitter {
  protected scenarios: Scenario[];

  protected currentScenarioIndex = -1;

  constructor(scenarios: Scenario[]) {
    super();
    this.scenarios = scenarios;
    if (scenarios.length > 0) {
      this.currentScenarioIndex = 0;
      scenarios
        .filter((_, i) => i !== this.currentScenarioIndex)
        .forEach((s) => ScenarioSwitcher.deselect(s));
      ScenarioSwitcher.select(this.scenarios[this.currentScenarioIndex]);
    }
  }

  protected static deselect(scenario: Scenario) {
    if (typeof scenario !== 'undefined' && scenario !== null) {
      scenario.setVisible(false);
      scenario.getSimulation().stop();
      scenario.reset();
    }
  }

  protected static select(scenario: Scenario, autoplay = false) {
    if (typeof scenario !== 'undefined' && scenario !== null) {
      if (autoplay) scenario.getSimulation().play();
      scenario.setVisible(true);
    }
  }

  switchTo(which: number, force = false): void {
    const clampedWhich = Math.min(
      this.scenarios.length - 1,
      Math.max(0, which)
    );

    if (!force && clampedWhich === this.getCurrentScenarioIndex()) return;

    const wasPlaying = this.getCurrentScenario().getSimulation().isPlaying();
    ScenarioSwitcher.deselect(this.getCurrentScenario());
    ScenarioSwitcher.select(this.scenarios[clampedWhich], wasPlaying);

    const oldIdx = this.currentScenarioIndex;
    this.currentScenarioIndex = clampedWhich;

    this.emit('switch', oldIdx, this.currentScenarioIndex);
  }

  prev(): void {
    this.switchTo(this.getCurrentScenarioIndex() - 1);
  }

  next(): void {
    this.switchTo(this.getCurrentScenarioIndex() + 1);
  }

  cycleForward() {
    this.switchTo((this.getCurrentScenarioIndex() + 1) % this.scenarios.length);
  }

  cycleBackward() {
    this.switchTo(
      (this.scenarios.length + this.getCurrentScenarioIndex() - 1) %
        this.scenarios.length
    );
  }

  getScenarios(): Scenario[] {
    return this.scenarios;
  }

  getCurrentScenario(): Scenario {
    return this.scenarios[this.getCurrentScenarioIndex()];
  }

  getCurrentScenarioIndex(): number {
    return this.currentScenarioIndex;
  }
}

export { ScenarioSwitcher };

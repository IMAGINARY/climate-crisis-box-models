import { EventEmitter } from 'events';
import { Scenario } from './scenario';

export default class ScenarioSwitcher extends EventEmitter {
  protected scenarios: Scenario[];
  protected currentScenarioIndex: number = -1;

  constructor(scenarios: Scenario[]) {
    super();
    this.scenarios = scenarios;
    scenarios.forEach((s) => ScenarioSwitcher.deselect(s));
    if (scenarios.length > 0) {
      this.currentScenarioIndex = 0;
      ScenarioSwitcher.select(this.scenarios[this.currentScenarioIndex]);
    }
  }

  protected static deselect(scenario: Scenario) {
    if (typeof scenario !== 'undefined' && scenario !== null) {
      scenario.setVisible(false);
      scenario.getSimulation().stop();
    }
  }

  protected static select(scenario: Scenario, autoplay: boolean = false) {
    if (typeof scenario !== 'undefined' && scenario !== null) {
      scenario.reset();
      const simulation = scenario.getSimulation();
      simulation.reset();
      if (autoplay) simulation.play();
      scenario.setVisible(true);
    }
  }

  switchTo(which: number): void {
    const clampedWhich = Math.min(
      this.scenarios.length - 1,
      Math.max(0, which)
    );

    if (clampedWhich === this.getCurrentScenarioIndex()) return;

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

  protected static async deselectWithTransition(
    scenario: Scenario
  ): Promise<void> {
    await scenario.tweenOut();
    scenario.getSimulation().stop();
  }

  protected static async selectWithTransition(
    scenario: Scenario,
    autoplay: boolean = false
  ): Promise<void> {
    scenario.reset();
    const simulation = scenario.getSimulation();
    simulation.reset();
    if (autoplay) simulation.play();
    await scenario.tweenIn();
  }

  async switchToWithTransition(which: number): Promise<void> {
    const clampedWhich = Math.min(
      this.scenarios.length - 1,
      Math.max(0, which)
    );

    if (clampedWhich === this.getCurrentScenarioIndex()) return;

    const wasPlaying = this.getCurrentScenario().getSimulation().isPlaying();
    await ScenarioSwitcher.deselectWithTransition(this.getCurrentScenario());
    await ScenarioSwitcher.selectWithTransition(
      this.scenarios[clampedWhich],
      wasPlaying
    );

    const oldIdx = this.currentScenarioIndex;
    this.currentScenarioIndex = clampedWhich;

    this.emit('switch', oldIdx, this.currentScenarioIndex);
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

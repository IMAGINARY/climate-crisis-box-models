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
      scenario.hide();
      scenario.getSimulation().stop();
    }
  }

  protected static select(scenario: Scenario) {
    if (typeof scenario !== 'undefined' && scenario !== null) {
      scenario.reset();
      scenario.getSimulation().start();
      scenario.show();
    }
  }

  switchTo(which: number): void {
    const clampedWhich = Math.min(this.scenarios.length, Math.max(0, which));

    ScenarioSwitcher.deselect(this.getCurrentScenario());
    ScenarioSwitcher.select(this.scenarios[clampedWhich]);

    const oldIdx = this.currentScenarioIndex;
    this.currentScenarioIndex = clampedWhich;

    this.emit('switch', oldIdx, this.currentScenarioIndex);
  }

  protected static async deselectWithTransition(
    scenario: Scenario
  ): Promise<void> {
    await scenario.tweenOut();
    scenario.getSimulation().stop();
  }

  protected static async selectWithTransition(
    scenario: Scenario
  ): Promise<void> {
    scenario.reset();
    scenario.getSimulation().start();
    await scenario.tweenIn();
  }

  async switchToWithTransition(which: number): Promise<void> {
    const clampedWhich = Math.min(this.scenarios.length, Math.max(0, which));

    await ScenarioSwitcher.deselectWithTransition(this.getCurrentScenario());
    await ScenarioSwitcher.selectWithTransition(this.scenarios[clampedWhich]);

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

import ready from 'document-ready';
import { EarthEnergyBalanceScenario } from './scenarios/earth-energy-balance';
import { IceAlbedoFeedbackScenario } from './scenarios/ice-albedo-feedback';
import { GreenhouseEffectScenario } from './scenarios/greenhouse-effect';
import ScenarioSwitcher from './ScenarioSwitcher';

function addSlider(parent, simulation) {
  const container = document.createElement('div');

  const labelSpan = document.createElement('span');
  labelSpan.innerText = simulation.getParameterId();
  container.append(labelSpan);

  const initialValue = simulation.getParameter();
  const { min, max } = simulation.getParameterRange();

  const slider = document.createElement('input') as HTMLInputElement;
  slider.type = 'range';
  slider.min = `${min}`;
  slider.max = `${max}`;
  slider.step = `${0.01 * (max - min)}`;
  slider.value = `${initialValue}`;
  container.append(slider);

  const valueSpan = document.createElement('span');
  valueSpan.innerText = slider.value;
  container.append(valueSpan);

  slider.addEventListener('input', () => {
    valueSpan.innerText = slider.value;
    simulation.setParameter(slider.valueAsNumber);
  });

  parent.appendChild(container);
}

async function main() {
  const scenarioContainer = document.getElementById(
    'scenario-container'
  ) as HTMLDivElement;

  const scenarioClasses = [
    EarthEnergyBalanceScenario,
    IceAlbedoFeedbackScenario,
    GreenhouseEffectScenario,
  ];
  const scenarios = await Promise.all(
    scenarioClasses.map(async (ScenarioClass) => {
      const scenarioResources = await ScenarioClass.loadResources();
      const scenario = new ScenarioClass(scenarioContainer, scenarioResources);
      return scenario;
    })
  );

  const scenarioSwitcher = new ScenarioSwitcher(scenarios);
  scenarioSwitcher.getCurrentScenario().getSimulation().stop();

  const scenarioSelectorContainer = document.getElementById(
    'scenario-selector-container'
  );
  scenarios.forEach((ScenarioClass, idx) => {
    const button = document.createElement('button') as HTMLButtonElement;
    button.innerText = ScenarioClass.constructor.name;
    button.onclick = () => scenarioSwitcher.switchTo(idx);
    scenarioSelectorContainer.appendChild(button);
  });

  const sliderContainerElem = document.getElementById('slider-container');
  scenarios.forEach((s) => addSlider(sliderContainerElem, s.getSimulation()));

  const startButton = document.getElementById(
    'playButton'
  ) as HTMLButtonElement;
  const stopButton = document.getElementById(
    'pauseButton'
  ) as HTMLButtonElement;

  let shouldBePlaying = false;

  startButton.addEventListener('click', () => {
    scenarioSwitcher.getCurrentScenario().getSimulation().play();
    shouldBePlaying = true;
  });
  stopButton.addEventListener('click', () => {
    scenarioSwitcher.getCurrentScenario().getSimulation().pause();
    shouldBePlaying = false;
  });

  function handlePageVisibilityChange() {
    switch (document.visibilityState) {
      case 'visible':
        if (shouldBePlaying) {
          scenarioSwitcher.getCurrentScenario().getSimulation().play();
        }
        break;
      case 'hidden':
        scenarioSwitcher.getCurrentScenario().getSimulation().pause();
        break;
      default:
        break;
    }
  }

  document.addEventListener('visibilitychange', handlePageVisibilityChange);
  document.addEventListener('pagehide', handlePageVisibilityChange);
}

ready(main);

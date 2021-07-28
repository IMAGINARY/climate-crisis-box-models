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

  return { container, slider };
}

function registerKey(eventType, keys, callback) {
  function filterKeyCallback(event) {
    if (typeof keys === 'string') {
      keys = [keys];
    }
    if (keys.indexOf(event.key) !== -1) {
      callback();
    }
  }

  window.addEventListener(eventType, filterKeyCallback);
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
  scenarios.forEach((scenario, idx) => {
    const button = document.createElement('button') as HTMLButtonElement;
    button.innerText = scenario.getName();
    button.onclick = () => scenarioSwitcher.switchTo(idx);
    scenarioSelectorContainer.appendChild(button);
  });

  const sliders = [];
  const sliderContainerElem = document.getElementById('slider-container');
  scenarios.forEach((s, idx) => {
    const { container, slider } = addSlider(
      sliderContainerElem,
      s.getSimulation()
    );
    sliders.push(slider);
    if (idx !== scenarioSwitcher.getCurrentScenarioIndex())
      container.classList.add('display-none');

    scenarioSwitcher.on('switch', (curIdx, prevIdx) => {
      container.classList.add('display-none');
      if (idx === prevIdx) {
        container.classList.remove('display-none');
      }
    });
  });

  const startButton = document.getElementById(
    'playButton'
  ) as HTMLButtonElement;
  const stopButton = document.getElementById(
    'pauseButton'
  ) as HTMLButtonElement;

  let shouldBePlaying = false;

  function play() {
    scenarioSwitcher.getCurrentScenario().getSimulation().play();
    startButton.style.display = 'none';
    stopButton.style.display = 'unset';
    shouldBePlaying = true;
  }

  function pause() {
    scenarioSwitcher.getCurrentScenario().getSimulation().pause();
    startButton.style.display = 'unset';
    stopButton.style.display = 'none';
    shouldBePlaying = false;
  }

  function tooglePlayPause() {
    if (shouldBePlaying) {
      pause();
    } else {
      play();
    }
  }

  // toggle play/pause
  startButton.addEventListener('click', play);
  stopButton.addEventListener('click', pause);
  registerKey('keypress', ' ', tooglePlayPause);
  pause();

  // step through scenarios
  registerKey('keydown', 'ArrowLeft', () => scenarioSwitcher.prev());
  registerKey('keydown', 'ArrowRight', () => scenarioSwitcher.next());

  function stepSliders(steps) {
    sliders.forEach((slider) => {
      slider.stepUp(steps);
      slider.dispatchEvent(new InputEvent('input'));
    });
  }

  // set model parameter via keys or mouse wheel
  registerKey('keydown', 'ArrowUp', () => stepSliders(+1));
  registerKey('keydown', 'ArrowDown', () => stepSliders(-1));
  window.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      if (event.deltaMode === WheelEvent.DOM_DELTA_PIXEL) {
        stepSliders(event.deltaY);
      }
    },
    { passive: false }
  );

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

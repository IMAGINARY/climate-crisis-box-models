import { strict as assert } from 'assert';
import ready from 'document-ready';

import { EarthEnergyBalanceScenario } from './scenarios/earth-energy-balance';
import { IceAlbedoFeedbackScenario } from './scenarios/ice-albedo-feedback';
import { GreenhouseEffectScenario } from './scenarios/greenhouse-effect';
import { ScenarioSwitcher } from './scenario-switcher';
import { Simulation } from './simulation';
import { ParameterWithRange } from './box-model-definition';
import { getDefaultOptions, getOptions } from './options/options';

function addSlider(
  parent: HTMLElement,
  simulation: Simulation
): { container: HTMLDivElement; slider: HTMLInputElement } {
  const container = document.createElement('div');

  const labelSpan = document.createElement('span');
  labelSpan.innerText = simulation.getParameterId();
  container.append(labelSpan);

  const initialValue = simulation.getParameter();
  const { min, max } = simulation.getParameterRange();

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = `${min}`;
  slider.max = `${max}`;
  slider.step = `${0.001 * (max - min)}`;
  slider.value = `${initialValue}`;
  container.append(slider);

  const valueSpan = document.createElement('span');
  valueSpan.innerText = slider.value;
  container.append(valueSpan);

  slider.addEventListener('input', () => {
    valueSpan.innerText = slider.value;
    simulation.setParameter(slider.valueAsNumber);
  });

  simulation.on(
    'parameter-changed',
    (p: ParameterWithRange, suppliedValue: number) => {
      if (suppliedValue === slider.valueAsNumber) {
        // no need to adjust the slider
      } else {
        slider.valueAsNumber = p.value;
        slider.dispatchEvent(new InputEvent('input'));
      }
    }
  );

  parent.appendChild(container);

  return { container, slider };
}

function registerKey<
  K extends keyof Pick<HTMLElementEventMap, 'keydown' | 'keyup' | 'keypress'>
>(
  eventType: K,
  eventProps: Partial<KeyboardEvent>,
  callback: () => unknown
): void {
  const eventPropsEntries = Object.entries(eventProps) as [
    key: keyof KeyboardEvent,
    value: unknown
  ][];
  const isMatching = (event: KeyboardEvent): boolean =>
    eventPropsEntries.reduce(
      (acc: boolean, [key, value]): boolean => acc && event[key] === value,
      true
    );

  function filterKeyCallback(event: KeyboardEvent) {
    if (isMatching(event)) {
      callback();
    }
  }

  window.addEventListener(eventType, filterKeyCallback);
}

async function main() {
  const options = getOptions();
  // eslint-disable-next-line no-console
  console.log({ options, defaults: getDefaultOptions() });

  const scenarioContainer = document.getElementById(
    'scenario-container'
  ) as HTMLDivElement;
  assert(scenarioContainer !== null);

  const earthEnergyBalanceScenario = new EarthEnergyBalanceScenario(
    scenarioContainer,
    await EarthEnergyBalanceScenario.loadResources()
  );
  earthEnergyBalanceScenario.setVisible(true);
  earthEnergyBalanceScenario.getSimulation().bootstrap();
  if (options.autoPlay) earthEnergyBalanceScenario.getSimulation().play();

  const scenarios = [
    earthEnergyBalanceScenario,
    new IceAlbedoFeedbackScenario(
      scenarioContainer,
      await IceAlbedoFeedbackScenario.loadResources()
    ).setVisible(false),
    new GreenhouseEffectScenario(
      scenarioContainer,
      await GreenhouseEffectScenario.loadResources()
    ).setVisible(false),
  ];

  const scenarioSwitcher = new ScenarioSwitcher(scenarios);

  if (options.initialScenario === 'first') scenarioSwitcher.switchTo(0);
  else if (options.initialScenario === 'last')
    scenarioSwitcher.switchTo(scenarioSwitcher.getScenarios().length - 1);
  else if (options.initialScenario === 'random')
    scenarioSwitcher.switchTo(Math.floor(Math.random() * scenarios.length));
  else {
    scenarioSwitcher.switchTo(options.initialScenario);
  }

  const scenarioSelectorContainer = document.getElementById(
    'scenario-selector-container'
  );
  scenarios.forEach((scenario, idx) => {
    const button = document.createElement('button');
    assert(button !== null);
    button.innerText = scenario.getName();
    button.onclick = () => scenarioSwitcher.switchTo(idx);
    scenarioSelectorContainer?.appendChild(button);
  });

  const sliders = [] as HTMLInputElement[];
  const sliderContainerElem = document.getElementById(
    'slider-container'
  ) as HTMLDivElement;
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
  registerKey('keypress', { key: ' ' }, tooglePlayPause);
  if (options.autoPlay) play();
  else pause();

  // step/cycle through scenarios
  registerKey('keydown', { key: options.prevScenarioKey }, () =>
    scenarioSwitcher.prev()
  );
  registerKey('keydown', { key: options.nextScenarioKey }, () =>
    scenarioSwitcher.next()
  );
  if (options.scenarioCycleDirection === 'forward') {
    registerKey('keydown', { key: options.cycleScenarioKey }, () =>
      scenarioSwitcher.cycleForward()
    );
  } else {
    registerKey('keydown', { key: options.cycleScenarioKey }, () =>
      scenarioSwitcher.cycleBackward()
    );
  }

  // toogle overlay
  {
    const enableMathMode = (visible: boolean) => {
      scenarioSwitcher.getScenarios().forEach((s) => s.enableMathMode(visible));
    };
    const keyProps = { key: options.mathModeKey, repeat: false };
    registerKey('keydown', keyProps, () => enableMathMode(true));
    registerKey('keyup', keyProps, () => enableMathMode(false));
    enableMathMode(false);
  }

  function stepSliders(steps: number) {
    sliders.forEach((slider) => {
      slider.stepUp(steps);
      slider.dispatchEvent(new InputEvent('input'));
    });
  }

  // set model parameter via keys or mouse wheel
  registerKey(
    'keydown',
    { key: options.increaseParameterKey, repeat: false },
    () => stepSliders(+1)
  );
  registerKey(
    'keydown',
    { key: options.decreaseParameterKey, repeat: false },
    () => stepSliders(-1)
  );
  registerKey(
    'keydown',
    { key: options.increaseParameterKey, repeat: true },
    () => stepSliders(+10)
  );
  registerKey(
    'keydown',
    { key: options.decreaseParameterKey, repeat: true },
    () => stepSliders(-10)
  );
  const wheelDeltaIdx = options.wheelAxis === 'y' ? 'deltaY' : 'deltaX';
  const wheelDivisor = options.wheelDivisor * (options.wheelInvert ? -1 : 1);
  window.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      if (event.deltaMode === WheelEvent.DOM_DELTA_PIXEL) {
        stepSliders(event[wheelDeltaIdx] / wheelDivisor);
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

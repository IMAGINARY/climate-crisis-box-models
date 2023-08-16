import { strict as assert } from 'assert';
import ready from 'document-ready';
import {
  Idler,
  KeyboardInterrupter,
  PointerInterrupter,
  EventInterrupter,
} from '@imaginary-maths/idler';

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

  const osc = document.getElementById('osc') as HTMLDivElement;
  assert(osc);

  if (options.osc) {
    osc.classList.remove('display-none');
  }

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
  const enableMathMode = (visible: boolean) => {
    scenarioSwitcher.getScenarios().forEach((s) => s.enableMathMode(visible));
  };
  const toggleMathMode = () => {
    scenarioSwitcher.getScenarios().forEach((s) => s.toggleMathMode());
  };

  const initialScenario: number = (() => {
    switch (options.initialScenario) {
      case 'first':
        return 0;
      case 'last':
        return scenarioSwitcher.getScenarios().length - 1;
      case 'random':
        return Math.floor(Math.random() * scenarios.length);
      default:
        return options.initialScenario;
    }
  })();
  scenarioSwitcher.switchTo(initialScenario);

  scenarios.forEach((scenario, idx) => {
    const button = document.getElementById(`scenario-${idx + 1}-button`);
    assert(button !== null);
    button.onclick = () => {
      const currentScenarioIndex = scenarioSwitcher.getCurrentScenarioIndex();
      scenarioSwitcher.switchTo(idx, true);
      if (currentScenarioIndex !== idx) enableMathMode(false);
    };
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

  let shouldBePlaying = false;

  function play() {
    scenarioSwitcher.getCurrentScenario().getSimulation().play();
    document.body.classList.remove('animation-paused');
    shouldBePlaying = true;
  }

  function pause() {
    scenarioSwitcher.getCurrentScenario().getSimulation().pause();
    document.body.classList.add('animation-paused');
    shouldBePlaying = false;
  }

  const keyboardInterrupter = new KeyboardInterrupter();
  const pointerInterrupter = new PointerInterrupter();
  const wheelInterrupter = new EventInterrupter(window, ['wheel']);
  const idler = new Idler(
    keyboardInterrupter,
    pointerInterrupter,
    wheelInterrupter
  );

  type IdlerCallbackOptions = Partial<Parameters<Idler['addCallback']>[0]>;
  const idlerCallbacks: IdlerCallbackOptions[] = [] as IdlerCallbackOptions[];
  if (typeof options.pauseAfter === 'number') {
    const idlePauseCallbackOptions: IdlerCallbackOptions = {
      delay: options.pauseAfter * 1000,
      onBegin: pause,
      onEnd: () => {
        // delay to next frame to avoid interference with play/pause key handling
        requestAnimationFrame(play);
      },
    };
    idlerCallbacks.push(idlePauseCallbackOptions);
  }

  if (typeof options.resetAfter === 'number') {
    const idleSwitchToInitialScenarioCallbackOptions: Partial<
      Parameters<Idler['addCallback']>[0]
    > = {
      delay: options.resetAfter * 1000,
      onBegin: () => scenarioSwitcher.switchTo(initialScenario, true),
    };
    idlerCallbacks.push(idleSwitchToInitialScenarioCallbackOptions);
  }

  let idlerCallbackIds: number[] = [];
  const addIdlerCallbacks = () => {
    idlerCallbackIds = idlerCallbacks.map(idler.addCallback.bind(idler));
  };
  const removeIdlerCallbacks = () => {
    idlerCallbackIds.forEach(idler.removeCallback.bind(idler));
    idlerCallbackIds = [];
  };

  function playByUser() {
    play();
    addIdlerCallbacks();
  }

  function pauseByUser() {
    removeIdlerCallbacks();
    pause();
  }

  function tooglePlayPauseByUser() {
    if (shouldBePlaying) {
      pauseByUser();
    } else {
      playByUser();
    }
  }

  // toggle play/pause
  registerKey('keypress', { key: ' ' }, tooglePlayPauseByUser);
  if (options.autoPlay) playByUser();
  else pauseByUser();

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

  // register event handlers for toggling math overlay
  const keyProps = { key: options.mathModeKey, repeat: false };
  registerKey('keydown', keyProps, () => enableMathMode(true));
  registerKey('keyup', keyProps, () => enableMathMode(false));
  const mathModeButton = document.getElementById(
    'math-mode-button'
  ) as HTMLDivElement;
  assert(mathModeButton !== null);
  mathModeButton.addEventListener('click', toggleMathMode, true);
  enableMathMode(false);

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

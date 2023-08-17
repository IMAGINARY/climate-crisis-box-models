import { strict as assert } from 'assert';
import ready from 'document-ready';
import * as Hammer from 'hammerjs';
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
import { ignorePromise } from './util';

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

let appScaleFactor = 1.0;

function resizeHandler() {
  const baseWidth = 1024;
  const baseHeight = 600;

  const scale =
    window.innerWidth / window.innerHeight > baseWidth / baseHeight
      ? window.innerHeight / baseHeight
      : window.innerWidth / baseWidth;
  const translateX = (window.innerWidth - baseWidth * scale) / 2;
  const translateY = (window.innerHeight - baseHeight * scale) / 2;

  const aspectRatioBox = document.getElementById('aspect-ratio-box');
  assert(aspectRatioBox !== null);
  aspectRatioBox.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

  appScaleFactor = scale;
}

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    ignorePromise(document.documentElement?.requestFullscreen());
  } else if (document.exitFullscreen) {
    ignorePromise(document.exitFullscreen());
  }
}

async function main() {
  resizeHandler();
  window.addEventListener('resize', resizeHandler);

  const options = getOptions();
  // eslint-disable-next-line no-console
  console.log({ options, defaults: getDefaultOptions() });

  const oscBackdrop = document.getElementById('osc-backdrop') as HTMLDivElement;
  assert(oscBackdrop);

  // create a touch gesture manager to detect gestures on the osc further down
  const mc = new Hammer.Manager(oscBackdrop);

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

  if (options.osc) {
    const osc = document.getElementById('osc') as HTMLDivElement;
    assert(osc);
    osc.classList.remove('display-none');

    // Only set up the gesture recognizers if osc is enabled

    // pan to change parameter
    {
      const panSignFactor = options.wheelInvert ? -1.0 : 1.0;
      const { panDirection, panEvents, getSize, getPanDelta, panDeltaFactor } =
        options.wheelAxis === 'y'
          ? {
              panDirection: Hammer.DIRECTION_VERTICAL,
              panEvents: 'panup pandown',
              getSize: () => window.innerHeight,
              getPanDelta: (e: HammerInput) => e.deltaY,
              panDeltaFactor: (panSignFactor * -1500) / options.wheelDivisor,
            }
          : {
              panDirection: Hammer.DIRECTION_HORIZONTAL,
              panEvents: 'panleft panright',
              getSize: () => window.innerWidth,
              getPanDelta: (e: HammerInput) => e.deltaX,
              panDeltaFactor:
                (panSignFactor * ((1500 * 1024) / 600)) / options.wheelDivisor,
            };
      const pan = new Hammer.Pan({
        pointers: 2,
        direction: panDirection,
      });
      mc.add(pan);

      let lastDelta = 10.0;
      mc.on('panstart', () => {
        lastDelta = 10.0;
      });

      mc.on(panEvents, (e) => {
        const delta = getPanDelta(e);
        const size = getSize();
        const perEventDelta = delta - lastDelta;
        const steps = panDeltaFactor * (perEventDelta / size / appScaleFactor);
        stepSliders(steps);
        lastDelta = delta;
      });
    }

    // tap to toggle math mode and fullscreen
    {
      // multi tap code according to https://hammerjs.github.io/require-failure/
      const singleTap = new Hammer.Tap({ event: 'singletap' });
      const doubleTap = new Hammer.Tap({ event: 'doubletap', taps: 2 });

      mc.add([doubleTap, singleTap]);

      doubleTap.recognizeWith(singleTap);
      singleTap.requireFailure(doubleTap);

      mc.on('singletap', toggleMathMode);
      mc.on('doubletap', toggleFullScreen);
    }
  }

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

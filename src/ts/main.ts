import ready from 'document-ready';
import ExampleScenario from './scenarios/ice-albedo-feedback';

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
  const scenario1Div = document.getElementById('scenario1') as HTMLDivElement;
  const scenarioResources = await ExampleScenario.loadResources();
  const scenario1 = new ExampleScenario(scenario1Div, scenarioResources);

  const sliderContainerElem = document.getElementById('slider-container');
  addSlider(sliderContainerElem, scenario1.getSimulation());

  const startButton = document.getElementById(
    'startButton'
  ) as HTMLButtonElement;
  const stopButton = document.getElementById('stopButton') as HTMLButtonElement;

  let shouldBePlaying = false;

  startButton.addEventListener('click', () => {
    scenario1.getSimulation().play();
    shouldBePlaying = true;
  });
  stopButton.addEventListener('click', () => {
    scenario1.getSimulation().pause();
    shouldBePlaying = false;
  });

  function handlePageVisibilityChange() {
    switch (document.visibilityState) {
      case 'visible':
        if (shouldBePlaying) {
          scenario1.getSimulation().play();
        }
        break;
      case 'hidden':
        scenario1.getSimulation().pause();
        break;
      default:
        break;
    }
  }

  document.addEventListener('visibilitychange', handlePageVisibilityChange);
  document.addEventListener('pagehide', handlePageVisibilityChange);
}

ready(main);

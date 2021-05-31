import ExampleScenarioController from './scenarios/greenhouse-effect';

function addSlider(parent, scenario) {
  const container = document.createElement('div');

  const initialValue = scenario.getParameter();
  const { min, max } = scenario.getParameterRange();

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
    scenario.setParameter(slider.valueAsNumber);
  });

  parent.appendChild(container);
}

const scenario1Div = document.getElementById('scenario1') as HTMLDivElement;
const scenario1 = new ExampleScenarioController(scenario1Div);
const parameter1Cb = scenario1.setParameter.bind(scenario1);

const sliderContainerElem = document.getElementById('slider-container');
addSlider(sliderContainerElem, scenario1);

const startButton = document.getElementById('startButton') as HTMLButtonElement;
const stopButton = document.getElementById('stopButton') as HTMLButtonElement;

let shouldBePlaying = false;

startButton.addEventListener('click', () => {
  scenario1.play();
  shouldBePlaying = true;
});
stopButton.addEventListener('click', () => {
  scenario1.pause();
  shouldBePlaying = false;
});

function handlePageVisibilityChange() {
  switch (document.visibilityState) {
    case 'visible':
      if (shouldBePlaying) {
        scenario1.play();
      }
      break;
    case 'hidden':
      scenario1.pause();
      break;
    default:
      break;
  }
}

document.addEventListener('visibilitychange', handlePageVisibilityChange);
document.addEventListener('pagehide', handlePageVisibilityChange);

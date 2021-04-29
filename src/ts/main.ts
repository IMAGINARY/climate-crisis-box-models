import EarthEnergyBalanceWithIceLoopScenarioController from './scenarios/earth-energy-balance-with-ice-loop';

function addSlider(parent, cb, initialValue) {
  const container = document.createElement('div');

  const slider = document.createElement('input') as HTMLInputElement;
  slider.type = 'range';
  slider.min = '0.0';
  slider.max = '1.0';
  slider.step = '0.001';
  slider.value = `${initialValue}`;
  container.append(slider);

  const valueSpan = document.createElement('span');
  valueSpan.innerText = slider.value;
  container.append(valueSpan);

  slider.addEventListener('input', () => {
    valueSpan.innerText = slider.value;
    cb(slider.valueAsNumber);
  });

  parent.appendChild(container);
}

const scenario1Div = document.getElementById('scenario1') as HTMLDivElement;
const scenario1 = new EarthEnergyBalanceWithIceLoopScenarioController(
  scenario1Div
);
const parameter1Cb = scenario1.setParameter.bind(scenario1);

const sliderContainerElem = document.getElementById('slider-container');
addSlider(sliderContainerElem, parameter1Cb, scenario1.getParameter());

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

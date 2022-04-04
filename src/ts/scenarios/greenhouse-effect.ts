import { SVG, Element as SVGElement } from '@svgdotjs/svg.js';
import flatten from 'lodash/flattenDepth';

import { BaseScenario } from './base';
import model from '../models/greenhouse-effect';
import { Simulation, SimulationResult } from '../simulation';
import {
  createTemperatureCelsiusExtractor,
  createYearExtractor,
  loadSvg,
} from '../util';

import {
  Record,
  BoxModelElementKey,
  convertToBoxModelForScenario,
} from '../box-model-definition';
import {
  TemperatureVsTimeChart,
  TemperatureVsTimeChartOptions,
} from '../charts/temperature-vs-time';

const scenarioSvgUrl: URL = new URL(
  './../../svg/scenario.svg',
  import.meta.url
);
const scenarioOverlaySvgUrl: URL = new URL(
  './../../svg/greenhouse-effect-overlay.svg',
  import.meta.url
);

export type Resources = {
  svg: XMLDocument;
  overlaySvg: XMLDocument;
};

const modelForScenario = convertToBoxModelForScenario(model);

export default class GreenhouseEffectScenario extends BaseScenario {
  protected readonly chart: TemperatureVsTimeChart;

  protected readonly svg;

  protected readonly overlaySvg;

  protected modelSceneConnections: ((record: Record) => void)[];

  constructor(elem: HTMLDivElement, resources: Resources) {
    super(elem, new Simulation(modelForScenario));
    const scenarioLabel = document.createElement('div');
    scenarioLabel.innerText = this.getName();
    scenarioLabel.classList.add('label');
    this.getContainer().appendChild(scenarioLabel);

    this.svg = SVG(document.importNode(resources.svg.documentElement, true));
    this.getScene().appendChild(this.svg.node);

    this.overlaySvg = SVG(
      document.importNode(resources.overlaySvg.documentElement, true)
    );
    this.overlaySvg.node.style.transform = 'scale(0.8) translate(-15%,+10%)';
    this.getOverlay().appendChild(this.overlaySvg.node);

    this.modelSceneConnections = this.prepareModelToSceneConnections();

    const canvas: HTMLCanvasElement = document.createElement('canvas');
    canvas.width = 270;
    canvas.height = 190;
    canvas.classList.add('graph');
    this.getScene().appendChild(canvas);

    const chartOptions: TemperatureVsTimeChartOptions = {
      numYears: model.numSteps,
      minTemp: 10,
      maxTemp: 30,
      toYear: createYearExtractor(model),
      toTemperatureCelsius: createTemperatureCelsiusExtractor(
        model,
        'variables',
        'gnd temperature'
      ),
    };
    this.chart = new TemperatureVsTimeChart(canvas, chartOptions);
  }

  prepareModelToSceneConnections(): ((record: Record) => void)[] {
    const formatter = new Intl.NumberFormat('de', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    const format = formatter.format.bind(formatter);

    const connectModelElemType = (
      modelElemType: BoxModelElementKey
    ): ((record: Record) => void)[][] =>
      model[modelElemType].map(({ id }: { id: string }, idx: number) => {
        const cssDataId = CSS.escape(id);
        const elems: NodeListOf<HTMLElement> =
          this.overlaySvg.node.querySelectorAll(`*[data-id="${cssDataId}"]`);
        const extractValue = (record: Record): number => {
          const recordElement = record[modelElemType];
          return recordElement[idx];
        };
        return Array.from(elems).map(
          (elem: HTMLElement) =>
            function setInnerText(record: Record) {
              // eslint-disable-next-line no-param-reassign
              elem.innerText = `${format(extractValue(record))}`;
            }
        );
      });
    const supportedTypes: BoxModelElementKey[] = [
      'stocks',
      'flows',
      'parameters',
      'variables',
    ];
    const nestedModelSceneConnections =
      supportedTypes.map(connectModelElemType);
    return flatten(flatten(nestedModelSceneConnections));
  }

  static async loadResources(): Promise<Resources> {
    const [svg, overlaySvg] = await Promise.all([
      loadSvg(scenarioSvgUrl),
      loadSvg(scenarioOverlaySvgUrl),
    ]);
    return { svg, overlaySvg };
  }

  reset() {
    this.chart.reset();
    this.update([]);
  }

  // eslint-disable-next-line class-methods-use-this
  getName() {
    return 'Greenhouse Effect';
  }

  protected update(newResults: SimulationResult[]) {
    this.chart.update(newResults);
    this.updateOverlay(newResults);
    this.updateCO2();
  }

  protected updateOverlay(newResults: SimulationResult[]) {
    if (newResults.length > 0) {
      const lastNewResult: SimulationResult = newResults[newResults.length - 1];
      const { record: lastRecord } = lastNewResult;
      this.modelSceneConnections.forEach((c) => c(lastRecord));
    }
  }

  protected updateCO2() {
    const simulation = this.getSimulation();
    const { min, max } = simulation.getParameterRange();
    const value = simulation.getParameter();
    const relValue = (value - min) / (max - min);
    const scale = 0.5 + (3 + 0.5) * relValue;

    const co2 = this.svg.findOne('#co2') as SVGElement;
    co2.transform({ scale });
  }
}

export { GreenhouseEffectScenario };

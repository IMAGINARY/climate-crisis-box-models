import assert from 'assert';
import { ConvergenceCriterion } from '@imaginary-maths/box-model/dist/box-model';
import { SVG } from '@svgdotjs/svg.js';

import { BaseScenario } from './base';
import model from '../models/greenhouse-effect';
import { Simulation } from '../simulation';
import {
  createSvgMorphUpdater,
  createTemperatureCelsiusExtractor,
  createYearExtractor,
  loadSvg,
} from '../util';

import { Record, convertToBoxModelForScenario } from '../box-model-definition';
import {
  TemperatureVsTimeChart,
  TemperatureVsTimeChartOptions,
} from '../charts/temperature-vs-time';
import { preprocessSvg } from '../svg-utils';

const scenarioSvgUrl: URL = new URL(
  './../../svg/greenhouse-effect.svg',
  import.meta.url
);

export type Resources = {
  svg: XMLDocument;
};

const modelForScenario = convertToBoxModelForScenario(model);

export default class GreenhouseEffectScenario extends BaseScenario {
  protected readonly svg;

  // protected modelSceneConnections: ((record: Record) => void)[];

  constructor(elem: HTMLDivElement, resources: Resources) {
    super(elem, new Simulation(modelForScenario));

    this.getSimulation().convergeInitialRecord(
      GreenhouseEffectScenario.getConvergenceCriterion()
    );

    this.svg = SVG(document.importNode(resources.svg.documentElement, true));
    this.getScene().appendChild(this.svg.node);
    this.enableMathMode(this.isMathModeEnabled());

    //    this.modelSceneConnections = this.prepareModelToSceneConnections();

    const canvas: HTMLCanvasElement = document.createElement('canvas');
    canvas.width = 238;
    canvas.height = 176;
    canvas.classList.add('graph');
    this.getScene().appendChild(canvas);

    const chartOptions: TemperatureVsTimeChartOptions = {
      numYears: model.numSteps,
      minTemp: 10,
      maxTemp: 30,
      tempAxisLabel: () => 'Temperature (°C)',
      timeAxisTitle: () => 'Zeit (Jahrhundert)',
      timeTickStepSize: 100,
      toYear: createYearExtractor(model),
      toTemperatureCelsius: createTemperatureCelsiusExtractor(
        model,
        'variables',
        'gnd temperature'
      ),
    };

    const chart = new TemperatureVsTimeChart(canvas, chartOptions);

    this.updaters.push(chart, ...this.createVizUpdaters());
  }
  /*
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
*/

  static fixScenarioSvg(svg: XMLDocument): void {
    // general fix-ups
    const parentClassName = 'greenhouse-effect-scenario';
    preprocessSvg(svg, parentClassName);
  }

  static async loadResources(): Promise<Resources> {
    const svg = await loadSvg(scenarioSvgUrl);
    GreenhouseEffectScenario.fixScenarioSvg(svg);
    return { svg };
  }

  // eslint-disable-next-line class-methods-use-this
  getName() {
    return 'Greenhouse Effect';
  }

  protected createVizUpdaters() {
    const solarEmissivityVizUpdater = createSvgMorphUpdater(
      model,
      'parameters',
      'solar emissivity',
      this.svg,
      '[id^=sun]',
      '[id^=sun-min]',
      '[id^=sun-max]',
      'sun-in-between'
    );

    const sunRadiationVizUpdater = createSvgMorphUpdater(
      model,
      'flows',
      'sun radiation',
      this.svg,
      '[id^=arrowL]',
      '[id^=arrowL-min]',
      '[id^=arrowL-max]',
      'arrowL-in-between'
    );

    const albedoVizUpdater = createSvgMorphUpdater(
      model,
      'parameters',
      'albedo',
      this.svg,
      '[id^=ice]',
      '[id^=ice-min]',
      '[id^=ice-max]',
      'ice-in-between'
    );

    const reflectedSunRadiationVizUpdater = createSvgMorphUpdater(
      model,
      'flows',
      'reflected sun radiation',
      this.svg,
      '[id^=arrowA]',
      '[id^=arrowA-min]',
      '[id^=arrowA-max]',
      'arrowA-in-between'
    );

    const co2VizUpdater = createSvgMorphUpdater(
      model,
      'parameters',
      'co2',
      this.svg,
      '[id^=co2]',
      '[id^=co2-min]',
      '[id^=co2-max]',
      'co2-in-between'
    );

    const atmInfraredRadiationToSpaceUpdater = createSvgMorphUpdater(
      model,
      'flows',
      'atm infrared radiation',
      this.svg,
      '[id^=arrowT04_00000112630670996646518150000012643698993845127854_]',
      '[id^=arrowT-min_00000178184571480185186270000000989059420252595633_]',
      '[id^=arrowT-min_00000048494689990831607920000012975954839801877127_]',
      'arrowAtmIrToSpace-in-between'
    );

    const atmInfraredRadiationToGroundUpdater = createSvgMorphUpdater(
      model,
      'flows',
      'atm infrared radiation',
      this.svg,
      '[id^=arrowT04_00000000220227962982375480000002875120465275809212_]',
      '[id^=arrowT-min_00000177457970715849149150000002028447019056006802_]',
      '[id^=arrowT-min_00000134220673476464974560000002754782525986077846_]',
      'arrowAtmIrToSpace-in-between'
    );

    const gndInfraredRadiationUpdater = createSvgMorphUpdater(
      model,
      'flows',
      'gnd infrared radiation',
      this.svg,
      '[id^=arrowT01_00000029741552965370584210000005287515950479437996_]',
      '[id^=arrowT-min_00000040537476374896218760000011249788402166947992_]',
      '[id^=arrowT-max_00000143601437999464270780000003627254799871171733_]',
      'arrowAtmIrToSpace-in-between'
    );

    const gndInfraredRadiationNoAbsorbedUpdater = createSvgMorphUpdater(
      model,
      'flows',
      'gnd infrared radiation not absorbed',
      this.svg,
      '[id^=arrowT04_00000150821003731813250060000004973534727753554340_]',
      '[id^=arrowT-min_00000163783013519234521790000015716059359473621940_]',
      '[id^=arrowT-min_00000025416743853861926490000014613916206075972529_]',
      'arrowAtmIrToSpace-in-between'
    );

    return [
      solarEmissivityVizUpdater,
      sunRadiationVizUpdater,
      albedoVizUpdater,
      reflectedSunRadiationVizUpdater,
      co2VizUpdater,
      atmInfraredRadiationToSpaceUpdater,
      atmInfraredRadiationToGroundUpdater,
      gndInfraredRadiationUpdater,
      gndInfraredRadiationNoAbsorbedUpdater,
    ];
  }

  protected static getConvergenceCriterion(): ConvergenceCriterion {
    const temperatureIdx = model.variables
      .map(({ id }) => id)
      .indexOf('gnd temperature');

    const convergenceCriterion = (record: Record, lastRecord: Record) => {
      const temp = record.variables[temperatureIdx];
      const lastTemp = lastRecord.variables[temperatureIdx];
      return Math.abs(temp - lastTemp) < 0.001;
    };

    return convergenceCriterion;
  }
  /*
  protected update(newResults: SimulationResult[]) {
    this.chart.update(newResults);
    //    this.updateOverlay(newResults);
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
*/

  getMathModeElements() {
    const nonMathModeText = this.svg.findOne('[id^=text02]');
    assert(nonMathModeText !== null);

    const mathModeOverlay = this.svg.findOne('[id^=mathmode03]');
    assert(mathModeOverlay !== null);

    return {
      hide: [nonMathModeText.node],
      show: [mathModeOverlay.node],
    };
  }
}

export { GreenhouseEffectScenario };

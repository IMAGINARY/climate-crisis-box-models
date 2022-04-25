# Climate box model simulator

This pedagogical program shows three examples of the _box model_ modeling technique applied to climate. This program is part of the [10 Minute Museum on the Climate Crisis](https://10mm.imaginary.org) by IMAGINARY.

Check out the [online demo](https://raw.githack.com/IMAGINARY/climate-crisis-box-models/main/dist/index.html).

## Background

A _box model_ consist of:

- A series of _stocks_ or containers of the quantity we want to model (e.g. energy, but could be money, people, etc).
- A series of _flows_ or arrows that transfer the quantity in and out the stocks, according to some physical laws or given formulas.
- Some _variables_ or values that depend on other values according to certain formulas.
- Some _parameters_ or values that we are free to adjust.

  Each of the components is set to an initial value. To run the model, we need an _engine_ or program that updates the values of stocks, flows, and variables for each time step. Mathematically, this is an integration algorithm.

## Models in this program

### The Earth Energy Balance

Energy enters the Earth by the Sun radiation, and it leaves the Earth by infrared radiation. We adjust the albedo parameter (how reflective is the Earth) to find the temperature at the equilibrium point.

### The Ice-Albedo Feedback

We modify the previous model to introduce a relationship between the albedo and the temperature (since the albedo depends mostly on the ice and water vapour in the Earth surface, which depends on the temperature). We observe a _hysteresis_ effect, that is, the system has some "memory" that makes the system evolve to one or another state depending on the previous history; and we also observe _tipping points_, that is, moments when the behavior changes abruptly and irreversibly due to the reinforced feedback effect. We adjust the Sun intensity to explore the effect.

### The Greenhouse Effect

This model describes the effect of the atmosphere as an _energy trap_ for the Earth. It is what makes life possible on the planet, but an increase of greenhouse gases (by human pollution) can cause the Earth to warm in excess.

Unlike the previous two theoretical examples, this third model is more realistic and has been tuned with real values. We can tune the amount of Greenhouse gases since 1850 and into the future according to some scenarios, and see the effect in the average temperature.

Please note that this is a pedagogical project. Our model for the greenhouse effect is an oversimplified _toy model_ aimed to explain the basic ideas to the public, and its results are in no way accurate. It cannot be a substitute for any professional model made by climate scientists.

## Usage

The repository contains the bundled app inside the [`dist`](dist) folder. This folder needs to be served by a web server.

Having `npx` installed, you can serve the app via

```shell
npx reload --dir dist
```

Another possibility is to run

```shell
npm install
npm run server
```

Note, however, that this pulls in all development dependencies, which are of considerable size.

In both cases, check the CLI output for the URL of the server, that you have to open in a web browser.

### Configuration

The app exposes a number of configuration options via the URL query string:

- `initialScenario` (`first` | `last` | `random` | number, default: `first`): start with the given scenario/model.
- `osc` (`true` | `false`, default: `true`): Toggle on-screen controls.
- `pauseAfter` (number | `false`, default: `60`): Automatically pause the simulation after being idle for the given number of seconds.
- `resetAfter` (number | `false`, default: `180`): Automatically reset to the initial scenario after being idle for the given number of seconds.
- `autoPlay` (`true` | `false`, default: `true`): Toggle auto-play.
- `scenarioCycleDirection` (`forward` | `backward`, default: `forward`): Cycle direction for the cycle key.
- `prevScenarioKey` (key name, default: `ArrowLeft`): Key to go to the previous scenario/model.
- `nextScenarioKey` (key name, default: `ArrowRight`): Key to go to the next scenario/model.
- `cycleScenarioKey` (key name, default: `c`): Key to cycle through the scenarios/model.
- `increaseParameterKey` (key name, default: `ArrowUp`): Key to increase the parameter value.
- `decreaseParameterKey` (key name, default: `ArrowDown`): Key to decrease the parameter value.
- `mathModeKey` (key name, default: `m`): Key to toggle the math mode.
- `wheelDivisor`(number, default: `1.0`): Divisor controlling the speed with with the mouse wheel/trackpad controls the parameter. -`wheelInvert` (`true` | `false`, default: `false`): Invert the direction of the mouse wheel/trackpad controls. -`wheelAxis`(`x` | `y`, default: `y`): Let this mouse wheel/trackpad axis control the parameter.

## Building

Install the dependencies:

```shell
npm install
```

Run the development server:

```shell
npm run serve
```

Build the redistributable bundle into the `dist` folder:

```shell
npm run build
```

## References

- Archer, D. _Course [Global Warming I: The Science and Modeling of Climate Change](https://www.coursera.org/learn/global-warming)_, in Coursera.

- Archer, D. _Course [Global Warming II: Create your own models in Python](https://www.coursera.org/learn/global-warming-model)_, in Coursera.

- Archer, D. _Course [Global Warming II: Time-dependent energy balance model](https://www.coursera.org/lecture/global-warming-model/how-the-model-works-xP2SG)_, in Coursera.

- Archer, D. _Course [Global Warming II: Iterative Runaway Ice-Albedo Feedback model](https://www.coursera.org/lecture/global-warming-model/how-the-model-works-rvNth)_, in Coursera.

- Marshall J. and Plumb R.A. _Atmosphere, Ocean and Climate Dynamics_, AP 2007, Chapter 2.

- Wikipedia. _[Idealized greenhouse model](https://en.wikipedia.org/wiki/Idealized_greenhouse_model)_.

## Contributors

- Christian Stussak (Software development)
- Daniel Ramos (Concept and theory)
- Malte Hein (Graphic design)
- Andreas Matt (Coordination)

## License

Copyright 2022 IMAGINARY gGmbH

Licensed under the MIT license (see the [`LICENSE`](LICENSE) file).

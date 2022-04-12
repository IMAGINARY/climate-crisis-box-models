// eslint-disable @typescript-eslint/naming-convention

/**
 * Temperature anomaly data with respect to the reference period 1961-1990.
 * Rounded to two decimal places.
 *
 * Data sources:
 * https://www.metoffice.gov.uk/hadobs/hadcrut5/data/current/download.html
 * https://www.metoffice.gov.uk/hadobs/hadcrut5/data/current/analysis/diagnostics/HadCRUT.5.0.1.0.analysis.summary_series.global.annual.csv
 */
const firstYear = 1850;
const temperatureAnomaliesCelsius = [
  -0.42, -0.23, -0.23, -0.27, -0.29, -0.3, -0.32, -0.47, -0.39, -0.28, -0.39,
  -0.43, -0.54, -0.34, -0.47, -0.33, -0.34, -0.36, -0.35, -0.32, -0.33, -0.37,
  -0.33, -0.34, -0.37, -0.38, -0.42, -0.1, -0.01, -0.3, -0.32, -0.23, -0.3,
  -0.35, -0.49, -0.47, -0.42, -0.5, -0.38, -0.25, -0.51, -0.4, -0.51, -0.49,
  -0.48, -0.45, -0.28, -0.26, -0.49, -0.36, -0.23, -0.29, -0.44, -0.53, -0.6,
  -0.41, -0.32, -0.5, -0.51, -0.54, -0.53, -0.54, -0.48, -0.47, -0.26, -0.19,
  -0.42, -0.54, -0.42, -0.33, -0.3, -0.24, -0.34, -0.32, -0.31, -0.28, -0.12,
  -0.23, -0.21, -0.39, -0.18, -0.1, -0.15, -0.32, -0.17, -0.21, -0.17, -0.02,
  -0.01, -0.04, 0.08, 0.04, 0, 0.01, 0.14, 0.04, -0.12, -0.09, -0.12, -0.14,
  -0.23, -0.06, 0.02, 0.08, -0.12, -0.2, -0.26, -0.04, -0.02, -0.05, -0.12,
  -0.02, -0.06, -0.04, -0.31, -0.2, -0.15, -0.12, -0.17, -0.03, -0.09, -0.21,
  -0.09, 0.05, -0.17, -0.11, -0.22, 0.1, 0.01, 0.09, 0.2, 0.25, 0.03, 0.22,
  0.05, 0.05, 0.1, 0.24, 0.28, 0.18, 0.36, 0.34, 0.12, 0.17, 0.23, 0.38, 0.28,
  0.42, 0.58, 0.32, 0.33, 0.49, 0.54, 0.54, 0.47, 0.61, 0.57, 0.59, 0.47, 0.6,
  0.68, 0.54, 0.58, 0.62, 0.67, 0.83, 0.93, 0.85, 0.76, 0.89, 0.92, 0.76, 0.77,
];

/**
 * Data source:
 * https://crudata.uea.ac.uk/cru/data/temperature/
 */
const temperatureAnomalyOffsetCelsius = 13.974;

const temperaturesCelsius = temperatureAnomaliesCelsius.map(
  (anomalie, index) => ({
    year: firstYear + index,
    value: temperatureAnomalyOffsetCelsius + anomalie,
  })
);

/**
 * CMIP6ssp585 GHG data set
 * Rounded to two decimal places.
 * Data type: [CO2 (ppmv), CH4 (ppbv), N20 (ppbv)]
 */
const greenhouseGasesCMIP6ssp585: [
  co2Ppm: number,
  ch4Ppb: number,
  n2oPpb: number
][] = [
  [284.32, 808.25, 273.02],
  [284.45, 808.41, 273.09],
  [284.6, 809.16, 273.17],
  [284.73, 810.4, 273.26],
  [284.85, 811.73, 273.36],
  [284.94, 813.33, 273.47],
  [285.05, 814.8, 273.58],
  [285.2, 816.45, 273.68],
  [285.37, 818.36, 273.76],
  [285.55, 820.4, 273.9],
  [285.74, 822.31, 274.06],
  [285.93, 824.4, 274.24],
  [286.1, 827.03, 274.42],
  [286.27, 830.17, 274.57],
  [286.44, 833.6, 274.72],
  [286.61, 836.89, 274.88],
  [286.78, 840.36, 275.05],
  [286.96, 844, 275.21],
  [287.11, 847.25, 275.39],
  [287.23, 850.13, 275.56],
  [287.36, 852.44, 275.72],
  [287.49, 853.99, 275.9],
  [287.66, 855.23, 276.08],
  [287.86, 856.17, 276.25],
  [288.06, 857.82, 276.42],
  [288.29, 859.47, 276.59],
  [288.52, 860.86, 276.74],
  [288.75, 862.38, 276.86],
  [288.99, 864.14, 277],
  [289.22, 866.28, 277.13],
  [289.47, 868.7, 277.27],
  [289.74, 870.98, 277.37],
  [290.02, 873.25, 277.49],
  [290.26, 875.6, 277.59],
  [290.51, 878.15, 277.7],
  [290.8, 881.03, 277.8],
  [291.1, 883.84, 277.89],
  [291.41, 886.93, 278],
  [291.76, 889.93, 278.08],
  [292.11, 893.16, 278.19],
  [292.46, 896.38, 278.27],
  [292.82, 899.67, 278.35],
  [293.17, 903.53, 278.44],
  [293.48, 907.27, 278.55],
  [293.79, 910.48, 278.69],
  [294.08, 913.23, 278.83],
  [294.37, 914.77, 278.94],
  [294.65, 916.27, 279.05],
  [294.95, 919.02, 279.16],
  [295.3, 922.28, 279.31],
  [295.68, 925.55, 279.45],
  [296.01, 928.8, 279.61],
  [296.33, 932.73, 279.86],
  [296.65, 936.78, 280.16],
  [296.95, 942.11, 280.43],
  [297.29, 947.44, 280.71],
  [297.66, 953.09, 280.98],
  [298.1, 959.16, 281.28],
  [298.52, 964.09, 281.61],
  [298.94, 969.4, 281.95],
  [299.38, 974.79, 282.31],
  [299.83, 979.47, 282.72],
  [300.35, 983.61, 283.02],
  [300.91, 986.24, 283.36],
  [301.42, 988.61, 283.72],
  [301.94, 991.46, 284.05],
  [302.49, 998.45, 284.31],
  [303.01, 1003.57, 284.62],
  [303.45, 1010.13, 284.81],
  [303.81, 1017.63, 284.85],
  [304.25, 1025.07, 284.93],
  [304.6, 1032.2, 285.04],
  [304.95, 1039.1, 285.17],
  [305.27, 1045.13, 285.47],
  [305.63, 1049.45, 285.61],
  [305.81, 1052.16, 285.65],
  [305.95, 1053.6, 285.69],
  [306.18, 1055.77, 285.74],
  [306.33, 1060.64, 285.83],
  [306.5, 1066.66, 285.89],
  [306.62, 1072.64, 285.94],
  [306.82, 1077.49, 286.12],
  [307.09, 1081.96, 286.22],
  [307.4, 1086.54, 286.37],
  [307.79, 1091.77, 286.47],
  [308.23, 1097.08, 286.59],
  [309.01, 1101.83, 286.75],
  [309.76, 1106.32, 286.95],
  [310.29, 1110.63, 287.19],
  [310.85, 1116.91, 287.39],
  [311.36, 1120.12, 287.62],
  [311.81, 1123.24, 287.86],
  [312.17, 1128.19, 288.14],
  [312.39, 1132.66, 288.78],
  [312.41, 1136.27, 289],
  [312.39, 1139.32, 289.23],
  [312.39, 1143.66, 289.43],
  [312.49, 1149.64, 289.51],
  [312.52, 1155.63, 289.56],
  [312.63, 1160.35, 289.6],
  [312.82, 1163.82, 289.74],
  [313.01, 1168.81, 289.86],
  [313.34, 1174.31, 290.03],
  [313.73, 1183.36, 290.33],
  [314.1, 1194.43, 290.55],
  [314.42, 1206.65, 290.84],
  [314.7, 1221.1, 291.19],
  [314.99, 1235.8, 291.51],
  [315.35, 1247.42, 291.77],
  [315.81, 1257.32, 291.99],
  [316.63, 1264.12, 292.28],
  [317.3, 1269.46, 292.6],
  [318.04, 1282.57, 292.95],
  [318.65, 1300.79, 293.33],
  [319.33, 1317.37, 293.69],
  [319.82, 1331.06, 294.05],
  [320.88, 1342.24, 294.45],
  [321.48, 1354.27, 294.86],
  [322.39, 1371.65, 295.27],
  [323.25, 1389.34, 295.68],
  [324.78, 1411.1, 296.1],
  [325.4, 1431.12, 296.52],
  [327.35, 1449.29, 296.96],
  [329.91, 1462.86, 297.4],
  [330.76, 1476.14, 297.86],
  [330.83, 1491.74, 298.33],
  [331.55, 1509.11, 298.81],
  [333.35, 1527.68, 299.32],
  [335.01, 1546.89, 299.85],
  [336.6, 1566.16, 300.39],
  [338.71, 1584.94, 300.96],
  [340.06, 1602.65, 301.56],
  [340.64, 1618.73, 302.19],
  [342.27, 1632.62, 302.84],
  [344.01, 1643.5, 303.53],
  [345.46, 1655.91, 304.25],
  [346.9, 1668.79, 305],
  [348.77, 1683.75, 305.79],
  [351.28, 1693.94, 306.62],
  [352.89, 1705.63, 307.83],
  [354.07, 1717.4, 308.68],
  [355.35, 1729.33, 309.23],
  [356.23, 1740.14, 309.73],
  [356.93, 1743.1, 310.1],
  [358.25, 1748.62, 310.81],
  [360.24, 1755.23, 311.28],
  [362.01, 1757.19, 312.3],
  [363.25, 1761.5, 313.18],
  [365.93, 1770.29, 313.91],
  [367.85, 1778.2, 314.71],
  [369.13, 1778.01, 315.76],
  [370.67, 1776.53, 316.49],
  [372.84, 1778.96, 317.1],
  [375.41, 1783.59, 317.73],
  [376.99, 1784.23, 318.36],
  [378.91, 1783.36, 319.13],
  [381.01, 1783.42, 319.93],
  [382.6, 1788.95, 320.65],
  [384.74, 1798.42, 321.58],
  [386.28, 1802.1, 322.27],
  [388.72, 1807.85, 323.14],
  [390.94, 1813.07, 324.16],
  [393.02, 1815.26, 325.01],
  [395.73, 1822.58, 325.92],
  [397.55, 1831.47, 326.99],
  [399.95, 1841.95, 328.18],
  [403.12, 1851.59, 329.08],
  [405.79, 1873.52, 329.79],
  [408.76, 1885.97, 330.56],
  [411.79, 1897.06, 331.35],
  [414.89, 1906.88, 332.15],
  [418.06, 1915.52, 332.97],
  [421.33, 1924.02, 333.8],
  [424.72, 1933.39, 334.64],
  [428.22, 1943.57, 335.48],
  [431.83, 1954.49, 336.33],
  [435.55, 1966.1, 337.18],
  [439.38, 1978.35, 338.04],
  [443.32, 1991.17, 338.9],
  [447.36, 2004.52, 339.77],
  [451.51, 2018.36, 340.64],
  [455.78, 2032.64, 341.52],
  [460.16, 2047.82, 342.4],
  [464.68, 2064.33, 343.29],
  [469.33, 2082.06, 344.18],
  [474.11, 2100.91, 345.07],
  [479.03, 2120.79, 345.96],
  [484.07, 2141.61, 346.85],
  [489.25, 2163.3, 347.75],
  [494.57, 2185.77, 348.65],
  [500.02, 2208.96, 349.55],
  [505.61, 2232.81, 350.46],
  [511.34, 2256.91, 351.36],
  [517.23, 2280.92, 352.25],
  [523.27, 2304.84, 353.13],
  [529.46, 2328.67, 354],
  [535.81, 2352.41, 354.86],
  [542.31, 2376.05, 355.71],
  [548.98, 2399.61, 356.55],
  [555.8, 2423.08, 357.38],
  [562.78, 2446.45, 358.2],
  [569.93, 2469.74, 359.01],
  [577.26, 2492.02, 359.82],
  [584.78, 2512.43, 360.62],
  [592.51, 2531.11, 361.41],
  [600.43, 2548.16, 362.21],
  [608.55, 2563.69, 363],
  [616.87, 2577.82, 363.79],
  [625.39, 2590.63, 364.57],
  [634.11, 2602.21, 365.35],
  [643.04, 2612.64, 366.13],
  [652.17, 2622.01, 366.9],
  [661.51, 2630.41, 367.67],
  [671.04, 2637.92, 368.44],
  [680.79, 2644.6, 369.19],
  [690.74, 2650.53, 369.94],
  [700.9, 2655.74, 370.69],
  [711.27, 2660.29, 371.42],
  [721.85, 2664.23, 372.15],
  [732.65, 2667.6, 372.88],
  [743.66, 2670.43, 373.59],
  [754.89, 2672.78, 374.31],
  [766.32, 2674.29, 375.01],
  [777.93, 2674.65, 375.71],
  [789.72, 2673.95, 376.4],
  [801.69, 2672.27, 377.09],
  [813.85, 2669.7, 377.78],
  [826.19, 2666.29, 378.46],
  [838.73, 2662.11, 379.13],
  [851.45, 2657.24, 379.8],
  [864.37, 2651.72, 380.46],
  [877.48, 2645.6, 381.11],
  [890.71, 2638.61, 381.76],
  [903.98, 2630.48, 382.4],
  [917.3, 2621.3, 383.03],
  [930.67, 2611.17, 383.66],
  [944.09, 2600.16, 384.27],
  [957.57, 2588.35, 384.87],
  [971.1, 2575.82, 385.47],
  [984.68, 2562.62, 386.05],
  [998.32, 2548.82, 386.63],
  [1012.02, 2534.47, 387.2],
  [1025.74, 2520.03, 387.75],
  [1039.45, 2505.94, 388.3],
  [1053.15, 2492.17, 388.83],
  [1066.85, 2478.71, 389.36],
  [1080.53, 2465.52, 389.87],
  [1094.21, 2452.61, 390.37],
  [1107.89, 2439.95, 390.86],
  [1121.55, 2427.53, 391.33],
  [1135.21, 2415.33, 391.8],
];

/**
 * CMIP6ssp245 GHG data set
 * Rounded to two decimal places.
 * Data type: [CO2 (ppmv), CH4 (ppbv), N20 (ppbv)]
 */
const greenhouseGasesCMIP6ssp245: [
  co2Ppm: number,
  ch4Ppb: number,
  n2oPpb: number
][] = [
  [284.32, 808.25, 273.02],
  [284.45, 808.41, 273.09],
  [284.6, 809.16, 273.17],
  [284.73, 810.4, 273.26],
  [284.85, 811.73, 273.36],
  [284.94, 813.33, 273.47],
  [285.05, 814.8, 273.58],
  [285.2, 816.45, 273.68],
  [285.37, 818.36, 273.76],
  [285.55, 820.4, 273.9],
  [285.74, 822.31, 274.06],
  [285.93, 824.4, 274.24],
  [286.1, 827.03, 274.42],
  [286.27, 830.17, 274.57],
  [286.44, 833.6, 274.72],
  [286.61, 836.89, 274.88],
  [286.78, 840.36, 275.05],
  [286.96, 844, 275.21],
  [287.11, 847.25, 275.39],
  [287.23, 850.13, 275.56],
  [287.36, 852.44, 275.72],
  [287.49, 853.99, 275.9],
  [287.66, 855.23, 276.08],
  [287.86, 856.17, 276.25],
  [288.06, 857.82, 276.42],
  [288.29, 859.47, 276.59],
  [288.52, 860.86, 276.74],
  [288.75, 862.38, 276.86],
  [288.99, 864.14, 277],
  [289.22, 866.28, 277.13],
  [289.47, 868.7, 277.27],
  [289.74, 870.98, 277.37],
  [290.02, 873.25, 277.49],
  [290.26, 875.6, 277.59],
  [290.51, 878.15, 277.7],
  [290.8, 881.03, 277.8],
  [291.1, 883.84, 277.89],
  [291.41, 886.93, 278],
  [291.76, 889.93, 278.08],
  [292.11, 893.16, 278.19],
  [292.46, 896.38, 278.27],
  [292.82, 899.67, 278.35],
  [293.17, 903.53, 278.44],
  [293.48, 907.27, 278.55],
  [293.79, 910.48, 278.69],
  [294.08, 913.23, 278.83],
  [294.37, 914.77, 278.94],
  [294.65, 916.27, 279.05],
  [294.95, 919.02, 279.16],
  [295.3, 922.28, 279.31],
  [295.68, 925.55, 279.45],
  [296.01, 928.8, 279.61],
  [296.33, 932.73, 279.86],
  [296.65, 936.78, 280.16],
  [296.95, 942.11, 280.43],
  [297.29, 947.44, 280.71],
  [297.66, 953.09, 280.98],
  [298.1, 959.16, 281.28],
  [298.52, 964.09, 281.61],
  [298.94, 969.4, 281.95],
  [299.38, 974.79, 282.31],
  [299.83, 979.47, 282.72],
  [300.35, 983.61, 283.02],
  [300.91, 986.24, 283.36],
  [301.42, 988.61, 283.72],
  [301.94, 991.46, 284.05],
  [302.49, 998.45, 284.31],
  [303.01, 1003.57, 284.62],
  [303.45, 1010.13, 284.81],
  [303.81, 1017.63, 284.85],
  [304.25, 1025.07, 284.93],
  [304.6, 1032.2, 285.04],
  [304.95, 1039.1, 285.17],
  [305.27, 1045.13, 285.47],
  [305.63, 1049.45, 285.61],
  [305.81, 1052.16, 285.65],
  [305.95, 1053.6, 285.69],
  [306.18, 1055.77, 285.74],
  [306.33, 1060.64, 285.83],
  [306.5, 1066.66, 285.89],
  [306.62, 1072.64, 285.94],
  [306.82, 1077.49, 286.12],
  [307.09, 1081.96, 286.22],
  [307.4, 1086.54, 286.37],
  [307.79, 1091.77, 286.47],
  [308.23, 1097.08, 286.59],
  [309.01, 1101.83, 286.75],
  [309.76, 1106.32, 286.95],
  [310.29, 1110.63, 287.19],
  [310.85, 1116.91, 287.39],
  [311.36, 1120.12, 287.62],
  [311.81, 1123.24, 287.86],
  [312.17, 1128.19, 288.14],
  [312.39, 1132.66, 288.78],
  [312.41, 1136.27, 289],
  [312.39, 1139.32, 289.23],
  [312.39, 1143.66, 289.43],
  [312.49, 1149.64, 289.51],
  [312.52, 1155.63, 289.56],
  [312.63, 1160.35, 289.6],
  [312.82, 1163.82, 289.74],
  [313.01, 1168.81, 289.86],
  [313.34, 1174.31, 290.03],
  [313.73, 1183.36, 290.33],
  [314.1, 1194.43, 290.55],
  [314.42, 1206.65, 290.84],
  [314.7, 1221.1, 291.19],
  [314.99, 1235.8, 291.51],
  [315.35, 1247.42, 291.77],
  [315.81, 1257.32, 291.99],
  [316.63, 1264.12, 292.28],
  [317.3, 1269.46, 292.6],
  [318.04, 1282.57, 292.95],
  [318.65, 1300.79, 293.33],
  [319.33, 1317.37, 293.69],
  [319.82, 1331.06, 294.05],
  [320.88, 1342.24, 294.45],
  [321.48, 1354.27, 294.86],
  [322.39, 1371.65, 295.27],
  [323.25, 1389.34, 295.68],
  [324.78, 1411.1, 296.1],
  [325.4, 1431.12, 296.52],
  [327.35, 1449.29, 296.96],
  [329.91, 1462.86, 297.4],
  [330.76, 1476.14, 297.86],
  [330.83, 1491.74, 298.33],
  [331.55, 1509.11, 298.81],
  [333.35, 1527.68, 299.32],
  [335.01, 1546.89, 299.85],
  [336.6, 1566.16, 300.39],
  [338.71, 1584.94, 300.96],
  [340.06, 1602.65, 301.56],
  [340.64, 1618.73, 302.19],
  [342.27, 1632.62, 302.84],
  [344.01, 1643.5, 303.53],
  [345.46, 1655.91, 304.25],
  [346.9, 1668.79, 305],
  [348.77, 1683.75, 305.79],
  [351.28, 1693.94, 306.62],
  [352.89, 1705.63, 307.83],
  [354.07, 1717.4, 308.68],
  [355.35, 1729.33, 309.23],
  [356.23, 1740.14, 309.73],
  [356.93, 1743.1, 310.1],
  [358.25, 1748.62, 310.81],
  [360.24, 1755.23, 311.28],
  [362.01, 1757.19, 312.3],
  [363.25, 1761.5, 313.18],
  [365.93, 1770.29, 313.91],
  [367.85, 1778.2, 314.71],
  [369.13, 1778.01, 315.76],
  [370.67, 1776.53, 316.49],
  [372.84, 1778.96, 317.1],
  [375.41, 1783.59, 317.73],
  [376.99, 1784.23, 318.36],
  [378.91, 1783.36, 319.13],
  [381.01, 1783.42, 319.93],
  [382.6, 1788.95, 320.65],
  [384.74, 1798.42, 321.58],
  [386.28, 1802.1, 322.27],
  [388.72, 1807.85, 323.14],
  [390.94, 1813.07, 324.16],
  [393.02, 1815.26, 325.01],
  [395.73, 1822.58, 325.92],
  [397.55, 1831.47, 326.99],
  [399.95, 1841.94, 328.18],
  [403.12, 1851.59, 329.08],
  [405.76, 1873.8, 329.79],
  [408.63, 1887.04, 330.54],
  [411.51, 1899.41, 331.3],
  [414.39, 1910.97, 332.07],
  [417.29, 1921.79, 332.84],
  [420.2, 1932.06, 333.62],
  [423.13, 1941.94, 334.4],
  [426.07, 1951.46, 335.19],
  [429.03, 1960.65, 335.98],
  [432.01, 1969.54, 336.78],
  [435.01, 1978.15, 337.58],
  [438.03, 1986.49, 338.39],
  [441.08, 1994.6, 339.21],
  [444.14, 2002.48, 340.03],
  [447.23, 2010.15, 340.86],
  [450.33, 2017.23, 341.68],
  [453.43, 2023.39, 342.51],
  [456.54, 2028.68, 343.34],
  [459.65, 2033.16, 344.16],
  [462.77, 2036.9, 344.98],
  [465.9, 2039.94, 345.81],
  [469.03, 2042.34, 346.63],
  [472.18, 2044.13, 347.45],
  [475.34, 2045.36, 348.27],
  [478.5, 2046.08, 349.09],
  [481.67, 2046.11, 349.9],
  [484.84, 2045.28, 350.71],
  [488, 2043.66, 351.51],
  [491.15, 2041.31, 352.3],
  [494.3, 2038.27, 353.09],
  [497.45, 2034.6, 353.87],
  [500.59, 2030.34, 354.64],
  [503.73, 2025.54, 355.41],
  [506.88, 2020.24, 356.17],
  [510.01, 2014.47, 356.92],
  [513.14, 2008.2, 357.66],
  [516.23, 2001.4, 358.4],
  [519.29, 1994.11, 359.12],
  [522.33, 1986.37, 359.83],
  [525.33, 1978.21, 360.53],
  [528.31, 1969.67, 361.22],
  [531.26, 1960.77, 361.9],
  [534.19, 1951.55, 362.57],
  [537.09, 1942.03, 363.23],
  [539.96, 1932.23, 363.88],
  [542.79, 1922.46, 364.51],
  [545.59, 1912.99, 365.13],
  [548.33, 1903.79, 365.74],
  [551.04, 1894.86, 366.34],
  [553.7, 1886.17, 366.91],
  [556.32, 1877.71, 367.48],
  [558.9, 1869.46, 368.03],
  [561.43, 1861.43, 368.57],
  [563.92, 1853.58, 369.1],
  [566.38, 1845.91, 369.61],
  [568.77, 1838.34, 370.11],
  [571.08, 1830.79, 370.58],
  [573.31, 1823.26, 371.04],
  [575.47, 1815.75, 371.48],
  [577.54, 1808.26, 371.89],
  [579.54, 1800.8, 372.29],
  [581.46, 1793.37, 372.67],
  [583.3, 1785.97, 373.03],
  [585.07, 1778.6, 373.37],
  [586.77, 1771.27, 373.69],
  [588.38, 1764.15, 374],
  [589.89, 1757.41, 374.29],
  [591.3, 1751.03, 374.56],
  [592.61, 1744.98, 374.83],
  [593.83, 1739.24, 375.08],
  [594.95, 1733.8, 375.32],
  [595.97, 1728.62, 375.54],
  [596.9, 1723.71, 375.75],
  [597.74, 1719.03, 375.95],
  [598.48, 1714.57, 376.14],
  [599.15, 1710.34, 376.31],
  [599.78, 1706.32, 376.47],
  [600.36, 1702.51, 376.62],
  [600.89, 1698.88, 376.76],
  [601.37, 1695.43, 376.88],
  [601.8, 1692.14, 376.99],
  [602.18, 1689.01, 377.1],
  [602.51, 1686.02, 377.19],
  [602.78, 1683.16, 377.26],
];

const toCo2 = (
  [co2Ppm, ,]: [co2Ppm: number, ch4Ppb: number, n2oPpb: number],
  index: number
) => ({
  year: firstYear + index,
  ppm: co2Ppm,
});

/**
 * Cummulative radiative forcing in terms of CO2 equivalents.
 * Conversion factors based on https://www.ghgprotocol.org/sites/default/files/ghgp/Global-Warming-Potential-Values%20%28Feb%2016%202016%29_1.pdf
 */
const toCo2Eq = (
  [co2Ppm, ch4Ppb, n2oPpb]: [co2Ppm: number, ch4Ppb: number, n2oPpb: number],
  index: number
) => ({
  year: firstYear + index,
  ppm: co2Ppm + ch4Ppb * 0.028 + n2oPpb * 0.265,
});

const co2CMIP6ssp245 = greenhouseGasesCMIP6ssp245.map(toCo2);

const co2EqCMIP6ssp245 = greenhouseGasesCMIP6ssp245.map(toCo2Eq);

const co2CMIP6ssp585 = greenhouseGasesCMIP6ssp585.map(toCo2);

const co2EqCMIP6ssp585 = greenhouseGasesCMIP6ssp585.map(toCo2Eq);

export {
  firstYear,
  temperaturesCelsius,
  co2CMIP6ssp245,
  co2EqCMIP6ssp245,
  co2CMIP6ssp585,
  co2EqCMIP6ssp585,
};

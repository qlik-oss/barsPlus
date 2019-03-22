/*
 Overrides the default prefixes (numerical abbrevations) used by D3 with the ones given by the
 Qlik app.
 */

import d3 from 'd3';

var overriddenAbbsStr = "";

export function overrideD3FormatPrefix(qlikNumAbbsStr) {
  if (!qlikNumAbbsStr || qlikNumAbbsStr === overriddenAbbsStr) {
    return;
  }

  // Converts Qlik's NumericalAbbrevation string to dictionary where precision is key
  let qlikNumAbbs = qlikNumAbbsStr.split(';');
  const d3NumAbs = {
    0: {
      scale: function(d) { return d; },
      symbol: ''
    }
  };
  qlikNumAbbs.forEach(function (pairStr) {
    let pair = pairStr.split(':');
    if (pair.length != 2 || isNaN(pair[0])) {
      return;
    }

    let precision = +pair[0];
    let k = Math.pow(10, -precision);
    d3NumAbs[precision] = {
      scale: function(d) { return d * k; },
      symbol: pair[1]
    };
  });


  d3.formatPrefix = function (value, precision) {
    if (!precision) {
      // Need to determine the precision from the value
      if (!value) {
        return d3NumAbs[0];
      }

      let log10 = Math.floor(Math.log10(value));
      let rest = log10 % 3;
      precision = log10 - rest;
    }

    while (!(precision in d3NumAbs)) {
      precision += precision < 0 ? 3 : -3;
    }

    return d3NumAbs[precision];
  };

  overriddenAbbsStr = qlikNumAbbsStr;
}

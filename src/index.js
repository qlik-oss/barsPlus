/**
 * barsPlus extension
 *
 * Set up Qlik Sense interface
 *
 * Note that the paint routine is used for only two purposes:
 *
 * 1) To save a reference to 'this' for calling the backendApi
 * 2) To refresh the chart when changes are made in edit mode
 *
 * See barsPlus-directive.js for the AngularJS directive
 * Most core processing is performed in ldw-barsPlus.js
 *
 * Author: L. Woodside
 * Modification History:
 *
 *	Version		Person			Date			Description
 *	V1.0.0		L. Woodside		19-Dec-2016		Initial Release
 *	V1.1.0		L. Woodside		29-Dec-2016		Added text on bars
 *  V1.2.0		L. Woodside		07-Jan-2017		Allow multiple measures
 *
*/

import './barsPlus-directive';
import props from './barsPlus-props';
import { updateColorSchemas } from './colorSchemas';
import { overrideD3FormatPrefix } from './numerical-abbrevation';
import qlik from 'qlik';

if (!window._babelPolyfill) { //eslint-disable-line no-underscore-dangle
  require('@babel/polyfill');
}

export default {
  initialProperties: {
    qHyperCubeDef: {
      qDimensions: [],
      qMeasures: [],
      qInitialDataFetch: [
        {
          qWidth: 10,
          qHeight: 1000 // max qWidth*qHeight 10000
        }
      ]
    }
  },
  data:{
    dimensions: {
      uses: "dimensions",
      min: 0,
      max: function(nMeasures) {
        if (nMeasures > 5) {
          return 0;
        }
        return nMeasures < 2 ? 2 : 1;
      }
    },
    measures: {
      uses: "measures",
      min: 1,
      max: function(nDimensions) {
        if (nDimensions == 0) {
          return 10;
        }
        return nDimensions == 1 ? 5 : 1;
      }
    }
  },
  definition: props,
  support: {
    snapshot: true,
    export: true,
    exportData: true
  },
  template: '<bars-plus qv-extension />',
  mounted: function () {
    const app = qlik.currApp(this);
    app.getAppLayout().then(function (res) {
      overrideD3FormatPrefix(res.layout.qLocaleInfo.qNumericalAbbreviation);
    });
  },
  paint: function ($element, layout) {
    var self = this;
    self.$scope.g.self = self; // Save reference for call to backendApi
    self.$scope.g.editMode = (self.options.interactionState == 2);

    return updateColorSchemas(this)
      .then(() => {
        if (self.$scope.g.editMode) {
          self.$scope.initProps();
          self.$scope.g.initData();
          self.$scope.g.refreshChart();
        }
      })
      .catch(error => {
        console.error(error); // eslint-disable-line no-console
        throw error;
      });
  }
};

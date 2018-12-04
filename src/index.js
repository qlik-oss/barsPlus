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


define( [
  "./barsPlus-props",
  "./barsPlus-directive"
],

function (props) {
  'use strict';

  return {
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
    definition: props,
    support: {
      snapshot: true,
      export: true,
      exportData : true
    },
    //		resize: function($element, layout) {
    //			console.log('resize>',$element,layout,$element.scope());
    //		},
    template: '<bars-plus qv-extension />',
    controller: ['$scope', function($scope) {
    }],
    paint: function ($element, layout) {
      var self = this;
      self.$scope.g.self = self; // Save reference for call to backendApi

      // Only repaint here when in edit mode
      self.$scope.g.editMode = (self.options.interactionState == 2);
      if (self.$scope.g.editMode) {
        self.$scope.initProps();
        self.$scope.g.initData();
        self.$scope.g.refreshChart();
      }
    }
  };
});

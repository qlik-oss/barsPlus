/**

 barsPlus - Create D3 bar chart, stacked bar chart, area chart

 Author: L. Woodside
 Modification History:

	Version		Person			Date			Description
	V1.0.0		L. Woodside		19-Dec-2016		Initial Release
	V1.1.0		L. Woodside		29-Dec-2016		Added text on bars
	V1.2.0		L. Woodside		07-Jan-2017		Allow multiple measures
	V1.3.0		L. Woodside		15-Jan-2017		Improved color options
	V1.3.1		L. Woodside		27-Jan-2017		Fix problem with legend properties

 Dependencies: d3.v3.js

 This script creates an object with the following methods:

	initData()		Initialize chart data
	initChart()		Initialize a bar chart
	createBars()	Create the bars in the chart
	updateBars()	modify the bar chart due to changes in data
	refreshChart()	refresh chart (calls three above excluding initData)

 Presentation Properties

 orientation		Orientation: H - Horizontal, V - Vertical
 normalized			Whether 100% bars
 showDeltas			Whether to show bar connectors (delta quadrangles)
 barGap				Spacing between bars, 0 - no space, 1 - no bars (area graph)
 outerGap			Spacing before first bar and after last bar
 gridHeight			Height of grid relative to highest bar
 backgroundColor	Grid background color

 Colors and Legend

 colorScheme		Named color scheme
 singleColor		Whether to use single color for 1-dimensional bars
 showLegend			Whether to show the legend
 legendPosition		Legend position: T - top, R - right, B - bottom, L - left
 legendSize			Legend size: N - narrow, M - medium, W - wide
 legendSpacing		Legend spacing: N - narrow, M - medium, W - wide

 Dimension Axis

 axisTitleD			Dimension axis title
 labelTitleD		Dimension axis: B - labels & title, L - labels only, T - titles only, N - none
 labelStyleD		Dimension style: A - Auto, H - horizontal, S - staggered, T - tilted
 gridlinesD			Dimension gridlines
 axisMarginD		Dimension margin size: N - narrow, M - medium, W - wide

 Measure Axis

 axisTitleM			Measure axis title
 labelTitleM		Measure axis: B - labels & title, L - labels only, T - titles only, N - none
 labelStyleM		Measure style: A - Auto, H - horizontal, S - staggered, T - tilted
 gridlinesM			Measure gridlines
 axisMarginM		Measure margin size: N - narrow, M - medium, W - wide
 ticks				Recommended number of ticks
 axisFormatM		Number format for measure axis, A - Auto, N - Number, P - Percent, S - SI, C - Custom
 axisFormatMs		Number format string for measure axis, D3 format

 Text on Bars

 showTexts			Whether to show text on bars: B - on bars, T - total, A - both, N - none
 showDim			What to show in bars: M - measure, D - dimension, P - percent
 showTot			What to show for total: M - measure, D - dimension
 innerBarPadH		Horizontal inner bar padding (px)
 innerBarPadV		Vertical inner bar padding (px)
 textSizeAbs		Whether to use textSize instead of textSizeFactor (horizontal bars only)
 textSizeFactor		Text size as proportion of bar height (horizontal bars only)
 textSize			Text size (px), when vertical bars or textSizeAbs = false
 textDots			Whether to show text at all if ellipsis would be shown
 textColor			"Auto" - Choose white or black depending on bar color, else text color string
 vAlign				Vertical alignment: C - center, T - top, B - bottom
 hAlign				Horizontal alignment: C - Center, L - left, R - right
 totalFormatM		Number format for total: N - Number, P - Percent, S - SI, C - Custom
 totalFormatMs		Number format string for total, D3 format

 Transitions

 transitions		Whether to enable transitions
 transitionDelay	Delay before start of transition
 transitionDuration	Duration of transition
 ease				Transition style

 Multiple measures

 defDims			Defined number of dimensions
 defMeas			Defined number of measures
 measures			Array of measure names

 UI-determined Properties

 id					Unique id of enclosing element
 component			D3 selection of enclosing element
 width				Width of enclosing element
 height				Height of enclosing element
 inSelections		Whether selection mode is enabled in Qlik Sense
 editMode			Whether edit mode is enabled in Qlik Sense
 selectionMode		Selection mode: QUICK or CONFIRM
 rawData			Raw data from hypercube

*/

import d3 from 'd3';
import qlik from 'qlik';
import { getColorSchemaByName, getDefaultSingleColor } from './colorSchemas';

export default {

  /**
 *--------------------------------------
 * Initialize Data
 *--------------------------------------
 * This method will take input QV data and format it for 1 or 2 dimensions
 * Input:	g.rawData
 * Output:	g.data
 *			g.flatData
 *			g.allDim2
 *			g.allCol2
 *			g.nDims
 *			g.deltas
*/
  initData: function () {
    /*
	To support multiple measures, take the input raw data and transform it
	to look like previously supported formats:
	0 Dimensions, 1 or more measures -> format as 1 dimension, 1 measure
	1 Dimension, 2 or more measures -> format as 2 dimensions, 1 measure
	If two dimensions and multiple measures specified, ignore all but the first measure
	*/
    var g = this;
    var struc = [], flatData = [], q = [], r = [], deltas = [], inData = [];

    if (!g.rawData[0]) return; // sometimes undefined
    if (g.defDims + g.defMeas != g.rawData[0].length) return; // sometimes mismatched

    if (g.defDims == 0) {
      for (var i = 0; i < g.rawData.length; i++) {
        for (var j = 0; j < g.measures.length; j++) {
          inData.push([
            { qElemNumber: -1, qNum: j + 1, qText: g.measures[j] },
            g.rawData[i][j]
          ]);
        }
      }
    }
    else if (g.defDims == 1 && g.defMeas > 1) {
      for (var i = 0; i < g.rawData.length; i++) {
        for (var j = 0; j < g.measures.length; j++) {
          inData.push([
            g.rawData[i][0],
            { qElemNumber: -1, qNum: j + 1, qText: g.measures[j] },
            g.rawData[i][j + 1]
          ]);
        }
      }
    }
    else {
      inData = g.rawData; // Process as in previous version
    }

    // Function to get dimension/measure attribute for color
    var cf = function (e) {
      var cn = 0;
      return cn;
    };

    // Process one dimension data
    if (inData[0].length == 2) {
      g.nDims = 1;
      g.normalized = false;
      inData.forEach(function (d) {
        struc.push({ dim1: d[0].qText, offset: d[1].qNum });
        flatData.push({
          dim1: d[0].qText,
          dim2: d[0].qText,
          offset: 0,
          qNum: d[1].qNum,
          qText: d[1].qText,
          qTextPct: "",
          qElemNumber: d[0].qElemNumber
        });
        if (q.indexOf(d[0].qText) == -1) {
          q.push(d[0].qText);
          r.push(cf(d));
        }
      });
      g.data = struc;
      g.flatData = flatData;
      g.allDim2 = q;
      g.allCol2 = r;
      return;
    }

    // Process two dimensional data
    g.nDims = 2;

    var p1 = "", p2, edges = [], b, p = [];
    inData.forEach(function (d) {
      var c2 = d[1].qText;
      if (p.indexOf(d[0].qText) == -1) {
        p.push(d[0].qText);
      }
      if (q.indexOf(d[1].qText) == -1) {
        q.push(d[1].qText);
        r.push(cf(d));
      }
      if (d[0].qText != p1) {
        p1 = d[0].qText;
      }
      else {
        b = false;
        for (var i = 0; i < edges.length; i++) {
          if (edges[i][0] == p2 && edges[i][1] == c2) {
            b = true;
            break;
          }
        }
        if (!b) {
          edges.push([p2, c2]);
        }
      }
      p2 = c2;
    });
    // Topological sort will throw an error if inconsistent data (sorting by measure)
    // Just ignore errors and use original sort order
    var qs, ps, rs = [];
    try {
      ps = q.slice();
      qs = this.toposort(q, edges);
      // Replicate qs order in r
      for (var i = 0; i < ps.length; i++) {
        rs.push(r[ps.indexOf(qs[i])]);
      }
      r = rs;
    }
    catch (err) {
      qs = q;
    }
    q = qs;

    var n = d3.nest()
      .key(function (d) { return d[0].qText; })
      .key(function (d) { return d[1].qText; })
      .entries(inData)
      ;
    // sort all nodes in order specified by q
    n.forEach(function (d) {
      d.values.sort(function (a, b) {
        return (q.indexOf(a.key) < q.indexOf(b.key) ? -1
          : (q.indexOf(a.key) > q.indexOf(b.key) ? 1 : 0));
      });
    });
    // nest messes up dim1 sort order, sort by order specified in p
    n.sort(function (a, b) {
      return (p.indexOf(a.key) < p.indexOf(b.key) ? -1
        : (p.indexOf(a.key) > p.indexOf(b.key) ? 1 : 0));
    });
    n.forEach(function (d, idx) {
      var t = 0, v = [], j = 0, num, txt;
      for (var i = 0; i < q.length; i++) {
        let elm;
        if (d.values.length <= j || d.values[j].key != q[i]) {
          num = 0;
          txt = "-";
          elm = [];
        }
        else {
          num = d.values[j].values[0][2].qNum;
          txt = d.values[j].values[0][2].qText;
          if(g.defDims == 2){
            elm = [d.values[j].values[0][0].qElemNumber,d.values[j].values[0][1].qElemNumber];
          }else{
            elm = d.values[j].values[0][0].qElemNumber;
          }
          j++;
          v.push({
            dim2: q[i],
            qNum: num,
            qText: txt,
            qElemNumber: elm,
            offset: t
          });
          t += num;
        }
      }
      v.forEach(function (e) {
        e.dim1 = d.key;
        if (g.normalized) {
          e.offset = e.offset / t;
          e.qNum = e.qNum / t;
          e.qTextPct = d3.format(".1%")(e.qNum);
        }
      });
      flatData.push.apply(flatData, v);
      struc.push({ dim1: d.key, offset: t, values: v });

      if (idx > 0 && g.showDeltas) {
        var p = struc[idx - 1].values;
        var c = struc[idx].values;
        for (var k = 0; k < p.length; k++) {
          if(p[k] && c[k]){
            deltas.push({
              dim1p: p[k].dim1 || '',
              dim1c: c[k].dim1 || '',
              dim2: p[k].dim2 || '',
              delta: c[k].qNum - p[k].qNum,
              deltaPct: 0,
              measureNumber: p[k].measureNumber,
              points: [
                p[k].offset,
                c[k].offset,
                p[k].qNum,
                c[k].qNum
              ]
            });
          }
        }
      }
    });
    g.data = struc;
    g.flatData = flatData;
    g.allDim2 = q;
    g.allCol2 = r;
    g.deltas = deltas;
  },

  /**
 *--------------------------------------
 * Initialize Chart
 *--------------------------------------
 * Set up initial elements, create axes, create legend
 * create bars, deltas and legend items and bind data
*/
  initChart: function () {
    var g = this;

    var xLabelTitle = g.orientation == "V" ? g.labelTitleD : g.labelTitleM;
    g.xAxisHeight = xLabelTitle == "B" || xLabelTitle == "L"
      ? [70, 40, 25]["WMN".indexOf(g.orientation == "V" ? g.axisMarginD : g.axisMarginM)] : 0;
    var xTitleHeight = xLabelTitle == "B" || xLabelTitle == "T" ? 20 : 0;
    var xAxisPad = 20;

    var yLabelTitle = g.orientation == "V" ? g.labelTitleM : g.labelTitleD;
    g.yAxisWidth = yLabelTitle == "B" || yLabelTitle == "L"
      ? [90, 50, 30]["WMN".indexOf(g.orientation == "V" ? g.axisMarginM : g.axisMarginD)] : 0;
    var yTitleWidth = yLabelTitle == "B" || yLabelTitle == "T" ? 20 : 0;
    var yAxisPad = 20;

    var tr; // translate string
    var dTitleHeight = g.labelTitleD == "B" || g.labelTitleD == "T" ? 20 : 0;
    var margin = {
      top: 10, //yAxisPad,
      right: xAxisPad,
      bottom: g.xAxisHeight + xTitleHeight + xAxisPad,
      left: g.yAxisWidth + yTitleWidth + yAxisPad
    };
    var innerWidth = g.width - margin.left - margin.right;
    var innerHeight = g.height - margin.top - margin.bottom;

    g.lgn = {
      minDim: [200, 100], // min inner dimensions for legend to be displayed
      use: "",
      pad: 0,
      sep: 5,
      box: [12, 12], // legend item color box
      itmHeight: 20,
    };
    g.lgn.txtOff = g.lgn.box[0] + g.lgn.pad + g.lgn.sep;

    // adjust for legend if any
    g.lgn.use = g.showLegend ? g.legendPosition : "";
    if (g.lgn.use) {
      if (g.lgn.use == "L" || g.lgn.use == "R") {
        if (innerWidth <= g.lgn.minDim[0]) {
          g.lgn.use = "";
        }
        else {
          g.lgn.width = innerWidth / ([4, 6, 10]["WMN".indexOf(g.legendSize)]);
          innerWidth -= (g.lgn.width + yAxisPad);
          g.lgn.height = innerHeight + g.xAxisHeight + xTitleHeight;
          g.lgn.y = margin.top;
          g.lgn.txtWidth = g.lgn.width - g.lgn.pad - g.lgn.sep - g.lgn.box[0];
          if (g.lgn.use == "L") {
            g.lgn.x = yAxisPad;
            margin.left += g.lgn.width + g.lgn.x;
          }
          else {
            g.lgn.x = margin.left + innerWidth + yAxisPad;
          }
        }
      }
      else if (g.lgn.use == "T" || g.lgn.use == "B") {
        if (innerHeight <= g.lgn.minDim[1]) {
          g.lgn.use = "";
        }
        else {
          g.lgn.width = innerWidth + g.yAxisWidth + yTitleWidth;
          g.lgn.height = g.lgn.itmHeight * (3 - "WMN".indexOf(g.legendSize));
          innerHeight -= g.lgn.height;
          g.lgn.x = yAxisPad;
          g.lgn.txtWidth = [100, 75, 50]["WMN".indexOf(g.legendSpacing)];
          if (g.lgn.use == "T") {
            g.lgn.y = margin.top;
            margin.top += g.lgn.height;
          }
          else {
            g.lgn.y = margin.bottom + innerHeight;
            innerHeight -= 10;
          }
        }
      }
    }
    g.component.selectAll("*")
      .remove()
    ;
    var tooltip = g.component.append("div")
      .attr("class", "ldwtooltip")
      .style("opacity", "0")
      ;
    tooltip.append("p")
      .attr("class", "ldwttheading")
    ;
    tooltip.append("p")
      .attr("class", "ldwttvalue")
    ;
    g.svg = g.component
      .append("svg")
      .attr("width", g.width)
      .attr("height", g.height)
      .style("background-color", g.backgroundColor)
      .style('position' , 'absolute')
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    ;
    g.self && g.self.$scope.options.interactionState === 2 ? g.svg.attr('class' , 'in-edit-mode') : g.svg.attr('class', '');
    var dim1 = g.data.map(function (d) { return d.dim1; });
    if (g.orientation == "H") dim1.reverse();
    g.dScale = d3.scale.ordinal()
      .domain(dim1)
      .rangeRoundBands(g.orientation == "V" ? [0, innerWidth] : [innerHeight, 0], g.barGap, g.outerGap)
    ;
    g.mScale = d3.scale.linear()
      .domain([0, d3.max(g.data, function (d) {
        const unscaledBarHeight = g.normalized ? 1 : d.offset;
        const unscaledBarHeightNumber = !isNaNOrStringNaN(unscaledBarHeight) ? unscaledBarHeight : 1;
        return unscaledBarHeightNumber * g.gridHeight;
      })])
      .range(g.orientation == "V" ? [innerHeight, 0] : [0, innerWidth])
      .nice()
    ;
    var dGrp = g.svg.append("g")
      .attr("class", "ldw-d ldwaxis");
    if (g.orientation == "V") {
      dGrp.attr("transform", "translate(0," + innerHeight + ")");
    }
    if (g.labelTitleD == 'B' || g.labelTitleD == 'L') {
      g.dAxis = d3.svg.axis()
        .scale(g.dScale)
        .orient(g.orientation == "V" ? "bottom" : "left")
        .tickSize(g.gridlinesD ? (g.orientation == "V" ? -innerHeight : -innerWidth) : 6)
        .tickPadding(5)
      ;
      dGrp.call(g.dAxis);
    }
    if (g.labelTitleD == 'B' || g.labelTitleD == 'T') {
      if (g.orientation == "V") {
        tr = "translate(" + (innerWidth / 2) + "," + (g.xAxisHeight + xTitleHeight) + ")";
      }
      else {
        tr = "translate(-" + (g.yAxisWidth + yTitleWidth / 2 + 2) + "," + (innerHeight / 2) + ")rotate(-90)";
      }
      dGrp.append("text")
        .attr("class", "axisTitle")
        .attr("text-anchor", "middle")
        .attr("transform", tr)
        .text(g.axisTitleD)
      ;
    }
    var mGrp = g.svg.append("g")
      .attr("class", "ldw-m ldwaxis")
      ;
    if (g.orientation != "V") {
      mGrp.attr("transform", "translate(0," + innerHeight + ")");
    }
    if (g.labelTitleM == 'B' || g.labelTitleM == 'L') {
      g.mAxis = d3.svg.axis()
        .scale(g.mScale)
        .orient(g.orientation == "V" ? "left" : "bottom")
        .tickSize(g.gridlinesM ? (g.orientation == "V" ? -innerWidth : -innerHeight) : 6)
        .ticks(g.ticks)
        .tickFormat(d3.format([",.3s", ",.0f", ",.0%", ",.3s", g.axisFormatMs]["ANPSC".indexOf(g.axisFormatM)]))
        .tickPadding(5)
      ;
      mGrp.call(g.mAxis);
    }
    if (g.labelTitleM == 'B' || g.labelTitleM == 'T') {
      if (g.orientation == "V") {
        tr = "translate(-" + (g.yAxisWidth + yTitleWidth / 2 + 2) + "," + (innerHeight / 2) + ")rotate(-90)";
      }
      else {
        tr = "translate(" + (innerWidth / 2) + "," + (g.xAxisHeight + xTitleHeight) + ")";
      }
      mGrp.append("text")
        .attr("class", "axisTitle")
        .attr("text-anchor", "middle")
        .attr("transform", tr)
        .text(g.axisTitleM)
      ;
    }
    let colorSchema = getColorSchemaByName(g.colorSchema).colors;

    if (g.singleColor) {
      g.cScale = () => (g.color && g.color.color) || getDefaultSingleColor().color;
    } else {
      g.cScale = d3.scale.ordinal().range(colorSchema).domain(g.allDim2);
    }

    // Create Legend
    if (g.lgn.use) {
      var lPos = g.legendPosition;
      var lgn = g.component
        .append("div")
        .attr("id", "ldwlegend")
        .style("transform", "translate(" + g.lgn.x + 'px' + "," + (g.lgn.y -10) + 'px' + ")")
        .style('position', 'relative')
        .style('height' , ()=> lPos === 'R' || lPos === 'L' ? g.height + 'px' : lPos === 'T' || lPos === 'B'? 'auto' : g.height + 'px')
        .style('overflow' ,'hidden')
        .style('width' , ()=> lPos === 'R' || lPos === 'L' ? 'fit-content' : lPos === 'T' || lPos === 'B'? 'auto' : g.height + 'fit-content')
        .style('flex-direction' , ()=> lPos === 'R' || lPos === 'L' ? 'column' : lPos === 'T' || lPos === 'B'? 'row-reverse' : g.height + 'column')
        ;

      var lgnContainer =lgn.append('div')
        .attr('class', 'lgnContainer')
        .style('overflow', 'hidden')
        .style('margin-left' , ()=> lPos === 'R' || lPos === 'L' ? '50px' : lPos === 'T' || lPos === 'B' ? '0' : '0' )
        .style('margin-right' , '50px')
        .style('width' , ()=> lPos === 'R' || lPos === 'L' ? 'auto' : lPos === 'T' || lPos === 'B' ? g.width + 'px' : 'auto' )
        .style('height' , ()=> lPos === 'R' || lPos === 'L' ? g.height + 'px' : lPos === 'T' || lPos === 'B' ? '34px' : g.height + 'px' )
        ;

      var legendItems = lgnContainer.append("svg")
        .attr("class", "ldwlgnitems")
        .attr('width' , ()=> lPos === 'R' ? '100px' : lPos === 'L' ? '100px' : lPos === 'T' ? g.width + 'px' : g.width + 'px' );
      if (g.legendPosition == 'R' || g.legendPosition == 'L'){
        legendItems.attr('height', g.allDim2.length * 20 +'px');
      }
      if(legendItems[0][0].clientHeight > lgnContainer[0][0].clientHeight){
        var btnContainer = lgn.append('div')
          .attr('class', 'btnContainer')
          .style('margin-right' , ()=> lPos === 'T' || lPos === 'B' ? '0' : '50px');
        var btnWrapper = btnContainer.append('div')
          .attr('class', 'btnWrapper');
        var scrollHeight = legendItems[0][0].clientHeight - lgnContainer[0][0].clientHeight;
        var btnDown = btnWrapper.append('button')
          .attr('class', lgnContainer[0][0].scrollTop >= scrollHeight ? 'ldwLgnBtn disabled' : 'ldwLgnBtn')
          .attr('id','btnDown')
          .attr('width', '10px')
          .attr('height', '10px')
          .on('click', function(e){
            if (g.self && g.self.$scope.options.interactionState === 2) return;
            if(g.legendPosition == 'R' || g.legendPosition == 'L'){

              lgnContainer[0][0].scrollTop += 200;

            }else{
              lgnContainer[0][0].scrollTop += 20;
            }
            btnUp.style('border-bottom-color','black');
            if(lgnContainer[0][0].scrollTop >= scrollHeight ){
              btnDown.style('border-top-color','gray');
            }
          });
        var btnUp = btnWrapper.append('button')
          .attr('class', 'ldwLgnBtn')
          .attr('id','btnUp')
          .attr('width', '10px')
          .attr('height', '10px')
          .on('click', function(e){
            if (g.self && g.self.$scope.options.interactionState === 2) return;
            if(g.legendPosition == 'R' || g.legendPosition == 'L'){
              lgnContainer[0][0].scrollTop -= 200;

            }else{
              lgnContainer[0][0].scrollTop -= 20;
            }
            btnDown.style('border-top-color','black');

            if(lgnContainer[0][0].scrollTop == 0){
              btnUp.style('border-bottom-color','gray');
            }
          });
      }

    }
    // Create bars
    g.bars = g.svg.selectAll("#" + g.id + " .ldwbar")
      .data(g.flatData)
    ;
    // Text on bars
    if (g.showTexts != "N") {
      // Create text box for determining sizing
      g.tref = g.svg.append("text")
        .attr("x", "0")
        .attr("y", "-100")
        .attr("class", "ldwtxtref")
      ;

      if (~"TA".indexOf(g.showTexts) && !g.normalized) {
        // Create bars totals
        g.totals = g.svg.selectAll("#" + g.id + " .ldwtot")
          .data(g.data, function (d) { return d.dim1; })
        ;
      }
      if (~"BA".indexOf(g.showTexts)) {
        // Create text on bars
        g.texts = g.svg.selectAll("#" + g.id + " .ldwtxt")
          .data(g.flatData)
        ;
      }
    }
    // Create deltas
    if (g.showDeltas && g.nDims == 2) {
      g.polys = g.svg.selectAll("#" + g.id + " polygon")
        .data(g.deltas, function (d) { return d.dim1p + "-" + d.dim1c + "," + d.dim2; })
      ;
    }
    // Create legend items
    if (g.lgn.use) {
      g.lgn.items = d3.select("." + "ldwlgnitems")
        // .attr('height', g.allDim2.length * 20)
        .selectAll("g")
        .data(g.allDim2)
      ;
    }
  },

  /**
 *--------------------------------------
 * Create Bars
 *--------------------------------------
 * Set up initial properties of bars, deltas, and legend
 * Objects already have had data bound
 * This procedure is also called from updateBars to add new items
*/
  createBars: function () {
    var g = this;
    // Create bars
    g.bars
      .enter()
      .append("rect")
      .attr("ldwdim1", function (d) { return d.qElemNumber; })
      .attr(g.orientation == "V" ? "x" : "y", function (d) { return g.dScale(d.dim1); })
      .attr(g.orientation == "V" ? "y" : "x", function (d) { return g.mScale(0); })		// grow from bottom
      .attr(g.orientation == "V" ? "width" : "height", g.dScale.rangeBand())
      .attr(g.orientation == "V" ? "height" : "width", function (d) { return 0; })
      .style("fill", function (d) {
        return g.cScale(d.dim2);
      })
      .style("opacity", "0")
      .attr("class", "selectable ldwbar")
      .on("click", function (d) {
        if (g.self.$scope.g.defDims == 2){ //if we have two Dims
          if ( d && d.dim2 ){
            if (g.selectionMode == "QUICK") {
              g.self.backendApi.selectValues(1, [d.qElemNumber[1]], false);
              g.self.backendApi.selectValues(0, [d.qElemNumber[0]], false);
            }
            else if (g.selectionMode == "CONFIRM") {

              let selectedArrayDim1=[];
              if(g.self.selectedArrays){
                selectedArrayDim1 = g.self.selectedArrays[0];
              }
              let selectedArrayDim2=[];
              if(g.self.selectedArrays){
                selectedArrayDim2 = g.self.selectedArrays[1];
              }
              if(
                selectedArrayDim1.indexOf(d.qElemNumber[0]) !== -1
              && selectedArrayDim2.indexOf(d.qElemNumber[1]) !== -1 )

              {
                g.self.selectValues(1, [d.qElemNumber[1]], true);
                g.self.selectValues(0, [d.qElemNumber[0]], true);
              }
              else{
                g.self.selectValues(1, [d.qElemNumber[1]], false);
                g.self.selectValues(0, [d.qElemNumber[0]], false);
              }

              let t = d3.select(this).classed("selected");
              let selecatableClass = d3.select(this).classed("selectable");

              // // following to address QS bug where clear button does not clear class names
              g.self.clearSelectedValues = function () {
                d3.selectAll("#" + g.id + " .selected").classed("selected", false);
                d3.selectAll("#" + g.id + " .selected").classed("selectable", false);
              };
              d3.selectAll("#" + g.id + " [ldwdim1='" + d.qElemNumber + "']")
                .classed("selected", !t);
              d3.selectAll("#" + g.id + " [ldwdim1='" + d.qElemNumber + "']")
                .classed("selectable", !selecatableClass);
              d3.select("#" + g.id + " .ldwtooltip")
                .style("opacity", "0")
                .transition()
                .remove
              ;
            }
          }
        }
        if (g.self.$scope.g.defDims == 1){
          if (g.selectionMode == "QUICK") {
            g.self.backendApi.selectValues(0, [d.qElemNumber], true);
          }
          else if (g.selectionMode == "CONFIRM") {
            var t = d3.select(this).classed("selected");
            let selectedArrayDim1=[];
            if(g.self.selectedArrays){
              selectedArrayDim1 = g.self.selectedArrays[0];
            }
            if(selectedArrayDim1.indexOf(d.qElemNumber) !== -1){
              g.self.selectValues(0, [d.qElemNumber], true);
            }else{
              g.self.selectValues(0, [d.qElemNumber], false);
            }
            // following to address QS bug where clear button does not clear class names
            g.self.clearSelectedValues = function () {
              d3.selectAll("#" + g.id + " .selected").classed("selected", false);
            };
            d3.selectAll("#" + g.id + " [ldwdim1='" + d.qElemNumber + "']")
              .classed("selected", !t);
            d3.select("#" + g.id + " .ldwtooltip")
              .style("opacity", "0")
              .transition()
              .remove
            ;
          }
        }
      })
      .on("touchstart", function(d){ //WIP toching should NOT give the hover effect,, waiting for a proper testing device to continue
        if (g.editMode) return;
        d3.select(this)
          .style("opacity", "1.0")
          .attr("stroke", "none")
        ;
        var event = d3.event;
        if (g.self.$scope.g.defDims == 2){ //if we have two Dims
          if ( d && d.dim2 ){
            if (g.selectionMode == "QUICK") {
              g.self.backendApi.selectValues(1, [d.qElemNumber[1]], true);
              g.self.backendApi.selectValues(0, [d.qElemNumber[0]], true);
            }
            else if (g.selectionMode == "CONFIRM") {

              var t = d3.select(this).classed("selected");
              g.self.selectValues(1, [d.qElemNumber[1]], true);
              g.self.selectValues(0, [d.qElemNumber[0]], true);

              // following to address QS bug where clear button does not clear class names
              g.self.clearSelectedValues = function () {
                d3.selectAll("#" + g.id + " .selected").classed("selected", false);
              };
              d3.selectAll("#" + g.id + " [ldwdim1='" + d.qElemNumber + "']")
                .classed("selected", !t);
              d3.select("#" + g.id + " .ldwtooltip")
                .style("opacity", "0")
                .transition()
                .remove
              ;
            }
          }
        }
        if (g.self.$scope.g.defDims == 1){
          if (g.selectionMode == "QUICK") {
            g.self.backendApi.selectValues(0, [d.qElemNumber], true);
          }
          else if (g.selectionMode == "CONFIRM") {
            var t = d3.select(this).classed("selected");
            g.self.selectValues(0, [d.qElemNumber], true);
            // following to address QS bug where clear button does not clear class names
            g.self.clearSelectedValues = function () {
              d3.selectAll("#" + g.id + " .selected").classed("selected", false);
            };
            d3.selectAll("#" + g.id + " [ldwdim1='" + d.qElemNumber + "']")
              .classed("selected", !t);
            d3.select("#" + g.id + " .ldwtooltip")
              .style("opacity", "0")
              .transition()
              .remove
            ;
          }
        }
        event.preventDefault();
      })
      .on("mouseenter", function (d,e) {
        if (g.editMode) return;
        d3.select(this)
          .style("opacity", "0.5")
          .attr("stroke", "white")
          .attr("stroke-width", "2")
        ;
        // Place text in tooltip
        d3.select("#" + g.id + " .ldwttheading")
          .text(g.nDims == 2 ? d.dim1 + ", " + d.dim2 : d.dim1);
        d3.select("#" + g.id + " .ldwttvalue")
          .text(g.nDims == 2
            ? (g.normalized ? d.qTextPct + ", " + d.qText : d.qText)
            : d.qText);

        var matrix = this.getScreenCTM()
          .translate(+this.getAttribute("x"), +this.getAttribute("y"));

        var xPosition = (window.pageXOffset + matrix.e)
          - d3.select("#" + g.id + " .ldwtooltip")[0][0].clientWidth / 2
          + (g.orientation == "V" ? g.dScale.rangeBand() : d3.select(this).attr("width")) / 2
          ;
        var yPosition = (window.pageYOffset + matrix.f)
          - d3.select("#" + g.id + " .ldwtooltip")[0][0].clientHeight
          - 10
          ;
        d3.select("#" + g.id + " .ldwtooltip")
          .style("left", xPosition + "px")
          .style("top", yPosition + "px")
          .transition()
          .delay(750)
          .style("opacity", "0.95")
        ;
      })
      .on("mouseleave", function () {
        d3.select(this)
          .style("opacity", "1.0")
          .attr("stroke", "none")
        ;
        d3.select("#" + g.id + " .ldwtooltip")
          .style("opacity", "0")
          .transition()
          .remove
        ;
      })
    ;

    if (~"TA".indexOf(g.showTexts) && !g.normalized) {
      // Create totals
      g.totals
        .enter()
        .append("text")
        .attr("class", "ldwtot")
        .style("opacity", "0")
        .each(function (d) {
          d.qNum = g.mScale.domain()[1] - d.offset;
          d.qText = d3.format([",.0f", ",.0%", ",.3s", g.totalFormatMs]["NPSC".indexOf(g.totalFormatM)])(d.offset);
          var txp = g.barText(d, true);

          d3.select(this)
            .style("fill", "black")
            .style("font-size", g.tref.style("font-size"))
            .attr("x", g.orientation == "V" ? txp.x : 0)
            .attr("y", g.orientation == "V" ? g.mScale(0) : txp.y)
            .attr("dy", "-.2em")
            .text(txp.text)
          ;
        })
      ;
    }

    if (~"BA".indexOf(g.showTexts)) {
      // Create text inside bars

      g.texts
        .enter()
        .append("text")
        .attr("class", "ldwtxt")
        .style("opacity", "0")
        .each(function (dataObject) {

          var txp = g.barText(dataObject);
          var bar = g.bars[0].find(element=>{
            return element.__data__.dim1 === dataObject.dim1;
          });

          d3.select(this)
            .style("fill", g.textColor == "Auto" ? g.txtColor(g.cScale(dataObject.dim2)) : g.textColor)
            .style("font-size", g.tref.style("font-size"))
            .attr("x", g.orientation == "V" ? txp.x : 0)
            .attr("y", txp.y)
            .text(txp.text)
          ;
          if (txp.rotation == true){
            d3.select(this).attr('transform' ,`rotate(-90 ${txp.x + bar.width.baseVal.value/2} ${txp.y + bar.height.baseVal.value/2})  `)
            ;
          }
        })
      ;
    }

    if (g.showDeltas && g.nDims == 2) {
      // Create deltas
      g.polys
        .enter()
        .append("polygon")
        .attr("points", function (d) {
          var p;
          if (g.orientation == "V") {
            p = (g.dScale(d.dim1p) + g.dScale.rangeBand()) + ","
              + g.mScale(0) + " "
              + (g.dScale(d.dim1p) + g.dScale.rangeBand()) + ","
              + g.mScale(0) + " "
              + (g.dScale(d.dim1c)) + ","
              + g.mScale(0) + " "
              + (g.dScale(d.dim1c)) + ","
              + g.mScale(0)
            ;
          }
          else {
            p = g.mScale(0) + "," + (g.dScale(d.dim1p) + g.dScale.rangeBand()) + " "
              + g.mScale(0) + "," + (g.dScale(d.dim1p) + g.dScale.rangeBand()) + " "
              + g.mScale(0) + "," + g.dScale(d.dim1c) + " "
              + g.mScale(0) + "," + g.dScale(d.dim1c)
            ;
          }
          return p;
        })
        .style("fill", function (d) {
          return g.cScale(d.dim2);
        })
        .style("opacity", "0")
      ;
    }
    // create legend
    if (g.lgn.use) {
      g.lgn.items
        .enter()
        .append("g")
        .attr("class",g.self && g.self._inEditState ? "ldwlgnitem" : "ldwlgnitem analysis-mode")
        .on('click', function(e) {
          d3.selectAll('rect')
            .filter(function(d){
              if (g.self && g.self._inEditState) return;
              if (g.self.$scope.g.defDims == 2){ //if we have two Dims
                if ( d && d.dim2 ){
                  if( d.dim2 === e){
                    if (g.selectionMode == "QUICK") {
                      g.self.backendApi.selectValues(1, [d.qElemNumber[1]], false);
                    }
                  }
                }
              }
              if (g.self.$scope.g.defDims == 1){
                if (d && d.dim1){
                  if (d.dim1 === e){
                    if (d.qElemNumber >= 0) { // Cannot select a measure
                      if (g.selectionMode == "QUICK") {
                        g.self.backendApi.selectValues(0, [d.qElemNumber], false);
                      }
                    }
                  }
                }
              }
            } )
          ;
        })
        .on('mouseenter', function(e){
          if (g.self && g.self.$scope.options.interactionState === 2) return;
          d3.select(this)
            .classed('legendHover');
          d3.selectAll('rect')
            .filter(function(d){
              if (g.self.$scope.g.defDims == 2){
                if (d && d.dim2){
                  if (d.dim2 === e){
                    d3.select(this)
                      .style("opacity", "0.5")
                      .attr("stroke", "white")
                      .attr("stroke-width", "2");
                  }
                }
              }
              else{
                if (d && d.dim1){
                  if (d.dim1 === e){
                    d3.select(this)
                      .style("opacity", "0.5")
                      .attr("stroke", "white")
                      .attr("stroke-width", "2");
                  }
                }
              }
            });
        })
        .on('mouseleave', function(e){
          d3.selectAll('rect')
            .filter(function(d){
              if (g.self.$scope.g.defDims == 2){
                if (d && d.dim2){
                  if (d.dim2 === e){
                    d3.select(this)
                      .style("opacity", "1.0")
                      .attr("stroke", "none");
                  }
                }
              }
              else{
                if (d && d.dim1){
                  if (d.dim1 === e){
                    d3.select(this)
                      .style("opacity", "1.0")
                      .attr("stroke", "none");
                  }
                }
              }
            });
        })
        .each(function (d, i) {
          d3.select(this)
            .append("rect")
            //					.attr("x","0")		// Initialize to zero to have legend grow from top
            //					.attr("y","0")
            .attr("x", function (e) {
              var x;
              if (g.lgn.use == "T" || g.lgn.use == "B") {
                x = i * (g.lgn.txtOff + g.lgn.txtWidth);
              }
              else {
                x = g.lgn.pad;
              }
              return x;
            })
            .attr("y", function (e) {
              var y;
              if (g.lgn.use == "T" || g.lgn.use == "B") {
                y = g.lgn.pad;
              }
              else {
                y = g.lgn.pad + g.lgn.itmHeight * i;
              }
              return y;
            })
            // .style("opacity", "0")
            .attr("width", g.lgn.box[0])
            .attr("height", g.lgn.box[1])
            .style("fill", function (e) {
              return g.cScale(e);
            })

          ;
          d3.select(this)
            .append("text")
            //					.attr("x","0")		// Initialize to zero to have legend grow from top
            //					.attr("y","0")
            .attr("x", function (e) {
              var x;
              if (g.lgn.use == "T" || g.lgn.use == "B") {
                x = i * (g.lgn.txtOff + g.lgn.txtWidth) + g.lgn.txtOff;
              }
              else {
                x = g.lgn.txtOff;
              }
              return x;
            })
            .attr("y", function (e) {
              var y;
              if (g.lgn.use == "T" || g.lgn.use == "B") {
                y = g.lgn.pad + 11;
              }
              else {
                y = g.lgn.pad + g.lgn.itmHeight * i + 11;
              }
              return y;
            })
            // .style("opacity", "0")
            .text(function (e) {
              return e;
            })

          ;
        })
      ;
    }
  },
  /**
 *--------------------------------------
 * Bar Text
 *--------------------------------------
 * Get bar text information: x, y and text
*/
  barText: function (d, total) {

    var tx, txt, origX, textX, bb, textY, textLength, ts;
    var g = this;
    var rotation = false;
    var isEllip = false;
    let bHeight;
    const ellipsis = '\u2026';
    // Relative text sizing, relative to bar width
    // For total, make larger by reducing unneeded padding
    var hAlign = g.hAlign, vAlign = g.vAlign,
      innerBarPadV = +g.innerBarPadV,
      innerBarPadH = +g.innerBarPadH;
    if (g.textSizeAbs)
      ts = g.textSize;
    else {
      if (total)
        if (g.orientation == "H")
          innerBarPadV = 1;
        else
          innerBarPadH = 1;
      ts = g.textSizeFactor * (g.dScale.rangeBand() - 2 * (g.orientation == "H" ? innerBarPadV : innerBarPadH));
      // limit size to maximum, also stored in textSize
      if (ts > g.textSize) ts = g.textSize;
    }
    g.tref.style("font-size", ts);

    if (total) { // Override some alignment for total
      if (g.orientation == "V")
        vAlign = "B";
      else
        hAlign = "L";
    }
    origX = g.orientation == "V" ? g.dScale(d.dim1) : g.mScale(d.offset);
    bHeight = g.orientation == "V" ? g.mScale(0) - g.mScale(d.qNum) : g.dScale.rangeBand();
    textX = g.orientation == "V" ? g.dScale.rangeBand() : g.mScale(d.qNum);

    g.tref.text(d.qNum == 0 ? ""
      : (total
        ? (g.showTot == "D" ? d.dim1 : d.qText)
        : (g.showDim == "D" ? d.dim1 : (g.showDim == "P" && g.normalized ? d.qTextPct : d.qText))
      )
    );

    bb = g.tref.node().getBBox();
    tx = origX + innerBarPadH;
    if (vAlign == "C")
    {

      textY = g.orientation == "V" ? g.mScale(d.offset) - (g.mScale(0) - g.mScale(d.qNum))
        + (g.mScale(0) - g.mScale(d.qNum) + bb.height) / 2
        : g.dScale(d.dim1) + (g.dScale.rangeBand() + bb.height) / 2;
    }

    else if (vAlign == "T")
      textY = g.orientation == "V" ? g.mScale(d.offset) - (g.mScale(0) - g.mScale(d.qNum))
        + bb.height + innerBarPadV
        : g.dScale(d.dim1) + innerBarPadV + bb.height;
    else
      textY = g.orientation == "V" ? g.mScale(d.offset) - innerBarPadV
        : g.dScale(d.dim1) + g.dScale.rangeBand() - innerBarPadV;
    txt = "";
    var barWidth = g.bars[0][0].width.baseVal.value;
    if (bb.height + 2 * innerBarPadV <= bHeight || (g.orientation != "V" && !g.textSizeAbs)) {
      if (bb.width + 2 * innerBarPadH <= textX) {
        if (hAlign == "C") {
          tx = origX + (textX - bb.width) / 2;
        }
        else if (hAlign == "R") {
          tx = origX + textX - bb.width - innerBarPadH;
        }
        txt = g.tref.text();
      }

      if(g.rotateLabel && barWidth > 25) {
        if (g.textDots) {
          textLength = g.tref.node().getComputedTextLength();
          txt = g.tref.text();
          const ellipsisLength = 25;
          const extraPadding= 15;
          let remainingSpaceForText = bHeight - ellipsisLength -extraPadding ;
          let numberOfTextCharacters = txt.length;
          let textOnCharacterPixelRatio = textLength / numberOfTextCharacters;

          if ( remainingSpaceForText < 0) {
            remainingSpaceForText = 0;
          }
          if (bHeight - extraPadding > textLength){
            txt = g.tref.text();
          }
          else{
            let textThatShouldbeEllip = textLength - remainingSpaceForText ;
            let numberOfChartoBeEllip = Math.ceil(textThatShouldbeEllip / textOnCharacterPixelRatio) +20;
            if(g.showTexts !== 'A')
            {
              isEllip = true;
              txt = txt.slice(0, -numberOfChartoBeEllip);
              txt +=ellipsis;
              if (txt === ellipsis){
                txt = '';
              }}
          }
        }
      }
      if (!g.rotateLabel && g.textDots){
        textLength = g.tref.node().getComputedTextLength();
        txt = g.tref.text();
        while (textLength > textX - 2 * innerBarPadH && txt.length > 0) {
          txt = txt.slice(0, -1);
          g.tref.text(txt + ellipsis);
          textLength = g.tref.node().getComputedTextLength();
        }
        if (txt.length != 0) txt = g.tref.text();
      }
      if(!g.textDots && g.rotateLabel){
        textLength = g.tref.node().getComputedTextLength();
        txt = g.tref.text();
        if(textLength > bHeight){
          txt ='';
          isEllip = false;
        }
      }
    }
    if (g.rotateLabel && g.orientation === "V"){
      rotation = true;
    }else if (g.orientation !== "V"){
      rotation = false;
    }
    if(total){
      textLength = g.tref.node().getComputedTextLength();
      txt = g.tref.text();
      while (textLength > barWidth && textLength > 0 && g.orientation !=='H'){
        txt = txt.slice(0, -1);
        g.tref.text(txt + ellipsis);
        textLength = g.tref.node().getComputedTextLength();
        if(!g.textDots){
          txt = '';
        }
      }
      if (txt.length != 0) txt = g.tref.text();
    }
    return {
      x: Number.isFinite(tx) ? tx : 0,
      y: Number.isFinite(textY) ? textY : 0,
      text: txt,
      rotation,
      isEllip
    };
  },
  /**
 *--------------------------------------
 * Update Bars
 *--------------------------------------
 * Modify properties of bars, deltas, and legend
*/
  updateBars: function () {
    var g = this;

    const containsInvalidBarHeight = !!g.data.find(data => isNaNOrStringNaN(data.offset));
    if (containsInvalidBarHeight) {
      return;
    }

    var dim1 = g.data.map(function (d) { return d.dim1; });
    if (g.orientation == "H") dim1.reverse();
    g.dScale.domain(dim1);
    g.mScale.domain([0, d3.max(g.data, function (d) { return (g.normalized ? 1 : d.offset) * g.gridHeight; })]);
    const isPrinting = qlik.navigation && !qlik.navigation.inClient;
    var tDelay = g.transitions && !g.editMode && !isPrinting ? g.transitionDelay : 0;
    var tDuration = g.transitions && !g.editMode && !isPrinting ? g.transitionDuration : 0;

    // Procedure to update dimension and measure axes
    var updateAxis = function (labelTitle, labelStyle, axis, axisClass, isXAxis, axisWidth) {
      if (labelTitle == 'B' || labelTitle == 'L') {
        // Update axis with transition
        g.svg.select("#" + g.id + " ." + axisClass + ".ldwaxis")
          .transition()
          .delay(tDelay)
          .duration(tDuration)
          .ease(g.ease)
          .call(axis)
        ;
        var lbl = d3.selectAll("#" + g.id + " ." + axisClass + ".ldwaxis");
        var txt = lbl.selectAll(".tick.major text")
          .attr("transform", null); // All horizontal initially
        var maxWidth = isXAxis ? lbl.node().getBBox().width / txt[0].length : g.yAxisWidth - 5;

        // If auto labels and any overlap, set to tilted
        if (labelStyle == "A") {
          txt.each(function (d, i) {
            if (d3.select(this).node().getComputedTextLength() > maxWidth) {
              labelStyle = "T"; // no break for each
            }
          })
          ;
        }
        // Tilted labels
        if (labelStyle == "T") {
          txt.style("text-anchor", "end")
            .attr("transform", "translate(" + (isXAxis ? "-12,0" : "-2,-8") + ") rotate(-45)")
          ;
          maxWidth = isXAxis ? g.xAxisHeight - 5 : maxWidth * Math.sqrt(2);
        }
        // Staggered labels
        else if (labelStyle == "S" && isXAxis) {
          txt.each(function (d, i) {
            if (i % 2 == 1) {
              d3.select(this).attr("transform", "translate(0,14)");
            }
          })
          ;
        }
        // Horizontal or titled labels, use ellipsis if overlap
        if (labelStyle == "H" || labelStyle == "T") {
          txt.each(function (d, i) {
            var self = d3.select(this),
              textLength = self.node().getComputedTextLength(),
              text = self.text();
            while (textLength > maxWidth && text.length > 0) {
              text = text.slice(0, -1);
              self.text(text + '\u2026');
              textLength = self.node().getComputedTextLength();
            }
          });
        }
      }
    };
    // Update dimension axis
    updateAxis(g.labelTitleD, g.labelStyleD, g.dAxis, "ldw-d", g.orientation == "V");
    // Update measure axis
    updateAxis(g.labelTitleM, g.labelStyleM, g.mAxis, "ldw-m", g.orientation != "V");

    g.bars = g.svg.selectAll("#" + g.id + " .ldwbar")
      .data(g.flatData)
    ;
    // Remove bars with transition
    g.bars
      .exit()
      .transition()
      .delay(tDelay)
      .duration(tDuration)
      .ease(g.ease)
      .style("opacity", "0")
      .remove()
    ;

    // Remove totals with transition
    if (~"TA".indexOf(g.showTexts)) {
      g.totals = g.svg.selectAll("#" + g.id + " .ldwtot")
        .data(g.data, function (d) { return d.dim1; })
      ;
      g.totals
        .exit()
        .transition()
        .delay(tDelay)
        .duration(tDuration)
        .ease(g.ease)
        .style("opacity", "0")
        .remove()
      ;
    }
    // Remove texts with transition
    if (~"BA".indexOf(g.showTexts)) {
      g.texts = g.svg.selectAll("#" + g.id + " .ldwtxt")
        .data(g.flatData)
      ;
      g.texts
        .exit()
        .transition()
        .delay(tDelay)
        .duration(tDuration)
        .ease(g.ease)
        .style("opacity", "0")
        .remove()
      ;
    }

    if (g.showDeltas && g.nDims == 2) {
      g.polys = g.svg.selectAll("#" + g.id + " polygon")
        .data(g.deltas, function (d) { return d.dim1p + "-" + d.dim1c + "," + d.dim2; })
      ;
      // Remove deltas with transition
      g.polys
        .exit()
        .transition()
        .delay(tDelay)
        .duration(tDuration)
        .ease(g.ease)
        .style("opacity", "0")
        .remove()
      ;
    }
    // remove legend items with transition
    if (g.lgn.use) {
      g.lgn.items = d3.selectAll("#" + g.id + " .ldwlgnitems")
        .selectAll("g")
        .data(g.allDim2,g.allDim2.forEach(element => element))
      ;
      g.lgn.items
        .exit()
        .transition()
        .delay(tDelay)
        .duration(tDuration)
        .ease(g.ease)
        .style("opacity", "0")
        .remove()
      ;
    }

    // Add any new bars/deltas/legend items
    this.createBars();

    // Update bars
    if (g.orientation == "V") {
      g.bars.transition()
        .delay(tDelay)
        .duration(tDuration)
        .ease(g.ease)
        .style("fill", function (d) {
          if(g.defMeas === 2 && g.measures[0] === g.measures[1]){
            return g.cScale(d.dim2 + d.measureNumber);
          }
          return g.cScale(d.dim2); })
        .style("opacity", "1")
        .style("fill", function (d) {
          return g.cScale(d.dim2);
        })
        .attr("x", function (d, i) {
          return g.dScale(d.dim1) ? g.dScale(d.dim1) : 0; // ignore NaN: causing errors in transitions
        })
        .attr("y", function (d) {
          const num = Number.isFinite(d.qNum) ? d.qNum : 0;
          return g.mScale(d.offset) - (g.mScale(0) - g.mScale(num));
        })
        .attr("width", g.dScale.rangeBand() && g.dScale.rangeBand() > 0 ? g.dScale.rangeBand() : 0) // ignore NaN: causing errors in transitions
        .attr("height", function (d) {
          return g.mScale(0) > g.mScale(d.qNum) ? g.mScale(0) - g.mScale(d.qNum) : 0; // ignore negatives: causing errors in transitions
        })
      ;
    }
    else {
      g.bars.transition()
        .delay(tDelay)
        .duration(tDuration)
        .ease(g.ease)
        .style("opacity", "1")
        .attr("x", function (d) {
          return g.mScale(d.offset);
        })
        .attr("y", function (d, i) {
          return g.dScale(d.dim1);
        })
        .attr("width", function (d) {
          const num = Number.isFinite(d.qNum) ? d.qNum : 0;
          return g.mScale(num);
        })
        .attr("height", g.dScale.rangeBand())
      ;
    }

    if (~"TA".indexOf(g.showTexts) && !g.normalized) {
      // Update totals
      g.totals
        .each(function (d) {
          d.qNum = g.mScale.domain()[1] - d.offset;
          d.qText = d3.format([",.0f", ",.0%", ",.3s", g.totalFormatMs]["NPSC".indexOf(g.totalFormatM)])(d.offset);
          var txp = g.barText(d, true);
          d3.select(this)
            .transition()
            .delay(tDelay)
            .duration(tDuration)
            .ease(g.ease)
            .style("opacity", "1")
            .style("fill", "black")
            .style("font-size", g.tref.style("font-size"))
            .attr({ x: txp.x, y: txp.y, dy: "-.2em" })
            .text(txp.text)
          ;
        })
      ;
    }

    if (~"BA".indexOf(g.showTexts)) {
      // Update texts
      g.texts
        .each(function (d) {
          var txp = g.barText(d);

          d3.select(this)
            .transition()
            .delay(tDelay)
            .duration(tDuration)
            .ease(g.ease)
            .style("opacity", "1")
            .style("fill", g.textColor == "Auto" ? g.txtColor(g.cScale(d.dim2)) : g.textColor)
            .style("font-size", g.tref.style("font-size"))
            .attr({ x: txp.x, y: txp.y })
            .text(txp.text)
          ;
        })
      ;
    }

    if (g.showDeltas && g.nDims == 2) {
      // update deltas
      g.polys.transition()
        .delay(tDelay)
        .duration(tDuration)
        .ease(g.ease)
        .attr("points", function (d) {
          var p;
          if (g.orientation == "V") {
            p = (g.dScale(d.dim1p) + g.dScale.rangeBand()) + ","
              + (g.mScale(d.points[0]) - (g.mScale(0) - g.mScale(d.points[2]))) + " "

              + (g.dScale(d.dim1p) + g.dScale.rangeBand()) + ","
              + g.mScale(d.points[0]) + " "

              + (g.dScale(d.dim1c)) + ","
              + g.mScale(d.points[1]) + " "

              + (g.dScale(d.dim1c)) + ","
              + (g.mScale(d.points[1]) - (g.mScale(0) - g.mScale(d.points[3])))
            ;
          }
          else {
            p = (g.mScale(d.points[0]) + g.mScale(d.points[2])) + ","
              + (g.dScale(d.dim1p) + g.dScale.rangeBand()) + " "

              + g.mScale(d.points[0]) + ","
              + (g.dScale(d.dim1p) + g.dScale.rangeBand()) + " "

              + g.mScale(d.points[1]) + ","
              + g.dScale(d.dim1c) + " "

              + (g.mScale(d.points[1]) + g.mScale(d.points[3])) + ","
              + g.dScale(d.dim1c)
            ;
          }
          return p;
        })
        .style("fill", function (d) {
          return g.cScale(d.dim2);
        })
        .style("opacity", g.barGap == 1 ? "1" : "0.5")
      ;
    }
    // update legend items
    if (g.lgn.use) {
      if (g.lgn.use == "T" || g.lgn.use == "B") {
        var maxprow = Math.floor(g.lgn.width / (g.lgn.txtOff + g.lgn.txtWidth));
        var nprow = maxprow;
      }

      g.lgn.items
        .each(function (d, i) {
          d3.select(this)
            .transition()
            .delay(tDelay)
            .duration(tDuration)
            .select("rect")
            .attr("x", function (e) {
              var x;
              if (g.lgn.use == "T" || g.lgn.use == "B") {
                x = (i % nprow) * (g.lgn.txtOff + g.lgn.txtWidth);
              }
              else {
                x = g.lgn.pad;
              }
              return x;
            })
            .attr("y", function (e) {
              var y;
              if (g.lgn.use == "T" || g.lgn.use == "B") {
                y = g.lgn.pad + Math.floor(i / nprow) * g.lgn.itmHeight;
              }
              else {
                y = g.lgn.pad + g.lgn.itmHeight * i;
              }
              return y;
            })
            .style("opacity", "1")
            .style("fill", function (e) {
              return g.cScale(e);
            })
          ;
          var txt = d3.select(this)
            .transition()
            .delay(tDelay)
            .duration(tDuration)
            .select("text")
            .attr("x", function (e) {
              var x;
              if (g.lgn.use == "T" || g.lgn.use == "B") {
                x = (i % nprow) * (g.lgn.txtOff + g.lgn.txtWidth) + g.lgn.txtOff;
              }
              else {
                x = g.lgn.txtOff;
              }
              return x;
            })
            .attr("y", function (e) {
              var y;
              if (g.lgn.use == "T" || g.lgn.use == "B") {
                y = g.lgn.pad + Math.floor(i / nprow) * g.lgn.itmHeight + 11;
              }
              else {
                y = g.lgn.pad + g.lgn.itmHeight * i + 11;
              }
              return y;
            })
            .style("opacity", "1")
            .text(function(e){
              return e;
            })
            ;
          txt.each(function (d, i) {
            var self = d3.select(this),
              textLength = self.node().getComputedTextLength(),
              text = self.text();
            while (textLength > g.lgn.txtWidth && text.length > 0) {
              text = text.slice(0, -1);
              self.text(text + '\u2026');
              textLength = self.node().getComputedTextLength();
            }
          });
        })
      ;
    }
  },

  /**
 *--------------------------------------
 * Refresh chart
 *--------------------------------------
 * Refresh chart, no new data
*/
  refreshChart: function () {
    this.initChart();
    this.createBars();
    this.updateBars();
  },
  //--------------------------------------
  // Topological sort
  //--------------------------------------
  /*- begin https://github.com/marcelklehr/toposort */
  toposort: function (nodes, edges) {
    var cursor = nodes.length
      , sorted = new Array(cursor)
      , visited = {}
      , i = cursor;

    while (i--) {
      if (!visited[i]) visit(nodes[i], i, []);
    }

    return sorted;

    function visit(node, i, predecessors) {
      if (predecessors.indexOf(node) >= 0) {
        throw new Error('Cyclic dependency: ' + JSON.stringify(node));
      }

      if (visited[i]) return;
      visited[i] = true;

      // outgoing edges
      var outgoing = edges.filter(function (edge) {
        return edge[0] === node;
      });
      if (i = outgoing.length) {
        var preds = predecessors.concat(node);
        do {
          var child = outgoing[--i][1];
          visit(child, nodes.indexOf(child), preds);
        } while (i);
      }

      sorted[--cursor] = node;
    }
  },
  /*- end https://github.com/marcelklehr/toposort */
  /*- begin http://stackoverflow.com/questions/11867545 */
  txtColor: function (hexcolor) {
    var r = parseInt(hexcolor.substr(1, 2), 16);
    var g = parseInt(hexcolor.substr(3, 2), 16);
    var b = parseInt(hexcolor.substr(5, 2), 16);
    var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 160) ? 'black' : 'white'; // 128 changed to 160 to give white preference
  },
  /*- end http://stackoverflow.com/questions/11867545 */
};


function isNaNOrStringNaN (input) {
  if (!input) {
    return false;
  }
  return isNaN(input) || input === 'NaN';
}

export function getBarLabelText(datum, component, total) {
  if (datum.qNum === 0) {
    return '';
  }
  if (total) {
    return component.showTot === 'D' ? datum.dim1 : datum.qText;
  }
  if (component.showDim === 'D') {
    const hasMoreDimensions = component.defDims > 1;
    return hasMoreDimensions ? datum.dim2 : datum.dim1;
  }
  if (component.showDim === 'P' && component.normalized) {
    return datum.qTextPct;
  }
  return datum.qText;
}
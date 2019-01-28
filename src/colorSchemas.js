import qlik from 'qlik';

const defaultSingleColor = {
  index: 4,
  color: '#4477aa'
};
const defaultColorSchema = {
  colors: ['#999999', '#333333']
};

let colorSchemas = [];

export function getDefaultSingleColor () {
  return defaultSingleColor;
}

export function getDefaultColorSchema () {
  return colorSchemas[0] || defaultColorSchema;
}

export function getColorSchemaByName (name) {
  const colorSchema = colorSchemas.find(schema => schema.label === name);
  return colorSchema || getDefaultColorSchema();
}

export function updateColorSchemas (component) {
  const app = qlik.currApp(component);
  return app.theme.getApplied()
    .then(qTheme => {
      const { data } = qTheme.properties.palettes;
      const schemas = data
        .filter(scale => {
          return scale.type === 'pyramid' || scale.type === 'row';})
        .map(scale => {
          let colors =[];
          const label = scale.name;
          if(scale.type === 'pyramid'){
            colors = scale.scale[scale.scale.length - 1];
          }else{
            colors = scale.scale;
          }
          return {
            label,
            component: 'color-scale',
            value: label,
            colors
          };
        });
      colorSchemas = schemas;
    });
}

export function getColorSchemas () {
  return colorSchemas;
}

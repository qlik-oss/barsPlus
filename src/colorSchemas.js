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
      const { scales } = qTheme.properties;
      const schemas = scales
        .filter(scale => scale.type === 'class-pyramid')
        .map(scale => {
          const label = scale.name;
          const colors = scale.scale[scale.scale.length - 1];

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

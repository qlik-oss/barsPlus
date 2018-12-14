import qlik from 'qlik';

let colorSchemas = [];

export function getDefaultColorSchema () {
  return colorSchemas[0].label;
}

export function getColorSchemaByName (name) {
  return colorSchemas.find(schema => schema.label === name) || {};
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

export default base => {
  // eslint-disable-next-line @jsdoc/require-jsdoc
  return class DocumentSheet extends foundry.applications.api.HandlebarsApplicationMixin(base) {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
      classes: ['honor-intrigue'],
      window: {
        resizable: true,
      },
    };
  };
};

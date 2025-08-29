export default base => {
  // eslint-disable-next-line @jsdoc/require-jsdoc
  return class DocumentSheet extends foundry.applications.api.HandlebarsApplicationMixin(base) {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
      classes: ['honor-intrigue'],
      form: {
        closeOnSubmit: false,
        submitOnChange: true,
      },
      window: {
        resizable: true,
      },
    };

    /** @inheritDoc */
    async _prepareContext(options) {
      const ctx = await super._prepareContext(options);

      return {
        ...ctx,
        gm: game.user.isGM,
        system: this.document.system,
        systemFields: this.document.system.schema.fields,
      };
    }
  };
};

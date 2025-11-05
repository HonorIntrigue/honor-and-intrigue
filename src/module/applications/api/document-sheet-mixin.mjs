import { systemID } from '../../constants.mjs';

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
    _initializeApplicationOptions(options) {
      const result = super._initializeApplicationOptions(options);
      result.classes.push(options.document.type);

      return result;
    }

    /** @inheritDoc */
    async _prepareContext(options) {
      const ctx = await super._prepareContext(options);

      return {
        ...ctx,
        isEditable: this.isEditable,
        isLimited: this.document.limited,
        isOwner: this.document.isOwner,
        gm: game.user.isGM,
        system: this.document.system,
        systemFields: this.document.system.schema.fields,
        useAlternateD10: game.settings.get(systemID, 'd10') === true,
      };
    }
  };
};

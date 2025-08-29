export default base => {
  // eslint-disable-next-line @jsdoc/require-jsdoc
  return class FormApplication extends foundry.applications.api.HandlebarsApplicationMixin(base) {
    static DEFAULT_OPTIONS = {
      classes: ['honor-intrigue'],
      form: {
        closeOnSubmit: true,
        handler: FormApplication.#submitHandler,
      },
      position: {
        height: 'auto',
        width: 400,
      },
      tag: 'form',
      window: {
        contentClasses: ['standard-form'],
      },
    };

    #formData = null;

    /**
     * Stored and processed form data.
     * @returns {FormDataExtended|null}
     */
    get formData() {
      return this.#formData;
    }

    /**
     * Factory method.
     * @param {Object} options
     * @returns {Promise<Object|null>}
     */
    static async create(options) {
      const { promise, resolve } = Promise.withResolvers();
      const application = new this(options);
      application.addEventListener('close', () => resolve(application.formData), { once: true });
      application.render(true);

      return promise;
    }

    /**
     * Handle form submission.
     * @param {SubmitEvent} event
     * @param {HTMLFormElement} form
     * @param {FormDataExtended} formData
     */
    static #submitHandler(event, form, formData) {
      this.#formData = this._processFormData(event, form, formData);
    }

    /**
     * Process submitted form data.
     * @param {SubmitEvent} event
     * @param {HTMLFormElement} form
     * @param {FormDataExtended} formData
     */
    _processFormData(event, form, formData) {
      return foundry.utils.expandObject(formData.object);
    }
  };
};

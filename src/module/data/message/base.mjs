import HonorIntrigueSystemModel from '../system-model.mjs';

export default class BaseMessageModel extends HonorIntrigueSystemModel {
  /** @inheritDoc */
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      target: new fields.DocumentUUIDField({ required: false, initial: () => game.user.targets.first()?.actor?.uuid }),
      targets: new fields.SetField(
        new fields.DocumentUUIDField({ nullable: false }),
        { initial: () => Array.from(game.user.targets.map(t => t.actor?.uuid)) },
      ),
    };
  }

  /**
   * Perform subtype-specific alterations to the final chat message HTML.
   * @param {HTMLElement} html The pending HTML.
   */
  async alterMessageHTML(html) {
    html.classList.add(this.parent.type);

    const footerButtons = await this._constructFooterButtons();

    if (footerButtons.length > 0) {
      const footer = document.createElement('footer');

      footer.append(...footerButtons);
      html.insertAdjacentElement('beforeend', footer);
    }
  }

  /**
   * Build an array of buttons to insert into the footer of the HTML.
   */
  async _constructFooterButtons() {
    return [];
  }

  /**
   * Add event listeners after all alterations in {@linkcode alterMessageHTML} have been made.
   */
  addListeners(html) {}
}

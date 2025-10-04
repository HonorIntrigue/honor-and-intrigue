import { HonorIntrigueDamageRoll } from '../../rolls/_module.mjs';
import HonorIntrigueSystemModel from '../system-model.mjs';

const fields = foundry.data.fields;

export default class BaseMessageModel extends HonorIntrigueSystemModel {
  /** @inheritDoc */
  static defineSchema() {
    return {
      targets: new fields.SetField(new fields.DocumentUUIDField({ nullable: false }), {
        initial: () => Array.from(game.user.targets.map(t => t.document.uuuid)),
      }),
    };
  }

  /**
   * Perform subtype-specific alterations to the final chat message HTML.
   * @param {HTMLElement} html The pending HTML.
   */
  async alterMessageHTML(html) {
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
    return [...this._constructDamageFooterButtons()];
  }

  /**
   * Create an array of damage buttons for each {@linkcode HonorIntrigueDamageRoll} in the message rolls.
   */
  _constructDamageFooterButtons() {
    const buttons = [];

    for (let i = 0; i < this.parent.rolls.length; i++) {
      const roll = this.parent.rolls[i];

      if (roll instanceof HonorIntrigueDamageRoll) {
        buttons.push(roll.toRollButton(i));
      }
    }

    return buttons;
  }

  /**
   * Add event listeners after all alterations in {@linkcode alterMessageHTML} have been made.
   */
  addListeners(html) {
    const damageButtons = html.querySelectorAll('.apply-damage');

    for (const btn of damageButtons) {
      btn.addEventListener('click', (event) => HonorIntrigueDamageRoll.applyDamageCallback(event));
    }
  }
}

import { WeaponModel } from '../item/_module.mjs';
import BaseMessageModel from './base.mjs';

const fields = foundry.data.fields;

export default class ManeuverMessageModel extends BaseMessageModel {
  /** @inheritDoc */
  static get metadata() {
    return {
      type: 'maneuver',
    };
  }

  /** @inheritDoc */
  static defineSchema() {
    const schema = super.defineSchema();

    // An optional reference to the readied equipment item for this maneuver.
    schema.relatedItemUuid = new fields.StringField({ blank: false });
    // A required reference to the maneuver (either in the compendium or owner by an actor).
    schema.uuid = new fields.StringField({ required: true, nullable: false, blank: false });

    return schema;
  }

  /** @inheritDoc */
  async _constructFooterButtons() {
    const buttons = await super._constructFooterButtons();

    if (this.relatedItemUuid) {
      buttons.push(hi.utils.constructButton({
        classes: ['roll-damage'],
        dataset: {
          itemUuid: this.relatedItemUuid,
          tooltip: game.i18n.localize('HONOR_INTRIGUE.Chat.Buttons.RollDamage.hint'),
          tooltipDirection: 'UP',
        },
        label: game.i18n.localize('HONOR_INTRIGUE.Chat.Buttons.RollDamage.label'),
      }));
    }

    return buttons;
  }

  /** @inheritDoc */
  addListeners(html) {
    super.addListeners(html);

    const rollButtons = html.querySelectorAll('.roll-damage');

    for (const btn of rollButtons) {
      btn.addEventListener('click', (event) => WeaponModel.rollDamageFromMessage(event));
    }
  }
}

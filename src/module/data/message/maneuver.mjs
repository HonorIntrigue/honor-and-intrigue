import { systemPath } from '../../constants.mjs';
import { WeaponModel } from '../item/_module.mjs';
import QualityRollMessageModel from './qualityRoll.mjs';

const fields = foundry.data.fields;

export default class ManeuverMessageModel extends QualityRollMessageModel {
  /** @inheritDoc */
  static get metadata() {
    return {
      type: 'maneuver',
    };
  }

  /** @inheritDoc */
  static defineSchema() {
    const schema = super.defineSchema();

    // A required reference to the maneuver (either in the compendium or owner by an actor).
    schema.maneuver = new fields.DocumentUUIDField({ required: true, nullable: false, blank: false });
    // A reference to the calculated outcome of the roll.
    schema.outcome = new fields.StringField(({ choices: Object.values(hi.CONFIG.ROLL_OUTCOME).map(v => v.key), nullable: false }));
    // An optional reference to the readied equipment item for this maneuver.
    schema.relatedItemUuid = new fields.StringField({ blank: false });
    // A list of modifiers from the target affecting the roll outcome.
    schema.targetModifiers = new fields.SchemaField({
      quality: new fields.SchemaField({
        key: new fields.StringField({ choices: Object.values(hi.CONFIG.qualities).map(v => v.rollKey) }),
        value: new fields.NumberField({ integer: true }),
      }, { required: false }),
      combatAbility: new fields.SchemaField({
        key: new fields.StringField({ choices: Object.values(hi.CONFIG.combatAbilities).map(v => v.rollKey) }),
        value: new fields.NumberField({ integer: true }),
      }, { required: false }),
      flatModifier: new fields.NumberField({ integer: true, initial: 0 }),
    });

    return schema;
  }

  /** @inheritDoc */
  async alterMessageHTML(html) {
    await super.alterMessageHTML(html);

    const mods = [];

    if (this.targetModifiers.quality?.value) mods.push(game.i18n.format('HONOR_INTRIGUE.Chat.Roll.Modifier.Ability', {
      ability: game.i18n.localize(hi.CONFIG.qualities[this.targetModifiers.quality.key].label),
      number: this.targetModifiers.quality.value.signedString(),
    }));
    if (this.targetModifiers.combatAbility?.value) mods.push(game.i18n.format('HONOR_INTRIGUE.Chat.Roll.Modifier.Ability', {
      ability: game.i18n.localize(hi.CONFIG.combatAbilities[this.targetModifiers.combatAbility.key].label),
      number: this.targetModifiers.combatAbility.value.signedString(),
    }));
    if (this.targetModifiers.flatModifier !== 0) mods.push(game.i18n.format('HONOR_INTRIGUE.Chat.Roll.Modifier.Flat', { number: this.targetModifiers.flatModifier.signedString() }));

    const details = await foundry.applications.handlebars.renderTemplate(systemPath('templates/rolls/maneuver-roll-content.hbs'), {
      modifiers: mods.join(','),
      outcome: Object.values(hi.CONFIG.ROLL_OUTCOME).find(v => v.key === this.outcome),
      target: await fromUuid(this.target),
    });

    html.querySelector('.message-content').insertAdjacentHTML('beforeend', details);

    if (this.outcome === hi.CONFIG.ROLL_OUTCOME.CritSuccess.key || this.outcome === hi.CONFIG.ROLL_OUTCOME.CritFailure.key) {
      html.querySelector('.dice-result .dice-total')?.classList.toggle(`outcome-${this.outcome}`);
    }
  }

  /** @inheritDoc */
  async _constructFooterButtons() {
    const buttons = await super._constructFooterButtons();
    const item = await fromUuid(this.relatedItemUuid);

    if (item && (this.parent.isAuthor || this.parent.isOwner || item.isOwner)) {
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
      btn.addEventListener('click', () => WeaponModel.rollDamageFromMessage(this));
    }
  }
}

import { systemPath } from '../../constants.mjs';
import BaseMessageModel from './base.mjs';

const fields = foundry.data.fields;

export default class QualityRollMessageModel extends BaseMessageModel {
  /** @inheritDoc */
  static get metadata() {
    return { type: 'quality' };
  }

  /** @inheritDoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.quality = new fields.SchemaField({
      key: new fields.StringField({
        choices: Object.values(hi.CONFIG.qualities).map(v => v.rollKey),
        nullable: false,
        required: true,
      }),
      value: new fields.NumberField({ integer: true, required: true }),
    });
    schema.modifiers = new fields.SchemaField({
      combatAbility: new fields.SchemaField({
        key: new fields.StringField({ choices: Object.values(hi.CONFIG.combatAbilities).map(v => v.rollKey) }),
        value: new fields.NumberField({ integer: true }),
      }, { required: false }),
      career: new fields.SchemaField({
        key: new fields.StringField(),
        value: new fields.NumberField({ integer: true }),
      }, { required: false }),
      bonuses: new fields.NumberField({ integer: true, initial: 0, min: 0 }),
      penalties: new fields.NumberField({ integer: true, initial: 0, min: 0 }),
      flatModifier: new fields.NumberField({ integer: true, initial: 0 }),
    });
    schema.statusModifiers = new fields.TypedObjectField(new fields.SchemaField({
      label: new fields.StringField(),
      value: new fields.NumberField({ integer: true }),
    }));

    return schema;
  }

  /** @inheritDoc */
  async alterMessageHTML(html) {
    await super.alterMessageHTML(html);

    const mods = [
      game.i18n.format('HONOR_INTRIGUE.Chat.Roll.Modifier.Ability', {
        ability: game.i18n.localize(hi.CONFIG.qualities[this.quality.key].label),
        number: this.quality.value.signedString(),
      }),
    ];

    if (this.modifiers.combatAbility?.value) mods.push(game.i18n.format('HONOR_INTRIGUE.Chat.Roll.Modifier.Ability', {
      ability: game.i18n.localize(hi.CONFIG.combatAbilities[this.modifiers.combatAbility.key].label),
      number: this.modifiers.combatAbility.value.signedString(),
    }));
    if (this.modifiers.career?.value) mods.push(game.i18n.format('HONOR_INTRIGUE.Chat.Roll.Modifier.Ability', {
      ability: this.modifiers.career.key,
      number: this.modifiers.career.value.signedString(),
    }));
    if (this.modifiers.bonuses > 0) mods.push(game.i18n.format('HONOR_INTRIGUE.Chat.Roll.Modifier.BonusDice', { number: this.modifiers.bonuses }));
    if (this.modifiers.penalties > 0) mods.push(game.i18n.format('HONOR_INTRIGUE.Chat.Roll.Modifier.PenaltyDice', { number: this.modifiers.penalties }));
    if (this.modifiers.flatModifier !== 0) mods.push(game.i18n.format('HONOR_INTRIGUE.Chat.Roll.Modifier.Flat', { number: this.modifiers.flatModifier.signedString() }));

    const details = await foundry.applications.handlebars.renderTemplate(systemPath('templates/rolls/quality-roll-content.hbs'), {
      modifiers: mods,
      statusModifiers: Object.values(this.statusModifiers).reduce((acc, { label, value }) => [
        ...acc,
        game.i18n.format('HONOR_INTRIGUE.Chat.Roll.Modifier.StatusEffect', {
          name: game.i18n.localize(label),
          value,
        }),
      ], []),
    });

    html.querySelector('.message-content').insertAdjacentHTML('afterbegin', details);
  }
}

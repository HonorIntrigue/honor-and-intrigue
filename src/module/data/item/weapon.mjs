import HonorIntrigueSystemModel from '../system-model.mjs';

const fields = foundry.data.fields;

export default class WeaponModel extends HonorIntrigueSystemModel {
  static LOCALIZATION_PREFIXES = ['HONOR_INTRIGUE.Item.Sheet'];

  /** @inheritDoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: 'weapon',
    };
  }

  /** @inheritDoc */
  static defineSchema() {
    const schema = {};

    schema.damageFormula = new fields.SchemaField({
      dieSize: new fields.NumberField({ choices: [2, 3, 4, 6, 8, 10, 12], initial: 6, integer: true, nullable: false }),
      flatModifier: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
      numDice: new fields.NumberField({ initial: 1, integer: true, min: 1, nullable: false }),
    });
    schema.description = new fields.HTMLField({ textSearch: true, trim: true });
    schema.handsHeld = new fields.NumberField({ initial: 0, integer: true, min: 0, max: 3, nullable: false });
    schema.rangeIncrement = new fields.NumberField({ initial: 0, integer: true, min: 0, nullable: false });
    schema.throwable = new fields.BooleanField({ initial: false, nullable: false });

    return schema;
  }

  /**
   * Generates an embeddable element for this item.
   */
  async toEmbed() {
    const embed = document.createElement('div');
    embed.classList.add('honor-intrigue', this.parent.type);
    embed.innerHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.description, {
      relativeTo: this.parent,
      secrets: this.parent.isOwner,
    });

    return embed;
  }
}

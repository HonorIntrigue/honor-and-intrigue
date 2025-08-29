import HonorIntrigueSystemModel from '../system-model.mjs';

const fields = foundry.data.fields;

export default class BaseActorModel extends HonorIntrigueSystemModel {
  /** @inheritDoc **/
  static defineSchema() {
    const schema = {};

    const quality = { min: -1, max: 6, initial: 0, integer: true, nullable: false };
    schema.qualities = new fields.SchemaField(
      Object.entries(hi.CONFIG.qualities).reduce((obj, [q, { label }]) => {
        obj[q] = new fields.SchemaField({
          value: new fields.NumberField({ ...quality, label }),
        });

        return obj;
      }, {}),
    );

    const combatAbility = { min: -1, max: 5, initial: 0, integer: true, nullable: false };
    schema.combatAbilities = new fields.SchemaField(
      Object.entries(hi.CONFIG.combatAbilities).reduce((obj, [ca, { label }]) => {
        obj[ca] = new fields.SchemaField({
          value: new fields.NumberField({ ...combatAbility, label }),
        });

        return obj;
      }, {}),
    );

    schema.lifeblood = new fields.SchemaField({
      value: new fields.NumberField({ min: -6, initial: 1, integer: true, nullable: false }),
    });
    schema.notes = new fields.HTMLField({ textSearch: true, trim: true });

    return schema;
  }

  /**
   * Calculate the maximum value of the lifeblood field.
   * @returns {number}
   */
  calcLifebloodMax() {
    return 1;
  }

  /** @inheritDoc */
  prepareDerivedData() {
    this.lifeblood.max = this.calcLifebloodMax();
  }

  /** @inheritDoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    this.parent.updateSource({
      system: { lifeblood: { value: this.calcLifebloodMax() } },
      prototypeToken: {
        disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE,
      } },
    );

    return true;
  }

  /** @inheritDoc */
  async _preUpdate(changes, options, user) {
    if (changes.system?.lifeblood) {
      changes.system.lifeblood = {
        value: Math.clamp(changes.system.lifeblood?.value ?? 0, 0, this.calcLifebloodMax()),
      };
    }

    return super._preUpdate(changes, options, user);
  }

  /** @inheritDoc */
  async _onUpdate(changes, options, user) {
    if (changes.system?.qualities?.might) {
      this.parent.update({
        system: { lifeblood: { value: Math.clamp(this.lifeblood.value, 0, this.calcLifebloodMax()) } },
      });
    }

    return super._onUpdate(changes, options, user);
  }
}

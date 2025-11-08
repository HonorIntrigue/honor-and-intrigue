import { systemID } from '../../constants.mjs';
import { HonorIntrigueProtectionRoll, HonorIntrigueRoll } from '../../rolls/_module.mjs';
import HonorIntrigueSystemModel from '../system-model.mjs';

const fields = foundry.data.fields;
const { hasProperty } = foundry.utils;

export default class BaseActorModel extends HonorIntrigueSystemModel {
  /** @inheritDoc **/
  static defineSchema() {
    const schema = {};

    const quality = { min: -1, max: 6, initial: 0, integer: true, nullable: false };
    schema.qualities = new fields.SchemaField(
      Object.values(hi.CONFIG.qualities)
        .filter(({ types }) => {
          if (!types) return true;
          return types.some(t => this.metadata.type === t);
        }).reduce((obj, { label, rollKey }) => ({
          ...obj,
          [rollKey]: new fields.NumberField({ ...quality, label }),
        }), {}),
    );

    const combatAbility = { min: -1, max: 5, initial: 0, integer: true, nullable: false };
    schema.combatAbilities = new fields.SchemaField(
      Object.values(hi.CONFIG.combatAbilities).reduce((obj, { label, rollKey }) => ({
        ...obj,
        [rollKey]: new fields.NumberField({ ...combatAbility, label }),
      }), {}),
    );

    schema.lifeblood = new fields.SchemaField({
      max: new fields.NumberField({ min: 1, initial: 1, integer: true, nullable: false }),
      min: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
      value: new fields.NumberField({ min: -6, initial: 1, integer: true, nullable: false, required: true }),
    });
    schema.arcanePower = new fields.SchemaField(({
      adjustment: new fields.NumberField({ initial: 0, integer: true }),
      value: new fields.NumberField({ min: 0, initial: 0, integer: true }),
    }));
    schema.notes = new fields.HTMLField({ textSearch: true, trim: true });

    return schema;
  }

  /**
   * A reference to the actor's party, if it exists.
   * @type {PartyModel}
   */
  party;

  /**
   * Get the base value for computing lifeblood.
   */
  get baseLifeblood() {
    return 10;
  }

  /**
   * Flag that indicates if the max value of lifeblood should be derived from Might.
   */
  get isLifebloodMightDerived() {
    return true;
  }

  /**
   * Flag that indicates if a chat message should be posted when Lifeblood changes.
   */
  get messageOnLifebloodChange() {
    return this.parent.inCombat;
  }

  /**
   * Apply an amount of damage to this actor, optionally rolling for protection first.
   */
  async applyDamage({ amount, withProtection }) {
    if (withProtection) {
      const result = await HonorIntrigueProtectionRoll.prompt({ actor: this.parent });
      if (!result) return; // prompt cancelled

      const { protectionItems, rollMode, rolls } = result;
      const { id } = await ChatMessage.create({
        flavor: game.i18n.localize('HONOR_INTRIGUE.Chat.Roll.Flavor.Protection'),
        rolls,
        sound: CONFIG.sounds.dice,
        speaker: ChatMessage.getSpeaker({ actor: this.parent }),
        system: {
          protectionItems,
          total: amount,
        },
        type: 'damageResult',
      }, { rollMode });

      if (game.dice3d?.waitFor3DAnimationByMessageID instanceof Function) {
        await game.dice3d.waitFor3DAnimationByMessageID(id);
      }

      amount = Math.max(1, amount - rolls[0].total);
    }

    return this.parent.update({ 'system.lifeblood.value': this.lifeblood.value - amount });
  }

  /**
   * Adjust roll data for the actor subtype.
   * @param rollData
   */
  modifyRollData(rollData) {
    for (const [key, val] of Object.entries(this.qualities)) {
      rollData[hi.CONFIG.qualities[key].rollKey] = val;
    }

    for (const [key, val] of Object.entries(this.combatAbilities)) {
      rollData[hi.CONFIG.combatAbilities[key].rollKey] = val;
    }
  }

  /** @inheritDoc */
  prepareBaseData() {
    super.prepareBaseData();
    this.party ??= game.actors?.find(a => a.type === 'party' && a.system.members.has(this.parent.uuid))?.system;
  }

  /** @inheritDoc */
  prepareData() {
    super.prepareData();
    this.party?.reset();
  }

  /** @inheritDoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    const atALoss = this.parent.statuses.has('at-a-loss');
    if (atALoss) {
      this.combatAbilities.defense -= 2;
    }

    const arcaneCareer = this.parent.itemTypes['career']
      .filter(c => c.system.isArcane)
      .sort((a, b) => a.system.rank - b.system.rank)
      .at(-1);
    if (arcaneCareer) {
      this.arcanePower.career = arcaneCareer.id;
      this.arcanePower.max = (10 + arcaneCareer.system.rank) + this.arcanePower.adjustment;
    }
  }

  /**
   * Prompt the user to roll a characteristic.
   * @param characteristic
   * @param options
   * @returns {Promise<messageData>|undefined}
   */
  async rollCharacteristic(characteristic, options = {}) {
    const data = this.parent.getRollData();
    const flavor = game.i18n.localize(foundry.utils.getProperty(hi.CONFIG, characteristic)?.label);
    const value = foundry.utils.getProperty(this, characteristic) ?? 0;

    options.system ??= {};
    options.system.quality = { key: foundry.utils.getProperty(hi.CONFIG, characteristic).rollKey, value };
    options.system.modifiers ??= {};
    options.type ??= 'quality';

    // TODO enrich header with:
    // speakerActor.img
    // user.name

    const result = await HonorIntrigueRoll.prompt({
      ...options,
      actor: this.parent,
      quality: value,
      characteristic,
      data,
      flavor,
      title: options.title ?? flavor,
    });

    if (!result) return;

    const { modifiers, rollMode, rolls } = result;

    if (modifiers.combatAbility && modifiers.combatAbility !== 'none') {
      options.system.modifiers.combatAbility = {
        key: hi.CONFIG.combatAbilities[modifiers.combatAbility].rollKey,
        value: this.parent.system.combatAbilities[modifiers.combatAbility],
      };
    }

    if (modifiers.career && modifiers.career !== 'none') {
      const career = await this.parent.getEmbeddedDocument('Item', modifiers.career);
      options.system.modifiers.career = {
        key: career.name,
        value: career.system.rank,
      };
    }

    options.system.modifiers.difficulty = modifiers.difficulty;
    options.system.modifiers.bonuses = modifiers.bonuses;
    options.system.modifiers.penalties = modifiers.penalties;
    options.system.modifiers.flatModifier = modifiers.flat;

    const messageData = {
      flags: { core: { canPopout: true }, [systemID]: (options.flags || {}) },
      flavor: options.title ?? flavor,
      rolls,
      rollMode,
      sound: CONFIG.sounds.dice,
      speaker: ChatMessage.getSpeaker({ actor: this.parent }),
      system: options.system,
      title: options.title ?? flavor,
      type: options.type,
    };

    return ChatMessage.create(messageData);
  }

  /** @inheritDoc */
  _onDelete(options, userId) {
    super._onDelete(options, userId);

    if (this.party) {
      if (game.user === this.party.parent.legalUpdater) {
        this.party.removeMembers(this.parent);
      }
    }
  }

  /** @inheritDoc */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);

    if (userId === game.user.id && hasProperty(changed, 'system.lifeblood.value')) {
      if (changed.system.lifeblood.value === this.lifeblood.min) {
        this.parent.toggleStatusEffect('dead', { active: true });
        this.parent.toggleStatusEffect('dying', { active: false });
      } else if (changed.system.lifeblood.value <= 0) {
        this.parent.toggleStatusEffect('dead', { active: false });
        this.parent.toggleStatusEffect('dying', { active: true });
      } else {
        this.parent.toggleStatusEffect('dead', { active: false });
        this.parent.toggleStatusEffect('dying', { active: false });
      }
    }

    this.party?.sheet?.render();
  }

  /** @inheritDoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    const changes = { prototypeToken: { disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE } };

    if (this.isLifebloodMightDerived) {
      changes.system = { lifeblood: {} };
      changes.system.lifeblood.max = changes.system.lifeblood.value = this.baseLifeblood + this.qualities.might;
    }

    this.parent.updateSource(changes);
    return true;
  }

  /** @inheritDoc */
  async _preUpdate(changes, options, user) {
    const allowed = await super._preUpdate(changes, options, user);
    if (allowed === false) return false;

    let { min, max } = this.lifeblood;

    if (hasProperty(changes, 'system.qualities.might')) {
      if (max && this.isLifebloodMightDerived) {
        max = this.baseLifeblood + changes.system.qualities.might;
        changes.system.lifeblood.max = max;
      }
    }

    if (hasProperty(changes, 'system.lifeblood.value')) {
      changes.system.lifeblood.value = Math.max(changes.system.lifeblood.value, min);
      if (max) changes.system.lifeblood.value = Math.min(changes.system.lifeblood.value, max);

      const change = changes.system.lifeblood.value - this.lifeblood.value;
      const diff = Math.abs(change);
      if (diff !== 0) {
        const tokens = this.parent.getActiveTokens();
        for (const token of tokens) {
          canvas.interface.createScrollingText(token.getCenterPoint(), change.signedString(), {
            fill: change > 0 ? 'green' : 'red',
          }).catch();
        }

        if (this.messageOnLifebloodChange) {
          let messageKey = '';

          if (change > 0) messageKey = 'HONOR_INTRIGUE.Chat.Result.LifebloodGain';
          else if (change < 0) messageKey = 'HONOR_INTRIGUE.Chat.Result.LifebloodLoss';

          await ChatMessage.create({
            content: game.i18n.format(messageKey, { amount: diff, name: this.parent.name }),
            speaker: ChatMessage.getSpeaker({ actor: this.parent }),
          });
        }
      }
    }

    if (hasProperty(changes, 'system.arcanePower.adjustment')) {
      const arcaneCareer = this.parent.items.get(this.arcanePower.career);
      changes.system.arcanePower.adjustment -= (10 + arcaneCareer.system.rank);
    }

    if (hasProperty(changes, 'system.arcanePower.value')) {
      changes.system.arcanePower.value = Math.min(changes.system.arcanePower.value, this.arcanePower.max);
    }

    return true;
  }
}

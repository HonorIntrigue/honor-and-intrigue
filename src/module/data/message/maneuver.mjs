import { systemPath } from '../../constants.mjs';
import CharacterActorModel from '../actor/characterActorModel.mjs';
import { WeaponModel } from '../item/_module.mjs';
import QualityRollMessageModel from './quality-roll.mjs';

const fields = foundry.data.fields;

export default class ManeuverMessageModel extends QualityRollMessageModel {
  /** @inheritDoc */
  static get metadata() {
    return { type: 'maneuver' };
  }

  /** @inheritDoc */
  static defineSchema() {
    const schema = super.defineSchema();

    // A required reference to the maneuver (either in the compendium or owner by an actor).
    schema.maneuver = new fields.DocumentUUIDField({ required: true, nullable: false, blank: false });
    // A reference to the calculated outcome of the roll.
    schema.outcome = new fields.SchemaField({
      difference: new fields.NumberField({ integer: true }),
      originalResult: new fields.StringField({ choices: Object.values(hi.CONFIG.ROLL_OUTCOME).map(v => v.key) }),
      modifiedReason: new fields.StringField(),
      result: new fields.StringField({ choices: Object.values(hi.CONFIG.ROLL_OUTCOME).map(v => v.key) }),
    }, { required: false });
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
      outcome: Object.values(hi.CONFIG.ROLL_OUTCOME).find(v => v.key === this.outcome?.result),
      reasonOutcomeModified: this.outcome?.modifiedReason,
      target: await fromUuid(this.target),
    });

    html.querySelector('.message-content').insertAdjacentHTML('beforeend', details);

    if (this.outcome?.result === hi.CONFIG.ROLL_OUTCOME.CritSuccess.key || this.outcome?.result === hi.CONFIG.ROLL_OUTCOME.CritFailure.key) {
      html.querySelector('.dice-result .dice-total')?.classList.toggle(`outcome-${this.outcome.result}`);
    }
  }

  /** @inheritDoc */
  async _constructFooterButtons() {
    const buttons = await super._constructFooterButtons();

    const [maneuver, target] = await Promise.all([fromUuid(this.maneuver), fromUuid(this.target)]);
    const isSuccess = [hi.CONFIG.ROLL_OUTCOME.CritSuccess.key, hi.CONFIG.ROLL_OUTCOME.Success.key].includes(this.outcome?.result);
    if (isSuccess && target && target.isOwner) {
      if (maneuver.system.abilityCheck?.opposedBy?.combatAbility === hi.CONFIG.combatAbilities.defense.rollKey) {
        if (this.outcome.difference <= 1) {
          buttons.push(hi.utils.constructButton({
            dataset: {
              action: 'dodge',
              tooltip: game.i18n.localize('HONOR_INTRIGUE.Chat.Buttons.Dodge.hint'),
            },
            label: game.i18n.localize('HONOR_INTRIGUE.Chat.Buttons.Dodge.label'),
          }));
        }

        buttons.push(hi.utils.constructButton({
          dataset: {
            action: 'reaction',
            tooltip: game.i18n.localize('HONOR_INTRIGUE.Chat.Buttons.UseReaction.hint'),
          },
          label: game.i18n.localize('HONOR_INTRIGUE.Chat.Buttons.UseReaction.label'),
        }));
      }

      if (target.system instanceof CharacterActorModel) {
        // TODO add this flag to compendium ranged attacks
        const fortuneNeededToAvoid = maneuver.getFlag(hi.CONST.systemID, 'rangedAttack') ? 1 : (this.outcome.difference + 1); // Add 1 to push the result BELOW the target difficulty

        if (fortuneNeededToAvoid) {
          const hasEnoughFortune = target.system.fortune.value < fortuneNeededToAvoid;
          buttons.push(hi.utils.constructButton({
            dataset: {
              action: 'fortune',
              amount: fortuneNeededToAvoid,
              tooltip: hasEnoughFortune ?
                game.i18n.localize('HONOR_INTRIGUE.Chat.Buttons.SpendFortune.disabled') :
                game.i18n.format('HONOR_INTRIGUE.Chat.Buttons.SpendFortune.hint', { amount: fortuneNeededToAvoid }),
            },
            disabled: hasEnoughFortune,
            label: game.i18n.format('HONOR_INTRIGUE.Chat.Buttons.SpendFortune.label', { amount: fortuneNeededToAvoid }),
          }));
        }

        if (target.system.advantage > 0) {
          buttons.push(hi.utils.constructButton({
            dataset: {
              action: 'yield',
              tooltip: game.i18n.localize('HONOR_INTRIGUE.Chat.Buttons.YieldAdvantage.hint'),
            },
            label: game.i18n.localize('HONOR_INTRIGUE.Chat.Buttons.YieldAdvantage.label'),
          }));
        }
      }
    }

    const item = await fromUuid(this.relatedItemUuid);
    if (item && (this.parent.isAuthor || this.parent.isOwner || item.isOwner)) {
      buttons.push(hi.utils.constructElement('hr'));
      buttons.push(hi.utils.constructButton({
        dataset: {
          action: 'damage',
          itemUuid: this.relatedItemUuid,
          tooltip: game.i18n.localize('HONOR_INTRIGUE.Chat.Buttons.RollDamage.hint'),
        },
        label: game.i18n.localize('HONOR_INTRIGUE.Chat.Buttons.RollDamage.label'),
      }));
    }

    return buttons;
  }

  /** @inheritDoc */
  addListeners(html) {
    super.addListeners(html);

    html.querySelector('[data-action="damage"]')?.addEventListener('click', () => WeaponModel.rollDamageFromMessage(this));
    html.querySelector('[data-action="dodge"]')?.addEventListener('click', this.onActionDodge.bind(this));
    html.querySelector('[data-action="reaction"]')?.addEventListener('click', this.onActionReaction.bind(this));
    html.querySelector('[data-action="fortune"]')?.addEventListener('click', this.onActionFortune.bind(this));
    html.querySelector('[data-action="yield"]')?.addEventListener('click', this.onActionYield.bind(this));
  }

  /**
   * Action handler to use a Dodge Reaction.
   */
  async onActionDodge() {
    return game.system.socketHandler.doIfOrEmit(
      async () => this.parent.update({
        'system.outcome': {
          modifiedReason: 'dodge',
          originalResult: this.outcome.result,
          result: hi.CONFIG.ROLL_OUTCOME.Failure.key,
        },
      }),
      this.parent.canUserModify(game.user, 'update'),
      { type: 'MESSAGE_ACTION_DODGE', message: { id: this.parent.id } },
    );
  }

  /**
   * Action handler to use Fortune to turn a hit into a Close Call.
   */
  async onActionFortune(event) {
    const target = await fromUuid(this.target);
    const { amount } = event.target.closest('[data-action="fortune"]').dataset;

    return game.system.socketHandler.doIfOrEmit(
      async () => this.onActionFortuneDeferred(amount),
      target.canUserModify(game.user, 'update') && this.parent.canUserModify(game.user, 'update'),
      { type: 'MESSAGE_ACTION_FORTUNE', data: { amount }, message: { id: this.parent.id } },
    );
  }

  /**
   * Handles a deferred call to deduct spent Fortune and update this message's outcome.
   */
  async onActionFortuneDeferred(amount) {
    const target = await fromUuid(this.target);

    await target.update({ 'system.fortune.value': target.system.fortune.value - amount });
    return this.parent.update({
      'system.outcome': {
        modifiedReason: 'fortune',
        originalResult: this.outcome.result,
        result: hi.CONFIG.ROLL_OUTCOME.Failure.key,
      },
    });
  }

  /**
   * Action handler to prompt the target to choose a Reaction Maneuver against this maneuver.
   */
  async onActionReaction() {
    const target = await fromUuid(this.target);
    const result = await foundry.applications.api.DialogV2.input({
      classes: ['honor-intrigue', 'roll-dialog'],
      content: await foundry.applications.handlebars.renderTemplate(systemPath('templates/rolls/damage-reaction-dialog.hbs'), {
        // TODO add non-conflicting compendium reactions
        maneuverChoices: (target.itemTypes['maneuver']?.filter(i => i.system.actionType === 3) ?? []).map(i => ({
          id: i.id,
          mastered: i.system.isMastered,
          name: `${i.name}${i.system.isMastered ? ` ${game.i18n.localize('HONOR_INTRIGUE.Dialog.DamageReaction.MasteryHint')}` : ''}`,
        })),
      }),
      window: { title: 'HONOR_INTRIGUE.Dialog.DamageReaction.Title' },
    });

    const maneuverChoice = result?.maneuverChoiceInput;
    if (!maneuverChoice) return;

    const maneuver = target.items.get(maneuverChoice);
    if (!maneuver) return;

    await ChatMessage.create({
      content: game.i18n.format('HONOR_INTRIGUE.Chat.Result.OutcomeModified.reaction', { maneuver: maneuver.name }),
      speaker: ChatMessage.getSpeaker({ actor: target }),
    });

    if (maneuver.system.requiresCheck) {
      return target.system.rollManeuver(maneuver);
    }
  }

  /**
   * Action handler to Yield Advantage to turn a hit into a miss.
   */
  async onActionYield() {
    const target = await fromUuid(this.target);

    return game.system.socketHandler.doIfOrEmit(
      async () => {
        await target.update({ 'system.advantage': target.system.advantage - 1 });
        return this.parent.update({
          'system.outcome': {
            modifiedReason: 'yield',
            originalResult: this.outcome.result,
            result: hi.CONFIG.ROLL_OUTCOME.Failure.key,
          },
        });
      },
      target.canUserModify(game.user, 'update') && this.parent.canUserModify(game.user, 'update'),
      { type: 'MESSAGE_ACTION_YIELD', gmOnly: true, message: { id: this.parent.id } },
    );
  }
}

import { systemPath } from '../../constants.mjs';
import { HonorIntrigueDamageRoll } from '../../rolls/_module.mjs';
import BaseMessageModel from './base.mjs';

const fields = foundry.data.fields;

export default class DamageMessageModel extends BaseMessageModel {
  /** @inheritDoc */
  static get metadata() {
    return {
      type: 'damage',
    };
  }

  /** @inheritDoc */
  static defineSchema() {
    const schema = super.defineSchema();

    // A required reference to the item source of this damage instance.
    schema.uuid = new fields.StringField({ required: true, nullable: false, blank: false });

    return schema;
  }

  /** @inheritDoc */
  async alterMessageHTML(html) {
    await super.alterMessageHTML(html);

    if (this.parent.isAuthor || this.parent.isOwner) {
      html.querySelector('.dice-result .dice-total')
        .insertAdjacentHTML('afterbegin',
          '<i class="fa-solid fa-bullseye-arrow set-targets" data-action="setTargets" data-tooltip="HONOR_INTRIGUE.Chat.Buttons.SetTargets.hint"></i>',
        );
    }
  }

  /** @inheritDoc */
  async _constructFooterButtons() {
    const buttons = await super._constructFooterButtons();

    buttons.push(foundry.utils.parseHTML(
      await foundry.applications.handlebars.renderTemplate(systemPath('templates/rolls/damage-roll-footer.hbs'), {
        damageTotal: this.parent.rolls[0].total,
        targets: (await Promise.all(this.targets.map(async t => await fromUuid(t)))).filter(t => t),
      }),
    ));

    return buttons;
  }

  /**
   * Add event listeners after all alterations in {@linkcode alterMessageHTML} have been made.
   */
  addListeners(html) {
    html.querySelector('[data-action="setTargets"]')?.addEventListener('click', this.onSetTargets.bind(this));
    html.querySelectorAll('[data-action="pingTarget"]').forEach(el => el.addEventListener('click', this.onPingTarget));
    html.querySelectorAll('[data-action="applyDamage"]').forEach(el => el.addEventListener('click', this.onApplyDamage.bind(this)));
    html.querySelectorAll('[data-action="applyProtection"]').forEach(el => el.addEventListener('click', this.onApplyProtection.bind(this)));
  }

  /**
   * Handles applying damage to a target.
   */
  async onApplyDamage(event, { withProtection = false } = {}) {
    const { targetUuid } = event.target.closest('[data-target-uuid]').dataset;
    const actor = await fromUuid(targetUuid);

    await HonorIntrigueDamageRoll.applyDamageCallback({ actor, roll: this.parent.rolls.at(0), withProtection });
  }

  /**
   * Handles applying protection and damage to a target.
   */
  async onApplyProtection(event) {
    return this.onApplyDamage(event, { withProtection: true });
  }

  /**
   * Locate and ping a target on the canvas.
   */
  async onPingTarget(event) {
    const { targetUuid } = event.target.closest('[data-target-uuid]').dataset;
    const actor = await fromUuid(targetUuid);
    const activeToken = actor?.getActiveTokens()?.at(0);

    if (activeToken) canvas.ping(activeToken.center);
  }

  /**
   * Handle resetting the targets on request.
   */
  async onSetTargets() {
    const targets = game.user.targets.map(t => t.actor?.uuid);
    this.parent.update({ system: { target: targets.first(), targets: Array.from(targets) } });
  }
}

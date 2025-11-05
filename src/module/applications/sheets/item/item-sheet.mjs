import { systemPath } from '../../../constants.mjs';
import { DocumentSheetMixin } from '../../api/_module.mjs';

export default class HonorIntrigueItemSheet extends DocumentSheetMixin(foundry.applications.sheets.ItemSheetV2) {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    actions: {
      addChange: this.#onAddChange,
      createRule: this.#onCreateRule,
      deleteChange: this.#onDeleteChange,
      deleteRule: this.#onDeleteRule,
    },
    classes: ['item'],
    position: {
      height: 450,
      width: 900,
    },
  };

  /** @inheritDoc */
  static PARTS = {
    header: { template: systemPath('templates/sheets/item/base/header.hbs') },
    sidebar: { template: systemPath('templates/sheets/item/base/sidebar.hbs') },
    content: { template: 'templates/generic/tab-navigation.hbs' },
    description: { template: systemPath('templates/sheets/item/base/tabs/description.hbs') },
    rules: { template: systemPath('templates/sheets/item/shared/rules.hbs'), scrollable: ['.scrollable'] },
  };

  /** @inheritDoc */
  static TABS = {
    primary: {
      initial: 'description',
      labelPrefix: 'HONOR_INTRIGUE.Item.Sheet.Tabs',
      tabs: [{ id: 'description' }, { id: 'rules' }],
    },
  };

  /**
   * Add a new change to a rule.
   */
  static async #onAddChange(event, target) {
    const { effectId } = target.closest('[data-effect-id]').dataset;
    if (!effectId) return;

    const effect = this.item.effects.get(effectId);
    const changes = effect.changes || [];
    changes.push({});

    await effect.update({ changes });
  }

  /**
   * Handler for creating a new rule.
   */
  static async #onCreateRule() {
    const { id } = await ActiveEffect.implementation.create({ name: game.i18n.localize('HONOR_INTRIGUE.Item.Defaults.RuleName') }, { parent: this.item });
    await this.render({ parts: ['rules'] });

    const el = document.querySelector(`.effect-item[data-effect-id="${id}"]`);

    if (el) {
      el.scrollIntoView();
      el.querySelector('input[name="name"]')?.focus();
    }
  }

  /**
   * Delete a change from a rule.
   */
  static async #onDeleteChange(event, target) {
    const { effectId } = target.closest('[data-effect-id]').dataset;
    if (!effectId) return;

    const effect = this.item.effects.get(effectId);
    const changes = effect.changes;
    const { index } = target.closest('li').dataset || 0;

    if (changes.length > index) {
      changes.splice(index, 1);
      await effect.update({ changes });
    }
  }

  /**
   * Delete a rule.
   */
  static async #onDeleteRule(event, target) {
    const { effectId } = target.closest('[data-effect-id]').dataset;
    if (!effectId) return;

    const effect = this.item.effects.get(effectId);
    await effect.delete();
    this.render({ parts: ['details'] });
  }

  /** @inheritDoc */
  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);
    if (!this.document.isOwner) this._restrictLimited(parts);
    return parts;
  }

  /**
   * Handles changing the name of an inline rule.
   */
  async onRuleNameChange(event) {
    const { effectId } = event.target.closest('[data-effect-id]').dataset;
    if (!effectId) return;

    const effect = this.item.effects.get(effectId);
    await effect.update({ name: event.target.value });
  }

  /**
   * Handles the change of a field in the list of rule changes.
   */
  async onRuleChangesFieldChange(event) {
    const { effectId } = event.target.closest('[data-effect-id]').dataset;
    const { index } = event.target.closest('li').dataset || -1;
    if (!effectId || index === -1) return;

    const effect = this.item.effects.get(effectId);
    const changes = effect.changes;
    const { dataset: { name }, value } = event.target;

    changes[index][name] = value;
    await effect.update({ changes });
    this.render({ parts: ['rules'] });
  }

  /** @inheritDoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    const nameFields = this.element.querySelectorAll('.effect-item-name input[data-name="name"]');
    for (const field of nameFields) {
      field.addEventListener('change', this.onRuleNameChange.bind(this));
    }

    const changesFields = this.element.querySelectorAll('[data-changes] [data-name]');
    for (const field of changesFields) {
      field.addEventListener('change', this.onRuleChangesFieldChange.bind(this));
    }
  }

  /** @inheritDoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.document.system.description, {
      rollData: this.document.getRollData(),
      secrets: this.document.isOwner,
    });

    return context;
  }

  /** @inheritDoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    switch (partId) {
      case 'rules':
        context.modes = Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((modes, [k, v]) => ({
          ...modes,
          [v]: game.i18n.localize(`EFFECT.MODE_${k}`),
        }));
        context.priorities = foundry.applications.sheets.ActiveEffectConfig.DEFAULT_PRIORITIES;
        break;
    }

    return context;
  }

  /** @inheritDoc */
  _prepareTabs(group) {
    const tabs = super._prepareTabs(group);
    if (!this.document.isOwner && group === 'primary') this._restrictLimited(tabs);
    return tabs;
  }

  /**
   * Removes tabs for viewers with limited permission.
   * @param {Record<string, any>} data The parts or tabs object to modify.
   */
  _restrictLimited(data) {
    for (const key in data) {
      if (!['header', 'sidebar', 'content', 'description'].includes(key)) delete data[key];
    }
  }
}

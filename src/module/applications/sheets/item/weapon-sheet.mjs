import { systemPath } from '../../../constants.mjs';
import HonorIntrigueItemSheet from './item-sheet.mjs';

export default class WeaponItemSheet extends HonorIntrigueItemSheet {
  /** @inheritDoc */
  static PARTS = {
    header: { template: systemPath('templates/sheets/item/base/header.hbs') },
    sidebar: { template: systemPath('templates/sheets/item/base/sidebar.hbs') },
    content: { template: 'templates/generic/tab-navigation.hbs' },
    description: { template: systemPath('templates/sheets/item/base/tabs/description.hbs'), scrollable: [''] },
    details: { template: systemPath('templates/sheets/item/weapon/details.hbs'), scrollable: [''] },
  };

  /** @inheritDoc */
  static TABS = {
    primary: {
      initial: 'description',
      labelPrefix: 'HONOR_INTRIGUE.Item.Sheet.Tabs',
      tabs: [{ id: 'description' }, { id: 'details' }],
    },
  };

  /** @inheritDoc */
  async _preparePartContext(partId, context, options) {
    const ctx = await super._preparePartContext(partId, context, options);

    if (partId === 'details') {
      const { damageFormula } = context.system;

      ctx.damageString = `${damageFormula.numDice}d${damageFormula.dieSize}`;

      if (damageFormula.flatModifier > 0) ctx.damageString += ` + ${damageFormula.flatModifier}`;
      else if (damageFormula.flatModifier < 0) ctx.damageString += ` - ${Math.abs(damageFormula.flatModifier)}`;
    }

    return ctx;
  }

  /** @inheritDoc */
  _processFormData(event, form, formData) {
    const damageString = formData.get('damageString').replace(/\s/g, '');
    formData.delete('damageString');

    const parsedDamageString = /(\d+)d(\d+)([+-]\d+)?/.exec(damageString);

    if (parsedDamageString?.length >= 3) {
      formData.set('system.damageFormula.numDice', parsedDamageString[1]);
      formData.set('system.damageFormula.dieSize', parsedDamageString[2]);

      if (parsedDamageString[3]) {
        formData.set('system.damageFormula.flatModifier', parsedDamageString[3]);
      } else {
        formData.set('system.damageFormula.flatModifier', 0);
      }
    }

    return super._processFormData(event, form, formData);
  }
}

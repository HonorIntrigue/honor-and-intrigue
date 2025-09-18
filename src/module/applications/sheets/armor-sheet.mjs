import { systemPath } from '../../constants.mjs';
import HonorIntrigueItemSheet from './item-sheet.mjs';

export default class WeaponItemSheet extends HonorIntrigueItemSheet {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ['armor'],
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
    description: { template: systemPath('templates/sheets/item/base/tabs/description.hbs'), scrollable: [''] },
    details: { template: systemPath('templates/sheets/item/armor/details.hbs'), scrollable: [''] },
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
      const { protection } = context.system;

      ctx.protectionString = `${protection.numDice}d${protection.dieSize}`;

      if (protection.flatModifier > 0) ctx.protectionString += ` + ${protection.flatModifier}`;
      else if (protection.flatModifier < 0) ctx.protectionString += ` - ${Math.abs(protection.flatModifier)}`;
    }

    return ctx;
  }

  /** @inheritDoc */
  _processFormData(event, form, formData) {
    const protectionString = formData.get('protectionString').replace(/\s/g, '');
    formData.delete('protectionString');

    const parsedProtectionString = /(\d+)d(\d+)([+-]\d+)?/.exec(protectionString);

    if (parsedProtectionString?.length >= 3) {
      formData.set('system.protection.numDice', parsedProtectionString[1]);
      formData.set('system.protection.dieSize', parsedProtectionString[2]);

      if (parsedProtectionString[3]) {
        formData.set('system.protection.flatModifier', parsedProtectionString[3]);
      } else {
        formData.set('system.protection.flatModifier', 0);
      }
    }

    return super._processFormData(event, form, formData);
  }
}

import { systemPath } from '../../constants.mjs';
import HonorIntrigueItemSheet from './item-sheet.mjs';

const FormulaRegex = /^(\d+)d(\d+)([+-]\d+)?$/;

export default class ArmorItemSheet extends HonorIntrigueItemSheet {
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
  _processFormData(event, form, formData) {
    const data = super._processFormData(event, form, formData);

    if (foundry.utils.hasProperty(data, 'system.protection.value')) {
      const value = data.system.protection.value.replaceAll(/\s/g, '');

      if (/^\d+$/.test(value)) {
        data.system.protection = { numDice: null, flatModifier: parseInt(value) };
      } else if (FormulaRegex.test(value)) {
        const formulaMatch = FormulaRegex.exec(value);

        if (formulaMatch?.length > 1) {
          data.system.protection.numDice = formulaMatch.at(1);
          data.system.protection.dieSize = formulaMatch.at(2);
          data.system.protection.flatModifier = formulaMatch.at(3) ?? 0;
        }
      } else {
        throw new Error(`Invalid protection value "${data.system.protection.value}"`);
      }
    }

    return data;
  }
}

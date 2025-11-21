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
  _processFormData(event, form, formData) {
    const data = super._processFormData(event, form, formData);

    if (foundry.utils.hasProperty(data, 'system.damageFormula.value') && !!data.system.damageFormula.value) {
      data.system.damageFormula = hi.utils.valueToFormulaField(data.system.damageFormula.value);
    }

    return data;
  }
}

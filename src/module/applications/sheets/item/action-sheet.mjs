import { systemPath } from '../../../constants.mjs';
import HonorIntrigueItemSheet from './item-sheet.mjs';

export default class ActionItemSheet extends HonorIntrigueItemSheet {
  /** @inheritDoc */
  static PARTS = {
    ...super.PARTS,
    details: { template: systemPath('templates/sheets/item/action/details.hbs') },
  };

  /** @inheritDoc */
  static TABS = {
    ...super.TABS,
    primary: {
      ...super.TABS.primary,
      tabs: [{ id: 'description' }, { id: 'details' }, { id: 'rules' }],
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

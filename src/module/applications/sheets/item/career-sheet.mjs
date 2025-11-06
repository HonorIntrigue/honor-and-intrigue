import { systemPath } from '../../../constants.mjs';
import HonorIntrigueItemSheet from './item-sheet.mjs';

export default class CareerItemSheet extends HonorIntrigueItemSheet {
  /** @inheritDoc */
  static PARTS = {
    ...super.PARTS,
    details: { template: systemPath('templates/sheets/item/career/details.hbs'), scrollable: [''] },
  };

  /** @inheritDoc */
  static TABS = {
    ...super.TABS,
    primary: {
      ...super.TABS.primary,
      tabs: [{ id: 'description' }, { id: 'details' }],
    },
  };
}

import { systemPath } from '../../../constants.mjs';
import HonorIntrigueItemSheet from './item-sheet.mjs';

export default class ManeuverItemSheet extends HonorIntrigueItemSheet {
  /** @inheritDoc */
  static PARTS = {
    ...super.PARTS,
    details: { template: systemPath('templates/sheets/item/maneuver/details.hbs') },
  };

  /** @inheritDoc */
  static TABS = {
    ...super.TABS,
    primary: {
      ...super.TABS.primary,
      tabs: [{ id: 'description' }, { id: 'details' }, { id: 'rules' }],
    },
  };
}

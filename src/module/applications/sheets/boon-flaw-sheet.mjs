import { systemPath } from '../../constants.mjs';
import HonorIntrigueItemSheet from './item-sheet.mjs';

export default class BoonFlawItemSheet extends HonorIntrigueItemSheet {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ['boon-flaw'],
    position: {
      height: 450,
      width: 900,
    },
  };

  /** @inheritDoc */
  static PARTS = {
    header: { template: systemPath('templates/sheets/item/base/header.hbs') },
    sidebar: { template: systemPath('templates/sheets/item/career/sidebar.hbs') },
    content: { template: 'templates/generic/tab-navigation.hbs' },
    description: { template: systemPath('templates/sheets/item/base/tabs/description.hbs') },
  };

  /** @inheritDoc */
  static TABS = {
    primary: {
      initial: 'description',
      labelPrefix: 'HONOR_INTRIGUE.Item.Sheet.Tabs',
      tabs: [{ id: 'description' }],
    },
  };
}

import { HONOR_INTRIGUE } from '../module/config.mjs';
import * as HI_CONST from '../module/constants.mjs';
import * as applications from '../module/applications/_module.mjs';
import * as data from '../module/data/_module.mjs';
import * as documents from '../module/documents/_module.mjs';
import * as helpers from '../module/helpers/_module.mjs';
import * as rolls from '../module/rolls/_module.mjs';

globalThis.hi = {
  applications,
  data,
  documents,
  helpers,
  CONST: HI_CONST,
  CONFIG: HONOR_INTRIGUE,
};

Hooks.once('init', () => {
  CONFIG.HONOR_INTRIGUE = HONOR_INTRIGUE;
  game.system.socketHandler = new helpers.HonorIntrigueSocketHandler();
  helpers.HonorIntrigueSettingsHandler.registerSettings();

  // Assign document classes
  for (const docCls of Object.values(documents)) {
    if (!foundry.utils.isSubclass(docCls, foundry.abstract.Document)) continue;

    CONFIG[docCls.documentName].documentClass = docCls;
  }

  const templates = [...helpers.templatePartials];

  // Assign data models & add templates
  for (const [doc, models] of Object.entries(data)) {
    if (!CONST.ALL_DOCUMENT_TYPES.includes(doc)) continue;

    for (const modelCls of Object.values(models)) {
      if (modelCls.metadata?.type) CONFIG[doc].dataModels[modelCls.metadata.type] = modelCls;
      if (modelCls.metadata?.detailsPartial) templates.push(...modelCls.metadata.detailsPartial);
    }
  }

  foundry.applications.handlebars.loadTemplates(templates.map(t => HI_CONST.systemPath(t))).catch(console.error);

  CONFIG.Dice.rolls = [rolls.HonorIntrigueRoll];
  CONFIG.statusEffects = [];

  const { Actors, Items } = foundry.documents.collections;

  Actors.registerSheet(HI_CONST.systemID, applications.sheets.HeroSheet, {
    types: ['hero'],
    makeDefault: true,
    label: 'TYPES.Actor.hero',
  });

  Items.unregisterSheet('core', foundry.applications.sheets.ItemSheetV2);
  Items.registerSheet(HI_CONST.systemID, applications.sheets.CareerItemSheet, {
    types: ['career'],
    makeDefault: true,
    label: 'TYPES.Item.career',
  });
  Items.registerSheet(HI_CONST.systemID, applications.sheets.ManeuverItemSheet, {
    types: ['maneuver'],
    makeDefault: true,
    label: 'TYPES.Item.maneuver',
  });
  Items.registerSheet(HI_CONST.systemID, applications.sheets.WeaponItemSheet, {
    types: ['weapon'],
    makeDefault: true,
    label: 'TYPES.Item.weapon',
  });
});

Hooks.on('hotReload', helpers.hotReload);

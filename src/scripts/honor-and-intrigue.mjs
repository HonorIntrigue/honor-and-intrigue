import { HONOR_INTRIGUE } from '../module/config.mjs';
import { systemID, systemPath } from '../module/constants.mjs';
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

  foundry.applications.handlebars.loadTemplates(templates.map(t => systemPath(t))).catch(console.error);

  CONFIG.Dice.rolls = [rolls.HonorIntrigueRoll];
  CONFIG.statusEffects = [];

  const { Actors } = foundry.documents.collections;

  Actors.registerSheet(systemID, applications.sheets.HeroSheet, {
    types: ['hero'],
    makeDefault: true,
    label: 'HONOR_INTRIGUE.Sheet.Labels.Character',
  });
});

Hooks.on('hotReload', helpers.hotReload);

import { HONOR_INTRIGUE } from '../module/config.mjs';
import { systemID } from '../module/constants.mjs';
import * as HI_CONST from '../module/constants.mjs';
import * as applications from '../module/applications/_module.mjs';
import * as collections from '../module/collection/_module.mjs';
import * as data from '../module/data/_module.mjs';
import * as documents from '../module/documents/_module.mjs';
import * as helpers from '../module/helpers/_module.mjs';
import * as rolls from '../module/rolls/_module.mjs';
import * as utils from '../module/utils/_module.mjs';

globalThis.hi = {
  applications,
  data,
  documents,
  helpers,
  utils,
  CONST: HI_CONST,
  CONFIG: HONOR_INTRIGUE,
};

Hooks.once('init', () => {
  console.log(HONOR_INTRIGUE.ASCII);

  CONFIG.HONOR_INTRIGUE = HONOR_INTRIGUE;
  game.system.socketHandler = new helpers.HonorIntrigueSocketHandler();
  helpers.HonorIntrigueKeybindings.registerKeybindings();
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
    }
  }

  foundry.applications.handlebars.loadTemplates(templates.map(t => HI_CONST.systemPath(t))).catch(console.error);

  CONFIG.Actor.collection = collections.HonorIntrigueActors;
  CONFIG.Dice.rolls = [rolls.HonorIntrigueRoll, rolls.HonorIntrigueDamageRoll, rolls.HonorIntrigueProtectionRoll];
  CONFIG.ui.actors = applications.sidebar.HonorIntrigueActorDirectory;

  const effectsToKeep = ['dead', 'prone'];
  CONFIG.statusEffects = [...CONFIG.statusEffects.filter(se => effectsToKeep.includes(se.id)), ...HONOR_INTRIGUE.statusEffects].sort((a, b) => a.id.localeCompare(b.id));

  const { Actors, Items } = foundry.documents.collections;

  Actors.registerSheet(HI_CONST.systemID, applications.sheets.actorSheets.HeroSheet, {
    types: ['hero'],
    makeDefault: true,
    label: 'TYPES.Actor.hero',
  });
  Actors.registerSheet(HI_CONST.systemID, applications.sheets.actorSheets.PawnSheet, {
    types: ['pawn'],
    makeDefault: true,
    label: 'TYPES.Actor.pawn',
  });
  Actors.registerSheet(HI_CONST.systemID, applications.sheets.actorSheets.RetainerSheet, {
    types: ['retainer'],
    makeDefault: true,
    label: 'TYPES.Actor.retainer',
  });
  Actors.registerSheet(HI_CONST.systemID, applications.sheets.actorSheets.VillainSheet, {
    types: ['villain'],
    makeDefault: true,
    label: 'TYPES.Actor.villain',
  });
  Actors.registerSheet(HI_CONST.systemID, applications.sheets.actorSheets.PawnSheet, {
    types: ['creature'],
    makeDefault: true,
    label: 'TYPES.Actor.creature',
  });
  Actors.registerSheet(HI_CONST.systemID, applications.sheets.actorSheets.PartySheet, {
    types: ['party'],
    makeDefault: true,
    label: 'TYPES.Actor.party',
  });

  Items.unregisterSheet('core', foundry.applications.sheets.ItemSheetV2);
  Items.registerSheet(HI_CONST.systemID, applications.sheets.itemSheets.HonorIntrigueItemSheet);
  Items.registerSheet(HI_CONST.systemID, applications.sheets.itemSheets.ActionItemSheet, {
    types: ['action'],
    makeDefault: true,
    label: 'TYPES.Item.action',
  });
  Items.registerSheet(HI_CONST.systemID, applications.sheets.itemSheets.ArmorItemSheet, {
    types: ['armor'],
    makeDefault: true,
    label: 'TYPES.Item.armor',
  });
  Items.registerSheet(HI_CONST.systemID, applications.sheets.itemSheets.BoonFlawItemSheet, {
    types: ['boon', 'flaw'],
    makeDefault: true,
  });
  Items.registerSheet(HI_CONST.systemID, applications.sheets.itemSheets.CareerItemSheet, {
    types: ['career'],
    makeDefault: true,
    label: 'TYPES.Item.career',
  });
  Items.registerSheet(HI_CONST.systemID, applications.sheets.itemSheets.ManeuverItemSheet, {
    types: ['maneuver'],
    makeDefault: true,
    label: 'TYPES.Item.maneuver',
  });
  Items.registerSheet(HI_CONST.systemID, applications.sheets.itemSheets.WeaponItemSheet, {
    types: ['weapon'],
    makeDefault: true,
    label: 'TYPES.Item.weapon',
  });
});

Hooks.once('ready', async () => {
  if (game.user !== game.users.activeGM || game.settings.get(systemID, 'createdParty')) return;
  if (!game.actors.some(a => a.type === 'party')) {
    await Actor.create({
      _id: HONOR_INTRIGUE.defaultPartyId,
      name: game.i18n.localize('HONOR_INTRIGUE.Actor.Party.DefaultName'),
      type: 'party',
    }, { keepId: true });
    await game.settings.set(systemID, 'worldPartyId', HONOR_INTRIGUE.defaultPartyId);
  }
  await game.settings.set(systemID, 'createdParty', true);
});

Hooks.on('getProseMirrorMenuItems', (el, items) => applications.hooks.adjustProseMenuItems(items));
Hooks.on('renderChatMessageHTML', applications.hooks.renderChatMessageHTML);

// Monkey-patch the activateListeners function to get a hook when the menu items are rendered.
helpers.override(foundry.prosemirror.ProseMirrorMenu.prototype, 'activateListeners', helpers.after(function(html) {
  Hooks.callAll('proseMirrorMenu.activateListeners', this, html);
}));

// TODO dev helper -- remove during CI/CD
Hooks.on('hotReload', helpers.hotReload);

import { renderChatMessageHTML } from './chatMessageHTML.mjs';
import * as combat from './combat.mjs';
import { adjustProseMenuItems } from './proseMenuItems.mjs';

export function registerHooks() {
  Hooks.on('getProseMirrorMenuItems', (el, items) => adjustProseMenuItems(items));
  Hooks.on('renderChatMessageHTML', renderChatMessageHTML);
  Hooks.on('updateCombat', combat.onCombatUpdate);
}

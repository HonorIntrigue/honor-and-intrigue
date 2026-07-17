import { systemID } from '../constants.mjs';

/**
 * All system keybindings.
 */
function keybindings() {
  return {
    openPartySheet: {
      name: 'HONOR_INTRIGUE.KEYBINDING.OpenPartySheet',
      editable: [{ key: 'KeyP' }],
      onUp: async () => {
        const party = game.actors.party;
        if (!party) return false;

        const { sheet } = party;
        if (sheet.rendered) {
          if (sheet.minimized) {
            sheet.maximize();
          } else {
            sheet.close();
          }
        } else {
          sheet.render(true);
        }
      },
    },
  };
}

/**
 * Helper function to register keybindings.
 */
export function registerKeybindings() {
  for (const [key, value] of Object.entries(keybindings())) {
    game.keybindings.register(systemID, key, value);
  }
}

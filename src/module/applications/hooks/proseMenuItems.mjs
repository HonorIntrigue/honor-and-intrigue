/**
 * Call to change the menu items in a prose-mirror element.
 * @param {ProseMirrorMenuItem[]} items
 */
export function adjustProseMenuItems(items) {
  items.push({
    action: 'adjust-height',
    cssClass: 'right',
    icon: '<i class="fa-solid fa-plus-minus"></i>',
    scope: '', // equivalent to BOTH (HTML, Text)
    title: 'HONOR_INTRIGUE.Actor.Sheet.Tooltips.AdjustProseSize',
  });
}

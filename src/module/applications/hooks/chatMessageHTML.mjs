/**
 * A hook that fires for each ChatMessage rendered to the chat log. This hook allows the message HTML to be adjusted
 * before it is added to the log.
 * @param {ChatMessage} message The message being rendered.
 * @param {HTMLElement} html The pending HTML.
 * @param {Record<string, any>} context
 */
export async function renderChatMessageHTML(message, html, context) {
  if (message.system.alterMessageHTML instanceof Function) {
    await message.system.alterMessageHTML(html);
  }

  if (message.system.addListeners instanceof Function) {
    await message.system.addListeners(html);
  }
}

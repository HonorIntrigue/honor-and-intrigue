/**
 * A utility method to get a list of unique actors from a list of tokens.
 * @param {Token[]} [tokens] The list of tokens, or empty to use the list of controlled tokens on the canvas.
 */
export function tokensToActors(tokens) {
  tokens ??= canvas?.tokens?.controlled ?? [];
  const actors = tokens.map(token => token.actor).filter(_ => _);

  return new Set(actors);
}

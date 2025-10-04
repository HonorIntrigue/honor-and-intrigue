/**
 * @import Document from "@common/abstract/document.mjs";
 * @import { Constructor } from "@common/_types.mjs";
 */

/**
 * Mixin for common functions used across most or all document classes in this system.
 * Requires the document to have a `system` field.
 * @template {Constructor<Document>} BaseDocument
 * @param {BaseDocument} base
 */
export default base => {
  // eslint-disable-next-line @jsdoc/require-jsdoc
  return class BaseDocumentMixin extends base {
  };
};

import BaseDocumentMixin from './base-document-mixin.mjs';

export default class HonorIntrigueActor extends BaseDocumentMixin(foundry.documents.Actor) {
  /** @inheritDoc */
  static migrateData(data) {
    return super.migrateData(data);
  }
}

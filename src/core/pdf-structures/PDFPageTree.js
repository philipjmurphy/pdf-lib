/* @flow */
/* eslint-disable prefer-destructuring */
import _ from 'lodash';

import { PDFDictionary, PDFIndirectObject } from '../pdf-objects';
import { PDFPage } from '.';
import { validate, isIndirectObjectOf } from '../../utils/validate';

import type { Predicate } from '../../utils';

export type Kid = PDFPageTree | PDFPage;

class PDFPageTree extends PDFDictionary {
  static validKeys = Object.freeze(['Type', 'Parent', 'Kids', 'Count']);

  static from = (object: PDFDictionary): PDFPageTree =>
    new PDFPageTree(object, PDFPageTree.validKeys);

  get kids(): Kid[] {
    return Object.freeze(this.get('Kids').object.map(kid => kid.pdfObject));
  }

  findMatches = (predicate: Predicate<Kid>) => {
    const matches = [];
    this.traverse(kid => {
      if (predicate(kid)) matches.push(kid);
    });
    return Object.freeze(matches);
  };

  addPage = (page: PDFIndirectObject<PDFPage>) => {
    validate(
      page,
      isIndirectObjectOf(PDFPage),
      'PDFPageTree.addPage() required argument to be of type PDFIndirectObject<PDFPage>',
    );
    this.get('Kids').object.push(page);
    return this;
  };

  traverse = (visit: Kid => any) => {
    this.kids.forEach(kid => {
      visit(kid);
      if (kid.is(PDFPageTree)) kid.traverse(visit);
    });
    return this;
  };

  // ascend = (lookup: (PDFIndirectObject<Kid>) => Kid) => {
  //   if (!this.get('Parent')) return;
  //   lookup(this.get('Parent')).ascend(lookup);
  // };
  ascend = (visit: Kid => Kid) => {
    if (!this.get('Parent')) return;
    visit(this.get('Parent'));
    this.get('Parent').pdfObject.ascend(visit);
  };
}

export default PDFPageTree;
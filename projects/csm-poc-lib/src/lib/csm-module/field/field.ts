import {Node} from './node';
import {Element} from './element';


export class Field extends Node {
  elements: any;

  constructor(field, parent, options = null) {
    super(field, parent, options);

    if ((this.properties.fieldType === 'checkBoxField' ||
        this.properties.fieldType === 'selectField' ||
        this.properties.fieldType === 'radioField') && !this.properties.elements) {
        this.properties.elements = Array<Element>();
    }

    if (this.properties.value === undefined) {
      this.properties.value = '';
      if (
        (this.properties.fieldType === 'checkBoxField' && this.properties.elements.length > 1) ||
        (this.properties.fieldType === 'selectField' && this.properties.multiple)
      ) {
        if (this.properties.elements && this.properties.elements.length > 0) {
          for (let i = 0; i < this.properties.elements.length; i++) {
            if (this.properties.elements[i].properties.state === undefined) {
              this.properties.elements[i].properties.state = false;
            }
          }
        }
      }
    }
  } // end constructor

  getElement(elementUUID) {
    return this.getRootSchema().getNodeById(elementUUID);
  }

  getNext() {
    // built by Application.decorateIndexes()
    return (<any>this).getNextField();
  }

  getPrevious() {
    // built by Application.decorateIndexes()
    return (<any>this).getPreviousField();
  }

  getSectionUUID() {
    if (this._parent) {
      return this._parent.id;
    }
    return null;
  }

  toJSON( ) {
    return super.toJSON([]);
  }

}

Node.register('field', Field);

import {Injectable} from '@angular/core';
import {Field} from '../../model-module/models';
import {CoreInterfaceService} from '../../essentials-module/services/core-interface.service';
import has = Reflect.has;
import {Properties} from '../../core-module/enums/properties.enum';
import {FieldType} from '../../essentials-module/model/enums/field-type.enum';
import {Element} from '../../model-module/models/element';
import * as moment from 'moment';
import { Subject } from 'rxjs';
import { AddressGroup } from '../../essentials-module/components/field-types_r/address/address-group';

@Injectable({
  providedIn: 'root'
})

/**
 * @description
 *   services to 1)validate  2)interface with Forms-UI
 */
export class DataService {
  commands = ['yes', 'no', 'next', 'previous'];
  alertValueChangeViaLucy$ = new Subject<any>();
  addressGroup: AddressGroup;

  constructor(private coreInterfaceService: CoreInterfaceService) {
  }

  /**
   * @description
   *   some of the UI html elements rely on key press
   *   and need a bit more massaging before values are emitted to the back end.
   * @param field
   * @param newValue
   */
  public processValueChange(field: Field, newValue: string): boolean {
    const self = this;
    if ('REVERT' === newValue.toUpperCase()) {
      return self.revertChanges(field, newValue);
    }

    switch (field.properties.fieldType) {

      case FieldType.TEXT: {
        console.log(`Processing TEXT Field Value Updates: ${newValue}`);
        return self.updateTextBoxChanges(field, newValue);
        break;
      }
      case FieldType.CURRENCY: {
        console.log(`Processing CURRENCY Field Value Updates: ${newValue}`);
        self.updateTextBoxChanges(field, newValue);
        break;
      }
      case FieldType.NUMBER: {
        console.log(`Processing NUMBER Field Value Updates: ${newValue}`);
        self.updateTextBoxChanges(field, newValue);
        break;
      }
      case FieldType.SELECT: {
        console.log(`Processing SELECT Field Value Updates: ${newValue}`);
        self.updateSelectBoxChanges(field, newValue);
        break;
      }
      case FieldType.DATE: {
        console.log(`Updating a DATE: ${newValue}`);
        return self.updateDateField(field, newValue);
        break;
      }
      case FieldType.RADIO: {
        console.log(`Updating a RADIO field: ${newValue}`);
        self.coreInterfaceService.emitFieldValueChange(field, newValue);
        break;
      }
      case FieldType.SINGLE_CHECKBOX: {
        console.log(`Updating a SINGLE checkbox field: ${newValue}`);
        self.updateSingleCheckBoxChange(field, newValue);
        break;
      }
      case FieldType.CHECKBOX: {
        console.log(`Updating a CHECKBOX field: ${newValue}`);
        self.coreInterfaceService.emitFieldValueChange(field, newValue);

        break;
      }
      default: {
        self.coreInterfaceService.emitFieldValueChange(field, newValue);
        break;
      }
    }
    return true;
  }


  /**
   * Client Side validation
   *  pre-validate before sending over value changes
   *  to catch un-intended value updates while speaking
   */
  public preValidate(field: Field, newValue: string): boolean {
    const self = this;

    const hasFormatting = has(field.properties, Properties.FORMAT);
    const hasMinLength = has(field.properties, Properties.MIN_LENGTH);
    const hasMaxLength = has(field.properties, Properties.MAX_LENGTH);

    if (hasFormatting) {
      if (newValue.length > field.properties.format.length) {
        console.warn(`Field: ${field.properties.title}   Value: ${newValue}   Required Format: ${field.properties.format}`);
        return false;
      }
    }
    if (hasMinLength) {
      if (newValue.length < field.properties.minLength) {
        return false;
      }
    }
    if (hasMaxLength) {
      if (newValue.length > field.properties.maxLength) {
        return false;
      }
    }
    return true;
  }

  revertChanges(field: Field, newValue: string): boolean {
    const self = this;
    if (field.properties.previousValueData) {
      const previousValue = field.properties.previousValueData.value;
      if (previousValue) {
        newValue = previousValue;
        // console.log(`Revert value back to this value: ${previousValue}`);
        self.coreInterfaceService.emitFieldValueChange(field, newValue);
      }
      return true;
    }
  }


  private updateTextBoxChanges(field: Field, newValue: string): boolean {
    const self = this;
    if (self.commands.includes(newValue)) {
      console.log(`${newValue} - is a voice command, not a valid value.`);
      return false;
    } else {
      // note - address group will update within the component after verification via SmartStreets
      if (!has(field.properties, 'addressGroup')) {
        self.coreInterfaceService.emitFieldValueChange(field, newValue);
      }
      self.alertValueChangeViaLucy$.next({field: field, value: newValue});
      return true;
    }
  }


  /**
   * @description
   *   parses thru elements matches voice to title and
   *   if a match is found - we emit the key value for persistence.
   * @param field
   * @param newValue
   */
  private updateSelectBoxChanges(field: Field, newValue: string): boolean {
    const self = this;
    let updated = false;

    // try to match exactly
    field.properties.elements.filter((option: Element) => {
      if (newValue.toUpperCase() === option.properties.title.toUpperCase() || newValue.toUpperCase() === option.properties.value.toUpperCase()) {
        self.coreInterfaceService.emitFieldValueChange(field, option.properties.value);
        updated = true;
      }
    });

    // if you make it here -- then try to match the first 2 digits (mail === male)
    if (!updated) {
      field.properties.elements.filter((option: Element) => {
        if (newValue.substring(0, 2).toUpperCase() === option.properties.title.substring(0, 2).toUpperCase()) {
          self.coreInterfaceService.emitFieldValueChange(field, option.properties.value);
          updated = true;
        }
      });
    }
    return updated;
  }

  private updateSingleCheckBoxChange(field: Field, newValue: string): boolean {
    const self = this,
      upperCaseValue = newValue.toUpperCase();

    if (upperCaseValue === 'YES' || upperCaseValue === 'TRUE' || upperCaseValue === 'CHECK') {
      field.properties.value = field.properties.elements[0].properties.value;
      self.coreInterfaceService.emitFieldValueChange(field, field.properties.elements[0].properties.value);
    } else if (upperCaseValue === 'NO' || upperCaseValue === 'FALSE' || upperCaseValue === 'UNCHECK') {
      field.properties.value = null;
      self.coreInterfaceService.emitFieldValueChange(field, null);
    }
    return true;
  }


  public updateDateField(field: Field, newValue: string): boolean {
    const self = this;
    const formattedDate = self.convertDate(newValue);
    field.properties.value = formattedDate;
    self.coreInterfaceService.emitFieldValueChange(field, formattedDate);
    return true;
  }


  /**
   * @todo -- need a STRONG jira ticket to work all possible dates.
   *
   *   01 01 1900     formatting works
   *   01 - 01 - 1800 formatting works
   *   01 / 01 / 1900 works
   *   August 01 1988 works BUT lucy keeps adding st and goofs it up.
   * @param newValue
   */
  convertDate(newValue: string): string {
    let prunedDate = newValue.replace(/\-/g, '/');
    prunedDate = prunedDate.replace(/\:/g, '/');
    prunedDate = prunedDate.replace(/\s/g, '');

    if (prunedDate && prunedDate.indexOf('/') < 0) {
      prunedDate = prunedDate.substring(0, 2) + '/' + prunedDate.substring(2, 4) + '/' + prunedDate.substring(4, 10);
    }
    try {
      // prunedDate = moment(prunedDate).format('mmm/dd/yyyy');
      prunedDate = moment(prunedDate).toISOString(true);
    } catch (e) {
      console.log(newValue + ' could not be processed.');
    }

    if (prunedDate) {
      return prunedDate;
    }


    let longMonth = '';
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];

    months.filter(month => {
      if (newValue.indexOf(month) === 0) {
        longMonth = newValue.replace(month, month.substring(0, 3));
        prunedDate = moment(prunedDate).format('mmm/dd/yyyy');
        longMonth = moment(longMonth).toISOString(true);
        return longMonth;
      }
    });
    return;
  }
}

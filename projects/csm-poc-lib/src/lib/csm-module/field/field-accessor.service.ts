import {Injectable} from '@angular/core';
import {FieldAccessorInterface} from '../field-accessor.interface';
import {SchemaPointer} from '../../model/schema.pointer';
import {StateService} from '../../../core-module/services/state/state.service';
import {FormState} from '../../../core-module/models/FormState';
import {NodeStats} from '../../../essentials-module/components/progress-indicators/node-stats';
import {ErrorService} from '../../../core-module/services/utils/error.service';
import {MessageType} from '../../../core-module/enums/message-type.enum';
import {CoreError} from '../../../core-module/models/CoreError';
import {isNull, isUndefined, has} from 'lodash';
import {Subscription} from 'rxjs';
import {DataService} from '../../services/data.service';
import {Field} from '../../../model-module/models';
import {FieldType} from '../../../essentials-module/model/enums/field-type.enum';


@Injectable({
    providedIn: 'root'
})

/**
 * @description
 *     FieldAccessorService -- provides basic methods
 *     to traverse fields and gather properties.
 */
export class FieldAccessorService implements FieldAccessorInterface {

    formState: FormState;
    schemaPointer: SchemaPointer;
    resetValue: string;
    formStateSubscription: Subscription;

    private convertType = {
        'Social Security number': 'Number',
        'Date of birth': 'Datetime',
        'Email address': 'Email',
        'Cell/Other phone number': 'Phone',
        'ZIP Code': 'Number',
        'Yearly gross salary': 'Currency',
        'Potential yearly bonus': 'Currency',
        'Monthly gross salary': 'Currency',
        'Number of deductions': 'Number',
        'Social Security tax': 'Currency',
        'Medicare tax': 'Currency',
        'Federal tax': 'Currency',
        'Net pay (per month)': 'Currency',
        'Net pay (per year)': 'Currency',
        'Form I-94 admission number': 'Number',
        'Foreign passport number': 'Number',
        'Expiration date': 'Datetime',
        'Contribution amount per pay period': 'Currency',
        'Document number': 'Number'
    };



    private convertRegEx = {
        'Social Security number': [{'regex': /^\d{9}$/}],
        'Date of birth': [{'regex': /^\d{2}\/\d{2}\/\d{4}$/}],
        'Email address': [{'regex': /([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})/}],
        'First name': [{'pos': `/NNP/`, 'regex': /\w/}],
        'Middle name': [{'pos': `/NNP/`, 'regex': /\w/}],
        'Last name': [{'pos': `/NNP/`, 'regex': /\w/}],
        'Cell/Other phone number': [{'regex': /^\d{10}$/}],
        'ZIP Code': [{'regex': /^\d{5}$/}],
        'Yearly gross salary': [{'regex': /^\$?[0-9]+\.?[0-9]*$/}],
        'Potential yearly bonus': [{'regex': /^\$?[0-9]+\.?[0-9]*$/}],
        'Monthly gross salary': [{'regex': /^\$?[0-9]+\.?[0-9]*$/}],
        'Number of deductions': [{'regex': /^\d{1,2}$/}],
        'Social Security tax': [{'regex': /^\$?[0-9]+\.?[0-9]*$/}],
        'Medicare tax': [{'regex': /^\$?[0-9]+\.?[0-9]*$/}],
        'Federal tax': [{'regex': /^\$?[0-9]+\.?[0-9]*$/}],
        'Net pay (per month)': [{'regex': /^\$?[0-9]+\.?[0-9]*$/}],
        'Net pay (per year)': [{'regex': /^\$?[0-9]+\.?[0-9]*$/}],
        'Form I-94 admission number': [{'regex': /^\d{1,11}$/}],
        'Foreign passport number': [{'regex': /^\d{1,9}$/}],
        'Expiration date': [{'regex': /^\d{2}\/\d{2}\/\d{4}$/}],
        'Country of issuance': [{'regex': /[\w\s]+/}],
        'Contribution amount per pay period': [{'regex': /^\$?[0-9]+\.?[0-9]*$/}],
        'Document number': [{'regex': /^\d{9}$/}]
    };

    constructor(private stateService: StateService, private dataService: DataService, private errorService: ErrorService) {
        this.init();
    }

    init() {
        const self = this;
        self.listenForFormStateChanges();
        if (self.formState) {
            self.schemaPointer = new SchemaPointer(self.formState.getApplication(), self.formState.getApplicationInstanceId());
            self.listenForServerValidationErrors();
        }
    }

    destroy() {
        if (this.formStateSubscription) {
            console.log('Clean Up Section State Observable... ');
            this.formStateSubscription.unsubscribe();
        }
    }

    /**
     * @description
     *  listens for formState changes and re-sets
     *  the instance variable.
     */
    private listenForFormStateChanges() {
        const self = this;
        self.stateService.currentState$.subscribe((formState_: FormState): void => {
            self.formState = formState_;
            const activeField = self.formState.getActiveField();
            if (!self.schemaPointer) {
                self.init();
            } else if (!isNull(activeField) && !isUndefined(activeField) && activeField.id !== self.schemaPointer.getActiveField().id) {
                // adjust pointer back to the active field and update references;
                // console.log(`Heard state change - adjusting schema pointer to this active field:  ${activeField.properties.title} `);
                // console.log(`The value of the ${activeField.properties.title} is ${activeField.properties.value}`)
                self.schemaPointer.setUpActiveReferences(activeField);
            }
        }, (error) => {
            console.warn('An exception has been caught listening for form-state changes.');
        });
    }

    /**
     * @description
     *  listen for server-side generated validation error.
     *  .properties.validationError
     */
    listenForServerValidationErrors() {
        const self = this;
        const activeField = self.schemaPointer.getActiveField();
        self.errorService.validationErrors$.subscribe((error: CoreError) => {
            const hasNodeError = activeField.id === error.data.node;
            if (hasNodeError) {
                const errCode = error.data.errCode;
                if (errCode === MessageType.VALIDATION_ERROR) {
                    self.schemaPointer.setActiveFieldValidationError(error.data.messages.toString());
                }
            }
        });
    }


    /**
     * @description
     * POINTER to first field in a
     * SECTION
     */
    first(): boolean {
        const self = this;
        console.log('FIRST FIELD was called');
        if (!self.schemaPointer) {
            return false;
        }
        return self.schemaPointer.setFirstField();
    }

    /**
     * @description
     * POINTER to last field in a
     * SECTION
     */
    last(): boolean {
        const self = this;
        console.log('LAST FIELD was called');
        if (!self.schemaPointer) {
            return false;
        }
        return self.schemaPointer.setLastField();
    }

    /**
     * Find a field by it title
     * @param title
     */
    find(title: string, index: number = 0): boolean {
        let retVal = false;
        const self = this;
        if (title && self.stateService.getCurrentApplication()) {
            const fields = self.stateService.getCurrentApplication().getNodesByTitle(title);
            if (!fields) {
                return retVal;
            }
            const isDisabled = fields[index].properties.disabled;
            const isHidden = fields[index].properties.hidden;
            if (!isDisabled && !isHidden) {
                self.schemaPointer.setUpActiveReferences(fields[index]);
                retVal = true;
            }
            return retVal;
        } else {
            return retVal;
        }
    }



    next(): boolean {
      const self = this;
      console.log('NEXT FIELD was called');
      if (!self.schemaPointer) {
          return false;
      }
      return self.schemaPointer.setNextField();
    }

    previous(): boolean {
      const self = this;
      console.log('PREVIOUS FIELD was called');
      if (!self.schemaPointer) {
          return false;
      }
      return self.schemaPointer.setPreviousField();
    }

    /**
     * @description
     *   update the UI section to what we
     *   have in the pointer.
     */
    public focus(): void {
      const self = this;
      if (!self.schemaPointer) {
          return;
      }
      self.stateService.setUpActiveReferences(self.schemaPointer.getActiveField());
      console.log(`Focus set to this Field:  ${self.schemaPointer.getActiveField().properties.title}`);
    }

    public focusStakeholder(): void {
        const self = this;
        if (!self.schemaPointer) {
            return;
        }
        self.stateService.setUpActiveReferences(self.schemaPointer.getActiveStakeholder());
        console.log(`Focus set to this Stakeholder:  ${self.schemaPointer.getActiveStakeholder().properties.title}`);
    }

    getHelp(): string {
        const self = this;
        return self.schemaPointer.getActiveField().properties.description;
    }

    getHint(): string {
        const self = this;
        if (!self.schemaPointer) {
            return '';
        }
        return self.schemaPointer.getActiveField().properties.description;
    }

    /**
     * @description
     *   returns the titles of the elements available
     *   in a select/radio/multi checkbox fields
     */
    getList(): Array<string> {
        const self = this;
        if (!self.schemaPointer) {
            return [];
        }
        const elementTitles = new Array<string>();
        const activeField = self.schemaPointer.getActiveField();
        for (const element of activeField.properties.elements) {
            elementTitles.push(element.properties.title);
        }
        return elementTitles;
    }

    getTitle(): string {
        const self = this;
        if (!self.schemaPointer) {
            return '';
        }
        return self.schemaPointer.getActiveField().properties.title;
    }

    getType(): string {
        const self = this;
        if (!self.schemaPointer) {
            return '';
        }
        return self.schemaPointer.getActiveField().properties.fieldType;
    }

    getUUID(): string {
        const self = this;
        if (!self.schemaPointer) {
            return '';
        }
        return self.schemaPointer.getActiveField().id;
    }

    getValue(): string {
        const self = this;
        if (!self.schemaPointer) {
            return '';
        }
        return self.schemaPointer.getActiveField().properties.value;
    }


    /**
     * @description
     *   returns true if field is complete
     *   (including documenets)
     */
    isComplete(): boolean {
        const self = this;
        if (!self.schemaPointer) {
            return false;
        }
        const activeField = self.schemaPointer.getActiveField();
        const nodeStats = new NodeStats(self.schemaPointer.getApplicationInstanceId(), activeField);
        return nodeStats.chartData.percentageCompleted === 100;
    }

    isEditable(): boolean {
        const self = this;
        if (!self.schemaPointer) {
            return false;
        }
        const activeField = self.schemaPointer.getActiveField();
        return !activeField.properties.disabled;
    }

    isPrivate(): boolean {
        const self = this;
        if (!self.schemaPointer) {
            return false;
        }
        const activeField = self.schemaPointer.getActiveField();
        return !activeField.properties.hidden;
    }

    isRequired(): boolean {
        const self = this;
        if (!self.schemaPointer) {
            return false;
        }
        const activeField = self.schemaPointer.getActiveField();
        return activeField.properties.required;
    }

    hasElements(): boolean {
      const self = this,
        activeFieldType = self.schemaPointer.getActiveField().properties.fieldType,
        elementFieldTypes = [FieldType.SELECT, FieldType.RADIO, FieldType.CHECKBOX]; // exclude single checkbox for now as the field title may be hidden

      let hasElements = false;
      if (elementFieldTypes.indexOf(activeFieldType) > -1) {
        hasElements = true;
      }
      return hasElements;
    }

    reset(): boolean {
        const self = this;
        if (!self.schemaPointer) {
            return false;
        }
        const activeField = self.schemaPointer.getActiveField();
        if (activeField.properties.resetValue) {
            activeField.properties.value = activeField.properties.resetValue;
            return true;
        }
        return false;
    }

    selectByUUID(uuid: string): boolean {
        const self = this;
        if (!self.schemaPointer) {
            return false;
        }
        const application = self.schemaPointer.getApplication();
        const field = application.getNodeById(uuid);
        self.schemaPointer.setUpActiveReferences(field);
        return true;
    }

    public setValue(fieldTitle: string, value: string): void {
        const self = this;
        if (!self.schemaPointer) {
            return;
        }
        const application = self.schemaPointer.getApplication();
        const field = application.getNodesByTitle(fieldTitle)[0];

        console.log(`${field.properties.title} value will be set to: ${value}`);
        self.dataService.processValueChange(field, value);
    }

    public revertValue(value: string): void {
        const self = this,
            activeField = self.schemaPointer.getActiveField();
        if (!value || value === 'previous' || value === 'value') {
            value = activeField.properties.previousValueData.value;
        }
        self.dataService.processValueChange(activeField, value);
    }

    /**
         * Return validation parameters for focussed control.
         *
         * @returns validation parameters, or null to not validate
         */
    public getValidationParameters(): any {

        let result = null;

        if (this.schemaPointer) {
            const activeField = this.schemaPointer.getActiveField();
            let type = activeField.properties.valueData.valueType;
            const title = activeField.properties.title;
            const alternateType = this.convertType[title];
            if (alternateType) {
                type = alternateType;
            }

            // Update regex for control
            let regEx = this.convertRegEx[title];
            if (!regEx && activeField.properties.speechValidationRegExp) {
              regEx = [new RegExp(activeField.properties.speechValidationRegExp)];
            }

            result = {
                type: type,
                regEx: regEx
            };
            console.log('result   ', result);
        }

        return result;
    }

    /**
    * @function validateSpeech
    * @description we need to get only the speech validated here and THEN
    * to the validate function below.
    */
    public validateSpeech(speech: string): boolean {
        let result = false;

        if (this.schemaPointer) {
            const activeField = this.schemaPointer.getActiveField();
            result = this.validate(activeField, speech);
        }

        return result;
    }

    public validate(targetNode: Field, speech: string, allowInvalid: boolean = false): boolean | null {
        // Initialize result
        let result = allowInvalid;

        // Check speech against regular expression
        let regularExpression = targetNode.properties.speechValidationRegExp;
        if (regularExpression) {

            if (regularExpression === '\\d{9}') {
                regularExpression = '\\d{9}|[\\d\\s]{17}';
            }

            const expression = new RegExp(regularExpression);
            const text = speech.toUpperCase().trim();
            result = text.match(expression) != null;
            console.log(text + ' against ' + regularExpression + ': ' + result);
        }

        return result;
    }

    public setValueOfActiveField(value: string): void {
        const self = this;
        if (!self.schemaPointer) {
            return;
        }

        // Check if field is writable
        if (this.activeFieldIsWritable()) {
            const activeField = self.schemaPointer.getActiveField();
            // field.properties.value = value;
            console.log(`${activeField.properties.title} value will be set to: ${value}`);
            self.dataService.processValueChange(activeField, value);
        }
    }

    /**
     * @description if field's properties.disabled is true - do not allow value setting
     * @author Ramsey
     * @returns {boolean}
     */
    public activeFieldIsWritable(): boolean {
      let isWritable = true;
      const activeField = this.schemaPointer.getActiveField();
      if (activeField.properties.disabled) {
        isWritable = false;
      }
      return isWritable;
    }

    getError(): string {
        const self = this;
        if (!self.schemaPointer) {
            return '';
        }
        const activeField = self.schemaPointer.getActiveField();
        return activeField.properties.validationError;
    }

    hasError(): boolean {
        const self = this;
        if (!self.schemaPointer) {
            return false;
        }
        const activeField = self.schemaPointer.getActiveField();
        return !!activeField.properties.validationError;
    }


}

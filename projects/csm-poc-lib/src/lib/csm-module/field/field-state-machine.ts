import {Injectable} from '@angular/core';
import {random} from 'lodash';
import {each} from 'lodash';
import {StateMachine} from '../state-machine/state-machine';
import {CSMService} from '../engine/csm.service';
import {FieldAccessorService} from './field-accessor.service';
import {LucyQandAService} from '../services/lucy-q-and-a.service';
import {FieldValidateObject} from '../services/mssql-connect.service';
import {Field} from './field';
import {FormState} from './FormState';

@Injectable()
/**
 * @Description
 *   Listens for VOICE Navigational and VALUE  Commands for Fields.
 *   When VOICE commands are heard - we engage the Field-Accessor service
 *   to traverse us through the schema and UPDATE the UI.
 *   ENGAGES WEBSOCKET CALLS
 *
 *   FieldMachine -> FieldAccessor -> CoreInteface and FormState -> UI is updated.
 */
export class FieldStateMachine extends StateMachine {
    stakeHolderMessage: string;
    stakeHolderWarningResult: Function;
    dependencyMessage: string;
    fieldValidateResults: FieldValidateObject;

    constructor(
        private _csmService: CSMService,
        private fieldAccessorService: FieldAccessorService,
        private lucyQandAService: LucyQandAService
    ) {
        super(_csmService);
        // console.log('Field Machine has been registered with State Machine Base Class.');
    }

    public getName(): string {
        return 'Field State Machine';
    }
  /**
   * Sets Value of Active Field
   *
   *
   */
  private setValueOfActiveField(speech: string): void {
    console.log('inside of here');
    // Do find
    // if active field is a select, radio, or checkbox the user is probably trying to set the value, not find the value by title
    const activeFieldHasElements = this.fieldAccessorService.hasElements();
    if (this.fieldAccessorService.find(speech) && !activeFieldHasElements) {
      this.fieldAccessorService.focus();
    } else if (!this.fieldAccessorService.activeFieldIsWritable()) {
      this.rejectCommand(); // active field is disabled, user has no WRITE permissions
    } else {
      this.regexPosValidation(speech);
    }
  }

  /**
   * Checks against the regex and pos validation
   * nlp-service used for pos validation
   *
   */
  public regexPosValidation (speech: string): void {
    // Check each qualifier. They must all pass
    const validationParams = this.fieldAccessorService.getValidationParameters();
    let value = this._CSMService.getUtilVoiceService().convertToType(speech, validationParams.type);
    const regEx = validationParams.regEx;
    let validated = true;
    if (regEx) {
      for (let i = 0; validated && i < regEx.length; i++) {
        const posExpression = regEx[i].pos;
        const regexExpression = regEx[i].regex;
        // Validate field against Parts of Speech
        if (posExpression) {
          this.lucyQandAService.postcsmField( 'abcde ' + value + ' abcde', 'abcde ' + posExpression + ' abcde').subscribe(
            (res) => {
              this.fieldValidateResults = res;
              validated =  this.fieldValidateResults.result;
              value = value.toLowerCase().trim();
              this.finishValidation(validated, value);
            },
            error => {
              console.log('SpeechError:', error);
              return error;

            });
        } else if (!posExpression && regEx) {
          // Validate against regular expressions
          const regularExpression = new RegExp(regEx[i].regex);
          value = value.toLowerCase().trim();
          validated = value.match(regularExpression) != null;
          this.finishValidation(validated, value);
          if (!validated) {
            validated = value.toUpperCase().match(regularExpression) != null;
            this.finishValidation(validated, value);
          }
        }
      }
    } else {
        // No validation brought in - will do immediate insert into field
        this.finishValidation(validated, value);
    }
  }

  /**
   * Finishes validation
   *
   */
  public finishValidation(validated: boolean, value: string): void {
    // Try to enter speech into field
    if (validated) {
      value = value.substring(0, 1).toUpperCase() + value.substring(1);
      this.fieldAccessorService.setValueOfActiveField(value);
      this.fieldAccessorService.next();
      this.fieldAccessorService.focus();
    } else {
      this.rejectCommand();
    }
  }
    /**
     * Traverse to next field.
     */
    private next(): void {
        this.fieldAccessorService.next();
        this.focus();
    }

    /**
     * Traverse to next field.
     */
    private previous(): void {
        this.fieldAccessorService.previous();
        this.focus();
    }

    /**
     * Traverse to first field.
     */
    private first(): void {
        this.fieldAccessorService.first();
        this.focus();
    }

    /**
     * Traverse to first field.
     */
    private last(): void {
        this.fieldAccessorService.last();
        this.focus();
    }

    private focus(): void {
        this.fieldAccessorService.focus();
    }

    private attemptSetValue(says: string[]): void {
        const self = this;
        const reTargetToValue = /(?<target>.*)\sto\s(?<value>.*)/; // example: "set first name to Ryan"
        // const reTargetIsValue = /(?<target>.*)\sis\s(?<value>.*)/; // example: "first name is Ryan"
        const reToValue = /to\s(?<value>.*)/; // example "set to Ryan"
        let targetNode = null;
        let value = says[0];
        let matches = null;
        if (self.find(says)) {
            this.fieldAccessorService.focus();
            this.enterState('askForValue');
            return;
        } else if ((matches = reTargetToValue.exec(says[0])) && (<any> matches).groups &&
          (<any> matches).groups.target && (<any> matches).groups.value) {
            const target = (<any> matches).groups.target;
            value = (<any> matches).groups.value;
            const found = self.find([target]); // target is the spoken field-title
            if (!found) {
                return;
            }
        } else if ((matches = reToValue.exec(says[0])) && (<any> matches).groups && (<any> matches).groups.value) {
            value = (<any> matches).groups.value;
        }
        targetNode = self.fieldAccessorService.schemaPointer.getActiveField();
        if (self.fieldAccessorService.validate(targetNode, value, true)) {
            self.fieldAccessorService.setValue(targetNode.properties.title, value);
            self.fieldAccessorService.next();
            this.fieldAccessorService.focus();
        }
    } // end attemptSetValue

    private setValue(says: string[]): void {
        const value = says[0];
        const fieldTitle = this.fieldAccessorService.schemaPointer.getActiveField().properties.title;
        this.fieldAccessorService.setValue(fieldTitle, value);
    }

    private getAskForValueRespose(): string {
        const msgOptions = [
            `What would you like to change it to?`,
            `Okay, what am I changing it to?`,
            `Absolutely, and what are we going to change it to?`
        ];
        return msgOptions[random(0, 2, false)];
    }

    private revertValue(value) {
        console.log('\tLucy is reverting a value: ' + value);
        this.fieldAccessorService.revertValue(value);
    }

    private getValue(): void {
        let fieldValue = '';
        let fieldName = '';
        fieldName = this.getTitle();
        fieldValue = this.fieldAccessorService.getValue();
        this.speak(`The value of '${fieldName}' field is '${fieldValue}'`);
    }

    /**
     * @description returns current Field Title.
     */
    private getTitle(): string {
        console.log('The title is ' + this.fieldAccessorService.getTitle());
        return this.fieldAccessorService.getTitle();
    }


    /**
     * @description
     */
    private selectNextIncompleteField(): boolean {
        let hasAnotherField = true;
        while (this.fieldAccessorService.isComplete() && hasAnotherField) {
            hasAnotherField = this.fieldAccessorService.next();
        }

        this.fieldAccessorService.focus();
        return hasAnotherField;
    }


    private find(says: string[]): boolean {
        let result = false;
        if (this.fieldAccessorService) {
            result = this.fieldAccessorService.find(says[0]);
            if (result) {
                this.fieldAccessorService.focus();
            }
        }
        return result;
    }

    private selectByUUID(uuid: string): void {
        this.fieldAccessorService.first();
        let anotherComponent = true;
        while (uuid !== this.fieldAccessorService.getUUID() && anotherComponent) {
            anotherComponent = this.fieldAccessorService.next();
        }
        this.fieldAccessorService.focus();
    }


    /**
     * Select next field.
     */
    private selectNextField(): boolean {
        // Find next field that is incomplete
        let hasAnotherField = true;
        while (this.fieldAccessorService.isComplete() && hasAnotherField) {
            hasAnotherField = this.fieldAccessorService.next();
        }

        // Set focus
        this.fieldAccessorService.focus();

        // Return if this is the last field
        return hasAnotherField;
    }

    /**
     * Spell contents of field.
     *
     * @param spellMilitary - true if military spelling should be used
     */
    private spell(spellMilitary: boolean): void {
        let military = {};
        military = {
            'a': 'alpha',
            'b': 'bravo',
            'c': 'charlie',
            'd': 'delta',
            'e': 'echo',
            'f': 'foxtrot',
            'g': 'golf',
            'h': 'hotel',
            'i': 'india',
            'j': 'juliett',
            'k': 'kilo',
            'l': 'lima',
            'm': 'mike',
            'n': 'november',
            'o': 'oscar',
            'p': 'papa',
            'q': 'quebec',
            'r': 'romeo',
            's': 'sierra',
            't': 'tango',
            'u': 'uniform',
            'v': 'victor',
            'w': 'whisky',
            'x': 'xray',
            'y': 'yankee',
            'z': 'zulu',
            '1': 'one',
            '2': 'two',
            '3': 'three',
            '4': 'four',
            '5': 'five',
            '6': 'six',
            '7': 'seven',
            '8': 'eight',
            '9': 'nine',
            '0': 'zero',
            ' ': 'space'
        };

        const value = this.fieldAccessorService.getValue().toLowerCase();
        let speech = '';
        for (let i = 0; i < value.length; i++) {
            let translation = value.charAt(i);
            if (military[translation] && spellMilitary) {
                translation = military[translation];
            }
            if (translation === ' ') {
                translation = 'space';
            }
            speech += ' ' + translation;
        }

        this.speak(speech);
    }

    public showStakeHoldingWarning(field: Field, state: FormState, result: Function): void {
        // Save callback function
        this.stakeHolderWarningResult = result;

        // Prepare fields and data
        let stakeholderFields = new Array<{field: Field, section: Field}>();
        each(field.properties.activeStakeholders, stakeholderFieldId => {

            const stakeholderField: Field = state.getApplication().getNodeById(stakeholderFieldId);
            const stakeholderSection = stakeholderField.getParent();

            stakeholderFields.push({
                field: stakeholderField,
                section: stakeholderSection
            });
        });

        stakeholderFields = stakeholderFields.reverse();

        // Build Lucy text
        this.stakeHolderMessage = '<p>Changing ' + field.properties.title + ' will invalidate the following. Do' +
          ' you still want to change this field?</p><ul><Mute>';
        for (let i = 0; i < stakeholderFields.length; i++) {
            const section = stakeholderFields[i].section.properties.title;
            const title = stakeholderFields[i].field.properties.title;
            this.stakeHolderMessage += `<li>` + section
              + `&nbsp<span class="fas fa-arrow-right"></span>&nbsp;<strong>` + title + `</strong></li>`;
        }
        this.stakeHolderMessage += `</Mute></ul>`;

        // Start StakeHolderWarning state
        this.enterState('StakeHolderWarning');
    }

    private getStakeHolderWarningMessage(): string {
        return this.stakeHolderMessage;
    }

    public showInitialDependencies(components: string[]): void {
        const singular = components.length === 1;
        this.dependencyMessage = 'There ' + (singular ? 'is ' : 'are ') +
          components.length + ' required field' + (singular ? '' : 's') + ' that you must complete to initial:<Mute><br>';
        for (let i = 0; i < components.length; i++) {
            if (components[i].length > 0) {
                this.dependencyMessage += `<a>` + components[i] + `</a>`;
            }
        }
        this.dependencyMessage += '</Mute>';
        // this.dependencyMessage += `</ul>`;
        console.log(this.dependencyMessage);

        // Start StakeHolderWarning state
        this.enterState('InitialDependency');
    }

    public getDependencyMessage(): string {
        return this.dependencyMessage;
    }

}

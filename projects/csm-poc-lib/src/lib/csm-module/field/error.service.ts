import {CoreError} from '../../models/CoreError';
import {Injectable} from '@angular/core';
import {MessageType} from '../../enums/message-type.enum';
import {Subject} from 'rxjs/Subject';
import {ValidationError} from '../../../essentials-module/model/validation-error';

@Injectable({
  providedIn: 'root'
})

export class ErrorService {
  serverError$ = new Subject<CoreError>();
  applicationError$ = new Subject<CoreError>();
  validationErrors$ = new Subject<CoreError>(); // Server Generated Validation Errors
  validationErrorsMessages$ = new Subject< ValidationError > (); // server and client error messages to display below html elements
  sessionAuthenticationErrors$ = new Subject<CoreError>();

  constructor() {
  }

  /**
   * DO NOT UNCOMMENT OUT THESE MESSAGE BELOW UNLESS YOU WANT SOCKET BLOW UPS AGAIN
   * ------------------------------------------------------------------------------
   * Process errors to display on the appropriate Observables back to client
   * @params {CoreError} coreError
   */
  errorHandler(coreError: CoreError) {

    const self = this;

    switch (coreError.errorType) {

      case MessageType.SESSION_EXPIRED: {
        self.sessionAuthenticationErrors$.next(coreError);
        break; // session expired
      }

      case MessageType.NOT_AUTHORIZED: {
        self.sessionAuthenticationErrors$.next(coreError);
        break; // not authorized
      }

      case MessageType.APPLICATION_ERROR: {
        self.applicationError$.next(coreError);
        break; // timeouts, bad schema and other core-service processing errors
      }

      case MessageType.SERVER_ERROR: {
        self.serverError$.next(coreError);
        console.warn('A server error was encountered: ' + coreError);
        break; // errors returned by server
      }

      case MessageType.VALIDATION_ERROR: {
        console.log('We have heard a validation error!!' + JSON.stringify(coreError));
        const errorMessage = `${coreError.data.value} ${coreError.errorMessage} `;
        const validationError = new ValidationError(coreError.data.node, errorMessage, coreError.data.value, coreError.data.messages);
        self.setClientValidationError(validationError);
        self.validationErrors$.next(coreError);
      //  console.log(coreError.toString());
        break;
      }

      case MessageType.TYPEDEF_ERROR: {
        const errorMessage = `${coreError.data.value} ${coreError.errorMessage} `;
        const validationError = new ValidationError(coreError.data.node, errorMessage, coreError.data.value, coreError.data.messages);
        self.setClientValidationError(validationError);
        self.validationErrors$.next(coreError);
        break;
      }

      case MessageType.APPLICATION_MODEL: {
        break; // not an error -- deal with this
      }

      case MessageType.APPLICATION_PROPERTY_CHANGE: {
        break; // not an error -- deal with this
      }
    }
  }

  setClientValidationError(validationError: ValidationError) {
    // DO NOT UNCOMMENT OUT THESE MESSAGE BELOW UNLESS YOU WANT SOCKET BLOW UPS AGAIN
    // ------------------------------------------------------------------------------
    // console.log('Set Client Side Validation' + validationError.uuid + validationError.errorMessage );
    this.validationErrorsMessages$.next(validationError);
  }

  clearClientValidationError(uuid: string) {
    // console.log(`Clear validation errors for uuid "${uuid}"`);
    const self = this,
      clearedError = new ValidationError(uuid, null, null, null);
    self.validationErrorsMessages$.next(clearedError);
  }
}

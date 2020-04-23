import {Injectable} from '@angular/core';
import {throwError} from 'rxjs';
import {Subscription} from 'rxjs/Subscription';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {isNullOrUndefined} from 'util';
import {LucyQandAService} from './lucy-q-and-a.service';


export interface LucySpeech {
  originalUserSpeech: string [];
  commandVariant: string;
  matchResults: string[];
  computerDoes: any[];
}

export interface FieldValidateObject {
  result: boolean;
}

@Injectable()
export class MssqlConnectService {

  urlLocation: string;
  lucyHelpLocation: string;
  lucyHelpResultsSubscription = new Subscription();
  public source = new BehaviorSubject<any>(' ');
  public data = this.source.asObservable();
  public answers: string[][];

  constructor(
    private lucyQandAService: LucyQandAService
  ) {
  }

  update(values: any) {
    this.source.next(values);
  }

  // main server REST api


  // getLucyHelpAnswer(question: string[]): any {
  //
  //   // console.log('QUESTION: ', question);
  //   // *************** Uncomment out when needed *********************************
  //   let mydata;
  //   this.lucyHelpResultsSubscription.unsubscribe();
  //   this.lucyHelpResultsSubscription = this.lucyQandAService.getAnswers(question).subscribe(
  //     (response: any) => {
  //
  //       this.answers = response;
  //
  //       if (!isNullOrUndefined(response.length)) {
  //         // console.log('RESPONSE: ', response);
  //         mydata = response;
  //       } else {
  //         // console.log('RESPONSE: ', response);
  //         mydata = 'Sorry, there was no data for your request.';
  //       }
  //       return mydata;
  //     },
  //     (error: any) => {
  //       // console.log('ERROR retrieving LUCY CONTENT: ', error);
  //       return this.handleError = error;
  //     }
  //   );
  // }

  postLucyCommands(commands: string []): any {
    this.lucyQandAService.postcsmCommands(commands).subscribe(
      (response) => {
        return response;
      },
      error => {
        return this.handleError(error);
      }
    );
  }

  public handleError(error: Response | any) {

    let errMsg: string;
    if (error instanceof Response) {
      const body = error || '';
      const err = JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    // console.error(errMsg);
    return throwError(errMsg);
  }
}

import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, Subject, asapScheduler, pipe, of, from, interval, merge, fromEvent, throwError} from 'rxjs';
import {catchError} from 'rxjs/internal/operators';

export const environment = {
  'csmSpeech': 'http://localhost:3200/speech',
  'csmCommands': 'http://localhost:3200/commands',
  'csmField': 'http://localhost:3200/field'
};
@Injectable()
export class LucyQandAService {

  private url: string;
  private originTabNameRequest: string;


  constructor(
    private http: HttpClient
  ) {
    this.originTabNameRequest = '';
  }

  // getAnswers(question: string[]): Observable<any> {
  //   return this.http.get<any>(`${environment.LUCYHELP}/${question}`)
  //     .catch(this.handleError);
  // }


  // define the objects going in and out of this function and then tie it to what's listed in the docs.
  postcsmCommands(commands: string[]): Observable<any> {
    return this.http.post<any>(`${environment.csmCommands}`, commands).pipe(catchError(e => of(e)));
  }

  postcsmSpeech(speech: string[]): Observable<any> {
    return this.http.post<any>(`${environment.csmSpeech}`, speech).pipe(catchError(e => of(e)));
  }

  postcsmField(text: string, regExp: string): Observable<any> {
    return this.http.post<any>(`${environment.csmField}`, {text, regExp}).pipe(catchError(e => of(e)));
  }

  private handleError(error: Response | any) {

    let errMsg: string;
    if (error instanceof Response) {
      const body = error || '';
      const err = JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    console.error(errMsg);
    return throwError(errMsg);  // Removed Observable.throw based on throw is deprecated
  }
}

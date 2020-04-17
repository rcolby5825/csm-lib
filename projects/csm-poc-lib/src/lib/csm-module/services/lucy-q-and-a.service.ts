import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../../environments/environment';
import {throwError} from 'rxjs';

@Injectable()
export class LucyQandAService {

  private url: string;
  private originTabNameRequest: string;


  constructor(
    private http: HttpClient
  ) {
    this.originTabNameRequest = '';
  }

  getAnswers(question: string[]): Observable<any> {
    return this.http.get<any>(`${environment.LUCYHELP}/${question}`)
      .catch(this.handleError);
  }

  postcsmCommands(commands: string[]): Observable<any> {
    return this.http.post<any>(`${environment.csmCommands}`, commands).catch(
      this.handleError);
  }

  postcsmSpeech(speech: string[]): Observable<any> {
    return this.http.post<any>(`${environment.csmSpeech}`, speech).catch(
      this.handleError);
  }

  postcsmField(text: string, regExp: string): Observable<any> {
    return this.http.post<any>(`${environment.csmField}`, {text, regExp}).catch(
      this.handleError);
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

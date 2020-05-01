import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

/*
 * CLASS: FieldHightlightService
 */
@Injectable()
export class FieldHighlightService {

  private _dataSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');

  data$ = this._dataSubject.asObservable();

  public updateActiveField(id: string) {
    this._dataSubject.next(id);
  }

}

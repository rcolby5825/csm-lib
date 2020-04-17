import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

export class DescriptionData {
  public text = '';
  public responses: any[] = [];

  constructor(text: string, responses: any[]) {
    this.text = text;
    this.responses = responses;
  }
}

@Injectable()
export class DescriptionService {

  private _dataSubject: BehaviorSubject<DescriptionData> = new BehaviorSubject<DescriptionData>(new DescriptionData('', []));

  private _speakSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  private _currentDescriptionData: DescriptionData;

  private _userAvatarEnableSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  private _enableSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  data$ = this._dataSubject.asObservable();

  speak$ = this._speakSubject.asObservable();

  enable$ = this._enableSubject.asObservable();

  userAvatarEnable$ = this._userAvatarEnableSubject.asObservable();

  private _debug = false;

  public updateData(data: DescriptionData) {
    if (this._debug) {
      // console.log('Description: Received: ', data.text);
    }
    // this._currentDescriptionData = data;
    this._dataSubject.next(data);
  }

  public getCurrentDescriptionData(): DescriptionData {
    return this._currentDescriptionData;
  }

  public updateSpeak(speak: boolean) {
    this._speakSubject.next(speak);
  }

  public updateEnable(enable: boolean) {
    this._enableSubject.next(enable);
  }

  public updateUserAvatarEnable(enable: boolean) {
    this._userAvatarEnableSubject.next(enable);
  }
}

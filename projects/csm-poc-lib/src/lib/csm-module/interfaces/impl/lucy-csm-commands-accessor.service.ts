import {Injectable} from '@angular/core';
import {Subscription} from 'rxjs';
import {LucyCSMCommandsInterface} from '../lucy-csm-commands.interface';
import {LucyMessageService} from './lucy-message.service';

@Injectable({
  providedIn: 'root'
})

/**
 * @description handles lucy-events of type 'lucy-message' (may handle other event types in future)
 * these come over the INSTANCE websocket (form must be loaded)
 * @note PERSISTENT SOCKET notifications are handled in notification-accessor.service
 * @author Ramsey
 * @export
 * @class LucyEventAccessorService
 * @implements {LucyEventAccessorInterface}
 */
export class LucyCSMCommandsAccessorService implements LucyCSMCommandsInterface {


  private whatPage: string;
  private whatUrl: string;
  private whatMsg: string;

  constructor(
    private lucyMessageService: LucyMessageService
  ) {
  }

  public registerObserver(callBack: Function): Subscription {
    const lucyCSMCallback = (message: string) => {
      // message
      console.log('Callback Message: ', message);
      callBack(message);
    };
    return this.lucyMessageService.lucyMessage$.subscribe(lucyCSMCallback);
  }

  /**
   * @functions setPath and getPath
   * @description setter and getters for PATH/URL
   * @arguments:
   * @param for setPath: String
   * @param for getPath: nothing
   * @returnValue for setPath: nothing
   * @returnValue for getPath: string
   */
  public setPath(whatpath: string): void {
    this.whatUrl = whatpath;
  }
  public getPath(): string {
    return this.whatUrl;
  }

  /**
   * @functions setPage and getPage
   * @description setter and getters for PAGE
   * @arguments:
   * @param for setPage: String
   * @param for getPage: nothing
   * @returnValue for setPage: nothing
   * @returnValue for getPage: string
   */
  public setPage(text: string): void {
    this.whatPage = text;
  }
  public getPage(): string {
    return this.whatPage;
  }

  /**
   * @functions setMessage and getMessage
   * @description setter and getters for MESSAGE
   * @arguments:
   * @param for setMessage: String
   * @param for getMessage: nothing
   * @returnValue for setMessage: nothing
   * @returnValue for getMessage: string
   */
  public setMessage(message: string): void {
    this.whatMsg = message;
  }
  public getMessage(): string {
    return this.whatMsg;
  }

}

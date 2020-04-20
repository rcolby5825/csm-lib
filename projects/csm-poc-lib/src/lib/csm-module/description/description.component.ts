import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {DescriptionData} from './description.service';
import {Subscription} from 'rxjs/Subscription';
import {CSMService} from '../engine/csm.service';
import {ListenService} from '../engine/listen.service';

class UIData {
  public left: any[] = [];
  public center: any[] = [];
  public right: any[] = [];

  constructor(data: any) {
    if (data.length > 0) {
      this.left = data.filter(action => action.placement === 'left').sort(function (a: any, b: any) {
        if (a.index < b.index) {
          return -1;
        } else {
          return 1;
        }
      });
      this.center = data.filter(action => action.placement === 'center').sort(function (a: any, b: any) {
        if (a.index < b.index) {
          return -1;
        } else {
          return 1;
        }
      });
      this.right = data.filter(action => action.placement === 'right').sort(function (a: any, b: any) {
        if (a.index < b.index) {
          return -1;
        } else {
          return 1;
        }
      });
    }
    return this;
  }
}

@Component({
  selector: 'lib-app-description',
  templateUrl: './description.component.html',
  styleUrls: ['./description.component.scss']
})
export class DescriptionComponent implements OnInit, OnDestroy {
  @Input() description = '';
  @Input() uidata: UIData;
  @Input() validLeft = false;
  @Input() validCenter = false;
  @Input() validRight = false;
  origDesc: string;
  @Input() speak = true;
  @Input() enable = true;
  @Input() userAvatarEnable = true;
  bubbleEnable = true;

  private _data: DescriptionData;
  private _debug = true;

  subscription: Subscription;
  enableSubscription: Subscription;
  speakSubscription: Subscription;
  userAvatarEnableSubscription: Subscription;

  constructor(
    // private _shared: SharedStateService,
    private _csmService: CSMService,
    private _ListenService: ListenService
    ) {

  }

  public processData(data: DescriptionData) {
    if (this._debug) {
      // console.log('Process Avatar Data: Received: ', data.text);
    }
    if (data === undefined) {
      if (this._debug) {
        // console.log('Description ProcessData received Undefined data');
      }
      return;
    }
    this._data = data;
    /*
    if (data.responses === undefined || data.responses.length === 0) {
      const currState = {label: 'Current State', index: 20, placement: 'center', type: 'button', class: 'action-button'};
      const currField = {label: 'Current Field', index: 21, placement: 'center', type: 'button', class: 'action-button'};
      const currSection = {label: 'Current Section', index: 22, placement: 'center', type: 'button', class: 'action-button'};
      // const addressTest = {label: 'Address Test', index: 23, placement: 'center', type: 'button', class: 'action-button'};
      const quickFill = {label: 'Quick Fill', index: 24, placement: 'center', type: 'button', class: 'action-button'};
      data.responses = [];
      data.responses.push(currState);
      data.responses.push(currField);
      data.responses.push(currSection);
      // data.responses.push(addressTest);
      data.responses.push(quickFill);

      // *** Pulled out for demo
      // data.responses.push(quickFill);

    }
    */
    if (data.responses === undefined || data.responses.length === 0) {
      data.responses = [];
    }
    this.uidata = new UIData(data.responses);
    if (this.uidata === null) {
      this.validLeft = false;
      this.validCenter = false;
      this.validRight = false;
    } else {
      // ** Pulled out for demo
      if (this.uidata.left.length > 0) {
        this.validLeft = true;
      } else {
        this.validLeft = false;
      }
      if (this.uidata.center.length > 0) {
        this.validCenter = true;
      } else {
        this.validCenter = false;
      }
      if (this.uidata.right.length > 0) {
        this.validRight = true;
      } else {
        this.validRight = false;
      }
    }

    //    if (data.text !== undefined && data.text !== '') {
    //      this.description = data.text;
    //    }
    this.description = data.text;
    if (this.description === undefined || this.description === '') {
      if (this._debug) {
        // console.log('Description: Empty Text: Pulling from Description');
      }
      // this.description = this._shared.state.active.section.properties.description;
    }
    if (this.description === undefined || this.description === '') {
      this.bubbleEnable = false;
    } else {
      this.bubbleEnable = true;
    }
    /* Remove default Avatar Text
    if (this.description === undefined || this.description === '') {
      if (this._debug) {
        console.log('Description: Empty Description: Hiding Bubble');
      }
      // this.description = 'I\'m Avatar. How can I help you?';
    }
    */

    // console.log('ValidLeft: ', this.validLeft);
    // console.log('ValidCenter: ', this.validCenter);
    // console.log('ValidRight: ', this.validRight);
    // this._ref.detectChanges();
  }

  ngOnInit() {
    const self = this;
    //    this.subscription = this._description.data$.subscribe(data => {this.processData(data); });
    //    this.enableSubscription = this._description.enable$.subscribe(e => {this.enable = e; });
    //    this.speakSubscription = this._description.speak$.subscribe(s => {this.speak = s; });
    //    this.userAvatarEnableSubscription = this._description.userAvatarEnable$.subscribe(e => {this.userAvatarEnable = e; });
    //
    //    self._shared.observableStream.subscribe(update => {
    //      const response: any = (<any>update);
    //      if (response.event = 'application-property-change' && response.data && response.data.name === 'completed') {
    //        // self.applicationProgress.Completed = response.data.value;
    //        self._csmService.checkForPercentageComplete();
    //      }
    //    });

  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.speakSubscription.unsubscribe();
    this.enableSubscription.unsubscribe();
    this.userAvatarEnableSubscription.unsubscribe();
  }

  buttonClick(name: string) {
    // console.log(name + ' pressed!');
    this._csmService.getProcessCommandService().processStateMachineResponse(name, true);
  }

  startStateMachine(): void {
    // console.log('Start State Machine pressed!');
    this._ListenService.enableAvatar();
  }

  stopStateMachine(): void {
    // console.log('Stop State Machine pressed!');
    this._ListenService.disableAvatar();
  }

  mute(): void {
    // console.log('Mute pressed!');
    this._ListenService.disableAvatar();
  }

  unmute(): void {
    // console.log('Umute pressed!');
    this._ListenService.enableAvatar();
  }

  dropdownSelect(option: any) {
    if (option.id > 1) {
      // console.log(option.value + ' selected');
      this._csmService.getProcessCommandService().processStateMachineResponse(option.value, true);
    }

  }


}

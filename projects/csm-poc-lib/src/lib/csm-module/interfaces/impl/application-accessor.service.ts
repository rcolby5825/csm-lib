import {Injectable} from '@angular/core';
import {ApplicationAccessorInterface} from '../application-accessor.interface';
import {FormState} from '../../../core-module/models/FormState';
import {NodeStats} from '../../../essentials-module/components/progress-indicators/node-stats';
import {ListenerStateService} from '../../../core-module/services/state/listener-state.service';
import {StateService} from '../../../core-module/services/state/state.service';
import {SessionUsersService} from '../../../core-module/services/utils/session-users.service';
import * as moment from 'moment';
import {paths} from '../../../../environments/environment';
import {ActionItemEvent} from '../enum/action-item-event.enum';
import {Subscription} from 'rxjs';
import {VoiceEvent} from '../../model/enum/event.enum';
import {SchemaPointer} from '../../model/schema.pointer';
import {User} from '../../../auth-module/models/user';


@Injectable({
  providedIn: 'root'
})

export class ApplicationAccessorService implements ApplicationAccessorInterface {

  loadedApplicationInstanceId: string;
  formState: FormState;
  schemaPointer: SchemaPointer;
  applicationStats: NodeStats;

  userId: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  greeting: string;
  parsedDate: string;
  parsedTime: string;
  ampm: string;
  greetingtext: string;
  applicationList: any;
  sortBy = 'lastUpdate';
  sortOrder = 'desc';
  formPath = paths.essentials;
  modalRef: any;
  private date = new Date(Date.now());
  private modalAppLauncher: HTMLElement;

  /**
   * @object applicationStatus
   * @description Listens for application open and close events and executes callback methods
   */
  private applicationStatus = {
    [ActionItemEvent.APPLICATION_OPEN]: (instanceScope: ApplicationAccessorService, callback: Function) => {
      const execCallback = () => {
        callback();
      };
      console.log('The Application/Form is OPEN');
      return instanceScope.stateService.newApplicationMeta$.subscribe(execCallback);
    },
    [ActionItemEvent.APPLICATION_CLOSE]: (instanceScope: ApplicationAccessorService, callback: Function) => {
      const execCallback = () => {
        callback();
      };
      console.log('The Application/Form is CLOSED');
      return instanceScope.stateService.unloadApplication$.subscribe(execCallback);
    }
    //    [ActionItemEvent.ACTION_ITEM_COMPLETE]: (instanceScope: ApplicationAccessorService, callback: Function) => {
    //      // TODO
    //    }
  };
  chatContainer: HTMLElement;

  /**
   * @function constructor
   * @description s a special method which will be called whenever
   * we create new objects. And generally used of initializing the class members.
   * @returns NA
   * @arguments Class Members as needed
   */
  constructor(
    private listenerStateService: ListenerStateService,
    private stateService: StateService,
    private sessionUserService: SessionUsersService
  ) {
    this.init();
    this.setDateObj();
  }

  /**
   * @function init()
   * @description called from Constructor
   * @arguments functions called to complete initialization of code
   * @returns nothing
   */
  init() {
    this.setLoggedInUser();
    this.listenForLoggedInUser();
    this.listenForFormStateChanges();
    this.listenForApplicationStatChanges();
    if (this.formState) {
      this.schemaPointer = new SchemaPointer(this.formState.getApplication(), this.formState.getApplicationInstanceId());
    }
    // console.log('Adapter-Module ApplicationAccessorService has been successfully initialized.');
  }

  public registerObserver(actionItemEvent: ActionItemEvent, callback: Function): Subscription {
    const self = this;
    return self.applicationStatus[actionItemEvent](self, callback);
  } // end registerObserver

  private setLoggedInUser(): void {
    const loggedInUserProfile = this.sessionUserService.getLoggedInUserProfile();
    console.log('Here is the user we are setting', loggedInUserProfile);
    if (loggedInUserProfile) {
      this.userId = loggedInUserProfile.getId();
      this.userFirstName = loggedInUserProfile.getUserFirstName();
      this.userLastName = loggedInUserProfile.getUserLastName();
      this.userEmail = loggedInUserProfile.getUserEmail();
    } else {
      console.warn ('Logged In User Information has not been set.');
    }
  }

  /**
   * logged in user:  is set AFTER a login or after a successful log-in check is performed.
   * Session Users:   (map) are set AFTER a form loads
   */
  private listenForLoggedInUser(): void {
    // map of user sessions is hydrated AFTER a form is loaded and includes ROLES
    this.sessionUserService.sessionUsers$.subscribe((mapOfSessionUsers) => {
      // loggedInUser is created AFTER a login -> however some user attributes
      // are not available until AFTER an application is loaded.
      this.setLoggedInUser();
    });
  }

  getUserId(): string {
    return this.userId;
  }

  getUserFirstName(): string {
    return this.userFirstName;
  }

  getUserLastName(): string {
    return this.userLastName;
  }

  /**
   * @function listenForFormsStateChanges
   * @arguments NA
   * @description
   *  listens for formState changes and re-sets
   *  the instance variable.
   * @returns NA
   */
  private listenForFormStateChanges() {
    this.stateService.currentState$.subscribe((formState_: FormState): void => {
      this.formState = formState_;
      if (!this.schemaPointer) {
        this.schemaPointer = new SchemaPointer(this.formState.getApplication(), this.formState.getApplicationInstanceId());
      }
      if (!this.applicationStats) {
        this.applicationStats = this.formState.getApplication().properties.stats;
      }
      this.loadedApplicationInstanceId = formState_.getApplicationInstanceId();
    }, (error) => {
      console.log('An exception has been caught listening for form-state changes.', error);
    });
  }

  /**
   * @function listenForApplicationStateChanges
   * @arguments none
   * @description this is for the "stat(us)" changes not 'state'.
   *  listens for 'completion' changes for the loadedApplicationInstanceId
   * @returns nothing
   */
  private listenForApplicationStatChanges() {
    this.listenerStateService.applicationStatChanges$.subscribe((applicationStats_: NodeStats): void => {
      if (applicationStats_.applicationInstanceId === this.loadedApplicationInstanceId) {
        this.applicationStats = applicationStats_;
      }
    }, (error) => {
      console.log('An exception has been caught listening for Node-Stat changes.', error);
    });
  }

  /**
   * @function getApplicationName
   * @description gets the title of the current application
   * @arguments none
   * @returns title of the current application instance id
   */
  public getApplicationName(): string {
    return this.formState.getApplication().properties.title;
  }

  /**
   * @function getStatus
   * @arguments none
   * @description
   * @returns properties.progressStatus as "incomplete" but these are set by
   * the client developer... so there is an IN_PROGRESS for example
   */
  public getStatus(): string {
    return this.formState.getApplication().properties.progressStatus;
  }

  /**
   * @function getPercentageComplete
   * @description gets the percent complete of the entire application
   * @arguments none
   * @returns percent complete of ENTIRE application
   */
  public getPercentageComplete(): number {
    if (
      this.formState &&
      this.formState.getApplicationInstanceId() &&
      this.formState.getApplication() &&
      (!this.applicationStats || this.formState.getApplicationInstanceId() !== this.applicationStats.applicationInstanceId)
    ) {
      this.applicationStats = new NodeStats(this.formState.getApplicationInstanceId(), this.formState.getApplication());
    }
    return this.applicationStats.chartData.percentageCompleted;
  }


  // /**
  //  * @function getUserName
  //  * @description gets user's username which is currently an EMAIL
  //  * @TODO  first/last name is really only available when a form is loaded.
  //  * @TODO -- probably need a FS jira ticket /current http request to return user.firstName user.lastName??
  //  * this is NOT available from my-applications list.
  //  * @arguments none
  //  * @returns user's name which is currently their email.
  //  */
  // public getUserName(): string {
  //   return this.sessionUserService.getUserName(this.loggedInUserId);
  // }

  /**
   * @function executeEvent
   * @description this is regarding the
   * @TODO -- need to identify all of the events an application should do.
   * @TODO -- probably need a jira ticket to work when requirements are established.
   * @param event
   * @param targetNodeTitle - title of a node that event will be executed on
   * @returns void
   */
  public executeEvent(theEvent: VoiceEvent, targetNodeTitle?: string): void {

  }
  /**
   * @function openApplication
   * @TODO -- probably need a jira ticket to offer a Lucy Friendly way to open
   * @argument application name
   * @returns nothing
   */
  public openApplication(appname: string): void {
    // open the application based on its name.
    // Peter
    console.log('APP NAME: ' + appname);
  }

  /**
   * @function closes whatever application is open
   * this is also done by saying: Go to My Applications/Dashboard or Close Application
   * using voice commands with Lucy
   * @TODO -- probably need a jira ticket to offer a Lucy Friendly way to close
   * @argument nothing
   * @returns nothing
   */
  public closeApplication(): void {
    // close the open application meaning, go back to My Applications
    console.log('Application has been closed');
  }

  /**
 * @function getDateObj
 * @arguments NA
 * @returns dateString
 */
  public setDateObj(): void {
    const month = this.date.getMonth() + 1;
    const year = this.date.getFullYear();
    const day = this.date.getDay();
    const hour = this.date.getHours();
    const min = this.date.getMinutes();
    this.parsedDate = month + '/' + day + '/' + year;
    this.parsedTime = hour + ':' + min + ' ' + this.ampm;
    // console.log('Date is: ' + month + '/' + day + '/' + year + ' the time is: ' + hour + ':' + min);
  }

  /**
   * @function getGreeting, getParsedDate, getParsedTime
   * @arguments none
   * @returns strings
   * @description gets all the Greeting data
   */
  getGreeting(): string {
    return this.greeting;
  }
  getParsedDate(): string {
    return this.parsedDate;
  }
  getParsedTime(): string {
    return this.parsedTime;
  }

  /**
    * @function greetingText
    * @argument none
    * @returns greeting (morning, afternoon, evening)
    * @todo Move this to a generic service
    */
  public greetingText(): string {
    const now = moment();
    const currentHour = now.hour();
    if (currentHour >= 12 && currentHour <= 17) {
      this.ampm = 'PM';
      this.greetingtext = 'Good Afternoon, ';
    } else if (currentHour >= 18 && currentHour <= 0) {
      this.ampm = 'PM';
      this.greetingtext = 'Good Evening, ';
    } else {
      this.ampm = 'AM';
      this.greetingtext = 'Good Morning, ';
    }
    return this.greetingtext;
  }

  /**
   * @function openGenericModal
   * @argument nones
   * @returns nothing
   * @description opens any model from its triggered click event anywhere in the form
   */
  public openGenericModal(): void {
    this.modalAppLauncher = document.querySelector('#modal-list-essentials') as HTMLElement;
    this.modalAppLauncher.click();
  }

  public openChatContainerMsg(): void {
    this.chatContainer = document.querySelector('.container-help-header-msg') as HTMLElement;
    // Need to get correct click event...
    this.chatContainer.click();
  }


  /**
   * @function listErrorHandle
   * @argument error, context
   * @return nothing
   * @description This handles all errors that may or can occur
   */
  listErrorHandler(error: {code: number}, context: any) {
    const self = context;
    if (401 === error.code) {
      console.log('User is no longer logged into the system.');
      self.router.navigate(['/auth/login']);
    }
  }
}

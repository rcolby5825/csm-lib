import {Injectable, NgZone} from '@angular/core';
import {Router} from '@angular/router';
import {CSMService} from '../engine/csm.service';
// This will bring in the avatar component - which this isn't ready for yet.
// import {CommonComponentServices} from '../avatar/avatar-diagnostic.component';
import {LucyCSMCommands} from '../interfaces/enum/lucy-csm-commands.enum';
import {LucyCSMCommandsAccessorService} from '../interfaces/impl/lucy-csm-commands-accessor.service';
// import {ApplicationAccessorService} from '../interfaces/impl/application-accessor.service';
import {StateMachine} from './state-machine';
import {SpeechService} from '../engine/speech.service';



@Injectable()
export class CSMStateMachine extends StateMachine {

  public whereAmI = document.location.href;
  private csmLucyCommandsCallback: Function;
  private areLucyCSMCommandsLoaded: any;
  private currentKeyword: string;

  private lucyCSMCommands = [
    {// 0 LOGIN
      'KEYWORD': 'login',
      'MSG': LucyCSMCommands.LOGIN_SIGNIN_MSG,
      'PATH': LucyCSMCommands.LOGIN_SIGNIN_PATH
    }, {// 1 LOGOUT
      'KEYWORD': 'logout',
      'MSG': LucyCSMCommands.LOGOUT_SIGNIN_MSG,
      'PATH': LucyCSMCommands.LOGOUT_SIGNIN_PATH
    }, {// 2 Settings/Profile
      'KEYWORD': 'settings',
      'MSG': LucyCSMCommands.SETTINGS_PROFILE_MSG,
      'PATH': LucyCSMCommands.SETTINGS_PROFILE_PATH
    }, {// 3 Password
      'KEYWORD': 'password',
      'MSG': LucyCSMCommands.SETTINGS_PASSWORD_MSG,
      'PATH': LucyCSMCommands.SETTINGS_PASSWORD_PATH
    }, {// 4 Close Application
      'KEYWORD': 'close',
      'MSG': LucyCSMCommands.CLOSE_APP_MSG,
      'PATH': LucyCSMCommands.CLOSE_APP_PATH
    }, {// 5 Signup/Getstarted
      'KEYWORD': 'signup',
      'MSG': LucyCSMCommands.SIGNUP_GETSTARTED_MSG,
      'PATH': LucyCSMCommands.SIGNUP_GETSTARTED_PATH
    }, {// 6 My Applications/Dashboard
      'KEYWORD': 'dashboard',
      'MSG': LucyCSMCommands.MYAPP_DASHBOARD_MSG,
      'PATH': LucyCSMCommands.MYAPP_DASHBOARD_PATH
    }
  ];


  constructor(
    _csmService: CSMService,
    // private _compDiagSvcs: CommonComponentServices,
    // private _applicationAccessor: ApplicationAccessorService,
    private _SpeechService: SpeechService,
    private _lucyCSMCommandsService: LucyCSMCommandsAccessorService,
    private router: Router,
    private ngZone: NgZone,
  ) {
    super(_csmService);
    this.turnOnMic();
    this.csmLucyCommandsCallback = this.lucyCSMCommandsLoaded.bind(this);
    this._lucyCSMCommandsService.registerObserver(this.lucyCSMCommandsLoaded.bind(this));
  }


  /**
   * Get name of state machine.
   *
   * @returns name of state machine
   */
  public getName() {
    return 'CSMStateMachine';
  }

  public lucyCSMCommandsLoaded(): void {
    // console.log('Form Loaded');
    if (!this.areLucyCSMCommandsLoaded) {
      // Get the Application Meta Data
      this.areLucyCSMCommandsLoaded = true;
    }
  }

  /**
   * Get state machine.
   *
   * @return JSON representing state machine
   */
  public getStateMachine(): any {
    return {
      'AvatarStart': {
        'voice': 'Google UK English Female',
        'computerSays': [this.letsGetStarted], // this.welcome
        'actions': [{
          'computerDoes': ['base'] // this._component.AvatarStart, 'base'
        }],
        'display': 'Avatar Start'
      },
      'base': {
        'voice': 'Google UK English Female',
        'image': 'afterspeech: lucy_l.png',
        'computerSays': [],
        'actions': [{
          'userSays': ['mute', 'silence'],
          'image': 'lucy_closed_eyes_and_mouth.svg',
          'computerDoes': [function (say: any) {
            this.speak(`I will not be speaking.`);
          }, this.disableSpeech]
        },
        {
          'userSays': ['unmute,speak'],
          'image': 'lucy_l.png',
          'computerDoes': [this.enableSpeech, function (say: any) {
            this.speak('I can speak to you now!');
          }]
        },
        {
          'userSays': ['[[repeat,what was,]] [[the,this,my,]] last command'],
          'computerDoes': [this.repeatLastCommand]
        },
        {
          'userSays': ['restart'],
          'computerDoes': [this.restart]
        },
        {
          'userSays': ['show commands'],
          'computerDoes': [this.getPossibleResponses]
        },
        {
          'userSays': ['hey lucy'],
          'image': 'lucy_l.png',
          'computerDoes': [function (say: any) {
            this.speak(`I'm listening`);
          }, 'base']
        },
        {
          'userSays': ['voice test'],
          'voice': 'Google UK English Female',
          'image': 'larry_not_speaking.png',
          'computerDoes': ['voice']
        },
        {
          'userSays': ['[[open,show]] debug [[console,council]]'],
          'computerDoes': [
            `function(say){ this.speak('Opening console');
                            console.log('SAY: '+say);
                            this.showHideCSMModal('voice');
                            return false;}`]
        },
        {
          'userSays': ['[[close,hide]] debug [[console,council]]'],
          'computerDoes': [
            `function(say){ this.speak('Closing console.');
                            console.log('SAY: '+say);
                            this.showHideCSMModal('close');
                            return false;}`]
        },
        {
          'userSays': [
            '[[open,go to,select,change to,navigate to,take me to]] browse[[r,]] application[[s,]]'
          ],
          'computerDoes': [this.browseApplications],
          'example': 'Go to Browse Applications'
        },
        {
          'userSays': [
            '[[open,go to,select,change to,navigate to,take me to]] [[get started,sign up,signup]]'
          ],
          'computerDoes': [`function(say){this.gotoPage('signup');}`],
          'example': 'Go to Settings'
        },
        {
          'userSays': [
            '[[open,go to,select,change to,navigate to,take me to]] settings'
          ],
          'computerDoes': [`function(say){this.gotoPage('settings');}`],
          'example': 'Go to Settings'
        },
        {// these are different commands going to same place
          'userSays': [
            '[[open,go to,select,change to,navigate to,take me to]] my application[[s,]]'
          ],
          'computerDoes': [`function(say){ this.gotoPage('dashboard');}`],
          'example': 'Go to My Applications or Dashboard'
        },
        {// these are different commands going to same place
          'userSays': [
            '[[open,go to,select,change to,navigate to,take me to]] dashboard'
          ],
          'computerDoes': [`function(say){ this.gotoPage('dashboard');}`],
          'example': 'Go to My Applications or Dashboard'
        },
        {
          'userSays': [
            '[[open,go to,select,change to,navigate to,take me to]] profile'
          ],
          'computerDoes': [`function(say){ this.gotoPage('settings');}`],
          'example': 'Go to Profile'
        },
        {
          'userSays': [
            '[[open,go to,select,change to,navigate to,take me to]] password'
          ],
          'computerDoes': [`function(say){ this.gotoPage('password');}`],
          'example': 'Go to Password'
        },
        {
          'userSays': [
            '[[I,open,go to,select,change to,navigate to,take me to]] [[log in,login,sign in,signin,already have an account]]'
          ],
          'computerDoes': [`function(say){ this.gotoPage('login');}`],
          'example': 'Go to Login'
        },
        {
          'userSays': [
            '[[open,go to,select,change to,navigate to,take me to]] [[sign out,signout,log out, logout]]'
          ],
          'computerDoes': [`function(say){ this.gotoPage('logout');}`],
          'example': 'Go to Logout'
        },
        {
          'userSays': [
            '[[open,go to,select,change to,navigate to,take me to]] [[chatbot window,lucys chatbot,lucy window,lucys window]]'
          ],
          'computerDoes': [this.openChatBot],
          'example': 'Open Chatbot'
        },
        {
          'userSays': [
            '[[close,forget it,no thank you]] [[chatbot window,lucys chatbot,lucy window,lucys window]]'
          ],
          'computerDoes': [this.closeChatBot],
          'example': 'Open Chatbot'
        },
        {
          'userSays': ['status'],
          'computerDoes': [this.getStatus],
          'example': 'Status'
        },
        {
          'userSays': ['progress'],
          'computerDoes': [this.getProgress],
          'example': 'Progress'
        }
        ]
      },
      'voice': {
        'computerSays': ['Are you sure you want to hear all the languages?'],
        'actions': [{
          'userSays': ['yes'],
          'computerDoes': [this.voiceTest, 'base']
        },
        {
          'userSays': ['<speech>'],
          'computerDoes': [function (say: any) {
            console.log('*** This is in CSM!');
            this.speak('Ok');
          }, 'base']
        }]
      }
    };
  }

  /**
     *
     * @returns string (the response for Lucy)
     * @description This is on intial start... where are we LUCY?
     */
  public letsGetStarted(): string {
    console.log('We\'re just getting started folks...');
    // Move the chatbot into position
    let response: string;
    const moveable1: HTMLElement = document.getElementsByClassName('moveable1')[0] as HTMLElement;
    moveable1.style.left = '5px';
    moveable1.style.top = '-190px';

    // Wait 5 second (after fade out), then clear tape
    setTimeout(() => {
      moveable1.classList.remove('moveable1visible');
      moveable1.classList.add('moveable1hidden');
    }, 5000);
    response = 'Welcome to Digital Harbor and SET FORMS. I\'m Lucy, your Digital Assistant.';
    return response;
  }

  /**
   *
   * @argument userSays (string)
   * @returns nothing
   * @description This method is called when the user says 'test'
   */
  public search(userSays: string): void {
    console.log('Got it!' + userSays);
  }

  /**
   * Disable Avatar.
   */
  public disableAvatar(): void {
    console.log('*** Disable Avatar');
    this._CSMService.getListenService().disableAvatar();
  }

  /**
   * enableAvatar
   * Description: Enables Avatar.
   * returns: nothing
   */
  public enableAvatar(): void {
    this._CSMService.getListenService().enableAvatar();
  }

  /**
   * stop
   * Description: Stops CSM.
   * Returns: nothing
   */
  public stop(): void {
    this._CSMService.stop();
  }

  /**
   * voiceTest
   * Description: Execute voice test.
   * returns: nothing
   */
  public voiceTest(userSays: any): void {
    console.log('usersays: ', userSays);
    const synth: any = window.speechSynthesis;
    const voices: any[] = synth.getVoices();
    for (let i = 0; i < voices.length; i++) {
      const voice: any = voices[i];
      const text: string = 'This is voice number ' + i;
      const utterance: any = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      synth.speak(utterance);
    }
  }

  /**
   * repeatLastCommand
   * Description: Repeat last command.
   * returns: nothing
   */
  public repeatLastCommand(): void {
    const lastCommand: string = this._CSMService.getProcessCommandService().getLastCommand();
    //  console.log('LastCommand: ' + lastCommand);
    if (lastCommand === undefined) {
      this.speak('I\'m not sure what the last command was.');
    } else {
      const speech: string = 'The last command I heard was: ' + lastCommand;
      this.speak(speech);
    }
  }

  /**
   * restart
   * Description: Restarts CSM.
   * returns: nothing
   */
  public restart(): void {
    this.speak('Restarting');
    this.enterState('base', undefined);
  }

  /**
   * disableSpeech
   * Description: Disables speech.
   * returns: nothing
   */
  public disableSpeech(): void {
    this._CSMService.disableSpeaker();
  }

  /**
   * enableSpeech
   * Decription: Enables speech.
   * Returns: nothing
   */
  public enableSpeech(): void {
    this._CSMService.enableSpeaker();
  }

  /**
   * getPossibleResponses
   * Description: gets the possible responses
   * Return log possible commands.
   */
  public getPossibleResponses(): void {
    //    let fn = this._CSMService.getPossibleResponses.bind(this._CSMService);
    //    let result = fn();
    //    for (let i = 0; i < result.length; i++)
    //      console.log(i + '. ' + result[i]);
  }

  /**
   * showHideCSMModal
   * Description: Shows the CSM Debug modal.
   * Returns: nothing
   */
  // will need to be migrated out of here into the avatar component
  // public showHideCSMModal(fromwhere: string) {
  //   // console.log(`**************** Showing modal we're in CSM STATE MACHINE IS: ` + fromwhere);
  //   this._compDiagSvcs.showHideCSMModal(fromwhere);
  // }

  public getStatus(): void {
    // const status = this._applicationAccessor.getStatus();
    // this.speak(status, undefined, undefined, this._SpeechService.getEndOfSpeechCallback());
  }

  public getProgress(): void {
    // const progress = this._applicationAccessor.getStatus();
    // this.speak(progress, undefined, undefined, this._SpeechService.getEndOfSpeechCallback());
  }

  /**
   *
   * @description this ensures that the MIC is on
   * @params NONE
   * @returns Nothing
   */
  public turnOnMic(): void {
    this._CSMService.enableMicrophone();
  }

  public browseApplications(): void {
    const modalMsg = 'Please choose an application you\'d like to create.';
    this.speak(modalMsg);
    // this._applicationAccessor.openGenericModal();
  }


  /**
   *
   * @description logs the user out of set forms
   *
   * @returns nothing
   */
  public gotoPage(keyword: string): void {
    let info;
    for (let i = 0; i < this.lucyCSMCommands.length; i++) {
      if (this.lucyCSMCommands[i].KEYWORD === keyword) {
        console.log('Inside FOR LOOP: ', this.lucyCSMCommands[i].KEYWORD);
        info = this.lucyCSMCommands[i].MSG;
        this._lucyCSMCommandsService.setMessage(info);
        this._lucyCSMCommandsService.setPath(this.lucyCSMCommands[i].PATH);
        // this._compDiagSvcs.navigate(this._lucyCSMCommandsService.getPath());
      }
    }
    // Speak the message
    this.speak(this._lucyCSMCommandsService.getMessage(), undefined, undefined, this._SpeechService.getEndOfSpeechCallback());

    // Page doesn't exist
    if (info === undefined) {
      info = `I'm sorry but that page doesn't exist. Please try again.`;
      this._lucyCSMCommandsService.setMessage(info);
      this.speak(this._lucyCSMCommandsService.getMessage(), undefined, undefined, this._SpeechService.getEndOfSpeechCallback());
    }

  }

  public chatBotOpenClose(whatPage: string): string {
    let msg = '';
    switch (whatPage) {
      case 'home':
      case 'landing page':
      case 'start page':
        msg = `Welcome to Digital Harbor. You are on the ${whatPage} page. I'm Lucy your Conversational State Machine.`;
        break;
      case 'chatbot':
        msg = `I have reopened the chat window.`;
        this.openChatBot();
        break;
      case 'closechatbot':
        msg = `Ok`;
        this.closeChatBot();
        break;
    }
    return msg;
  }

  /**
 *
 * @description this opens the chatbot modal manually
 *
 * @returns nothing
 */
  // this may not work - try it out and see
  public openChatBot(): void {
    const moveable1: HTMLElement = document.getElementsByClassName('moveable1')[0] as HTMLElement;
    const modalbody: HTMLElement = document.getElementsByClassName('modalbodyoverride')[0] as HTMLElement;
    if (moveable1) {
      moveable1.classList.add('moveable1visible');
      moveable1.classList.remove('moveable1hidden');
      moveable1.scrollTop = moveable1.scrollHeight;
      modalbody.scrollTop = moveable1.scrollHeight;
    }
  }

  // might not work as it deals directly with the avatar component
  public closeChatBot(): void {
    const moveable1: HTMLElement = document.getElementsByClassName('moveable1')[0] as HTMLElement;
    if (moveable1) {
      moveable1.classList.add('moveable1hidden');
      moveable1.classList.remove('moveable1visible');
    }
  }

  public navigate(commands: any): void {
    this.ngZone.run(() => this.router.navigateByUrl(commands).then());
  }


}

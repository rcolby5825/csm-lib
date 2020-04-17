import {Injectable} from '@angular/core';
import {CSMService} from './csm.service';

export interface IWindow extends Window {
  utterances: any[];
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

/**
* Service to listen for voice commands.
*/
@Injectable({ providedIn: 'root', })
export class ListenService {

  private _CSMService: CSMService;

  private fRecognition: any;
  private fRecognitionRunning = false;
  private fSpeechRecognitionRunning = false;
  private fInitialized = false;
  private fRecognizing: boolean;
  private fAutoStartRecognition: boolean;
  private fAvatarEnabled = true;
  private fConversationThreshold = 15;
  private fOptionsCallback: Function;

 /**
  * Constructor.
  */
  constructor(
  ) {}

  /**
   * Set CSMService.
   *
   * @param _CSMService - CSMService object
   */
   public setCSMService(_CSMService: CSMService): void {
       this._CSMService = _CSMService;
   }

  /**
   * Start voice recognition.
   *
   * @param force (optional) force restart of lister service
   */
  public async startVoiceRecognition(force?: boolean): Promise<void> {
    // Check if Speech Recognition is available in this browser
    if (!('webkitSpeechRecognition' in window) && !this.fSpeechRecognitionRunning) {
      // console.log('Error: Speech not supported');
      return;
    }

    if (!this.fInitialized) {
      this.startVoiceRecognitionEx();
      this.fInitialized = true;
      let enable = true;
      if (!force) {
        // ### Hook up when User supports enable Avatar
        this._CSMService.getAvatarEnabled().then(enabled => {
          enable = enabled;
          if (enable) {
            if (this.fAvatarEnabled) {
              return;
            } else {
              this.enableAvatar();
              this.fAvatarEnabled = true;
            }
          }
        })
        .catch(error => {
          enable = false;
        });
        // enable=sessionService.getSessionUserInfo().enableAvatar;
        // enable = true;
        // enable = this._user.getLoggedInUser().
      }

      this.enableAvatar();
      this._CSMService.enableSpeaker();
    }
  }

  /**
   * Start voice service event loop.
   */
  public startVoiceRecognitionEx(): void {
    // Flag that speech recognition is now running
    this.fSpeechRecognitionRunning = true;

    // Create speech recognition toolkit
    const {webkitSpeechRecognition}: IWindow = <IWindow> window;
    this.fRecognition = new webkitSpeechRecognition();

    (<any> this.fRecognition).lang = 'en-US';
    (<any> this.fRecognition).continuous = true;
    (<any> this.fRecognition).interimResults = true;

    let finalOption: boolean;
    let resultIndex = 0;

    // Set flag when recognition is running
    const onStart = function (event: any) {
      this.setRecognitionRunning(true);
    };
    this.fRecognition.onstart = onStart.bind(this);       // Set the 'this' to current 'this'

    // Log if there is an error
//    const onError = function (event: any) {
//    };
//    this.fRecognition.onError = onError.bind(this);       // Set the 'this' to current 'this'

    // Process results of recognition
    const onResult = function (event: any) {
      // Build string with speech option
      this._finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        for (let j = 0; j < event.results[i].length; j++) {
          finalOption = event.results[i].isFinal;
          this._finalText += event.results[i][j].transcript;
        }

        // Clean up text
        this._finalText = this._finalText.trim();

        // Remove 'Please'
        if (this._finalText.toLowerCase().startsWith('please')) {
          this._finalText = this._finalText.substring('please'.length).trim();
        }
      }

      // Log text option
      if (this.fOptionsCallback) {
        this.fOptionsCallback(this._finalText);

      }

      // Detect if speech text has too many words
      const words: string[] = this._finalText.split(' ');
      if (this._checkForLongSpeech && words.length > this.fConversationThreshold) {
        // There are too many words. Disable Avatar
        this.disableAvatar();
      } else {
        // Process state machine reponse
        if (finalOption) {
          this.setAutoStartRecognition(true);

          // If not in continuous listen mode, and recognizing, then stop recognizing
          if (!this._CSMService.isMicrophoneOn()) {
            if (this.isRecognizing()) {
              this.setRecognizing(false);
              this.fRecognition.stop();
            }
          }

          // Log main text option
          if (this._finalTextCallback) {
            //            this._finalTextCallback(this.createTruePartsOfSpeech(this._finalText));
            this._finalTextCallback(this._finalText);
          }

          // Process text response from user
          if (this._CSMService.isMicrophoneOn() && this._CSMService.isListening()) {
            this._CSMService.getProcessCommandService().processStateMachineResponse(this._finalText);
          }
          resultIndex = 0;
          this.finalText = '';

          // If not continuously listening and in auto start recognition
          if (/*!this.isMicrophoneOn() &&*/ this.isAutoStartRecognition()) {
            this.fRecognition.onend = this.onEndHandler.bind(this);
            if (this.isRecognizing()) {
              this.setRecognizing(false);
            }
          }
        }
      }
    };

    // Set up onresult and onend functions
    this.fRecognition.onresult = onResult.bind(this);       // Set the 'this' to current 'this'
    this.fRecognition.onend = this.onEndHandler.bind(this);       // Set the 'this' to current 'this'
  }

  /**
   * Enable state machine listening.
   */
  public enableAvatar(): void {
    // Flag that Avatar is now enabled
    this.fAvatarEnabled = true;

    // Flag that auto start recognition is true
//    this._Description.updateEnable(true);
    this.setAutoStartRecognition(true);

    // If not recognizing, start recognizing
    if (!this.isRecognizing()) {
      this.fRecognizing = true;

      // If CSM is not recognizing, the start it
      if (!this.isRecognitionRunning()) {
        this.fRecognition.start();
      }
    }

    // If no state machine is defined, default to 'base' state
    if (this._CSMService.getStateMachineService().getCurrentStateMachineIndex() === undefined) {
      this._CSMService.getProcessCommandService().enterState('base');
    }
  }

  /**
   * onEndHandler that is called after speech recognition.
   *
   * @param event
   */
  public onEndHandler(event: any): void {  // Start must occur after the onend function is called
    //    if (!this.setRecognitionRunning()) {
    //      this.setRecognitionRunning(false);
    //      if (this.isDebugFullListeningAndRecognition()) {
    //        console.log('onEndHandler');
    //        console.log('recognizing=' + this.isRecognizing());
    //        console.log('autoStartRecognizing=' + this.isAutoStartRecognition());
    //      }
    //    }

    if (this._CSMService.isMicrophoneOn()) {
      // If not in continuous listen, start recognition
      if (!this.isRecognitionRunning()) {
        // Set recognizing to true
        this.setRecognizing(true);
      }

      // Start recognition
      this.fRecognition.start();
    }
  }

  /**
   * Disable CSM listening.
   */
  public disableAvatar(): void {
    // Reset flags
//    this._Description.updateEnable(false);
    this.setAutoStartRecognition(false);
    this.setRecognizing(false);
    this.setRecognitionRunning(false);
    this.fAvatarEnabled = false;

    // Abort recognition
    this.fRecognition.abort();
  }

  /**
   * Return if Avatar is enabled.
   */
  public isAvatarEnabled(): boolean {
    return this.fAvatarEnabled;
  }

  /**
   * Set Recognition to running state.
   *
   * @param recognition - true if recognition is running
   */
  private setRecognitionRunning(recognition: boolean): void {
    this.fRecognitionRunning = recognition;
  }

  /**
   * Return if recognition is running.
   *
   * @return true if recognition is running
   */
  public isRecognitionRunning(): boolean {
    return this.fRecognitionRunning;
  }

  /**
   * Set recognizing state.
   *
   * @param recognize - true if recognizing
   */
  public setRecognizing(recognizing: boolean): void {
    this.fRecognizing = recognizing;
  }

  /**
   * Return recognize state.
   *
   * @return true if recognizing
   */
  public isRecognizing(): boolean {
    return this.fRecognizing;
  }

  /**
   * Set Auto Start Recognition state.
   *
   * @autoStartRecognition -  true if auto start recognition state
   */
  public setAutoStartRecognition(autoStartRecognition: boolean): void {
    this.fAutoStartRecognition = autoStartRecognition;
  }

  /**
  /** * Return if in Auto Start Recognition state.
   *
   * @return true if recognizing
   */
  private isAutoStartRecognition(): boolean {
    return this.fAutoStartRecognition;
  }

  /**
   * Set conversation threshold.
   *
   * This allows the Conversational State Machine to stop listening
   * after a certain number of words have been said.
   *
   * This should be replaced with intelligent field interaction to
   * understand what types of values, and lengths of data the
   * target fields need.
   *
   * @num - Number of words to listen for
   */
  public setConversationThreshold(num: number): void {
    this.fConversationThreshold = num;
  }

  /**
   * Stop voice recognition.
   */
  public stop(): void {
   this.fRecognition.stop();
  }

  /**
   * Start voice recognition.
   */
  public start(): void {
   this.fRecognition.start();
  }

  /**
   * Set on end handler.
   */
  public setOnEndHandler(): void {
    this.fRecognition.onend = this.onEndHandler.bind(this);
  }

  /**
   * Return true if speech recognition is running.
   *
   * @returns true if speech recognition is running
   */
  public isSpeechRecognitionRunning(): boolean {
      return this.fSpeechRecognitionRunning;
  }

  /**
   * Register callback for options.
   *
   * @param optionsCallback Function to call when options defined
   */
  public regForOptions(optionsCallback: any) {
    this.fOptionsCallback = optionsCallback;
  }

}

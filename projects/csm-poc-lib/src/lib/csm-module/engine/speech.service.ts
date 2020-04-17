import {Injectable} from '@angular/core';
import {CSMService} from './csm.service';

/**
* Speech service.
*/
@Injectable({ providedIn: 'root', })
export class SpeechService {

  private _CSMService: CSMService;

  private fUtteranceCache: any;
  private fVoiceInstance: any;
  private fTextToSpeak: any[] = [];
  private fVoices = window.speechSynthesis.getVoices();
  private fSelectedVoice = 'Google UK English Female';
  private fEndOfSpeechTimeListener: any;
  private fCurrentImage: string;
  private fPendingImage: string;
  private fImageCallback: Function;
  private fCurrentlySpeaking: boolean;
  private fEndOfSpeechCallback: Function;
  private fSpeechCallback: Function[] = [];
  private fSpokenText: string;
  private fSpeech: any;

  private fAcceptedResponseCallback: Function;
  private fButtonArrayCallback: Function;
  private fSelectionArrayCallback: Function;
  private fTextFieldCallback: Function;
  private fSetListDataManagerCallback: Function;
  private fGraphDataCallback: Function;
  private speechFinishedCallback: Function;

  private dontShowUserSpeechFlag = false;           // Block sending user speech to LucyBot

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
   * Speak without recognizing responses.
   *
   * @param text - text to speak
   * @param responses - ?
   * @param silent - ?
   */
  public speakWithNoRecognition(text: any, responses: any, silent: boolean) {
    let silence: boolean = !this._CSMService.isSpeakerOn();
    if (silent === true) {
      silence = true;
    }

    // If text is array, but text to speak
    if (text.length) {// Check if there is an array
      let tempText = '';
      for (let i = 0; i < text.length; i++) {
        if (text[i] instanceof Function) {
          tempText += text[i]();
        } else {
          tempText += text[i];
        }
      }
      text = tempText;
    }

    // This is the callback for fSpeechCallback
    //    this.showTape = responses ? responses.showTape : false;
    this.sendSpeech(text);            // Send speech with HTML tags to Lucy bubble

    // Remove HTML tags from spoen speech
    text = this.removeTags(text);

    let utterance: any;
    if (!silence) {
      (<any> window).utterances = [];
      utterance = new SpeechSynthesisUtterance(text);
      //      this.configureAvatarVoice();
      utterance.voice = this.fVoiceInstance;
      utterance.pitch = 1;
      utterance.rate = 1;
      this.fUtteranceCache = utterance; // The utterance is cached so it is not garbage collected. This can assure that onend is not cleared.

      const onEnd = function () {
        // if (this.isDebugFullListeningAndRecognition()) {
        // console.log('SpeakWithNoRecognition: OnEnd');
        // }
        this.setCurrentlySpeaking(false);
        // Speak queued text
        if (this.fTextToSpeak.length > 0) {
          const textArray: any = this.fTextToSpeak.shift();
          if (this.isDebugFullListeningAndRecognition()) {
            // console.log('Popping: ', textArray);
            // console.log('Queue Length: ', this.fTextToSpeak.length);
          }
          this.speakWithNoRecognition(textArray.text, textArray.responses, textArray.silent);
        }
      };
      utterance.onend = onEnd.bind(this);       // Set the 'this' to current 'this'
    }

    this.buildAvatarResponses(responses);

    if (!silence) {
      this.setCurrentlySpeaking(true);
      try {
        (<any> window).utterances.push(utterance);
        window.speechSynthesis.speak((<any> window).utterances[0]);
        this.observeEndOfSpeech();
      } catch (err) {
        // console.log('Error! Caught:', err);
      }
    } else {
      // Speak queued text
      if (this.fTextToSpeak.length > 0) {
        const textArray = this.fTextToSpeak.shift();
        this.speakWithNoRecognition(textArray.text, textArray.responses, textArray.silent);
      }
    }
  }

  /**
   * Speak text or array passed as parameter.
   *
   * @param text - text, or array of text to speak. The array can contain text, or a function that returns text. For example, ['Hi ', sayFirstName]
   * @param responses - ?
   * @param silent - ?
   * @param callback - optional callback function which will be called when speech finishes.
  */
  public async speak(text: any, responses?: any, silent?: boolean, callback?: Function): Promise<void> {
    // if (_silence) return;
    if (text === undefined) {
      return;
    }
    while (this.fVoiceInstance === 'undefined') {
      //      if (this.isDebugFullListeningAndRecognition()) {
      // console.log('Voice not configured. Waiting...');
      //      }
      await this._CSMService.sleep(50);
    }

    //    text = await this.resolveTags(text);    // This should call back to solution library

    if (!this._CSMService.getListenService().isSpeechRecognitionRunning()) {
      // console.log('Calling speakWithNoRecognition');
      this.speakWithNoRecognition(text, responses, silent);
      return;
    }

    // console.log('Speak: Silent: ', silent);
    let silence = !this._CSMService.isSpeakerOn();
    if (silent === true) {
      silence = true;
    }

    // Queue text to speak
    if (this.isCurrentlySpeaking() || this.fVoices.length === 0) {
      if (text !== undefined) {
        const obj: any = {text: text, responses: responses, silent: silent};
        this.fTextToSpeak.push(obj);
      }
      return;
    }
    // console.log('Text To Speak: ',fTextToSpeak);

    // If text is array, but text to speak
    if (text.length) {// Check if there is an array
      let tempText = '';
      for (let i = 0; i < text.length; i++) {
        if (text[i] instanceof Function) {
          tempText += text[i]();
        } else {
          tempText += text[i];
        }
      }
      text = tempText;
    }

    // Remove <Mute> tags from displayed speech and tags and content from spoken speech
    let viewedSpeech = text.replace(/<Mute>/gi, ``);
    viewedSpeech = viewedSpeech.replace(/<\/Mute>/gi, ``);

    // This is the callback for fSpeechCallback
    //    this.showTape = responses ? responses.showTape : false;
    this.sendSpeech(viewedSpeech);            // Send speech with HTML tags to Lucy bubble

    // Remove <Mute> tags from displayed speech and tags and content from spoken speech
    let mute;
    while ((mute = text.toLowerCase().indexOf('<mute>')) !== -1) {
      let muteOff = text.toLowerCase().indexOf('</mute>');
      if (muteOff === -1) {
        muteOff = text.length - 7;             // Compensate for lack of </mute> tag at end of string
      }
      text = text.substring(0, mute) + text.substring(muteOff + 7);
    }

    // Remove HTML tags from spoen speech
    text = this.removeTags(text);

    // Stop recognition in order to speak
    //    if (!this.isRecognizing()) {
    if (this._CSMService.getListenService().isRecognizing()) {
      this._CSMService.getListenService().setRecognizing(false);
      this._CSMService.getListenService().stop();
    }
    //    }

    let utterance: any;
    if (!silence) {
      // Create utterance and onEnd function
      // if (!this.isMicrophoneOn()) {
      this._CSMService.getListenService().setAutoStartRecognition(false);
      // }
      (<any> window).utterances = [];
      utterance = new SpeechSynthesisUtterance();
      utterance.text = text; // {'type':'SSML','ssml': text};
      utterance.lang = 'en';
      //      this.configureAvatarVoice();
      utterance.voice = this.fVoiceInstance;
      utterance.pitch = 1;
      utterance.rate = 1;
      this.fUtteranceCache = utterance; // The utterance is cached so it is not garbage collected. This can assure that onend is not cleared.

      const eofSpeechCb = this.setCallbackAfterSpeech;
      const onEnd = function () {
        this.utteranceOnEnd();
        if (callback) {
          callback();
        }
        if (eofSpeechCb) {
          this.setCallbackAfterSpeech(eofSpeechCb);
        }
        console.log('******** The speech ended! *******************');
        this.setSpeechIsFinished();
      };
      utterance.onend = onEnd.bind(this);
    }

    this.buildAvatarResponses(responses);

    // ### Update when AvatarService gets ported
    // if (this._stateMachineDebug) {
    // console.log('Sending Text: ' + text + ' to Description');
    // }
    //    this._Description.updateData(new DescriptionData(text, responses));
    // AvatarService.updateAvatarData(text,responses);

    try {
      if (!silence) {
        this.setCurrentlySpeaking(true);

        // console.log('Speaking 2');
        if (utterance.onend === undefined) {
          // console.log('onend is undefined!!!   2');
        }
        (<any> window).utterances.push(utterance);
        window.speechSynthesis.speak((<any> window).utterances[0]);
        this.observeEndOfSpeech();
      } else {
        this.utteranceOnEnd();
      }
    } catch (err) {
      // console.log('Error! Caught', err);
    }
  }

  /**
   * Set callback for after speech event.
   *
   * @param endOfSpeechCallback after speech callback function
   */
  private setCallbackAfterSpeech(endOfSpeechCallback: Function): void {
    const self = this;
    if (endOfSpeechCallback) {
      this.setCurrentlySpeaking(false);
      self.fEndOfSpeechCallback = endOfSpeechCallback;
    }
  }

  /**
   * Return end of speech callback.
   *
   * @returns end of speech callback
   */
  public getEndOfSpeechCallback(): Function {
    return this.fEndOfSpeechCallback;
  }

  /**
   * Watch for end of speech. This doesn't come if Chrome creates a log
   * that says that speech is being discontinued. For whatever reason
   * the miss calling the end of speech callback, and we believe that
   * speech is continuing, so we queue speech.
   */
  public observeEndOfSpeech(): void {
    if (this.fEndOfSpeechTimeListener) {
      window.clearTimeout(this.fEndOfSpeechTimeListener);
    }
    this.fEndOfSpeechTimeListener = setTimeout(this.speechObserver.bind(this), 5000);
  }

  /**
   * This method is called if time has passed, and speech hasn't finished.
   *
   * This method should reset the timer, and indicate that speech has finished.
   *
   * [Deprecation] speechSynthesis.speak() without user activation is no longer
   * allowed since M71, around December 2018.
   * See https://www.chromestatus.com/feature/5687444770914304 for more details
   */
  public speechObserver(): void {
    window.clearTimeout(this.fEndOfSpeechTimeListener);
    this.setCurrentlySpeaking(false);
  }

  /**
   * Function to call at end of speech.
   */
  public utteranceOnEnd(): void {
    if (this.fEndOfSpeechTimeListener) {
      window.clearTimeout(this.fEndOfSpeechTimeListener);
      this.fEndOfSpeechTimeListener = undefined;
    }
    this.setCurrentlySpeaking(false);

    if (/*!this.isMicrophoneOn() &&*/ !this._CSMService.getListenService().isRecognizing()) {
      // Flag that recognition is starting
      this._CSMService.getListenService().setRecognizing(true);
      this._CSMService.getListenService().setAutoStartRecognition(true);

      // If currently speaking, set currently speaking to false so speech will start automatically after next speak
      if (this.isCurrentlySpeaking()) {
        this.setCurrentlySpeaking(false); // Decrease instance count so speech will start automatically after next speak.
      } else {
        // CSM is not speaking, so start recognition
        if (this.fTextToSpeak.length === 0) {
          // Start recognition
          this._CSMService.getListenService().setOnEndHandler();
          if (!this._CSMService.getListenService().isRecognitionRunning()) {
            try {
              this._CSMService.getListenService().start();
            } catch (e) {
              // console.log('Recognition already started!', e);
            }
          }
        }
      }
    }

    // Speak queued text
    if (this.fTextToSpeak.length > 0) {
      const textArray: any = this.fTextToSpeak.shift();
      this.speak(textArray.text, textArray.responses, textArray.silent, undefined);
    }

    // If image should change at end of speech, do it now.
    this.sendImage();
  }

  /**
   * Remove HTML tags from text string.
   *
   * @param text - input text string
   * @returns text without HTML tags
   */
  public removeTags(text: string): string {
    // Remove tags for speech
    let index = text.indexOf('<');
    while (index !== -1) {
      const closeIndex = text.indexOf('>', index + 1);
      if (closeIndex !== -1) {
        text = text.substring(0, index) + text.substring(closeIndex + 1);
        index = text.indexOf('<');
      } else {
        break;       // In case of no close brace, exit loop
      }
    }

    return text;
  }

  /**
   * Build buttons for Avatar bubble.
   *
   * @param responses - responses to be mapped to buttons. Can be array of individual JSON
   * @returns array of buttons
   */
  public buildAvatarResponses(responses: any): void {
    if (responses) {
      if (Array.isArray(responses)) {
        for (let i = 0; i < responses.length; i++) {
          this.buildAvatarResponsesInternal(responses[i]);
        }
      } else {
        this.buildAvatarResponsesInternal(responses);
      }
    }
  }

  /**
   * Build buttons for Avatar bubble.
   *
   * @param responses - responses to be mapped to buttons
   * @returns array of buttons
   */
  private buildAvatarResponsesInternal(responses: any): void {
    // Return if responses is undefined
    if (responses) {
      const type = responses.type;
      switch (type) {
        case 'MenuItems':
          if (this.fSelectionArrayCallback) {
            this.fSelectionArrayCallback(responses.data);
          }
          break;

        case 'Buttons':
          this.setButtons(responses.data);
          break;

        case 'TextField':
          if (this.fTextFieldCallback) {
            this.fTextFieldCallback(responses.data);
          }
          break;

        case 'List':
          if (this.fSetListDataManagerCallback) {
            if (responses.data) {
              const fn = responses.data.bind(this._CSMService.getStateMachineStackService().getStateMachineStateContext());        // Used to do .getThis()
              const listDataManager = fn();
              this.fSetListDataManagerCallback(listDataManager);
            }
          }
          break;
      }
    } else {
      this.fSelectionArrayCallback(undefined);        // Force all UI options to reset
    }
  }

  /**
  * Configure CSM voice.
  *
  * @returns promise
  */
  public async configureAvatarVoice(): Promise<any> {
    // Check if voice is available and has been set up
    if (typeof window.speechSynthesis !== 'undefined') {
      if (this.fVoices.length === 0) {
        this.fVoices = window.speechSynthesis.getVoices();
      }

      // Loop through all voices
      let defaultVoice;
      let voiceSet = false;
      for (let i = 0; i < this.fVoices.length; i++) {
        // Save default voice if found
        if (this.fVoices[i].name === 'Google UK English Female') {
          defaultVoice = this.fVoices[i];
        }

        // Set selected voice, if found
        if (this.fVoices[i].name === this.fSelectedVoice) {
          this.fVoiceInstance = this.fVoices[i];
          voiceSet = true;
          break;
        }
      }

      if (!voiceSet && defaultVoice) {
        this.fVoiceInstance = defaultVoice;
      }
    }

    // Define call-back in case voices change
    if (window.speechSynthesis.onvoiceschanged === undefined) {
      window.speechSynthesis.onvoiceschanged = this.voiceChangeCallback.bind(this);
    }
  }

  /**
   * Reload voices when callback is called.
   */
  public voiceChangeCallback() {
    this.configureAvatarVoice();
  }

  /**
   * Start loading voices when available.
   *
   * This function waits until voices are loaded, then speaks speech that has been queued.
   */
  public loadVoicesWhenAvailable() {
    // Are voices loaded?
    this.fVoices = window.speechSynthesis.getVoices();
    if (this.fVoices.length !== 0) {
      // They are loaded. Configure voices, then speak queued text.
      this.configureAvatarVoice();
      if (this.fTextToSpeak.length > 0) {
        this.speak('');
      }
    } else {
      // They are not loaded. Call this function recursively until they are loaded.
      const fn = this.loadVoicesWhenAvailable.bind(this);
      setTimeout(function () {fn(); }, 10);
    }
  }

  /**
   * Set selected voice.
   *
   * @param selectionVoice voice to use for avatar
   */
  public setVoice(selectedVoice: string): void {
    this.fSelectedVoice = selectedVoice;
    this.configureAvatarVoice();
  }

  /**
   * Register function to be called when avatar image set.
   *
   * @param imageCallback Function to call when image set
   */
  public regForImage(imageCallback: Function): void {
    this.fImageCallback = imageCallback;
    if (this.fCurrentImage && this.fImageCallback) {
      this.fImageCallback(this.fCurrentImage);
    }
  }

  /**
   * Set image to pass to callback at end of speech.
   *
   * @params image image to pass
   */
  public setImageAtEndOfSpeech(image: string) {
    if (image) {
      this.fPendingImage = image;
      if (image.startsWith('afterspeech:')) {
        this.fPendingImage = this.fPendingImage.substring('afterspeech:'.length);
      } else {
        this.sendImage();
      }
    }
  }

  /**
   * Send image to callback immediately.
   */
  public sendImage() {
    if (this.fPendingImage) {
      if (this.fImageCallback && this.fPendingImage && this.fCurrentImage !== this.fPendingImage) {
        this.fImageCallback(this.fPendingImage);
      }
      this.fCurrentImage = this.fPendingImage;
      this.fPendingImage = undefined;
    }
  }

  /**
  * Set Is Currently Speaking state.
  *
  * @isCurrentlySpeaking -  true if is currently speaking state
  */
  public setCurrentlySpeaking(isCurrentlySpeaking: boolean): void {
    //    console.log('Is she speaking? ' + isCurrentlySpeaking);
    this.fCurrentlySpeaking = isCurrentlySpeaking;
  }


  public getCurrentlySpeaking(): boolean {
    return this.fCurrentlySpeaking;
  }

  /**
    * Return if in Auto Start Recognition state.
    *
    * @return true if recognizing
    */
  public isCurrentlySpeaking(): boolean {
    // console.log('isCurrentlySpeaking?: ', this.fCurrentlySpeaking);
    return this.fCurrentlySpeaking;
  }

  /**
   * Register function to be called when speech occurs.
   *
   * @param speechCallback Function to call when speech occurs
   */
  public regForSpeech(speechCallback: any) {
    // console.log('Inside regForSpeech has started', speechCallback);
    this.fSpeechCallback.push(speechCallback);
    for (let cb = 0; cb < this.fSpeechCallback.length; cb++) {
      this.fSpeechCallback[cb](this.fSpokenText);
    }
  }

  /**
   * Send speech to speech callback function.
   *
   * @param text to send to callback
   */
  public sendSpeech(text: string): void {
    if (this.fSpeechCallback) {
      for (let cb = 0; cb < this.fSpeechCallback.length; cb++) {
        this.fSpeechCallback[cb](text);
      }
    }
    this.fSpokenText = text;
  }

  /**
   * @function regForSpeechEnds
   * @description is Lucy speaking or not
   * @argument NA
   * @returns Nothing
   */
  public regForSpeechIsFinished(fCallbackLucySpeaks: Function): void {
    // console.log('***************regForSpeechIsFinished in speech service ************', fCallbackLucySpeaks);
    this.speechFinishedCallback = fCallbackLucySpeaks;
  }

  // endOfSpeech function then calls this.
  public setSpeechIsFinished(): void {
    // console.log('***************SetSpeechIsFinished************', this.fCurrentlySpeaking);
    if (this.speechFinishedCallback) {
      // console.log('***************SpeechFinishedCallback************', this.fCurrentlySpeaking);
      this.speechFinishedCallback(this.isCurrentlySpeaking);
    }
  }


  /**
   * Get current speech selection.
   *
   * @return current speech selection
   */
  public getSpeech(): string {
    return this.fSpeech;
  }

  /**
   * Set speech selection.
   *
   * @param speech
   */
  public setSpeech(speech: string): void {
    this.fSpeech = speech;
  }

  /**
   * Register callback for accepted response.
   *
   * @param acceptedResponseCallBack Function to call for accepted response
   */
  public regForAcceptedResponse(acceptedResponseCallBack: any): void {
    this.fAcceptedResponseCallback = acceptedResponseCallBack;
  }

  /**
   * Flag to not show user speech.
   */
  public dontShowUserSpeech(): void {
    this.dontShowUserSpeechFlag = true;
  }

  /**
   * Flag to show user speech.
   */
  public showUserSpeech(): void {
    this.dontShowUserSpeechFlag = false;
  }

  /**
   * Set to .
   *
   * @param response value to send to callback
   */
  public sendAcceptedResponse(response: string): void {
    if (!this.dontShowUserSpeechFlag && this.fAcceptedResponseCallback) {
      this.fAcceptedResponseCallback(response);
    }
  }

  /**
   * Register callback for buttons.
   *
   * @param buttonArrayCallback Function to call when buttons defined
   */
  public regForButtonArray(buttonArrayCallback: Function) {
    this.fButtonArrayCallback = buttonArrayCallback;
  }

  /**
   * Call Function to set buttons.
   *
   * @param buttons buttons to pass to callback function
   */
  public setButtons(buttons: string): void {
    if (this.fButtonArrayCallback) {
      this.fButtonArrayCallback(buttons);     // Cause all generated UI items to clear
    }
  }

  /**
   * @function resetControls()
   * @description resets all controls so that it can remove the buttons once clicked
   * @argument none
   * @returns nothing
   */
  public resetControls(): void {
    if (this.fSelectionArrayCallback) {
      this.fSelectionArrayCallback(null);
    }

    this.setButtons(null);

    if (this.fTextFieldCallback) {
      this.fTextFieldCallback(null);
    }

    if (this.fSetListDataManagerCallback) {
      this.fSetListDataManagerCallback(null);
    }

  }

  /**
   * Register callback for selection.
   *
   * @param selectionArrayCallback Function to call when selection defined
   */
  public regForSelectionArray(selectionArrayCallback: Function) {
    this.fSelectionArrayCallback = selectionArrayCallback;
  }

  /**
   * Register callback for text field definition.
   *
   * @param textFieldCallback Function to call when text field defined
   */
  public regForTextField(textFieldCallback: Function) {
    this.fTextFieldCallback = textFieldCallback;
  }

  /**
   * Register callback for list definition.
   *
   * @param listDataManagerCallback Function to call list field defined
   */
  public regForListDataManager(listDataManagerCallback: Function) {
    this.fSetListDataManagerCallback = listDataManagerCallback;
  }

  /**
   * Register callback for graph definition.
   *
   * @param graphDataCallback Function to call graph defined
   */
  public regForGraphData(graphDataCallback: Function) {
    this.fGraphDataCallback = graphDataCallback;
  }

  /**
   * Call Function to graph data.
   *
   * @param chartData chartData to pass to callback function
   */
  public setGraphData(chartData: any): void {
    if (this.fGraphDataCallback) {
      this.fGraphDataCallback(chartData);     // Push chart data
    }
  }


  public regForIsSheSpeaking(isSheSpeakingCallback: Function) {

  }

  public cancelSpeech(): void {
    window.speechSynthesis.cancel();
  }
}

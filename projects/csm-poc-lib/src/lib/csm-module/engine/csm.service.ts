import {Injectable} from '@angular/core';
import {SynonymVoiceService} from './synonym-voice.service';
import {UtilVoiceService} from './util-voice.service';
import {NLUMatchService} from './nlu-match.service';
import {SpeechService} from './speech.service';
import {ListenService} from './listen.service';
import {ProcessCommandService} from './process-command.service';
import {ConversationManager} from '../conversations/conversation.service';
import {StateMachineService} from './state-machine.service';
import {StateMachineStackService} from './state-machine-stack.service';
import {DescriptionService} from '../description/description.service';
import {LanguageParserService} from './language-parser.service';
import {StateMachine} from '../state-machine/state-machine';


/**
* Conversational State Machine (CSM) main controller.
*/
@Injectable({ providedIn: 'root', })
export class CSMService {

    private fSilence = false;
    private fUser: any;
    private fValidUser = false;
    private fContinuousListen = true;
    private fUserObject: any;
    private fIsLucySpeaking: boolean;
  private listening = true;

    /**
     * Constructor.
     *
     * @param _SynonymVoiceService Synonym service
     * @param _UtilVoiceService Utility service
     * @param _DescriptionService Description service
     * @param _LanguageParserService Service for parsing English Language parts of speech
     * @param _NLUMatchService Service for matching English Language parts of speech
     * @param _SpeechService Service for speaking CSM commands
     * @param _ListenService Service for listening for CSM commands
     * @param _ProcessCommandService Service for processing and executing CSM commands
     * @param _StateMachineService Service for managing State Machines and transitions
     * @param _StateMachineStackService Service for managing State Machines stacks
     */
    constructor(
        private _SynonymVoiceService: SynonymVoiceService,
        private _UtilVoiceService: UtilVoiceService,
        private _DescriptionService: DescriptionService,
        private _LanguageParserService: LanguageParserService,
        private _NLUMatchService: NLUMatchService,
        private _SpeechService: SpeechService,
        private _ListenService: ListenService,
        private _ProcessCommandService: ProcessCommandService,
        private _StateMachineService: StateMachineService,
        private _StateMachineStackService: StateMachineStackService,
        private _ConversationManager: ConversationManager
    ) {
        // Set referemce tp CSMServoce into individual services. This prevents circular references.
        this._SpeechService.setCSMService(this);
        this._ListenService.setCSMService(this);
        this._ProcessCommandService.setCSMService(this);
        this._StateMachineService.setCSMService(this);
        this._StateMachineStackService.setCSMService(this);
    }

    public getState(): string {
        return this._ProcessCommandService.fCurrentState;
    }

    /**
     * Cancel current speech.
     */
    public stop(): void {
        // this._utteranceCache.cancel();
        window.speechSynthesis.cancel();
    }

    /**
     * Return if the CSM is enabled.
     *
     * @param true if CMS is enabled
     */
    public async getAvatarEnabled(): Promise<boolean> {
        // Determine if CSM is enabled
        let enabled = false;
        const user = this.getUser();
        if (this.fValidUser) {
            enabled = (<any> user).enableAvatar;
            this._DescriptionService.updateUserAvatarEnable(enabled);
        }

        // Return result
        return enabled;
    }

    /**
   * This method needs to be cleaned up with the others. Sloppy.
   */
  public disableListening(): void {
      this.listening = false;
  }

  /**
   * This method needs to be cleaned up with the others. Sloppy.
   */
  public enableListening(): void {
      this.listening = true;
  }

  /**
   * This method needs to be cleaned up with the others. Sloppy.
   */
  public isListening(): boolean {
      return this.listening;
  }

  /**
      * Turn off listening.
      */
    public disableMicrophone(mic: object): void {
        // Silence CSM
        this.fContinuousListen = false;

        // Accessing the audioContext and turning OFF the mic
        // console.log('Mic Object: ', mic);
        this._StateMachineService.isUserMediaGood(this.fContinuousListen);
        return;
    }

    /**
     * Turn on listening.
     */
    public enableMicrophone(): void {
        // Flag that CSM is listening
        this.fContinuousListen = true;
        this._ListenService.startVoiceRecognitionEx();
    }

    /**
      * Return if microphone is on.
      *
      * @returns true if microphone is on
      */
    public isMicrophoneOn(): boolean {
        return this.fContinuousListen;
    }

    /**
     * Turn on listening.
     */
    public enableSpeaker(): void {
        // Flag that CSM is listening
        this.fSilence = false;
        this._DescriptionService.updateSpeak(true);
    }

    /**
      * Turn off listening.
      */
    public disableSpeaker(): void {
        // Silence CSM
        this.fSilence = true;
        this._DescriptionService.updateSpeak(false);
    }

    /**
     * Return if speaker is on, ie, if avatar is allowed to talk.
     *
     *@returns true if speaker is on
     */
    public isSpeakerOn(): boolean {
        return !this.fSilence;
    }

    /**
     * Get user name and information.
     *
     *  This function should be moved to a solution library.
     *
     *  @return user object
     */
    public async getUser(): Promise<any> {
        // If user object not ready, wait 1 second, or until it is ready
        let count = 0;
        while (!this.fValidUser && count++ < 10) {
            await this.sleep(100);
        }

        // Return user if it is valid
        let user;
        if (this.fValidUser) {
            user = this.fUser;
        }

        // Return user
        return user;
    }

    /**
     * Set user object that can be used for any purpose.
     * This is generally used to set a context-sensitive object for use by State Machines.
     *
     * @param userObject User object for any use
     */
    public setUserObject(userObject: any): void {
        this.fUserObject = userObject;
    }

    /**
     * Return user object that can be used for any purpose.
     *
     * @returns user object
     */
    public getUserObject(): any {
        return this.fUserObject;
    }

    /**
     * Add state machine.
     *
     * @param stateMachine - State Machine to add
     */
    public addStateMachine(stateMachine: StateMachine): boolean {
        return this._StateMachineService.addStateMachine(stateMachine);
    }

    /**
     * Remove state machine.
     *
     * @param stateMachine - State Machine to remove
     */
    public removeStateMachine(stateMachine: StateMachine): void {
        this._StateMachineService.removeStateMachine(stateMachine);
    }

    /**
     * Start state machine and set to initial state (optional).
     *
     * @param State Machine to add
     * @param initialState (optional) starting state for State Machine
     */
    public startStateMachine(stateMachine: StateMachine, initialState?: string): void {
        this._StateMachineService.startStateMachine(stateMachine, initialState);
    }

    /**
     * Enter state of state machine.
     *
     * @param command - new state of state machine. For example, 'base'. The command can be in form: 'command.name'
     * @param name - optional name of state machine
    */
    public async enterState(command: string, name?: string, x?: number, y?: number): Promise<any> {
        return this._ProcessCommandService.enterState(command, name, x, y);
    }

    /**
     * Get SpeechService.
     *
     * @returns SpeechService
     */
    public getSpeechService(): SpeechService {
        return this._SpeechService;
    }

    /**
     * Get ListenService.
     *
     * @returns ListenService
     */
    public getListenService(): ListenService {
        return this._ListenService;
    }

    /**
     * Get SynonymVoiceService.
     *
     * @returns SynonymVoiceService
     */
    public getSynonymVoiceService(): SynonymVoiceService {
        return this._SynonymVoiceService;
    }

    /**
     * Get NLUMatchService.
     *
     * @returns NLUMatchService
     */
    public getNLUMatchService(): NLUMatchService {
        return this._NLUMatchService;
    }

    /**
     * Get NotificationManager.
     *
     * @returns NotificationManager
     */
    public getConversationManager(): ConversationManager {
        return this._ConversationManager;
    }

    /**
     * Get UtilVoiceService.
     *
     * @returns UtilVoiceService
     */
    public getUtilVoiceService(): UtilVoiceService {
        return this._UtilVoiceService;
    }

    /**
     * Get LanguageParserService.
     *
     * @returns LanguageParserService
     */
    public getLanguageParserService(): LanguageParserService {
        return this._LanguageParserService;
    }

    /**
     * Get ProcessCommandService.
     *
     * @returns ProcessCommandService
     */
    public getProcessCommandService(): ProcessCommandService {
        return this._ProcessCommandService;
    }

    /**
     * Get StateMachineService.
     *
     * @returns StateMachineService
     */
    public getStateMachineService(): StateMachineService {
        return this._StateMachineService;
    }

    /**
     * Get StateMachineStackService.
     *
     * @returns StateMachineStackService
     */
    public getStateMachineStackService(): StateMachineStackService {
        return this._StateMachineStackService;
    }

    /**
     * Get DescriptionService.
     *
     * @returns DescriptionService
     */
    public getDescriptionService(): DescriptionService {
        return this._DescriptionService;
    }

    /**
     * Register to be called when final text is determined.
     *
     * @param textCallBack Function to call when final text is determined from speech
     *
     */
    public regForFinalText(textCallBack: Function) {
        this._ProcessCommandService.regForFinalText(textCallBack);
    }

    /**
     * Register to be called when parts of speech are determined.
     *
     * @param textCallBack Function to call when parts of speech are determined from speech
     *
     */
    public regForPartsOfSpeech(partsCallBack: Function) {
        this._ProcessCommandService.regForPartsOfSpeech(partsCallBack);
    }

    /**
     * Register for speech parameters.
     *
     * @@param speechParameterCallback - method to call when parameters are extracted
     */
    public regForSpeechParameters(speechParameterCallback: Function) {
        this._ProcessCommandService.regForSpeechParameters(speechParameterCallback);
    }

    /**
     * Register to know when end of chat occurs.
     *
     * @@param endOfChatCallback - method to call when end of chat occurs
     */
    public regForEndOfChat(endOfChatCallback: Function) {
        this._ProcessCommandService.regForEndOfChat(endOfChatCallback);
    }

    /**
     * Register to know when ChatBot location is set.
     *
     * @@param chatBotLocationCallback - method to call when ChatBot location is set
     */
    public regForChatBotLocation(chatBotLocationCallback: Function) {
        this._ProcessCommandService.regForChatBotLocation(chatBotLocationCallback);
    }

    /**
     * Register to know when response is accepted.
     *
     * @@param acceptedResponseCallBack - method to call when response is accepted
     */
    public regForAcceptedResponse(acceptedResponseCallBack: Function) {
        this._SpeechService.regForAcceptedResponse(acceptedResponseCallBack);
    }

    /**
     * Register to set menu option control.
     *
     * @@param optionsCallback - method to set menu option control
     */
    public regForOptions(optionsCallback: Function) {
        this._ListenService.regForOptions(optionsCallback);
    }

    /**
     * Register to set button controls.
     *
     * @@param buttonArrayCallback - method to set button controls
     */
    public regForButtonArray(buttonArrayCallback: Function) {
        this._SpeechService.regForButtonArray(buttonArrayCallback);
    }

    /**
     * Register to set selection control.
     *
     * @@param selectionArrayCallback - method to set button control
     */
    public regForSelectionArray(selectionArrayCallback: Function) {
        this._SpeechService.regForSelectionArray(selectionArrayCallback);
    }

    /**
     * Register to set text control.
     *
     * @@param textFieldCallback - method to set text controls
     */
    public regForTextField(textFieldCallback: Function) {
        this._SpeechService.regForTextField(textFieldCallback);
    }

    /**
     * Register to set list control.
     *
     * @@param setListDataManagerCallback - method to set list control
     */
    public regForListDataManager(setListDataManagerCallback: Function) {
        this._SpeechService.regForListDataManager(setListDataManagerCallback);
    }

    /**
     * Register to set graph control.
     *
     * @@param graphDataCallback - method to set graph control
     */
    public regForGraphData(graphDataCallback: Function) {
        this._SpeechService.regForGraphData(graphDataCallback);
    }

    /**
     * Register to listen for possible commands.
     *
     * @@param possibleCommandsCallback - method to listen for possible commands
     */
    public regForPossibleCommands(possibleCommandsCallback: Function) {
        this._StateMachineService.regForPossibleCommands(possibleCommandsCallback);
    }


    /**
     * UnRegisters from listening for possible commands.
     *
     * @params nothing
     * @returns nothing
     */
    public unRegForPossibleCommands() {
        this._StateMachineService.unRegForPossibleCommands();
    }

    /**
     * Sleep for a specified number of millis. Utility method. Sleeping is bad practice and should be resolved in all modules.
     *
     * @param ms - number of ms to sleep for
     */
    public sleep(ms: any): any {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * @functions regForSpeechEnds
     * @description is Lucy speaking or not
     * @arguments NA
     * @returns Nothing
     */
    public regForSpeechIsFinished(fCallbackLucySpeaks: Function): void {
        // console.log('>>>>>>>>regForSpeechIsFinished<<<<<<<<<<<<<<', fCallbackLucySpeaks);
        this._SpeechService.regForSpeechIsFinished(fCallbackLucySpeaks);
    }



    /**
       * Utility method to dump current stack trace for debugging purposes.
       *
       * commented out due to arguments.callee.caller is forbidden
       *
       */
    public stacktrace() {
        function st2(f: any): any {
            return !f ? [] :
                st2(f.caller).concat([f.toString().split('(')[0].substring(9) + '(' + f.arguments.join(',') + ')']);
        }

        let result;
        try {
            result = st2(arguments);
        } catch (err) {
            console.log(err);
        }

        return result;
    }
}

import {Injectable} from '@angular/core';
import {CSMService} from './csm.service';
import {StateMachineStackService} from './state-machine-stack.service';
import {StateMachineService} from './state-machine.service';
// import will change when interface is moved.
import {LucySpeech} from '../services/mssql-connect.service';
import {LucyQandAService} from '../services/lucy-q-and-a.service';

/**
 * Command processor service.
 */
@Injectable({ providedIn: 'root', })
export class ProcessCommandService {

  private _CSMService: CSMService;
  private _StateMachineStackService: StateMachineStackService;
  private _StateMachineService: StateMachineService;

  private fError: any;
  private fActionIndex: number;
  private fCommandHistory: any[] = [];
  private fAction: any;
  private fPreviousLastCommand: any;
  private fUserSays: string;
  private fLastCommand: any;

  private fBeforeStackState: string;
  private fAfterStackState: string;
  private fDisableStack: boolean;

  private fFinalTextCallback: Function;
  private fPartsSpeechCallback: Function;
  private fSpeechParametersCallback: Function;
  private fEndOfChatCallback: Function;
  private fChatBotLocationCallback: Function;
  private fStateChangeCallback: Function;
  private fCommandExecutedCallback: Function;
  private voiceCommands: string[] = [];
  public finalSpeechResp: LucySpeech;
  fRejectCommandCallback: Function;
  public fCurrentState: string;
  private fStateQueue: string[] = [];

  /**
   * Constructor.
   */
  constructor(
    private lucyQandAService: LucyQandAService
  ) {}

  /**
   * Set CSMService.
   *
   * @param _CSMService - CSMService object
   */
  public setCSMService(_CSMService: CSMService): void {
    this._CSMService = _CSMService;
    this._StateMachineStackService = _CSMService.getStateMachineStackService();
    this._StateMachineService = _CSMService.getStateMachineService();
  }

  /**
   * Change state of state machine.
   *
   * @param command - new state of state machine. For example, 'base'. The command can be in form: 'command.name'
   * @param name - optional name of state machine.
   */
  public enterState(command: string, name?: string, x?: number, y?: number): void {
    if (command !== this.fCurrentState) {
      this.enterJSONState(command, name, x, y);
    }
  }

  /**
   * Change state of state machine.
   *
   * @param command - new state of state machine. For example, 'base'. The command can be in form: 'command.name'
   * @param name - optional name of state machine
   */
  public enterJSONState(command: string, name?: string, x?: number, y?: number): void {
    // Call registered callback if state changes
    this.fCurrentState = command;
    if (this.fStateChangeCallback) {
      this.fStateChangeCallback(command);
    }

    // Check if going to 'base' state. If true, allow user speech to be shown.
    if (command === 'base') {
      this._CSMService.getSpeechService().showUserSpeech();
    }

    // Exit if there is no command
    if (command === undefined || command === null || command.length === 0) {
      return;
    }

    // Split command from name using '.'
    if (command.toString().indexOf('.') !== -1) {
      const split = command.split('.');
      if (split.length === 2) {
        command = split[1];
        name = split[0];
      }
    }

    // Select state machine
    if (!this._StateMachineService.updateStateMachine(command, name)) {
      this._CSMService.sleep(100);
      if (!this._StateMachineService.updateStateMachine(command, name)) {
        return;
      }
    }

    // Move LucyBot window relative to x, y
    if (x) {
      this.setChatBotLocation(x, y);
    }

    // Process command
    this.internalProcessStateMachineCommand();

    // whenever we change a state, remove buttons so Lucy bot window can be hidden.
    if (command === 'base') {
      this._CSMService.getSpeechService().resetControls();
      this.setEndOfChat(true);
    }

    // Inform Notification Manager if CSM is idle
    this._CSMService.getConversationManager().setIdle(command === 'base');
  }


  /**
   * Return current state.
   */
  public getCurrentState(): string {
    return this.fCurrentState;
  }

  /**
   * Process state machine command.
   *
   * @returns false if no computerDoes actions
   */
  public internalProcessStateMachineCommand(): any {
    // Check for pass through state, such as only voice with no user input for the actions
    const stateMachineState = this._StateMachineStackService.getStateMachineState();
    if (stateMachineState === undefined || stateMachineState.actions === undefined) {
      return;
    }

    const action: any = stateMachineState.actions[0];
    let computerDoes: any;
    if (action) {
      if (!action.userSays && action.computerDoes) {
        computerDoes = action.computerDoes;
      }
    }

    // Read Avatar description, and set up response buttons
    const readDescription: any = stateMachineState.readDescription;
    if (readDescription) {
      // Get description here. This used to get the description from the section. Now it must be set.
      const description = '';

      // If there is something to read, turn off auto start recognition
      if (description.length > 0) {
        this._CSMService.getListenService().setAutoStartRecognition(false);
      }

      // Speak description
      this._CSMService.getSpeechService().speak(description, stateMachineState.responses, true);
    } else {
      // There is no section (default) description. Process voice from state machine
      const say: any = stateMachineState.computerSays;
      if (say) {
        // If there is no conditional, say 'computerSays'
        let says: any;
        if (say.conditional === undefined) {
          says = say;
        } else {
          // If there is conditional process it
          for (let i = 0; i < say.conditional.length; i++) {
            const condition: any = say.conditional[i].condition;
            const result: any = this.evalConditional(condition);
            if (result === true) {
              says = say.conditional[i].says;
              break;
            }
          }
          if (says === undefined) {
            if (say.default !== undefined) {
              says = say.default;
            }
          }
        }

        // Say text
        if (says !== undefined) {
          // Assemble full text from array of parts
          let speechText = '';
          for (let i = 0; i < says.length; i++) {
            let speech = says[i];
            if (speech instanceof Function) {
              speech = speech.bind(this._StateMachineStackService.getStateMachineStateContext().getThis());
              speech = speech();
            } else {
              try {
                if (speech.startsWith('function')) {
                  const fnStr = 'var f = function(){return ' + speech + '};f();';
                  let fn = eval(fnStr); // tslint:disable-line
                  fn = fn.bind(this._StateMachineStackService.getStateMachineStateContext().getThis());
                  speech = fn();
                }
              } catch (exception) {
                console.log('speech.startsWith caused an exception -- please fix.');
              }
            }
            speechText += ' ' + speech;
          }

          // Speak text if there is any
          if (speechText.length > 0) {
            // Turn auto start recognition off
            this._CSMService.getListenService().setAutoStartRecognition(false);

            // Speak speechText
            this._CSMService.getSpeechService().speak(speechText, stateMachineState.responses, undefined, undefined);
          }
        }
      }
    }

    // Execute computerDoes
    let error: any;
    if (computerDoes) {
      this._CSMService.getSpeechService().resetControls();
      for (let j = 0; j < computerDoes.length && !error; j++) {
        error = this.executeAction(computerDoes[j], []);
      }
    }
    return error;
  }

  /**
   * Execute all computer does actions.
   *
   * @param action - array of actions to be executed
   * @param userSays - user voice input
   * @param errorList - array of errors
   */
  public executeComputerDoesAction(action: any, userSays: string[], errorList: any): void {
    // Execute all computerDoes actions
    this.fError = false;
    for (let i = 0; i < action.length && !this.fError; i++) {
      this.fError = this.executeAction(action[i], userSays);
    }

    // Handle error processing
    if (this.fError) {
      if (this._StateMachineStackService.getStateMachineState().failure) {
        this.reportFailure();
      } else {
        if (errorList) {
          for (let i = 0; i < errorList.length; i++) {
            this.executeAction(errorList[i], userSays);
          }
        }
      }
    }
  }

  /**
   * Speak that operation was a success.
   */
  public reportSuccess(): void {
    const speak: string = this._CSMService.getSynonymVoiceService().getCompleted();
    this._CSMService.getSpeechService().speak(speak);
  }

  /**
   * Speak that operation was a failure.
   */
  public reportFailure(): void {
    const speak: string = this._CSMService.getSynonymVoiceService().getNotCompleted();
    this._CSMService.getSpeechService().speak(speak);
  }

  /**
   * Execute action. Can be function, or new state for machine, for example, 'base'.
   *
   * @params action can be function, or new state for machine, for example, 'base'
   */
  public executeAction(action: any, userSays: string[]): boolean {
    let error: any;

    // Execute Javascript Function
    if (action instanceof Function) {
      try {
        const fn = action.bind(this._StateMachineStackService.getStateMachineStateContext().getThis());
        error = fn(userSays);
      } catch (err) {
        console.error('ProcessCommandService.executeAction - Error calling function! ', err);
      }
    } else if (typeof action === 'string' && action.startsWith('function')) {
      try {
        // Execute Javascript function specified in String
        const fnStr = 'var f = function(){return ' + action + '};f();';
        let fn = eval(fnStr); // tslint:disable-line
        fn = fn.bind(this._StateMachineStackService.getStateMachineStateContext().getThis());
        error = fn(userSays);
      } catch (err) {
        console.error('ProcessCommandService.executeAction - Error calling typeOf action and starts with! ', err);
      }
    } else if (action === 'endThread') {
      // Traverse to specified state machine
      try {
        // Execute endThread action
        // Used to restore to startThread state
        this._StateMachineStackService.endThread();
      } catch (err) {
        console.error('ProcessCommandService.executeAction - Error calling action endThread! ', err);
      }
    } else if (action === 'success') {
      // Traverse to specified state machine
      try {
        // Execute success action
        this.reportSuccess();
      } catch (err) {
        console.error('ProcessCommandService.executeAction - Error calling reportSuccess! ' + err);
      }
    } else if (action.startsWith('say:')) {
      // Traverse to specified state machine
      try {
        // Execute 'say'
        this._CSMService.getSpeechService().speak(action.substring('say:'.length));
        // this._CSMService.getSpeechService().setButtons(undefined); // Cause all generated UI items to clear
      } catch (err) {
        console.error('ProcessCommandService.executeAction - Error calling CSMService.getSpeechService().speak! ' + err);
      }
    } else if (action.toLowerCase().startsWith('endofchat:')) {
      console.error('End of Chat is now Deprecated... Do Not Use...');
    } else {
      // Traverse to specified state machine
      try {
        error = this.enterJSONState(action);
      } catch (err) {
        console.error('Error! ' + err);
      }
    }

    return error;
  }

  /**
   * Evaluate condition.
   *
   * @params condition
   * @returns evaluation of condition
   */
  public async evalConditional(str: string): Promise<any> {
    let copy: string = str.slice(0);
    const regex: any = new RegExp('\{\{([$@#a-zA-Z0-9_.-]+)\}\}', 'gm');
    let array: any;
    while ((array = regex.exec(str)) !== null) {
      const bool: any = true;
      //            const tag: any = await this.getTag(array[1]);
      //            if (tag === undefined || tag.length === 0) {
      //                bool = false;
      //            }
      copy = copy.replace(array[0], bool);
    }
    // console.log('Original: ', str);
    // console.log('Copy: ', copy);
    const result: any = eval(copy); // tslint:disable-line
    // console.log('Result: ', result);
    return result;
  }

  /**
   * Get all user says variants.
   *
   * @param userSays - array of responses the user can have
   * @returns string array of all possible variants fully qualified with variants
   */
  public getUserSaysVariants(userSays: string[]): string[] {
    const variants: string[] = [];

    // Process each command for variants
    for (let i = 0; i < userSays.length; i++) {
      this.addVariant(variants, userSays[i]);
    }
    return variants;
  }

  /**
   * Add all variants specified in string.
   *
   * The following string will expand to all possible variants: 'Hello {world,universe,ant hill,}.
   * An empty string can be included to make the variant optional.
   *
   * @param variants - array of variant strings
   * @param userSays - current string
   */
  public addVariant(variants: string[], userSays: string): void {
    // Check if there is a variant
    let index = userSays.indexOf('[[');
    if (index === -1) {
      let pos = this._CSMService.getNLUMatchService().getPOS(userSays);         // Expand parts of speech
      while (pos.indexOf('&') !== -1) {
        pos = pos.replace('&', '/');           // Convert & to proper / to eliminated recursion.
      }
      // console.log('.......', pos);
      variants.push(pos);
    } else {

      // Get first part of phrase
      const firstStr = userSays.substring(0, index);
      userSays = userSays.substring(index + 2);

      // Get middle and last parts of phrase
      index = userSays.indexOf(']]');
      if (index !== -1) {
        const variant = userSays.substring(0, index);
        const secondStr = userSays.substring(index + 2);

        // Build strings out of variants
        const variantList = variant.split(',');
        for (let i = 0; i < variantList.length; i++) {
          let newString = firstStr + variantList[i] + secondStr;

          while (newString.indexOf('  ') !== -1) {
            newString = newString.replace('  ', ' ');
          }
          this.addVariant(variants, newString.trim());
        }
      }
    }
  }

  /**
   * Return string array of possible responses in state state-machines.
   *
   * @returns string array of possible responses in state state-machines
   */
  public getPossibleResponses(): string[] {
    // Iterate through all possible user responses
    const results = [];

    this._StateMachineService.updateStateMachine('base');
    if (this._StateMachineService.getStateMachineProcessingStates()) {
      for (let i = 0; i < this._StateMachineService.getStateMachineProcessingStates().length; i++) {
        this._StateMachineStackService.setStateMachineState(this._StateMachineService.getStateMachineProcessingStates()[i]);
        const actions = this._StateMachineStackService.getStateMachineState().actions;
        for (let j = 0; j < actions.length; j++) {

          // Check all states in state machine for match to command
          const example = actions[j].example;
          if (example) {
            // Check for match or partial match
            results.push(example);
          }
        }
      }
    }

    return results;
  }

  /**
   * Process state machine command and response
   *
   * @param command - command to process
   * @param response - buttons that can optionally be added to Avatar bubble
   */
  public processStateMachineCommandAndResponse(command: string, response?: string): void {
    // Process state machine command and response
    this.enterState(command);
    this.processStateMachineResponse(response);
  }

  /**
   * Process main and secondary spoken options to find and execute user response.
   *
   * @params mainOption main text spoken by user
   * @params secondaryOptions array of additional options that were spoken by user
   */
  public processStateMachineResponse(mainOption: any, cancelSpeech?: boolean): void {
    // Send response to tape
    // this._CSMService.getSpeechService().sendAcceptedResponse(mainOption);

    if (cancelSpeech) {
      this._CSMService.getSpeechService().cancelSpeech();
    }

    // Save current stack state
    this.fBeforeStackState = this._StateMachineStackService.getStackState();

    let voiceCommands = [mainOption];

    // Remove duplicate entries
    const set = new Set(voiceCommands);
    voiceCommands = [];
    set.forEach(x => voiceCommands.push(x));

    this._CSMService.getStateMachineService().setCurrentStateMachineIndex(this._StateMachineService.getStateMachineProcessingIndex(0));

    // This is set outside this file. Not sure what it is doing.  This is old Kalani stuff.
    // if (this._stateMachineState.checkBase === 'true') {
    //  this.processStateMachineCommandAndResponse('base', mainOption);
    // }

    // Restore stack state
    this.fAfterStackState = this._StateMachineStackService.getStackState();

    const voiceCommandsFixed = this._CSMService.getUtilVoiceService().translate(voiceCommands[0]);
    this.fUserSays = voiceCommands[0];

    // nlp-service call and when response is provided, moves along to the rest of command processing.
    this.lucyQandAService.postcsmSpeech([voiceCommandsFixed]).subscribe(
      (res) => {
        this.finalSpeechResp = res;
        const actionExecuted = this.processAllResponses(voiceCommands);
        // Restore stack state
        this.fAfterStackState = this._StateMachineStackService.getStackState();

        const stackState = {
          before: this.fBeforeStackState,
          after: this.fAfterStackState,
          interim: this._StateMachineStackService.getInterimStackState(),
          actionFound: actionExecuted,
          // actionIndex: actionIndex,
          action: this.fAction,
          main: mainOption,
          error: this.fError
        };
        if (this.fDisableStack !== true) {
          const length: number = this._StateMachineStackService.pushToStack(stackState);
        }
      },
      error => {
        console.log('SpeechError:', error);
        return error;

      });
  }

  /**
   * Process all speech responses. Use 2 tier approach to respect commands that are marked for processing last.
   *
   * @params voiceCommands - voice commands to check against state machine commands
   * any should be changed to boolean (see if works)
   */
  public processAllResponses(voiceCommands: string[]): any {
    // If evaluateRawSpeech is undefined, then execute evaluate first and second passes to assure that
    if (this.fCommandExecutedCallback) {
      this.fCommandExecutedCallback(null, 0);
    }
    let actionExecuted = this.processAllResponsesImpl(voiceCommands, false);
    if (!actionExecuted) {
      actionExecuted = this.processAllResponsesImpl(voiceCommands, true);
    }

    return actionExecuted;
  }

  /**
   * Process all speech responses. Use 2 tier approach to respect commands that are marked for processing last.
   *
   * @param voiceCommands - voice commands to check against state machine commands
   * @param evaluateRawSpeech - true if 'processLast' commands should be evaluated, else all other commands
   */
  public processAllResponsesImpl(voiceCommands: string[], processLast: boolean): any {
    let actionExecuted: any;
    for (let i = 0; i < this._StateMachineService.getStateMachineProcessingStates().length && !actionExecuted; i++) {
      this._StateMachineStackService.setStateMachineState(this._StateMachineService.getStateMachineProcessingStates()[i]);
      this._StateMachineStackService.setStateMachineStateContext(this._StateMachineService.getStateMachineProcessingStatesContext()[i]);
      for (let j = 0; j < voiceCommands.length && !actionExecuted; j++) {
        actionExecuted = this.processLucySpeechResponse(voiceCommands[j],
          processLast, this._StateMachineStackService.getStateMachineStateName(),
          this._StateMachineStackService.getStateMachineStateContext().getName());
        // actionExecuted = this.processSpecificResponse(voiceCommands[j], processLast,
        // this._StateMachineStackService.getStateMachineStateName(),
        // this._StateMachineStackService.getStateMachineStateContext().getName());
      }
    }
    return actionExecuted;
  }


  /**
   * Filter out LUCY POC response to the original state machines
   *
   * Provides responses to the help questions from the nlp-service
   *
   */
  public processLucySpeechResponse(userSays: string, processLast: boolean, stateMachineName?: string, stateMachineState?: string): any {
    let actionExecuted = false;
    let executionContext: string;
    // Ignore all commands if Avatar is disabled
    if (!this._CSMService.getListenService().isAvatarEnabled()) {
      return;
    }

    this.fDisableStack = undefined;

    // Iterate through all possible user responses

    const actions = this._StateMachineStackService.getStateMachineState().actions;

    for (let i = 0; actions && i < actions.length && !actionExecuted; i++) {
      // Funky state - change state to base
      if (actions[i].userSays === undefined) {
        this._StateMachineService.updateStateMachine('base');
        return;
      }
      let userSaysVariants = actions[i].userSays;

      // Process variants, and cache
      if (!actions[i].preprocessed) {
        userSaysVariants = this.getUserSaysVariants(userSaysVariants);
        actions[i].userSays = userSaysVariants;
        actions[i].preprocessed = 'true';
      }

      // Manage 2 phase processing of commands. Any command marked as "processLast" will
      // be processed after all other commands have been processed
      let response: any;
      // this conditional isn't needed for the help commands.
      if (!processLast && !actions[i].processLast || processLast && actions[i].processLast) {
        // Evaluate each command and act if a command is matched
        for (let j = 0; j < userSaysVariants.length && !actionExecuted; j++) {
          // Check for match or partial match
          response = userSaysVariants[j];
          let speechResponse = userSays.toLowerCase() === response.toLowerCase() ? [] : undefined;
          let results;
          if (!speechResponse && this.finalSpeechResp !== null) {
            // processes state machine commands
            if (userSaysVariants[j] === this.finalSpeechResp.commandVariant) {
              results = this.finalSpeechResp.matchResults;
              // processes help commands from nlp-service
            } else if (this.finalSpeechResp && this.finalSpeechResp.computerDoes[0] !== 'empty' && response !== '<speech>') {
              actions[i].computerDoes = this.finalSpeechResp.computerDoes;
              actions[i].error = undefined;
              this.executeComputerDoesAction(actions[i].computerDoes, [this.finalSpeechResp.commandVariant], actions[i].error);
              results = this.finalSpeechResp.originalUserSpeech;
            } else {
              results = [];
            }

            speechResponse = results && results.length > 0 ? [] : undefined;
          }

          if (speechResponse || response === '<speech>') {

            // Got a speech response
            if (actions[i].conversation === 'true' && (actions[i].dontShowInTape === undefined || !actions[i].dontShowInTape)) {
              this._CSMService.getSpeechService().sendAcceptedResponse(userSays);
            }

            // Check for voice change
            if (actions[i].voice) {
              this._CSMService.getSpeechService().setVoice(actions[i].voice);
            }

            // Check if image should change
            this._CSMService.getSpeechService().setImageAtEndOfSpeech(actions[i].image);

            // Save command history in case user asks for it
            this.fPreviousLastCommand = this.fLastCommand;
            // this was the originalUserSays
            this.fLastCommand = this.voiceCommands[0];

            // Handle speech-specific logic
            if (response === '<speech>') {
              this._CSMService.getSpeechService().setSpeech(userSays);
              speechResponse = [userSays];
            } else if (this.finalSpeechResp) {
              // Extract Parameters
              speechResponse = this.extractParameters(userSays, this.finalSpeechResp.commandVariant);
            }

            // Save action
            this.fActionIndex = i;
            this.fAction = actions[i];

            // Execute all computerDoes actions
            if (this.fCommandExecutedCallback) {
              executionContext = stateMachineState + ':' + stateMachineName + ':' + i + ':' + j;
              this.fCommandExecutedCallback(executionContext, 1);
            }
            this.executeComputerDoesAction(actions[i].computerDoes, speechResponse, actions[i].error);

            this.fDisableStack = actions[i].disableStack;

            // Show speech parameters
            if (speechResponse && speechResponse.length === 1 && speechResponse[0].length === 0) {
              speechResponse = [];
            }
            this.setSpeechParameters(speechResponse);

            // Show parts of speech
            if (this.hasSpeechParametersCallback() && this.finalSpeechResp ) {
              let pos: any;
              if (results) {
                pos = this._CSMService.getLanguageParserService().createPartsOfSpeech(results);
              } else {
                pos = userSays;
              }
              this.setPartsOfSpeech(pos);
            }

            // Pass final text to callback function
            this.setFinalText(userSays);

            actionExecuted = true;
          } else {
            // Clear callback text if there wasn't a result
            // this part can go away with this
            if (!actionExecuted) {
              this.setPartsOfSpeech('');
              this.setSpeechParameters(undefined);
            }
          }
        }
      }
    }
    // Call callback function when command is executed
    if (this.fCommandExecutedCallback) {
      this.fCommandExecutedCallback(executionContext, 2);
    }

    // Return result
    return actionExecuted;
  }

  /**
   * Process specific user response, and return true if this was a valid response.
   *
   * @returns true if action was a valid response
   */
  // public processSpecificResponse(userSays: string, processLast: boolean, stateMachineName?: string, stateMachineState?: string): any {
  //   // Ignore all commands if Avatar is disabled
  //   let executionContext: string;
  //   let actionExecuted = false;
  //   if (this._CSMService.getListenService().isAvatarEnabled()) {
  //
  //
  //     // Translate phrases if needed to fix common misinterpreted speech problems
  //     userSays = this._CSMService.getUtilVoiceService().translate(userSays);
  //     const originalUserSays: string = userSays;
  //     this.fUserSays = userSays;
  //
  //     this.fDisableStack = undefined;
  //
  //     // Iterate through all possible user responses
  //
  //     const actions = this._StateMachineStackService.getStateMachineState().actions;
  //     for (let i = 0; actions && i < actions.length && !actionExecuted; i++) {
  //
  //       // Funky state - change state to base
  //       if (actions[i].userSays === undefined) {
  //         this._StateMachineService.updateStateMachine('base');
  //         break;
  //       }
  //       // Check all states in state machine for match to command
  //               let userSaysVariants = actions[i].userSays;
  //
  //               // Process variants, and cache
  //               if (!actions[i].preprocessed) {
  //                   userSaysVariants = this.getUserSaysVariants(userSaysVariants);
  //                   actions[i].userSays = userSaysVariants;
  //                   actions[i].preprocessed = 'true';
  //               }
  //
  //               // Manage 2 phase processing of commands. Any command marked as "processLast" will be
  //               // processed after all other commands have been processed
  //               let response: any;
  //               if (!processLast && !actions[i].processLast || processLast && actions[i].processLast) {
  //                   // Evaluate each command and act if a command is matched
  //                   for (let j = 0; j < userSaysVariants.length && !actionExecuted; j++) {
  //                       // Check for match or partial match
  //                       response = userSaysVariants[j];
  //                       let speechResponse = userSays.toLowerCase() === response.toLowerCase() ? [] : undefined;
  //                       let results;
  //                       if (!speechResponse) {
  //                           results = this._CSMService.getNLUMatchService().matchCommand(userSays, response);
  //                           speechResponse = results && results.length > 0 ? [] : undefined;
  //                       }
  //                       if (speechResponse || response === '<speech>') {
  //                           // Inform avatar of human speech if in middle of conversation
  //                           if (stateMachineName && stateMachineName !== 'base') {
  //                               this._CSMService.getSpeechService().sendAcceptedResponse(userSays);
  //                           }
  //                           // Got a speech response
  //                           // if (actions[i].conversation === 'true' &&
  //                           (actions[i].dontShowInTape === undefined || !actions[i].dontShowInTape)) {
  //                           //   this._CSMService.getSpeechService().sendAcceptedResponse(userSays);
  //                           // }
  //
  //                           // Check for voice change
  //                           if (actions[i].voice) {
  //                               this._CSMService.getSpeechService().setVoice(actions[i].voice);
  //                           }
  //
  //                           // Check if image should change
  //                           this._CSMService.getSpeechService().setImageAtEndOfSpeech(actions[i].image);
  //
  //                           // Save command history in case user asks for it
  //                           this.fPreviousLastCommand = this.fLastCommand;
  //                           this.fLastCommand = originalUserSays;
  //
  //                           // Handle speech-specific logic
  //                           if (response === '<speech>') {
  //                               this._CSMService.getSpeechService().setSpeech(userSays);
  //                               speechResponse = [userSays];
  //                           } else {
  //                               // Extract Parameters
  //                               speechResponse = this.extractParameters(userSays, response);
  //                           }
  //
  //                           // Save action
  //                           this.fActionIndex = i;
  //                           this.fAction = actions[i];
  //
  //                           // Execute all computerDoes actions
  //                           if (this.fCommandExecutedCallback) {
  //                               executionContext = stateMachineState + ':' + stateMachineName + ':' + i + ':' + j;
  //                               this.fCommandExecutedCallback(executionContext, 1);
  //                           }
  //
  //                           this.executeComputerDoesAction(actions[i].computerDoes, speechResponse, actions[i].error);
  //                           this.fDisableStack = actions[i].disableStack;
  //
  //                           // Show speech parameters
  //                           if (speechResponse && speechResponse.length === 1 && speechResponse[0].length === 0) {
  //                               speechResponse = [];
  //                           }
  //                           this.setSpeechParameters(speechResponse);
  //
  //                           // Show parts of speech
  //                           if (this.hasSpeechParametersCallback()) {
  //                               let pos: any;
  //                               if (results) {
  //                                   pos = this._CSMService.getLanguageParserService().createPartsOfSpeech(results);
  //                               } else {
  //                                   pos = userSays;
  //                               }
  //                               this.setPartsOfSpeech(pos);
  //                           }
  //
  //                           // Pass final text to callback function
  //                           this.setFinalText(userSays);
  //
  //                           actionExecuted = true;
  //                       } else {
  //                           // Clear callback text if there wasn't a result
  //                           if (!actionExecuted) {
  //                               this.setPartsOfSpeech('');
  //                               this.setSpeechParameters(undefined);
  //                           }
  //                       }
  //                   }
  //               }
  //           }
  //       }
  //
  //       // Call callback function when command is executed
  //       if (this.fCommandExecutedCallback) {
  //           this.fCommandExecutedCallback(executionContext, 2);
  //       }
  //
  //       // Return result
  //       return actionExecuted;
  //   }

  /**
   * Extract speech parameters from user spoken text.
   *
   * For instance, if user speaks 'Bob likes linquine', then return ['linguine']
   *
   * @param userSays - full text spoken by user
   * @param command - state machine command that was matched, including NLP and RegEx rules
   * @returns string array of user spoken text. Array includes text for each NLP or RegEx rule
   */
  private extractParameters(userSays: string, command: string): string[] {
    // Replace occurances of ${...} with pipe
    let index = 0;
    while ((index = command.indexOf('${')) !== -1) {
      let count = 1;
      for (let i = index + 2; i < command.length; i++) {
        const char = command.charAt(i);
        if (char === '{') {
          count++;
        } else if (char === '}') {
          count--;
        }

        if (count === 0) {
          command = command.substring(0, index) + '|*|' + command.substring(i + 1);
          break;
        }
      }
    }

    // Replace fixed words with pipes, which leaves spoken parameratized text
    const fixedWords = command.split('|*|');
    for (let i = 0; i < fixedWords.length; i++) {
      if (fixedWords[i].length > 0) {
        userSays = userSays.replace(fixedWords[i], '|*|');
      }
    }

    // Pipes at beginning or end of string have no meaning
    if (userSays.startsWith('|*|')) {
      userSays = userSays.substring(3);
    }
    if (userSays.endsWith('|*|')) {
      userSays = userSays.substring(0, userSays.length - 3);
    }

    // Split user spoken text
    const params = userSays.split('|*|');

    // Return user spoken text as string[]
    return params;
  }


  /**
   * Get last command executed.
   *
   * @return last command executed
   */
  public getLastCommand(): any {
    return this.fPreviousLastCommand;
  }

  /**
   * Check if same field has been entered 2 times in a row. If so, request the user spell the name.
   */
  private mispeakCmd(): void {      // This method isn't referenced, but has potential.
    // Only check mispoken commands if not in continuous listen mode
    if (!this._CSMService.isMicrophoneOn()) {
      // Check for duplicate commands if there is a previous command
      const length: number = this.fCommandHistory.length;
      if (length > 1) {
        // Check if current and previous commands are the same
        const last: string = this.fCommandHistory[length - 1];
        const secondToLast: string = this.fCommandHistory[length - 2];
        if (last[0] === secondToLast[0]) {
          // Ask the user to repeat or spell the previous command
          this._CSMService.getListenService().setRecognizing(false);
          this._CSMService.getListenService().stop();
          this._CSMService.getListenService().setAutoStartRecognition(false);
          this.fCommandHistory = []; // Reset array
          this._CSMService.getSpeechService().speak('Sorry, I am having a hard time understanding. Can you please spell out the value?',
            undefined, false, undefined);
          this._CSMService.enterState('enterFieldSpell');
        }
      }
    }
  }

  /**
   * regForStateChange
   *
   * Arg: Callback
   *
   * For getting called back when state changes
   *
   */
  public regForStateChange(stateChangeCallBack: Function) {
    this.fStateChangeCallback = stateChangeCallBack;
  }

  /**
   * regForCommandExecuted
   *
   * Arg: Callback
   *
   * For getting called back when command executed
   *
   */
  public regForCommandExecuted(commandExecutedCallBack: Function) {
    this.fCommandExecutedCallback = commandExecutedCallBack;
  }

  /**
   * regForFinalText
   *
   * Arg: Callback
   *
   * For getting called back from avatar.component.ts
   *
   */
  public regForFinalText(fTextCallBack: Function) {
    this.fFinalTextCallback = fTextCallBack;
  }

  /**
   * Use callback to set final text.
   *
   * @params text
   *
   */
  public setFinalText(text: string) {
    if (this.fFinalTextCallback) {
      this.fFinalTextCallback(text);
    }
  }

  /**
   * Register callback for parts of speech.
   *
   * @params partsOfSpeechCallback
   */
  public regForPartsOfSpeech(partsOfSpeechCallback: Function) {
    this.fPartsSpeechCallback = partsOfSpeechCallback;
  }

  /**
   * Use callback to set parts of speech.
   *
   * @params parts of speech
   */
  public setPartsOfSpeech(pos: string): void {
    if (this.fPartsSpeechCallback) {
      this.fPartsSpeechCallback(pos, this._CSMService.getNLUMatchService().getPOSDefinitions());
    }
  }

  /**
   * Return if there is a speech parameters callback function.
   */
  private hasSpeechParametersCallback(): boolean {
    return this.fPartsSpeechCallback !== undefined;
  }

  /**
   * Register for speech parameters.
   *
   * @@param speechParameterCallback - method to call when parameters are extracted
   */
  public regForSpeechParameters(speechParameterCallback: Function) {
    this.fSpeechParametersCallback = speechParameterCallback;
  }

  /**
   * Register for speech parameters.
   *
   * @@param speechParameterCallback - method to call when parameters are extracted
   */
  public setSpeechParameters(speechParameters: any[]): void {
    if (this.fSpeechParametersCallback) {
      this.fSpeechParametersCallback(speechParameters);
    }
  }

  /**
   * Register to know when end of chat occurs.
   *
   * endOfChatCallback method to call when end of chat occurs
   */
  public regForEndOfChat(endOfChatCallback: any) {
    this.fEndOfChatCallback = endOfChatCallback;
  }

  /**
   * Use method to call when end of chat occurs.
   *
   * @param endOfChat true if at end of chat
   */
  public setEndOfChat(endOfChat: boolean): void {
    if (this.fEndOfChatCallback) {
      this.fEndOfChatCallback(endOfChat);
    }
  }

  /**
   * Register to be informed when LucyBot should move.
   *
   * @param chatBotLocationCallback function to call when LucyBot should be moved
   */
  public regForChatBotLocation(chatBotLocationCallback: Function): void {
    this.fChatBotLocationCallback = chatBotLocationCallback;
  }

  /**
   * Calls listener function when location of LucyBot should change.
   *
   * @param x coordinate
   * @param y coordinate
   */
  public setChatBotLocation(x: number, y: number): void {
    if (this.fChatBotLocationCallback) {
      this.fChatBotLocationCallback(x, y);
    }
  }

  public regForRejectCommand(rejectcmdcallback: Function): void {
    this.fRejectCommandCallback = rejectcmdcallback; // argument type function assigning to the var
    // this will call back eventually
  }

  public rejectCommand(): void {
    if (this.fRejectCommandCallback) { // variable
      this.fRejectCommandCallback(); // Represents a function and want to call it by calling the var
    }
  }

}

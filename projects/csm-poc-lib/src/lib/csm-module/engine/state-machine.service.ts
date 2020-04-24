import {Injectable, OnInit, AfterViewInit} from '@angular/core';
import {CSMService} from './csm.service';
import {StateMachine} from '../state-machine/state-machine';
import {MssqlConnectService} from '../services/mssql-connect.service';
import {ProcessCommandService} from './process-command.service';

/**
 * State Machine service.
 */
@Injectable({ providedIn: 'root', })
export class StateMachineService implements OnInit, AfterViewInit {
  private _CSMService: CSMService;
  private commandArraySave: any[] = [];
  private fStateMachines: any[] = [];
  private fStateMachinesContext: any[] = [];
  private fStateMachineNames: string[] = [];
  private fStateMachineIndex: number;
  private fCurrentStateMachineCommand: string;
  private fCurrentStateMachineName: string;
  private fStateMachineProcessingStates: any[] = [];
  private fStateMachineProcessingStatesContext: StateMachine[] = [];
  private fStateMachineProcessingIndexes: number[] = [];
  private fContexts: StateMachine[] = [];
  private fStateMachineRunning = false;

  private fCacheStateMachineIndex: number;
  private fCacheStateMachineState: string;
  private fCacheStateMachineStateContext: StateMachine;
  private fCacheStateMachineStateName: string;
  private fCacheCurrentStateMachineCommand: string;
  private fCacheCurrentStateMachineName: string;

  private fThreadStateMachineIndex: number;
  private fThreadStateMachineState: string;
  private fThreadStateMachineStateContext: StateMachine;
  private fThreadStateMachineStateName: string;
  private fThreadCurrentStateMachineCommand: string;
  private fThreadCurrentStateMachineName: string;

  private _possibleCommandsCallback: Function;

  public isUserMediaThere: boolean;
  public microphone: HTMLAudioElement;
  /**
   * Constructor.
   */
  constructor(
    private mssqlConnectService: MssqlConnectService,
    private _ProcessCommandService: ProcessCommandService
  ) {}


  ngOnInit() {
    this.microphone = document.querySelector('#microphone') as HTMLAudioElement;
  }

  ngAfterViewInit() {
    this.microphone = document.querySelector('#microphone') as HTMLAudioElement;
  }

  /**
   * Set CSMService.
   *
   * @param csmService - CSMService object
   */
  public setCSMService(csmService: CSMService): void {
    this._CSMService = csmService;
  }

  /**
   * Check if state machine is active.
   *
   * @param name - name of state machine
   * @returns true if given state machine is active
   */
  public checkStateMachine(name: string): boolean {
    return this.getStateMachineIndex(name) !== -1;
  }

  /**
   * Check if state machine is active.
   *
   * @param state - state of state machine
   * @param name - name of state machine
   * @returns true if given state machine is active
   */
  public checkStateName(state: string, name: string): boolean {
    if (name === undefined) {
      for (let i: number = this.fStateMachines.length - 1; i >= 0; i--) {
        if (this.fStateMachines[i][state] !== undefined) {
          return true;
        }
      }
      return false;
    } else {
      const index: number = this.getStateMachineIndex(name);
      if (index === -1) {
        return false;
      }
      if (this.fStateMachines[index][state] !== undefined) {
        return true;
      }
      return false;
    }
  }

  /**
   * Add state machine.
   *
   * @param stateMachine - State Machine to add
   */
  public addStateMachine(stateMachine: StateMachine): boolean {
    let result = false;     // Define return value
    if (stateMachine.increaseCount()) {
      const name = stateMachine.getName();
      this.fContexts[name] = stateMachine;

      const stateMachineRules = stateMachine.getStateMachine();
      if (name === undefined || stateMachineRules === undefined || name === '' || stateMachineRules === '') {
        if (name === undefined) {
          // console.log('AddStateMachine: Invalid State Machine Name(undefined)');
        }
        if (stateMachineRules === undefined) {
          // console.log('AddStateMachine: Invalid State Machine (undefined)');
        }
        if (name === '') {
          // console.log('AddStateMachine: Invalid State Machine Name(empty)');
        }
        if (stateMachineRules === '') {
          // console.log('AddStateMachine: Invalid State Machine (empty)');
        }
      } else {
        const index: number = this.getStateMachineIndex(name);
        if (index === -1) {
          this.fStateMachines.push(stateMachineRules);
          this.fStateMachinesContext.push(stateMachine);
          this.fStateMachineNames.push(name);
          this.refreshUpdateStateMachine();
        }

        // If no load trigger then need to update state machine so that added state machine can get added to processingIndexes
        this.updateStateMachine(this.fCurrentStateMachineCommand);

        result = true;
      }
      // console.log(this.fStateMachineProcessingStates);
      this.postCommands();

      // Dump example speech commands
      this.setPossibleCommands(this._CSMService.getProcessCommandService().getPossibleResponses());
    }

    return result;
  }

  /**
   * Post commands object to nlp-service
   *
   * removes duplicate state machine actions
   */
  private postCommands() {
    const unique = {};
    const finalCommands = [];
    let indexCommand = 0;
    this.commandArraySave.forEach(function(i) {
      // Remove duplicate entries
      if (!unique[i]) {
        unique[i] = true;
        finalCommands.push([{'id': indexCommand++, 'userSays' : i}]);

      }
      return Object.keys(unique);
    });
    // console.log(finalCommands);
    this.mssqlConnectService.postLucyCommands(finalCommands);
  }

  /**
   * Remove state machine.
   *
   * @param StateMachine - name of state machine to remove
   */
  public removeStateMachine(stateMachine: StateMachine): void {
    if (stateMachine) {
      // Assure that only last state machine is removed
      const name = stateMachine.getName();
      if (stateMachine.decreaseCount()) {
        this.fContexts[name] = undefined;
      }
      const index: number = this.getStateMachineIndex(name);
      if (index === -1) {
        // console.log('Index of ' + name + ' couldn\'t be found');
      } else {
        this.fStateMachines.splice(index, 1);
        this.fStateMachinesContext.splice(index, 1);
        this.fStateMachineNames.splice(index, 1);
        this.restoreStateMachineSettings();
        /*
        if (this.fStateMachineIndex === index) {
            this.processStateMachineCommand('base');
        } else {
            this.refreshUpdateStateMachine();
        }
        */
      }
      stateMachine.destroy();
    }
  }

  /**
   * Return name of current state machine.
   *
   * @result name of current state machine
   */
  public getCurrentStateMachineName(): string {
    return this.fCurrentStateMachineName;
  }

  /**
   * Return index of current state machine.
   *
   * @return index of current state machine
   */
  public getCurrentStateMachineIndex(): number {
    return this.fStateMachineIndex;
  }

  /**
   * Return index of current state machine.
   *
   * @return index of current state machine
   */
  public setCurrentStateMachineIndex(index: number): void {
    this.fStateMachineIndex = index;
  }

  /**
   * Return index of given state machine.
   *
   * @param name - name of state machine
   * @return index of state machine
   */
  public getStateMachineIndex(name: string): number {
    for (let i = 0; i < this.fStateMachineNames.length; i++) {
      if (this.fStateMachineNames[i] === name) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Return index of given state machine.
   *
   * @param name - index of state machine
   * @return index of state machine
   */
  public getStateMachineProcessingIndex(index: number): number {

    return this.fStateMachineProcessingIndexes[index];
  }

  public startStateMachine(context: StateMachine, initialState?: string): void {
    // Start loading of voices. Speech will be queued until a voice is available.
    this._CSMService.getSpeechService().loadVoicesWhenAvailable();

    // Start state machine, if not started already
    this._CSMService.getListenService().startVoiceRecognition();

    if (!this.fStateMachineRunning) {
      this.fStateMachineRunning = true;

      // Add solution state machine as top state machine
      if (context) {
        this.addStateMachine(context);
      }

      this.updateStateMachine('base');
      if (initialState) {
        this._CSMService.getProcessCommandService().enterState(initialState);
      }
    }
  }

  /**
   * Restore state machine settings.
   */
  private restoreStateMachineSettings(): void {
    if (this.fCacheStateMachineStateName !== undefined) {
      this._CSMService.getStateMachineStackService().setStateMachineStateName(this.fCacheStateMachineStateName);
      this._CSMService.getStateMachineStackService().setStateMachineState(this.fCacheStateMachineState);
      this._CSMService.getStateMachineStackService().setStateMachineStateContext(this.fCacheStateMachineStateContext);
      this.fStateMachineIndex = this.fCacheStateMachineIndex;
      this.fCurrentStateMachineCommand = this.fCacheCurrentStateMachineCommand;
      this.fCurrentStateMachineName = this.fCacheCurrentStateMachineName;
      this.fCacheStateMachineStateName = undefined;
      this.fCacheStateMachineState = undefined;
      this.fCacheStateMachineIndex = undefined;
      this.fCacheCurrentStateMachineCommand = undefined;
      this.fCacheCurrentStateMachineName = undefined;
      this.refreshUpdateStateMachine();
    } else {
      // console.log('Restoring State Machine: failed. Setting state machine to base');
      this.updateStateMachine('base');
    }
  }

  /**
   * Refresh update state machine.
   */
  private refreshUpdateStateMachine() {
    this.updateStateMachine(this.fCurrentStateMachineCommand, this.fCurrentStateMachineName);
  }

  /**
   * Change state of state machine.
   *
   * @param command - new state of state machine. For example, 'base'
   * @param name - name of state
   */
  public updateStateMachine(command: string, name?: string): boolean {
    // Bottom up approach
    // Cascade upwards so that lower state state-machines can overload higher state state-machines
    // State Machine Processing Indexes checks for duplicate state names in state state-machines
    // Each state machine with a matching name will get inserted
    // Hits are checked from the lower state machine to the higher state state-machines
    if (name === undefined) {
      // Loop through all statemachines to see if named state machine exists
      let processingIndexesCleared = false;
      for (let i = this.fStateMachines.length - 1; i >= 0; i--) {
        // Check if state machine for command exists
        if (this.fStateMachines[i][command] !== undefined) {
          // Initialize state machine arrays

          if (!processingIndexesCleared) {
            this.fStateMachineProcessingStates = [];
            this.fStateMachineProcessingStatesContext = [];
            this.fStateMachineProcessingIndexes = [];
            processingIndexesCleared = true;
            // Check if voice should change
            const voice = this.fStateMachines[i][command].voice;
            if (voice) {
              this._CSMService.getSpeechService().setVoice(voice);
            }

            // Check if image should change
            this._CSMService.getSpeechService().setImageAtEndOfSpeech(this.fStateMachines[i][command].image);
          }

          // Save state machine that was found
          this.fStateMachineProcessingStates.push(this.fStateMachines[i][command]);
          this.fStateMachineProcessingStatesContext.push(this.fStateMachinesContext[i]);
          this.fStateMachineProcessingIndexes.push(i);
        }
      }

      // Check if state state-machines were found
      if (this.fStateMachineProcessingStates.length > 0) {
        // Save highest level state machine
        const index = this.fStateMachineProcessingStates[0];
        // creating Command Object
        const initialCommands = this.fStateMachineProcessingStates[0].actions.map( item => item.userSays);
        for (let j = 0; j < initialCommands.length; j++) {
          if (initialCommands[j] === undefined) {
            // assigning an empty string to undefined actions to prevent processing error
            initialCommands[j] = '';
          } else if (initialCommands[j] !== undefined) {
            // fix import here
            initialCommands[j] = this._ProcessCommandService.getUserSaysVariants(initialCommands[j]);
          }
        }
        this.commandArraySave.push(initialCommands);

        this._CSMService.getStateMachineStackService().setStateMachineStateName(command);
        this._CSMService.getStateMachineStackService().setStateMachineState(this.fStateMachineProcessingStates[0]);
        this._CSMService.getStateMachineStackService().setStateMachineStateContext(this.fStateMachineProcessingStatesContext[0]);
        this.fStateMachineIndex = this.fStateMachineProcessingIndexes[0];

        // Save state machine in thread
        if (this.fStateMachines[index] !== undefined) {
          if (this.fStateMachines[index][command].startThread === 'true') {
            this.fThreadStateMachineIndex = this.fStateMachineIndex;
            this.fThreadStateMachineState = this._CSMService.getStateMachineStackService().getStateMachineState();
            this.fThreadStateMachineStateContext = this._CSMService.getStateMachineStackService().getStateMachineStateContext();
            this.fThreadStateMachineStateName = this._CSMService.getStateMachineStackService().getStateMachineStateName();
            this.fThreadCurrentStateMachineCommand = this.fCurrentStateMachineCommand;
            this.fThreadCurrentStateMachineName = this.fCurrentStateMachineName;
          }
        }

        // Save state machine name and definition
        this.fCurrentStateMachineCommand = command;
        this.fCurrentStateMachineName = this.fStateMachineNames[this.fStateMachineIndex];

        // Return that the state machine was found
        return true;
      }

      // Log that the state machine wasn't found
      return false;
    } else {
      // Look for state machine using name
      // Don't cascade through the state state-machines. Use the current state machine index for 'this'
      let index = 0;
      if (name === 'this') {
        index = this.fStateMachineIndex;
      } else {
        // Use the named state machine
        // Finds the named state machine instance that was used
        index = this.getStateMachineIndex(name);
        if (index === -1) {
          // Return that the named state machine wasn't found
          return false;
        }
      }

      // Find state in state machine
      if (this.fStateMachines[index][command] !== undefined) {
        // Store state machine as only state machine
        this.fStateMachineProcessingIndexes = [];
        this._CSMService.getStateMachineStackService().setStateMachineStateName(command);
        this._CSMService.getStateMachineStackService().setStateMachineState(this.fStateMachines[index][command]);
        this._CSMService.getStateMachineStackService().setStateMachineStateContext(this.fStateMachinesContext[index]);
        this.fStateMachineIndex = index;
        this.fStateMachineProcessingIndexes.push(index);
        this.fStateMachineProcessingStates.push(this.fStateMachines[index][command]);
        this.fStateMachineProcessingStatesContext.push(this.fStateMachinesContext[index]);

        if (this.fStateMachines[index][command].startThread) {
          // Store state machine info
          this.fThreadStateMachineIndex = this.fStateMachineIndex;
          this.fThreadStateMachineState = this._CSMService.getStateMachineStackService().getStateMachineState();
          this.fThreadStateMachineStateContext = this._CSMService.getStateMachineStackService().getStateMachineStateContext();
          this.fThreadStateMachineStateName = this._CSMService.getStateMachineStackService().getStateMachineStateName();
          this.fThreadCurrentStateMachineCommand = this.fCurrentStateMachineCommand;
          this.fThreadCurrentStateMachineName = this.fThreadCurrentStateMachineName;
        }

        // Store current state machine name
        this.fCurrentStateMachineCommand = command;
        this.fCurrentStateMachineName = name;

        // Return that the state machine was found
        return true;
      }

      // Return the failure
      return false;
    }

    // Return failure
    //    return false;         // Unreachable code
  }


  /**
   * Get the name of the current machine state.
   *
   * @returns name of current state machine
   */
  public getStateName(): string {
    return this._CSMService.getStateMachineStackService().getStateMachineStateName();
  }

  /**
   * Get the state machine processing state.
   *
   * @returns state machine processing state
   */
  public getStateMachineProcessingStates(): any[] {
    return this.fStateMachineProcessingStates;
  }

  /**
   * Get the state machine processing state context.
   *
   * @returns state machine processing state context
   */
  public getStateMachineProcessingStatesContext(): StateMachine[] {
    return this.fStateMachineProcessingStatesContext;
  }

  /**
   * Set the current state machine command.
   *
   * @param currentStateMachineCommand current state machine command
   */
  public setCurrentStateMachineCommand(currentStateMachineCommand: string): void {
    this.fCurrentStateMachineCommand = currentStateMachineCommand;
  }

  /**
   * Return the current state machine.
   *
   * @return currentStateMachineCommand current state machine
   */
  public getCurrentStateMachineCommand(): string {
    return this.fCurrentStateMachineCommand;
  }

  /**
   * Set the current state machine name.
   *
   * @param currentStateMachineCommand current state machine name
   */
  public setCurrentStateMachineName(currentStateMachineName: string): void {
    this.fCurrentStateMachineName = currentStateMachineName;
  }

  /**
   * Register callback for all possible commands.
   *
   * @param possibleCommandsCallback callback for all possible commands
   */
  public regForPossibleCommands(possibleCommandsCallback: Function) {
    this._possibleCommandsCallback = possibleCommandsCallback;
  }

  /**
   * UnRegister callback for all possible commands.
   *
   * @param possibleCommandsCallback callback for all possible commands
   * Do this everywhere we want to unregister...
   */

  public unRegForPossibleCommands(): void {
    this._possibleCommandsCallback = undefined;
  }

  /**
   * Set call callback function with possible commands.
   *
   * @param possible commands
   */
  public setPossibleCommands(possibleCommands: string[]): void {
    if (this._possibleCommandsCallback) {
      this._possibleCommandsCallback(possibleCommands);
    }
  }

  /**
   * Get thread state machine index.
   *
   * @returns fThreadStateMachineIndex
   */
  public getThreadStateMachineIndex(): number {
    return this.fThreadStateMachineIndex;
  }

  /**
   * Get thread state machine state.
   *
   * @returns fThreadStateMachineState
   */
  public getThreadStateMachineState(): string {
    return this.fThreadStateMachineState;
  }

  /**
   * Get thread state machine state context.
   *
   * @returns fThreadStateMachineStateContext
   */
  public getThreadStateMachineStateContext(): StateMachine {
    return this.fThreadStateMachineStateContext;
  }

  /**
   * Get thread state machine state name.
   *
   * @returns fThreadStateMachineStateName
   */
  public getThreadStateMachineStateName(): string {
    return this.fThreadStateMachineStateName;
  }

  /**
   * Get thread current state machine state name.
   *
   * @returns fThreadCurrentStateMachineName
   */
  public getThreadCurrentStateMachineName(): string {
    return this.fThreadCurrentStateMachineName;
  }

  /**
   * Get thread current state machine command.
   *
   * @returns fThreadCurrentStateMachineCommand
   */
  public getThreadCurrentStateMachineCommand(): string {
    return this.fThreadCurrentStateMachineCommand;
  }

  /**
   * Checks for getUserMedia
   *
   * @params: none
   * @returns: any
   */
  public hasGetUserMedia(): any {
    const mediaservices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    // console.log('Media Services: ', navigator.mediaDevices);
    return mediaservices;
  }

  /**
   * A function to get the return value of hasGetUserMedia
   *
   * @params: none
   * @return: none
   */
  public isUserMediaGood(micstatus: boolean): boolean {
    const self = this;
    if (this.hasGetUserMedia()) {
      // Good to go!
      self.isUserMediaThere = true;
      // console.log('We have User Media Houston!');

      // Now accessInputDevice
      this.accessInputDevice(micstatus);
      return true;
    } else {
      // Oops!
      self.isUserMediaThere = false;
      console.warn('WARNING: getUserMedia() is not supported by your browser');
      return false;
    }
  }

  public accessInputDevice(micstatus: boolean) {

    const self = this;
    // window.AudioContext = window.AudioContext;
    //    let videoTrack: {stop: () => void;} = null;
    //    // let audioTrack = null;
    //    let videoDefaultConstraintString = '{\n  "width": 320,\n  "height": 240,\n  "frameRate": 30\n}';
    //    let videoConstraints = null;
    //    let videoConstraintEditor = document.getElementById("videoplayer");
    //    let videoSettingsText = document.getElementById("videoSettingsText");
    //    videoConstraintEditor.id = videoDefaultConstraintString;
    //
    //    if (videoTrack) {
    //      videoSettingsText.value = JSON.stringify(videoTrack.getSettings(), null, 2);
    //    }
    //

    //
    //    const supports = navigator.mediaDevices.getSupportedConstraints();
    //    if (!supports.deviceId) {
    //      // Treat like an error.
    //    } else {
    //      console.log('DeviceID: ', supports);
    //    }

    // const context = new AudioContext();
    // console.log('Audio Context: ', context);

    // initialization
    if (localStorage.getItem('microphone') === null) {
      // just assume it is prompt
      localStorage.setItem('microphone', 'prompt');
    }

    const constraints = {
      video: true,
      audio: micstatus
    };

    navigator.mediaDevices.getUserMedia(constraints).then(function success(stream) {
      /* do stuff */
      self.successcheck(success, stream);

    }).catch(function (err) {
      // log to console first
      console.warn('Lucy StateMachine: ', err); /* handle the error */
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        // required track is missing
        console.warn('Lucy StateMachine: Required track is missing');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        // webcam or mic are already in use
        console.warn('Lucy StateMachine: Webcam or mic are already in use');
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        // constraints can not be satisfied by avb. devices
        console.warn('Lucy StateMachine: Constraints can not be satisfied by available devices');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        // permission denied in browser
        console.warn('Lucy StateMachine: Permission Denied.');
      } else if (err.name === 'TypeError' || err.name === 'TypeError') {
        // empty constraints object
        console.warn('Lucy StateMachine: Both audio and video are FALSE');
      } else {
        // other errors
        console.warn('Lucy StateMachine: Sorry! Another error occured.');
      }
    });
  }

  public successcheck(status: any, stream: any): void {
    // Success!!!
    // console.log('Success with the Audio Context', status);
    // console.log('Audio Context', stream);

    // let AudioContext = window.AudioContext;

    // if (typeof AudioContext === 'undefined' && typeof AudioContext !== 'undefined') {
    //   AudioContext = AudioContext;
    // }

    /*global MediaStream: true */
    if (typeof MediaStream !== 'undefined' && !('stop' in MediaStream.prototype)) {

      // console.log('MediaStream: ', MediaStream);

      if (stream != null) {
        stream.getTracks().map(function (val: any) {
          val.stop();
        });
      }
    }
  }

  public gotDevices(deviceInfos: any) {

    for (let i = 0; i !== deviceInfos.length; ++i) {
      const deviceInfo = deviceInfos[i];
      const option = document.createElement('option');
      option.value = deviceInfo.deviceId;
      if (deviceInfo.kind === 'audioinput') {
        option.text = deviceInfo.label || 'microphone ';
        // microphone
        // console.log('Found Audio device: ', deviceInfo);
      } else if (deviceInfo.kind === 'videoinput') {
        // video
        option.text = deviceInfo.label || 'camera ';
        // console.log('Found Video device: ', deviceInfo);
      } else {
        // other
        // console.log('Found another kind of device: ', deviceInfo);
      }
    }
  }

  public getStream() {
    const self = this;
    const constraints = {
      audio: {
        audio: false,
        deviceId: {exact: self.microphone.id}
      },
      video: false
    };

    navigator.mediaDevices.getUserMedia(constraints).
    then(self.gotStream).catch(self.handleError);
  }

  public gotStream(stream: any) {
    const self = this;
    // window.AudioContext = stream; // make stream available to console
    // self.microphone = stream;

  }

  public handleError(error: any) {


    // log to console first
    console.error('Error: ', error); /* handle the error */
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      // required track is missing
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      // webcam or mic are already in use
    } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
      // constraints can not be satisfied by avb. devices
    } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      // permission denied in browser
    } else if (error.name === 'TypeError' || error.name === 'TypeError') {
      // empty constraints object
    } else {
      // other errors
    }


  }

}

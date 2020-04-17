import {Injectable} from '@angular/core';
import {StateMachine} from '../state-machine/state-machine';
import {CSMService} from './csm.service';

/**
* State Machine stack service.
*/
@Injectable({ providedIn: 'root', })
export class StateMachineStackService {

  private _CSMService: CSMService;

  private fStateMachineState: any;
  private fStateMachineStateContext: StateMachine;
  private fStateMachineStateName: string;
  private fStack: any[] = [];
  private fInterimStackState: any;

/**
  * Constructor.
  */
 constructor(
      ) {
  } // end constructor

  /**
   * Set CSMService.
   *
   * @param csmService - CSMService object
   */
   public setCSMService(csmService: CSMService): void {
       this._CSMService = csmService;
   }

  /**
   * Push item to stack.
   *
   * @param stackItem - object to push to stack
   */
  public pushToStack(stackItem: any): number {
    // Push to stack
    this.fStack.push(stackItem);
    this.fInterimStackState = undefined;

    // Return number of items on stack
    return this.fStack.length;
  }

  /**
   * Pop item from stack.
   *
   * @return stack popped from stack
   */
  public popFromStack(): any {
    // Pop item from stack
    const stackItem: any = this.fStack.pop();

    // Return item from stack
    return stackItem;
  }

  /**
   * Get stack state.
   *
   * @return name of stack item
   */
  public getStackState(): any {
    return {
      stateName: this._CSMService.getStateMachineService().getStateName(),
    };
  }

  /**
   * Save stack state.
   */
  public addInterimState(): void {
    const stackState: any = this.getStackState();
    this.fInterimStackState = stackState;
  }

  /**
   * Undo stack.
   */
  public undoStack(): void {
    // Pop all items from stack
    let stackItem: any = this.popFromStack();
    while (stackItem && !stackItem.actionFound) {
      stackItem = this.popFromStack();
    }

    // Handle last stack item
    if (stackItem) {
      if (stackItem.before.currentControl.id === stackItem.after.currentControl.id) {
        if (stackItem.before.currentValue !== stackItem.after.currentValue) {
          stackItem.before.currentControl.properties.value = stackItem.before.currentValue;
        }
      } else {
        if (stackItem.interim !== undefined) {
          if (stackItem.interim.currentControl.id === stackItem.after.currentControl.id) {
            if (stackItem.interim.currentValue !== stackItem.after.currentValue) {
              stackItem.after.currentControl.properties.value = stackItem.interim.currentValue;
            }
          }
        }
      }
    }
  }

  /**
   * End thread.
   *
   * @returns error that might occur in internalProcessStateMachineCommand
   */
  public endThread(): any {
    // Restore state machine values saved in updateStateMachine
    this._CSMService.getStateMachineService().setCurrentStateMachineIndex(this._CSMService.getStateMachineService().getThreadStateMachineIndex());
    this.fStateMachineState = this._CSMService.getStateMachineService().getThreadStateMachineState();
    this.fStateMachineStateContext = this._CSMService.getStateMachineService().getThreadStateMachineStateContext();
    this.fStateMachineStateName = this._CSMService.getStateMachineService().getThreadStateMachineStateName();
    this._CSMService.getDescriptionService().updateData(this._CSMService.getStateMachineService().getThreadDescriptionData());
    this._CSMService.getStateMachineService().setCurrentStateMachineCommand(this._CSMService.getStateMachineService().getThreadCurrentStateMachineCommand());
    this._CSMService.getStateMachineService().setCurrentStateMachineName(this._CSMService.getStateMachineService().getThreadCurrentStateMachineName());

    // Process state machine command
      return this._CSMService.getProcessCommandService().internalProcessStateMachineCommand();
  }

  /**
   * Get state machine state.
   *
   * @returns fStateMachineState
   */
   public getStateMachineState(): any {
       return this.fStateMachineState;
   }

  /**
   * Set state machine state.
   *
   * @param stateMachineState
   */
   public setStateMachineState(stateMachineState: any): void {
       this.fStateMachineState = stateMachineState;
   }

  /**
   * Get state machine state context.
   *
   * @returns fStateMachineStateContext
   */
   public getStateMachineStateContext(): StateMachine {
       return this.fStateMachineStateContext;
   }

  /**
   * Set state machine state context.
   *
   * @param stateMachineStateName
   */
   public setStateMachineStateContext(stateMachineStateContext: StateMachine): void {
       this.fStateMachineStateContext = stateMachineStateContext;
   }

  /**
   * Get state machine state name.
   *
   * @returns name of state machine
   */
   public getStateMachineStateName(): string {
       return this.fStateMachineStateName;
   }

  /**
   * Set state machine state name.
   *
   * @param stateMachineStateName
   */
   public setStateMachineStateName(stateMachineStateName: string): void {
       this.fStateMachineStateName = stateMachineStateName;
   }

  /**
   * Get interim stack state.
   *
   * @returns interim stack state
   */
   public getInterimStackState(): any {
       return this.fInterimStackState;
   }
}

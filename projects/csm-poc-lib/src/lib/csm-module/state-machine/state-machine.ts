import {Injectable} from '@angular/core';
import {CSMService} from '../engine/csm.service';
import {ContextInvoker} from '../command-pattern/context-invoker';

@Injectable()
export class StateMachine {

    public _CSMService: CSMService;
    private _invoker: ContextInvoker;
    private instanceCount = 0;

    public HIGH: Number = 2;
    public MEDIUM: Number = 1;
    public LOW: Number = 0;

        public AnyWords = `/[\\w\\s]+/`;
    public MonthDay = `/NNP/ /CD/`;
    public MonthDayYear = `/NNP/ /CD/ /CD/`;

    constructor(csmService: CSMService) {
        this._CSMService = csmService;
    }

    public getName() {
        return 'None';
    }
    public getStateMachine(): any {}

    public setInvoker(invoker: ContextInvoker) {
        this._invoker = invoker;
    }

    public getThis(): any {
        return this;
    }

    public speak(speech: any, responses?: any, silent?: boolean, callback?: Function): void {
        this._CSMService.getSpeechService().speak(speech, responses, silent, callback);
    }

    public readParameters(userSays: string): void {
        if (!userSays || userSays.length === 0) {
            this.speak(`There aren't any parameters!`);
        } else {
            for (let i = 0; i < userSays.length; i++) {
                this.speak(`Parameter ${i} is ${userSays[i]}`);
            }
        }
    }

    public increaseCount(): boolean {
        this.instanceCount++;
        return this.instanceCount === 1;
    }

    public decreaseCount(): boolean {
        this.instanceCount--;
        return this.instanceCount === 0;
    }

    /**
     * Change state of state machine.
     *
     * @param command - new state of state machine. For example, 'base'. The command can be in form: 'command.name'
     * @param name - optional name of state machine
    */
    public enterState(command: string, name?: string, x?: number, y?: number): Promise<any> {
        return this._CSMService.enterState(command, name, x, y);
    }

    public destroy(): void {
        console.log('We are destroying something');
        this._CSMService.unRegForPossibleCommands();
    }

    public rejectCommand(): void {
        this._CSMService.getProcessCommandService().rejectCommand();
    }

    /**
     * Flag to not show user speech.
     */
    public dontShowUserSpeech(): void {
        this._CSMService.getSpeechService().dontShowUserSpeech();
    }

    /**
     * Flag to show user speech.
     */
    public showUserSpeech(): void {
        this._CSMService.getSpeechService().showUserSpeech();
    }

    public registerConversation(conversation: string, priority?: Number, payload?: any): void {
        this._CSMService.getConversationManager().registerConversation(conversation, priority, payload);
    }

    public getPayload(): any {
        return this._CSMService.getConversationManager().getActivePayload();
    }
}

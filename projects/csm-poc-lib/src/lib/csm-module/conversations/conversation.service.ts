import {Injectable} from '@angular/core';
import {ProcessCommandService} from '../engine/process-command.service';

/**
* Conversation Manager Service.
*/
@Injectable()
export class ConversationManager {

    public HIGH: Number = 2;
    public MEDIUM: Number = 1;
    public LOW: Number = 0;

    /**
     * Each conversation will be added to registry in the following format:
     * {
     *      conversation: 'MyNewState',          //'name of CSM state that represents conversation'
     *      priority: HIGH  Priority of conversation. Sub priorities may be indicated by adding 1/10 increments, for ex, MEDIUM + .5
     * }
     */
    private conversationRegistry: any = [];
    private currentPayload: any;

    /**
     * Constructor.
     */
    constructor(private processCommandService: ProcessCommandService) {}

    /**
     * Register conversation for conversations. Note that conversation are not persisted across sessions.
     *
     * @param state = CSM state to execute when conversation is executed
     * @param priority = Priority of conversation, HIGH, MEDIUM, LOW. Finer granularity can be added, for ex, HIGH + .5. Default is LOW.
     * @param repeat =  number of seconds between repeat. Default is undefined which represents "no repeat"
     */
    public registerConversation(conversation: string, priority?: Number, payload?: any): void {
        // Remove events if they have timed out
        for (let i = this.conversationRegistry.length - 1; i > 0; i--) {
            const note = this.conversationRegistry[i];
            if (note.beenSeen) {
                const minutesPassed = this.diff_minutes(note.date, new Date());
                if (minutesPassed >= 1) {
                    this.conversationRegistry.splice(i);
                }
            }
        }

        // Update or set values of conversation
        let conversationFound = false;
        for (let i = 0; i < this.conversationRegistry.length && !conversationFound; i++) {
            conversationFound = this.conversationRegistry[i].conversation === conversation;
        }
        if (!conversationFound) {
            this.conversationRegistry.push({
                conversation: conversation,
                priority: priority ? priority : this.LOW,
                payload: payload,
                date: new Date(),
                beenSeen: false
            });
        }

        // Sort by priority
        this.conversationRegistry.sort((a: any, b: any) => b.priority - a.priority);

        // Determine if CSM is idle
        this.setIdle(this.processCommandService.getCurrentState() === 'base');
    }

    /**
     * Remove conversation for conversations.
     *
     * @param state = CSM state representing conversation to remove
     */
    public removeConversation(conversation: string): void {
        // Remove event
        for (let i = 0; i < this.conversationRegistry.length; i++) {
            if (this.conversationRegistry[i].conversation === conversation) {
                this.conversationRegistry.splice(i);
                break;
            }
        }
    }

    /**
     * Remove all conversation conversations.
     */
    public removeAllConversations(): void {
        this.conversationRegistry = [];
    }

    /**
     * Set CSM idle. Process next conversation by priority and by repeat factor.
     *
     * @param csmIdle = true if CSM is in 'base' state and can process next conversation
     */
    public setIdle(csmIdle: boolean): void {
        let conversation;
        if (csmIdle) {
            // Get next conversation
            for (let i = 0; i < this.conversationRegistry.length; i++) {
                conversation = this.conversationRegistry[i];
                if (!conversation.beenSeen) {
                    break;
                }
                conversation = null;
            }

            // If CSM is idle, execute next event
            if (conversation) {
                conversation.beenSeen = true;
                this.currentPayload = conversation.payload;
                this.processCommandService.enterState(conversation.conversation);
            }
        }
    }

    private diff_minutes(dt2, dt1): Number {
        let diff = (dt2.getTime() - dt1.getTime()) / 1000;
        diff /= 60;
        return Math.abs(Math.round(diff));
    }

   /**
     * Return JSON payload for active conversation.
     *
     * @returns JSON payload
     */
    public getActivePayload(): any {
        return this.currentPayload;
    }
}

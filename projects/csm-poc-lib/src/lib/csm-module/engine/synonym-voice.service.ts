import {Injectable} from '@angular/core';

@Injectable({ providedIn: 'root', })
export class SynonymVoiceService {
    public getCancelWords(): string[] {
        return ['cancel', 'return', 'go back', 'oops', 'undo', 'nevermind'];
    }

    public getForwardWords(): string[] {
        return ['next', 'forward', 'go forward', 'more'];
    }

    public getBackwardWords(): string[] {
        return ['back', 'go back', 'previous', 'go backwards'];
    }

    public getGreeting(): string {
        return ['Great', 'Fantastic', 'Super', 'Terrific', 'Outstanding', ''][(Math.random() * 5).toFixed()];
    }

    public getOk(): string {
        return ['Ok', 'Roger', 'Affirmative'][(Math.random() * 2).toFixed()];
    }

    public getValue(): string {
        return ['value', 'item', 'information', 'data', 'info'][(Math.random() * 4).toFixed()];
    }

    public getCancel(): string {
        return ['Canceling', 'Going back', 'Returning'][(Math.random() * 2).toFixed()];
    }

    public getPlease(): string {
        return ['please', '', ''][(Math.random() * 2).toFixed()];
    }

    public getNotUnderstood(): string {
        return ['I didn\'t understand.', 'What was that?', 'Huh.', 'Sorry. I didn\'t get that. ', 'I didn\'t get that.'][(Math.random() * 4).toFixed()];
    }

    public getNewValue(): string {
        return ['New value?', 'Value, please?', 'What\'s the new value?', 'Value?'][(Math.random() * 3).toFixed()];
    }

    public getChoose(): string {
        return ['Choose between', 'Your options are', 'Selections include', 'Choices include'][(Math.random() * 3).toFixed()];
    }

    public getChoices(): string {
        return ['choices', 'selections', 'options', 'picks'][(Math.random() * 3).toFixed()];
    }

    public getCompleted(): string {
        return ['Done', 'Finished', 'Ok', 'Completed', 'Command executed'][(Math.random() * 4).toFixed()];
    }

    public getNotCompleted(): string {
        return ['I couldn\'t complete your request',
        'I\'m having trouble completing your request',
        'There\'s a problem with your request',
        'I\'m having difficulties with your request']
        [(Math.random() * 3).toFixed()];
    }

    public getRepeat(): string {
        return ['Please repeat your request.', 'Repeat your request.', 'What was that last command?', 'Repeat your last command.', 'Please repeat your last command.'][(Math.random() * 4).toFixed()];
    }

    public getNotFound(): string {
        return ['Not found.', 'I can\'t find it.', 'I\'m lost.', 'Try again.'][(Math.random() * 3).toFixed()];
    }

    public getNavigating(): string {
        return ['Navigating there now.', 'Moving there now.', 'Taking you there now.', 'Displaying section.', 'Navigating.'][(Math.random() * 4).toFixed()];
    }

    public getSectionCompleted(): string {
        return ['The section is completed.', 'We\'re finished processing this section.', 'We\'re done with this section.', 'Completed with this section.'][(Math.random() * 3).toFixed()];
    }
}

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import {SocketMessage} from '../models/SocketMessage';

@Injectable({
  providedIn: 'root'
})

export class LucyMessageService {
  reviewComplete$ = new Subject<string>(); // remove when things are more stable
  correctionsComplete$ = new Subject<string>(); // all msgs to go thru lucyMessage$ - remove when things are more stable
  lucyMessage$ = new Subject<string>();
  lucySocialChatCommunications$ = new Subject<string>();
  constructor(

  ) {}

  receiveMessage(socketMessage: SocketMessage) {
    this.lucyMessage$.next(socketMessage.data.message);
  }

  communicateSocialChatMessages(socketMessage: SocketMessage) {
    this.lucySocialChatCommunications$.next(socketMessage.data.message);
  }

}

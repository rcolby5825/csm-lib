import { NgModule } from '@angular/core';
import { CsmPocLibComponent } from './csm-poc-lib.component';
import { CsmModuleComponent } from './csm-module/csm-module.component';
import {SpeechService} from './csm-module/engine/speech.service';
import {StateMachine} from './csm-module/state-machine/state-machine';
import {CommonModule} from '@angular/common';
import {CSMService} from './csm-module/engine/csm.service';
import {ProcessCommandService} from './csm-module/engine/process-command.service';
import {ConversationManager} from './csm-module/conversations/conversation.service';
import {SynonymVoiceService} from './csm-module/engine/synonym-voice.service';
import {InferenceEngineService} from './csm-module/engine/inference-engine.service';
import {ListenService} from './csm-module/engine/listen.service';
import {StateMachineService} from './csm-module/engine/state-machine.service';
import {LanguageParserService} from './csm-module/engine/language-parser.service';
import {NLUMatchService} from './csm-module/engine/nlu-match.service';
import {ContextInvoker} from './csm-module/command-pattern/context-invoker';
import {DescriptionComponent} from './csm-module/description/description.component';
import {StateMachineStackService} from './csm-module/engine/state-machine-stack.service';
import {LucyQandAService} from './csm-module/services/lucy-q-and-a.service';
import {MssqlConnectService} from './csm-module/services/mssql-connect.service';
import {DescriptionService} from './csm-module/description/description.service';
import {FieldHighlightService} from './csm-module/description/field-highlight.service';
import {UtilVoiceService} from './csm-module/engine/util-voice.service';
import {CSMStateMachine} from './csm-module/state-machine/CSM-state-machine';

@NgModule({
  declarations: [
    DescriptionComponent,
    CsmModuleComponent,
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    DescriptionComponent,
  ],
  providers: [
    CSMService,
    NLUMatchService,
    SpeechService,
    ListenService,
    ProcessCommandService,
    UtilVoiceService,
    SynonymVoiceService,
    StateMachineService,
    StateMachineStackService,
    StateMachine,
    CSMStateMachine,
    DescriptionService,
    FieldHighlightService,
    ContextInvoker,
    CsmModuleComponent,
    LanguageParserService,
    InferenceEngineService,
    LucyQandAService,
    MssqlConnectService,
    ConversationManager
  ],
})
export class CsmPocLibModule { }

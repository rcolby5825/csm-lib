/*
 * Public API Surface of csm-poc-lib
 */

// needed for the csm-poc-lib module to be used
export * from './lib/csm-poc-lib.service';
export * from './lib/csm-poc-lib.component';
export * from './lib/csm-poc-lib.module';

// These may need to be revised to ONLY include the specific methods that
// are touching an outside application.

export * from './lib/csm-module/services/lucy-q-and-a.service';
export * from './lib/csm-module/conversations/conversation.service';
export * from './lib/csm-module/engine/csm.service';

export * from './lib/csm-module/engine/language-parser.service';
export * from './lib/csm-module/engine/process-command.service';


export * from './lib/csm-module/engine/speech.service';


export * from './lib/csm-module/state-machine/CSM-state-machine';

export * from './lib/csm-module/engine/inference-engine.service';


// state-machine had a static injector error when entering
export * from './lib/csm-module/state-machine/state-machine';

// ones that are being put in - but probably won't be kept in final
export * from './lib/csm-module/command-pattern/context-invoker';
export * from './lib/csm-module/services/mssql-connect.service';
export * from './lib/csm-module/engine/nlu-match.service';
// state-machine-stack.service had a static injector error when entering
export * from './lib/csm-module/engine/state-machine-stack.service';
export * from './lib/csm-module/engine/synonym-voice.service';
export * from './lib/csm-module/engine/util-voice.service';


// doesn't work will need to see about a different way to import the component
// export * from './lib/csm-module/avatar-papertape-modal/avatar-papertape-modal.component';
// leaving everything out from the interfaces directory

// one that was missed
export * from './lib/csm-module/engine/listen.service';

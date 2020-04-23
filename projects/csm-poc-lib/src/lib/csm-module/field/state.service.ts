// import {Application} from '../../../model-module/models';
// import {CoreError} from '../../models/CoreError';
// import {ErrorMessage} from '../../enums/error-message.enum';
// import {ErrorService} from '../utils/error.service';
// import {FamilyTree} from '../../models/FamilyTree';
// import {Field} from '../../../model-module/models';
// import {forEach, isNull} from 'lodash';
// import {FormState} from '../../models/FormState';
// import {Injectable} from '@angular/core';
// import {ListenerPrepareService} from './listener-prepare.service';
// import {MessageType} from '../../enums/message-type.enum';
// import {Node} from '../../../model-module/models/node';
// import {ResponseSettings} from '../../models/ResponseSettings';
// import {Section} from '../../../model-module/models';
// import {SocketMessage} from '../../models/SocketMessage';
// import {Stakeholder} from '../../../model-module/models';
// import {Subform} from '../../../model-module/models';
// import {Subject} from 'rxjs/Subject';
// import {SocialAttachments} from '../../../plugin-module/components/doc-checklist/models/social-attachments';
//
// type Uuid = string;
//
// @Injectable({
//   providedIn: 'root'
// })
//
// /**
//  *   @description
//  *     manage user state within the schema ONLY!!!
//  */
// export class StateService {
//
//   // private convenience variables
//   private currentState = new FormState();
//   private currentApplication: Application;
//
//   // Form-State observables
//   applicationStats$ = new Subject<SocketMessage>();
//   currentState$ = new Subject<FormState>();
//   newApplicationMeta$ = new Subject<string>();
//   unloadApplication$ = new Subject<null>();
//   isLoading$ = new Subject<boolean>();
//
//   constructor(
//     private errorService: ErrorService,
//     private listenerPrepareService: ListenerPrepareService
//   ) {
//   }
//
//   /**
//    * Controls the loading icon.
//    * @param {boolean} isLoading
//    */
//   setLoading(isLoading: boolean) {
//     this.isLoading$.next(isLoading);
//   }
//
//
//   /**
//    * typically called when we change sections
//    * @param {Uuid} sectionUuid
//    */
//   setCurrentSectionUuid(sectionUuid: Uuid) {
//     const self = this;
//     let newCurrentSection: Section;
//
//     const curStateSubscription = self.currentState$.subscribe((currState) => {
//       if (sectionUuid === currState.getActiveSection().id) {
//         return;
//       } else if (sectionUuid !== currState.getActiveSection().id) {
//         newCurrentSection = currState.getApplication().getNodeById(sectionUuid);
//         self.setCurrentSection(newCurrentSection);
//         return;
//       }
//     });
//   }
//
//   /**
//    * @description
//    *   supports breadcrumb roll-over menu items.
//    * @param familyTree
//    */
//   setFamilyTree(familyTree: FamilyTree): void {
//     try {
//       this.currentState.setFamilyTree(familyTree);
//       this.currentState$.next(this.currentState);
//     } catch (exception) {
//       console.log('An exception was caught setting up Family Tree' + exception);
//     }
//   }
//
//   /**
//    * @description
//    *    message is set ONLY if there are saved documents.
//    *    creates SocialAttachments object that can be shared between UI and VOICE
//    *    updates loaded application - adding .properties.attachments to impacted nodes
//    *
//    * @param socialDocumentMessage
//    */
//   setNodeAttachments(documentTreeMessage: SocketMessage): void {
//     const self = this;
//     if (self.getCurrentApplication()) {
//       console.log(`Documents: State process documents for instance id: ${self.getInstanceId()}`);
//       self.listenerPrepareService.prepareDocumentTreeMessage(self.getInstanceId(), self.getCurrentApplication(), documentTreeMessage);
//     } else {
//       console.log(`Documents: Heard a change - application is not loaded, cannot yet process.`);
//     }
//   }
//
//   /**
//    * typically called to set first Section on application load.
//    * @param {Section} theSection
//    */
//   setCurrentSection(theSection: Section): void {
//     const self = this;
//     if (!theSection) {
//       console.log('Failed to set Current Section to an Empty Section');
//       return;
//     }
//     // console.log('User is moving around -> clear out focus attributes.');
//     self.currentState.clearActiveFocusedNodes();
//     self.currentState.setActiveSection(theSection);
//     self.setUpActiveReferences(theSection as Node);
//   }
//
//   setCurrentApplication(_application: Application, responseSettings: ResponseSettings): boolean {
//     const self = this;
//     if (_application) {
//       self.currentState.setApplication(_application);
//       self.currentApplication = _application;
//       let firstSection = self.currentApplication.getFirstSection();
//       if (responseSettings.getParentSectionUuid()) {
//         firstSection = _application.getNodeById(responseSettings.getParentSectionUuid());
//       }
//       self.setCurrentSection(firstSection);
//       return true;
//     } else {
//       console.log('Not enough information was provided to create an Application instance, cannot load form.');
//       return false;
//     }
//   }
//
//   getCurrentApplication() {
//     return this.currentApplication;
//   }
//
//   setInstanceId(_instanceId: Uuid) {
//     this.currentState.setApplicatonInstanceId(_instanceId);
//     this.newApplicationMeta$.next(_instanceId);
//   }
//
//   getInstanceId(): Uuid {
//     return this.currentState.getApplicationInstanceId();
//   }
//
//   /**
//    * Iterates through application's fields and sets `isActive` and `isHighlighted`
//    * based on the provided `activeField`
//    *
//    * @param activeField
//    * @param fields
//    */
//   setFields(activeField: Field, fields: Array<Field>) {
//     const self = this;
//
//     forEach(fields, (field: Field) => {
//       if (isNull(activeField)) {
//         // this usually happens in Summary pages where it has no fields
//         self.setInactiveField(field);
//       } else if (activeField.id === field.id) {
//         self.currentState.setActiveField(activeField);
//       }
//     });
//   }
//
//   setStatus(_status: string) {
//     this.currentState.setStatus(_status);
//   }
//
//   /**
//    * updates active references based on the incoming node
//    * @param node
//    */
//   setUpActiveReferences(node: Node) {
//     const self = this;
//     if (!self.getCurrentApplication()) {
//       return;
//     }
//
//     const allFields = self.getCurrentApplication().getFields();
//
//     let activeField;
//     if (node instanceof Field || node instanceof Stakeholder) {
//       // console.log(`Form State active field: ${node.properties.title} (${node.id}) `);
//       activeField = node;
//       // for fields, set active UI properties (highlight, focus) from the field-type component
//       self.currentState.setActiveField(activeField);
//
//       const section = node.getParent();
//       // we don't need to change active section, subform, tree, or form
//       // if we know the new active field is in the same section as the previous
//       if (self.currentState.activeSection && (self.currentState.activeSection.id !== section.id)) {
//         const theSubform = section.getParent();
//         const theTree = theSubform.getParent();
//         const theForm = theTree.getParent();
//         self.currentState.setActiveSection(section);
//         self.currentState.setActiveSubform(theSubform);
//         self.currentState.setActiveTree(theTree);
//         self.currentState.setActiveForm(theForm);
//       }
//     } else if (node instanceof Section) {
//       // console.log(`Form State active section: ${node.properties.title} (${node.id}) `);
//
//       self.currentState.setActiveSection(node);
//
//       const theSubform = node.getParent();
//       const theTree = theSubform.getParent();
//       const theForm = theTree.getParent();
//
//       activeField = node.getFirstField();
//       self.setFields(activeField, allFields);
//
//       self.currentState.setActiveSubform(theSubform);
//       self.currentState.setActiveTree(theTree);
//       self.currentState.setActiveForm(theForm);
//     } else if (node instanceof Subform) {
//       // console.log(`Form State active subform: ${node.properties.title} (${node.id}) `);
//
//       self.currentState.setActiveSubform(node);
//
//       const section = node.getFirstSection();
//       const theTree = node.getParent();
//       const theForm = theTree.getParent();
//
//       activeField = node.getFirstSection().getFirstField();
//       self.setFields(activeField, allFields);
//
//       self.currentState.setActiveSection(section);
//       self.currentState.setActiveTree(theTree);
//       self.currentState.setActiveForm(theForm);
//     }
//
//     self.currentState$.next(self.currentState);
//   }
//
//   handleNodeFocusError(socketMessage: SocketMessage): void {
//     const self = this;
//     const data = {
//       errCode: 'NodeFocusFailure',
//       uuid: socketMessage.data.node,
//       messages: socketMessage.data.messages,
//       type: socketMessage.data.type
//     };
//     const nodeFocusError = new CoreError(MessageType.APPLICATION_ERROR, ErrorMessage.FOCUS_NODE_NOT_FOUND, data, 'currentSection');
//     self.errorService.errorHandler(nodeFocusError);
//   }
//
//   public updateNodeProperties(socketMessage: SocketMessage) {
//     const self = this;
//     const uuid = socketMessage.data.node;
//
//     // get loaded objects for updates.
//     const application = self.getCurrentApplication();
//     const loadedNodeToUpdate = application.getNodeById(uuid);
//
//     if (loadedNodeToUpdate) {
//       self.listenerPrepareService.brokerMessageToPrepare(self.getInstanceId(), self.getCurrentApplication(), loadedNodeToUpdate, socketMessage);
//     }
//   }
//
//   /**
//    * @description:
//    * Lucy
//    * forms-service emits a lucy-event
//    * after we submit.. seems it would be handled like a regular plugin event.
//    *
//    * @todo: MOVE OUT OF STATE SERVICE!!! Probably legacy code we can get rid of
//    */
//   // updateLucyProperties(socketMessage: SocketMessage) {
//   //   const self = this;
//   //   // get loaded objects we are updating.
//   //   const application = self.getCurrentApplication();
//   //   const submitFields = application.getNodesByTitle('Submit');
//   //   if (submitFields) {
//   //     const loadedNodeToUpdate = submitFields[0];
//   //     // loadedNodeToUpdate.properties['pluginProperties']['pluginName'] = Plugin.SUBMIT;
//   //     loadedNodeToUpdate.properties.value = socketMessage.data;
//   //     loadedNodeToUpdate.properties['submittedBy'] = '';
//   //     loadedNodeToUpdate.properties['submittedDate'] = new Date();
//   //     if (socketMessage.data.firstName && socketMessage.data.lastName) {
//   //       loadedNodeToUpdate.properties['submittedBy'] = socketMessage.data.firstName + ' ' + socketMessage.data.lastName;
//   //     }
//   //   }
//   // }
//
//   public setActiveField(node: Field) {
//     const self = this;
//     self.setUpActiveReferences(node);
//   }
//
//   public setInactiveField(node: Field) {
//     node.setActive(false);
//     node.setHighlight(false);
//   }
//
//   /**
//    * Called by INCOMING web-socket messages
//    * (not called by the ui)
//    * @param {SocketMessage} socketFocusMessage
//    */
//   public setFocusOnNode(socketFocusMessage: SocketMessage) {
//     const self = this;
//     const nodeId = socketFocusMessage.nodeUuid;
//     const node = this.getCurrentApplication().getNodeById(nodeId);
//
//     if (!node) {
//       self.handleNodeFocusError(socketFocusMessage);
//     } else {
//       node.setActive(true);
//       node.properties.focus = {
//         'focusMessage': socketFocusMessage.message,
//         'focusType': socketFocusMessage.focusType
//       };
//       this.setUpActiveReferences(node);
//     }
//   }
//
//   /**
//    * @description:
//    * Responds to `flag-change` event and updates a node's flags
//    * @param {SocketMessage} socketMessage msg from WS containing new flag data
//    */
//   public updateNodeFlag(socketMessage: SocketMessage): void {
//     const self = this,
//       nodeId = socketMessage.data.nodeId,
//       application = self.getCurrentApplication(),
//       node = application.getNodeById(nodeId);
//
//     if (node) {
//       self.listenerPrepareService.brokerFlagToPrepare(application, node, socketMessage);
//     }
//   }
//
//   public clearFormState(): void {
//     this.currentApplication = null;
//     this.unloadApplication$.next(null);
//   }
// }

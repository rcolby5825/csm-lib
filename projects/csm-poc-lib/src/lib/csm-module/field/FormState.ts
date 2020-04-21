import {Application, Field, Form, Section, Subform, Tree} from '../../model-module/models/index';
import {FamilyTree} from './FamilyTree';

type Uuid = string;

export class FormState {

  private applicationId: string;
  private applicationInstanceId: string;
  private status: any; // IN PROGRESS SUBMITTED enum
  private application: Application;
  private isChild: boolean;
  private familyTree: FamilyTree; // used for table menu (descendant.title) items

  activeForm: Form;
  activeTree: Tree;
  activeSubform: Subform;
  activeSection: Section;
  activeField: Field;

  getApplicationId() {
    return this.applicationId;
  }

  setApplicationInstanceId(applicationInstanceId: string): void {
    this.applicationInstanceId = applicationInstanceId;
  }

  getApplicationInstanceId(): Uuid {
    return this.applicationInstanceId;
  }

  getStatus() {
    return this.status;
  }

  setAsNestedChildForm(isChild: boolean) {
    this.isChild = isChild;
  }

  isNestedChildForm() {
    return this.isChild;
  }

  getApplication(): Application {
    return this.application;
  }

  getActiveForm(): Form {
    return this.activeForm;
  }

  getActiveTree(): Tree {
    return this.activeTree;
  }

  getActiveSubform(): Subform {
    return this.activeSubform;
  }

  getActiveSection(): Section {
    return this.activeSection;
  }

  setApplicatonInstanceId(_uuid: Uuid) {
    this.applicationInstanceId = _uuid;
  }

  setStatus(_status: string) {
    this.status = _status;
  }

  setApplication(application_: Application) {
    this.application = application_;
    this.applicationId = application_.id;
  }

  setActiveForm(_form: Form) {
    this.activeForm = _form;
  }

  setActiveTree(_tree: Tree) {
    this.activeTree = _tree;
  }

  setActiveSubform(_subform: Subform) {
    this.activeSubform = _subform;
  }

  setActiveSection(_section: Section) {
    this.activeSection = _section;
  }

  setActiveField(_field: Field) {
    this.activeField = _field;
  }

  getActiveField(): Field {
    return this.activeField;
  }

  setFamilyTree(familyTree_: FamilyTree): void {
    this.familyTree = familyTree_;
  }

  getFamilyTree(): FamilyTree {
    return this.familyTree;
  }

  clearActiveFocusedNodes(): void {
    // console.log('User has shifted focus -> remove focus attributes and un-select active field.');
    if (this.activeField) {
      delete this.getActiveField().properties.focus;
      this.activeField = null;
    }
    if (this.activeSection) {
      delete this.getActiveSection().properties.focus;
    }
    if (this.activeSubform) {
      delete this.getActiveSubform().properties.focus;
    }
    if (this.activeTree) {
      delete this.getActiveTree().properties.focus;
    }
  }
}

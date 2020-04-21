import {Application, Field, Form, Section, Subform, Tree, Table, Stakeholder} from '../../model-module/models';
import {Node} from '../../model-module/models/node';
import {ReviewFlag} from '../../essentials-module/components/review-flag/review-flag';
import {ReviewFlags} from '../../essentials-module/components/review-flag/review-flags';
import {Grid} from '../../essentials-module/components/field-types_r/table-grid/model/grid';
import {Row} from '../../essentials-module/components/field-types_r/table-grid/model/row';
import {has} from 'lodash';

/**
 * @description
 *   this class serves as a pointer to
 *   current node in the schema
 *   it does NOT represent the UI's FormState
 *   this is in memory and will be lost on a page re-fresh
 */
export class SchemaPointer {

  private applicationInstanceId;
  private application: Application;
  private activeForm: Form;
  private activeTree: Tree;
  private activeSubform: Subform;
  private activeSection: Section;
  private activeField: Field;
  private activeStakeholder: Stakeholder;
  private activeReview: ReviewFlag;
  private activeTable: Table;
  private activeTableRow: Row;

  constructor(private application_: Application, private applicationInstanceId_: string) {
    this.application = application_;
    this.applicationInstanceId = applicationInstanceId_;
    this.setActiveSection(this.application_.getFirstSection());
    this.setActiveField(this.activeSection.getFirstField());
    this.setActiveTable(this.application.getTables()[0]); // default, first table
    this.setUpActiveReferences(this.activeField);
  }

  setFirstSection(): boolean {
    this.setActiveSection(this.application_.getFirstSection());

    if (this.activeSection) {
      this.setActiveField(this.activeSection.getFirstField());
      this.setUpActiveReferences(this.activeField);
      return true;
    } else {
      return false;
    }
  }

  setNextSection(): boolean {
    const currentSection = this.application.getNodeById(this.activeSection.id);
    const nextSection = currentSection.getNextSection();
    if (nextSection && !nextSection.properties.hidden) {
      // console.log(`NEXT SECTION IS: ${nextSection.properties.title}`);
      this.setActiveSection(nextSection);
      const firstFieldOfNextSection = nextSection.getFirstField();
      this.setUpActiveReferences(firstFieldOfNextSection);
      return true;
    } else {
      return this.setFirstSection();
    }
    return false;
  }

  setPreviousSection(): boolean {
    const currentSection = this.application.getNodeById(this.activeSection.id);
    const previousSection = currentSection.getPreviousSection();
    if (previousSection && !previousSection.properties.hidden) {
      this.setActiveSection(previousSection);
      const firstFieldOfPreviousSection = previousSection.getFirstField();
      this.setUpActiveReferences(firstFieldOfPreviousSection);
      return true;
    }
    return false;
  }

  setLastSection(): boolean {
    const lastSection = this.application.getLastSection();
    this.setUpActiveReferences(lastSection);
    return true;
  }

  /**
   * Sets pointer to first field in the
   * active section
   */
  setFirstField(): boolean {
    const firstField = this.getActiveSection().getFirstField();
    this.setActiveField(firstField);
    return true;
  }

  /**
   * sets pointer to first field in the
   * active section
   */
  setLastField(): boolean {
    const lastField = this.getActiveSection().getLastField();
    this.setActiveField(lastField);
    return true;
  }

  setActiveTable(table: Table): void {
    if (!table) {
      this.activeTable = this.application.getTables()[0] ? this.application.getTables()[0] : null;
      return;
    }
    this.activeTable = table;
  }

  setFirstTable(): boolean {
    const tables = this.indexTables();
    if (tables[0]) {
      this.activeTable = tables[0];
      return true;
    }
    return false;
  }

  setLastTable(): boolean {
    const tables = this.indexTables();
    if (tables.length) {
      const lastIndex = tables.length - 1;
      this.activeTable = tables[lastIndex];
      return true;
    }
    return false;
  }

  setPreviousTable(): boolean {
    const tables = this.indexTables();
    const currentTable = this.activeTable;
    if (!currentTable) {
      return false;
    }

    tables.forEach((table, i) => {
      if (table.id === currentTable.id) {
        const previousTable = tables[i - 1];
        if (previousTable) {
          this.activeTable = previousTable;
          return true;
        } else {
          return false;
        }
      }
    });
  }

  setNextTable(): boolean {
    const tables = this.indexTables();
    const currentTable = this.activeTable;
    if (!currentTable) {
      return false;
    }

    tables.forEach((table, i) => {
      if (table.id === currentTable.id) {
        const nextTable = tables[i + 1];
        if (nextTable) {
          this.activeTable = nextTable;
          return true;
        } else {
          return false;
        }
      }
    });
  }

  /**
   * @description helper function that collects all fields of type 'table'
   * @author Ramsey
   * @returns {array}
   */
  indexTables(): Array<Table> {
    const fields = this.application.getFields()[0];
    const tables = [];
    fields.forEach(field => {
      if (field.type === 'table') {
        tables.push(field);
      }
    });

    return tables;
  }

  setFirstTableRow(): boolean {
    const table = this.activeTable;
    if (table) {
      const grid = new Grid(this.activeTable);
      const firstRow = grid.rows[0];
      if (firstRow) {
        this.activeTableRow = firstRow;
        return true;
      }
    }
    return false;
  }

  setLastTableRow(): boolean {
    const table = this.activeTable;
    if (table) {
      const grid = new Grid(this.activeTable);
      const lastRow = grid.rows[grid.rows.length - 1];
      if (lastRow) {
        this.activeTableRow = lastRow;
        return true;
      }
    }
    return false;
  }

  setPreviousTableRow(): boolean {
    const currentRow = this.activeTableRow;
    if (!currentRow) {
      return false;
    }
    const grid = new Grid(this.activeTable);
    grid.rows.forEach((row, i) => {
      if (row.cells[0].dataProviderId === currentRow.cells[0].dataProviderId) {
        const previousRow = grid.rows[i - 1];
        if (previousRow) {
          this.activeTableRow = previousRow;
          return true;
        } else {
          return false;
        }
      }
    });
  }

  setNextTableRow(): boolean {
    const currentRow = this.activeTableRow;
    if (!currentRow) {
      return false;
    }
    const grid = new Grid(this.activeTable);
    grid.rows.forEach((row, i) => {
      if (row.cells[0].dataProviderId === currentRow.cells[0].dataProviderId) {
        const nextRow = grid.rows[i + 1];
        if (nextRow) {
          this.activeTableRow = nextRow;
          return true;
        } else {
          return false;
        }
      }
    });
  }

  setFirstReview(): boolean {
    const fields = this.application.getFields(),
      reviewFlags = new ReviewFlags(this.application, fields[0], null, null);
    if (reviewFlags.applicationFlagsList[0]) {
      const field = this.application.getNodeById(reviewFlags.applicationFlagsList[0]);
      const flag = new ReviewFlag(field, field.properties.flags[0]);
      this.activeReview = flag;
      return true;
    }
    return false;
  }

  setLastReview(): boolean {
    const fields = this.application.getFields(),
      reviewFlags = new ReviewFlags(this.application, fields[0], null, null),
      lastIndex = reviewFlags.applicationFlagsList.length - 1;
    if (lastIndex) {
      const field = this.application.getNodeById(reviewFlags.applicationFlagsList[lastIndex]);
      const flag = new ReviewFlag(field, field.properties.flags[0]);
      this.activeReview = flag;
      return true;
    }
    return false;
  }

  setNextReview(): boolean {
    const fields = this.application.getFields();
    const reviewFlags = new ReviewFlags(this.application, fields[0], null, null);
    const currentReview = this.activeReview;
    if (!currentReview) {
      const field = this.application.getNodeById(reviewFlags.applicationFlagsList[0]);
      this.activeReview = new ReviewFlag(field, field.properties.flags[0]);
      return true;
    }

    reviewFlags.applicationFlagsList.forEach((nodeId, i) => {
      if (nodeId === currentReview.nodeId) {
        const nextId = reviewFlags.applicationFlagsList[i + 1];
        const field = this.application.getNodeById(nextId);
        this.activeReview = new ReviewFlag(field, field.properties.flags[0]);
        return true;
      }
    });

    return false;
  }

  setPreviousReview(): boolean {
    const fields = this.application.getFields();
    const reviewFlags = new ReviewFlags(this.application, fields[0], null, null);
    const currentReview = this.activeReview;
    if (!currentReview) {
      return false;
    }

    reviewFlags.applicationFlagsList.forEach((nodeId, i) => {
      if (nodeId === currentReview.nodeId) {
        const nextId = reviewFlags.applicationFlagsList[i - 1];
        const field = this.application.getNodeById(nextId);
        this.activeReview = new ReviewFlag(field, field.properties.flags[0]);
        return true;
      }
    });

    return false;
  }

  setApplicationInstanceId(applicationInstanceId: string): void {
    this.applicationInstanceId = applicationInstanceId;
  }

  getApplicationInstanceId(): string {
    return this.applicationInstanceId;
  }

  setApplication(_application: Application) {
    this.application = _application;
  }

  getApplication(): Application {
    return this.application;
  }

  setActiveForm(_form: Form) {
    this.activeForm = _form;
  }

  getActiveForm(): Form {
    return this.activeForm;
  }

  setActiveTree(_tree: Tree) {
    this.activeTree = _tree;
  }

  getActiveTree(): Tree {
    return this.activeTree;
  }

  setActiveSubform(_subform: Subform) {
    this.activeSubform = _subform;
  }

  getActiveSubform(): Subform {
    return this.activeSubform;
  }

  setActiveSection(_section: Section): boolean {
    this.activeSection = _section;
    return true;
  }

  getActiveSection(): Section {
    return this.activeSection;
  }

  setActiveField(_field: Field): void {
    if (!_field) {
      this.activeField = this.application.getFields()[0];
      return;
    }
    // this.calculateNextVisibleEnabledField();
    this.activeField = _field;
    this.activeField.properties.resetValue = this.activeField.properties.value;
    this.activeField.properties.validationError = '';
  }

  setActiveStakeholder(stakeholder: Stakeholder): void {
    if (!stakeholder) {
      return;
    }
    this.activeStakeholder = stakeholder;
  }

  getActiveStakeholder(): Stakeholder {
    return this.activeStakeholder;
  }

  setActiveFieldValidationError(err: string) {
    this.activeField.properties.validationError = err;
  }

  getActiveField(): Field {
    return this.activeField;
  }

  getActiveReview(): ReviewFlag {
    return this.activeReview;
  }

  getActiveTable(): Table {
    return this.activeTable;
  }

  getActiveTableRow(): Row {
    return this.activeTableRow;
  }

  setPreviousField(): boolean {
    const self = this;
    let currentField = self.application.getNodeById(this.activeField.id);
    if (!currentField) {
      currentField = self.application.getFields()[0];
    }
    // const previousField = self.calculatePreviousVisibleEnabledField();
    const previousField = currentField.getPreviousField();
    if (previousField) {
      const isInCurrentSection = previousField.getParent().id === this.activeSection.id;
      if (isInCurrentSection) {
        console.log(`\tSetting Previous Field To: ${previousField.properties.title}`);
        this.setActiveField(previousField);
        return true;
      }
    }
    return false;
  }

  private calculatePreviousVisibleEnabledField() {
    const self = this;
    let previousField = self.getActiveField().getPrevious();

    while (previousField && ((previousField.properties.hidden || previousField.properties.disabled))) {
      if (!previousField.getPreviousField()) {
        previousField = self.getActiveSection().getLastField();
      } else {
        previousField = previousField.getPreviousField();
      }
    }
    return previousField;
  }

  setNextField(): boolean {
    const self = this;
    let currentField = this.application.getNodeById(this.activeField.id);
    if (!currentField) {
      currentField = this.application.getFields()[0];
    }
    // const nextField = self.calculateNextVisibleEnabledField();
    const nextField = currentField.getNextField();
    if (nextField) {
      const isInCurrentSection = nextField.getParent().id === this.activeSection.id;
      if (isInCurrentSection) {
        console.log(`\tSetting Next Field To: ${nextField.properties.title}`);
        this.setActiveField(nextField);
        return true;
      }
    }
    return false;
  }

  // private calculateNextVisibleEnabledField(): Field {
  //   const self = this;
  //   let nextField = self.getActiveField().getNext();
  //   while (nextField && ((nextField.properties.hidden || nextField.properties.disabled))) {
  //     if (!nextField.getNext()) {
  //       nextField = self.getActiveSection().getLastField();
  //     } else {
  //       nextField = nextField.getNext();
  //     }
  //   }
  //   return nextField;
  // }

  getStakeholderByType(type: string): Field {
    const stakeholders = this.application.getStakeholders();
    let fieldToReturn;
    stakeholders.forEach(field => {
      if (field.properties.fieldType === type) {
        fieldToReturn = field;
      }
    });
    return fieldToReturn;
  }

  getSubmitPlugin(): Node {
    const nodes = this.application.getContent();
    let submitNode;
    nodes.forEach(node => {
      if (has(node.properties, 'pluginProperties')) {
        if (node.properties.pluginProperties.pluginName === 'submit') {
          submitNode = node;
        }
      }
    });
    return submitNode;
  }

  /**
   * checklists do not have fields
   * so dont set active field
   * @param checklistSection
   */
  setChecklistReferences(checklistSection: Section) {
    const self = this;
    self.setActiveSection(checklistSection);
    const theSubform = checklistSection.getParent();
    const theTree = theSubform.getParent();
    const theForm = theTree.getParent();
    // checklists do not have fields
    self.setActiveField(undefined);
    if (theSubform.id !== self.activeSubform.id) {
      self.setActiveSubform(theSubform);
    }
    if (theTree.id !== self.activeTree.id) {
      self.setActiveTree(theTree);
    }
    if (theForm.id !== self.activeForm.id) {
      self.setActiveForm(theForm);
    }
  }

  setUpActiveReferences(node: Node) {
    const self = this;

    if (node instanceof Field) {
      self.setActiveField(node);
      const theSection = node.getParent();
      if (theSection.id !== self.activeSection) {
        self.setActiveSection(theSection);
        const theSubform = theSection.getParent();
        const theTree = theSubform.getParent();
        const theForm = theTree.getParent();
        self.setActiveSubform(theSubform);
        self.setActiveTree(theTree);
        self.setActiveForm(theForm);
        self.setActiveField(node);
        // console.log(`Lucy -> set active reference to this Field node: ${node.properties.title}`);
      }
    } else if (node instanceof Stakeholder) {
      // console.log(`Lucy -> set active reference to this Stakeholder node: ${node.properties.title}`);
      self.setActiveStakeholder(node);
      const theSection = node.getParent();

      if (theSection.id !== self.activeSection) {
        self.setActiveSection(theSection);
        const theSubform = theSection.getParent();
        const theTree = theSubform.getParent();
        const theForm = theTree.getParent();
        self.setActiveSubform(theSubform);
        self.setActiveTree(theTree);
        self.setActiveForm(theForm);
      }
    } else if (node instanceof Section) {
      // console.log(`Lucy -> set active reference to this Section node: ${node.properties.title}`);
      self.setActiveSection(node);
      const theSubform = node.getParent();
      const theTree = theSubform.getParent();
      const theForm = theTree.getParent();
      if (node.getFirstField()) {
        self.setActiveField(node.getFirstField());
      }
      if (theSubform.id !== self.activeSubform.id) {
        self.setActiveSubform(theSubform);
      }
      if (theTree.id !== self.activeTree.id) {
        self.setActiveTree(theTree);
      }
      if (theForm.id !== self.activeForm.id) {
        self.setActiveForm(theForm);
      }

    } else if (node instanceof Subform) {
      // console.log(`Lucy -> set active reference to this Subform node: ${node.properties.title}`);
      self.setActiveSubform(node);

      const theSection = node.getFirstSection();
      const theTree = node.getParent();
      const theForm = theTree.getParent();

      if (theSection.id !== self.activeSection.id) {
        self.setActiveSection(theSection);
      }
      if (theTree.id !== self.activeTree.id) {
        self.setActiveTree(theTree);
      }
      if (theForm.id !== self.activeForm.id) {
        self.setActiveForm(theForm);
      }
    }
    return true;
  }


}

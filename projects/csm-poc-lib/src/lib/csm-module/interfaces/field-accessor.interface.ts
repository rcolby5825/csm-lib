/**
 * @description
 *  pluggible interface providing standard methods for multiple implementations
 *  The FieldAccessor provides access to fields within a section.
 *  Note that information about the Form engine is encapsulated behind the API so that
 *  client modules aren’t required to know the specific workings of forms.
 */
import {Field} from '../field/field';


export interface FieldAccessorInterface {

  /**
   * @description
   *  POINTER to the first field in a
   *  subform.
   */
  first(): boolean;

  find(title: string, index: number): boolean;

  /**
   * @description
   * POINTER to the last field in a
   * subform
   */
  last(): boolean;

  /**
   * @description
   * Traverses to next field and returns false if no more fields are found.
   */
  next(): boolean;

  /**
   * @description
   *  Traverses to previous field and returns false if no more fields are found.
   */
  previous(): boolean;

  getHelp(): string;

  getHint(): string;

  getList(): Array<string>;

  getTitle(): string;

  getUUID(): string;

  getValue(): string;

  /**
   * @description
   * ACTUALLY set UI Focus to this node.
   * @params node
   */
  focus(node: Node): void;

  /**
   * @description
   *  Returns content of current field or empty string if not available.
   */

  selectByUUID(uuid: string): boolean;

  setValue(fieldTitle: string, value: string): void;

  reset(): boolean;

  isComplete(): boolean;

  hasError(): boolean;

  getError(): string;

  validate(targetNode: Field, speech: string): boolean;

  getType(): string;

  isRequired(): boolean;

  isEditable(): boolean;

  isPrivate(): boolean;


}

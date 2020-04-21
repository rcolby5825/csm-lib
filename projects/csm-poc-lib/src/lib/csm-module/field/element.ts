import {ReviewFlag} from './review-flag';
import {Permission} from './permission.enum';


export class Element {
  id: string;
  type: string;
  properties: {
    value: string,
    disabled: boolean;
    hidden: boolean;
    permissions: Array<Permission>;
    progressStatus: string;
    stats: {
      value: {
        required: number,
        completed: number
      }
    },
    title: string;
    flags: Array<ReviewFlag>
  };
}

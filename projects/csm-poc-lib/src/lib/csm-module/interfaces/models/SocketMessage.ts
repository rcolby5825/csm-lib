import {SocketServerMessage} from '../enum/socket-server-message.enum';
import {FocusType} from '../enum/focus-type.enum';


type Uuid = string;
interface ISender {
  firstName?: string;
  lastName?: string;
  email?: string;
  userId: string;
}
/**
 * @interfaces ITable
 * @description This gives us all the data from the Socket about a table
 */
interface ITable {
  uuId?: string;
  tableName?: string;
  numRows?: number;
  numCols?: number;
  bitActive?: boolean;
}

/**
 * pojo to hold incoming server side web-socket messages
 * data: {
    node: string,
    completed: any,
    required: any,
    value:
      {errCode: string,
        type: string,
        channel: string,
        flags: Array<string>,
        completed: any,
        required: any,
        messages: string,
        flagId: string,
        nodeId: string,
        key: string,
        value: string,
        stakeholder: {completed: any, required: any}},
 */
export class SocketMessage {
  name: SocketServerMessage; // see SocketServerMessage enum
  userId: string;
  applicationId: Uuid; // might not always be sent
  applicationInstanceId: Uuid; // might not always be sent
  status: any; // might not always be sent
  applicationType: string; // might not always be sent
  focusType: FocusType; // only sent on FocusMessages
  message: string;
  nodeUuid: Uuid; // needed for FocusMessages
  data: any;
  label: string; // social-notification, indicates subject of message
  payload: any; // object containing unlimited # of properties, such as {"message": "hello", "from": "ryan"}
  sender: ISender; // indicates the user who sent the social-notification
  table: ITable;


  constructor(_name: SocketServerMessage, _socketData: any) {
    this.name = _name;
    if (_socketData) {
      this.userId = _socketData.userId;
      this.applicationId = _socketData.applicationId;
      this.applicationInstanceId = _socketData.applicationInstanceId;
      this.applicationType = _socketData.applicationType;
      this.focusType = _socketData.type;
      this.message = _socketData.message;
      this.nodeUuid = _socketData.node;
      this.label = _socketData.label;
      this.payload = _socketData.payload;
      this.sender = _socketData.sender;
      this.table = _socketData.table;
      this.data = _socketData;
    }
  }

  getData() {
    return this.data;
  }
}


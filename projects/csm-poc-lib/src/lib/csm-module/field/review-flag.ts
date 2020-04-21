


export class ReviewFlag {

  node: Node; // parent field object
  nodeId: string; // parent field UUID
  applicationInstanceId: string;
  flagActive: Boolean;
  flagStatus: string;
  flagId: string;
  flagType: string; // "flag"
  foreignId: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  isModifying: Boolean;

  constructor(node: Node, flag: any) {
    const self = this;

    self.node = node; // parent field, row, etc that the flag lives on. We need to include this to focus on the node.
    self.nodeId = flag.nodeId;
    self.applicationInstanceId = flag.applicationInstanceId;
    self.flagActive = flag.flagActive;
    self.flagStatus = flag.flagStatus;
    self.flagId = flag.flagId;
    self.flagType = flag.flagType;
    self.foreignId = flag.foreignId;
    self.message = flag.message;
    self.createdAt = flag.createdAt;
    self.updatedAt = flag.updatedAt;
    self.userId = flag.userId;
    self.isModifying = false;
  }
}

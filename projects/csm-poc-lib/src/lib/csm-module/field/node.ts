// import * as _ from 'underscore';
// import {EventEmitter} from 'events';
//
// const nodeTypesToDefinitions = {};
//
// export class Node extends EventEmitter {
// // export class Node {
//   _parent: any;
//   _childrenByType: any;
//   properties: any;
//   _rootSchema: any;
//   // nodes: any;
//   id: any;
//   // only one node can be active
//   isActive: boolean;
//   // multiple nodes can be highlighted
//   isHighlighted: boolean;
//
//   constructor(extend, parent, options = null) {
//     // @param {object} extend to mixin to this (self)
//     // @param {object} parent which this node is a child of
//     // @param {object} options (OPTIONAL) contains additional impl and abilities to enhances nodes
//
//     super();
//     const self = this;
//
//     _.extend(this, extend);
//     this._parent = parent;
//
//     const rootSchema = this.getRootSchema();
//
//     this._childrenByType = {};
//     this._instantiateChildren(options);
//
//     if (!this.properties) {
//       this.properties = {};
//     }
//
//     if (typeof (window) !== 'undefined' && typeof (Proxy) === 'function') {
//       this.properties = new Proxy(this.properties, {
//         set: function (target, name, value) {
//           if (target[name] !== value) { // ensure there is a value-change before assigning and emitting
//             target[name] = value;
//             // emit() is inherited from EventEmitter3. The <any> satisfies typescript.
//             (<any>self).emit('property-change', {
//               target: self,
//               name: name,
//               value: value
//             });
//             try {
//               rootSchema.emit('child-property-change', {
//                 target: self,
//                 name: name,
//                 value: value
//               });
//             } catch (error) {
//               // console.log( 'Node does not have an emit method.');
//             }
//           }
//
//           return true;
//         }
//       });
//     }
//
//   }
//
//   static register = function (nodeType, classDefinition) {
//     nodeTypesToDefinitions[nodeType] = classDefinition;
//   };
//
//   static getClassFromType = function (nodeType) {
//     if (nodeType in nodeTypesToDefinitions) {
//       return nodeTypesToDefinitions[nodeType];
//     }
//
//     throw new Error('Node type "' + nodeType + '" does not exist');
//   };
//
//   getParent() {
//     return this._parent;
//   }
//
//   getRootSchema() {
//     const self = this;
//
//     if (this._rootSchema) {
//       return this._rootSchema;
//     }
//
//     if ((<any>self).type && (<any>self).type === 'application') {
//       // this is instance of Application
//       this._rootSchema = this;
//       return this;
//     }
//
//     function getRootSchema(obj) {
//       try {
//         const parent = obj.getParent();
//         if (parent && (<any>parent).type && (<any>parent).type === 'application') {
//           // parent is instance of Application
//           self._rootSchema = parent;
//           return parent;
//         }
//         return getRootSchema(parent);
//       } catch (error) {
//         console.log('Node does not have a parent.');
//         // return obj.nodes[0]; // FIXME given Section with no parent, will return Field?
//         return obj.properties.children[0]; // FIXME given Section with no parent, will return Field?
//       }
//     }
//
//     return getRootSchema(this);
//   }
//
//   setActive(flag: boolean) {
//     // only 1 node in a array can be active
//     this.isActive = flag;
//   }
//
//   getIsActive() {
//     return this.isActive;
//   }
//
//   setHighlight(flag: boolean) {
//     // multiple nodes in an array may be hightlighted
//     this.isHighlighted = flag;
//   }
//
//   _instantiateChildren(options) {
//     const self = this;
//     // if (!self.nodes) {
//     if (!self.properties.children) {
//       return;
//     }
//
//     const children = [];
//     // self.nodes.forEach(function (node) {
//     self.properties.children.forEach(function (node) {
//       const ChildClass = Node.getClassFromType(node.type);
//       const childObject = new ChildClass(node, self, options);
//       children.push(childObject);
//       if (!self._childrenByType[node.type]) {
//         self._childrenByType[node.type] = [];
//       }
//       self._childrenByType[node.type].push(childObject);
//     });
//     // self.nodes = children;
//     self.properties.children = children;
//   }
//
//   getChildren() {
//     // return this.nodes || [];
//     return this.properties.children || [];
//   }
//
//   merge(obj) {
//     _.extend(this, obj);
//   }
//
//   getChildrenByType(type) {
//     const descendants = [];
//     const self = this;
//     const recurse = function (node) {
//       if (node.type === type && self.id !== node.id) {
//         descendants.push(node);
//       }
//       // if (node.nodes) {
//       //   node.nodes.forEach(recurse);
//       if (node.properties.children) {
//         node.properties.children.forEach(recurse);
//       }
//     };
//     recurse(self);
//     return descendants;
//   }
//
//   appendChild(node) {
//     const ChildClass = Node.getClassFromType(node.type);
//     const childObject = new ChildClass(node, this);
//     // this.nodes.push(childObject);
//     this.properties.children.push(childObject);
//     this.getRootSchema().buildIndexes();
//     return childObject;
//   }
//
//   insertChildAt(index, node): void {
//     const ChildClass = Node.getClassFromType(node.type);
//     const childObject = new ChildClass(node, this);
//     // this.nodes[index] = childObject;
//     this.properties.children[index] = childObject;
//     this.getRootSchema().buildIndexes();
//     return childObject;
//   }
//
//   replaceChild(node) {
//     let index = -1;
//     // this.nodes.forEach(function (obj, i) {
//     this.properties.children.forEach(function (obj, i) {
//       if (obj.id === node.id) {
//         index = i;
//       }
//     });
//
//     let childObject;
//     if (index === -1) {
//       childObject = this.appendChild(node);
//     } else {
//       childObject = this.insertChildAt(index, node);
//     }
//     this.getRootSchema().buildIndexes();
//     return childObject;
//   }
//
//   toJSON(toInclude) {
//     let include = [
//       'id',
//       'properties',
//       'resourceId',
//       'type',
//       'schemaDefinition',
//       'rootApplicationId',
//       'entity',
//       'entityAttribute'
//     ];
//     if (toInclude) {
//       include = include.concat(toInclude);
//     }
//     return _.pick(this, include);
//   }
// }

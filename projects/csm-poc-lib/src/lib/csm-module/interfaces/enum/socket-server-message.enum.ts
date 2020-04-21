// Message Constants sent by Server
export enum SocketServerMessage {
  APP_META = 'app-meta', // after initialized
  APPLICATION_ERROR = 'application-error', // includes the node uuid string or array of string, error type (validation), node (uuid), undefined over all app err)
  APPLICATION_MODEL = 'application-model', // after initialized
  APPLICATION_MODEL_REFRESH = 'application-model-refresh', // boolean first run is falsey, everything else is true
  APPLICATION_PROPERTY_CHANGE = 'application-property-change', // every time a property change.
  DOCUMENT_TREE = 'document-tree', // list of social documents for an instance-id (sent after model-load)
  DUE_DATES = 'due-dates', // list of pending due dates
  FAMILY_TREE = 'family-tree',
  FLAG_CHANGE = 'flag-change',
  FOCUS_NODE = 'focus-node',
  LUCY_EVENT = 'lucy-event',
  NOT_AUTHORIZED = 'not-authorized', // you are attempting to access a resource you aren't supposed to
  OPEN = 'open', // not implemented
  SECTION_LOAD = 'section-load',
  SESSION_EXPIRED = 'session-expired',
  SET_COOKIE = 'set-cookie', // string, name, expires, sessionExpires
  SOCIAL_NOTIFICATION = 'social-notification', // a curated social-notification message
  SOCIAL_CHAT_EVENT = 'social-chat-event', // communicate with external social chat accessor
  STATE_INITIALIZED = 'state-initialized',
  TABLE_CHANGE = 'table-change',
  USER_AUTHORIZED = 'user-authorized' // socket router is ready to receive an init message,
}


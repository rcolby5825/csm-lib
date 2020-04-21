export enum Permission {
  INVITE = 'INVITE',  // expectations an OWNER can invite a coworker to complete parts of form.
  READ_ONLY = 'READ', // expectations form data is viewable but NOT editable, elements are disabled
  READ_WRITE = 'WRITE', // expectations form is editable (disabled=false, hidden=false)
  REVIEW = 'REVIEW', // expectations user can create a review flag if they also have WRITE permission, can mark review flags as complete.
  VIEW_FLAGS = 'VIEW_FLAGS',
  SUBMIT = 'SUBMIT',  // expectations SUBMIT Plugin Button will be disabled
  DELETE = 'DELETE'
}

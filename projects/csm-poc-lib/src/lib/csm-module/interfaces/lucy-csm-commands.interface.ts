/**
 * @description
 * This is what we need for the Lucy Commands
 */
export interface LucyCSMCommandsInterface {

  setPath(whatpath: string): void;
  getPath(): string;

  setPage(text: string): void;
  getPage(): string;

  setMessage(msg: string): void;
  getMessage(): string;

}

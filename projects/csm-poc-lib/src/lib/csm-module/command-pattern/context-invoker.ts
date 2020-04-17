import { Injectable } from '@angular/core';

@Injectable()
export class ContextInvoker {

    private _commandNames: string[] = [];
    // private _commands:any[] = [];
    // private _commands: { (data?: any): any; }[] = [];
    private _commands: ((data?: any) => any)[] = [];

    constructor() {
    }

    // public addCommand(name: string, command: { (data?: any): any; }): void {
    public addCommand(name: string, command: (data?: any) => any): void {
      // console.log('AddCommand: Name: ' + name);
      // console.log('AddCommand: Command: ' + command);
      this._commandNames.push(name);
      this._commands.push(command);
      // console.log('AddCommand: Commands: ' + this._commands);
    }

    public getCommandNames(): string[] {
      return this._commandNames;
    }

    public getCommand(name: string): any {
      for (let i = 0; i < this._commandNames.length; i++) {
        if (name === this._commandNames[i]) {
          return this._commands[i];
        }
      }
      return undefined;
    }

    public executeCommand(name: string, args?: any) {
      // var deferred = $q.defer();
      // var command:any = this.getCommand(name);
      // deferred.resolve(command(args));
      // return deferred.promise;
        return new Promise((resolve) => {
            const command: any = this.getCommand(name);
            resolve(command(args));
        });
    }

    public removeCommand(name: string) {
      for (let i = 0; i < this._commandNames.length; i++) {
        if (name === this._commandNames[i]) {
          this._commandNames.splice(i, 1);
          this._commands.splice(i, 1);
        }
      }
    }

    public removeAllCommands(): void {
      this._commandNames = [];
      this._commands = [];
    }
  }

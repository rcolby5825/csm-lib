import {AfterViewInit, Component, OnInit, OnDestroy, Input, ChangeDetectorRef} from '@angular/core';
import {CSMService} from 'csm-poc-lib/lib/csm-module/engine/csm.service';

@Component({
  selector: 'lib-avatar-papertape-modal',
  templateUrl: './avatar-papertape-modal.component.html',
  styleUrls: ['./avatar-papertape-modal.component.scss']
})

export class AvatarPapertapeModalComponent implements OnInit, OnDestroy, AfterViewInit {

  title: string;
  list: any[] = [];
  display = 'none';
  closeBtnName = 'Close PaperTape Modal';


  @Input() handle: any;
  @Input() _finalTextValue = '';
  @Input() _partsOfSpeechValue = '';
  @Input() _optionSpeech = '';
  @Input() _speechParameters = '';

  private clearOptions: boolean;
  public modalContainer: HTMLElement;

  constructor(
    private _csmService: CSMService,
    private ref: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Sample on how to push more stuff into the modal 'list'
    // this.list.push('PROFIT!!!');
    this._csmService.regForPartsOfSpeech(this.partsCallback.bind(this));
    this._csmService.regForFinalText(this.finalCallback.bind(this));
    this._csmService.regForOptions(this.optionsCallback.bind(this));
    this._csmService.regForSpeechParameters(this.speechParametersCallback.bind(this));
    this.modalContainer = document.querySelector('.drag-block') as HTMLElement;
  }

  // Had to add as HTMLElement to CAST it as the ELEMENT and eliminate the errors:
  // Property 'accessKey' is missing in type 'Element'
  // error TS2322: Type 'Element' is not assignable to type 'HTMLElement'
  // used in avatar.component.ts
  ngAfterViewInit() {
    this.modalContainer = document.querySelector('.drag-block') as HTMLElement;
  }

  public optionsCallback(options: string) {
    if (this.clearOptions) {
      this.clearOptions = false;
      this._optionSpeech = '';
    }
    this._optionSpeech = options + '<br>' + this._optionSpeech;
    this.refresh();
  }
  public partsCallback(options: string, pos: any) {
    this.clearOptions = true;
    this._partsOfSpeechValue = this.createPOSHtml(options, pos);
    this.refresh();
  }
  public finalCallback(options: string) {
    this.clearOptions = true;
    this._finalTextValue = options;
    this.refresh();
  }


  /**
   * Create HTML string for Parts of Speech.
   *
   * @param posString - parts of speech string in form: 'Dentist[NN] tiger[NN]'
   * @param pos - Parts of speech JSON for description and example lookup
   * @returns HTML string with parts of speech as tooltips
   */
  private createPOSHtml(posString: string, pos: any): string {
    // Set return
    let result = posString;

    // Convert all ']' to '[' in preparation for splitting
    while (result.indexOf(']') !== -1) {
      result = result.replace(']', '[');
    }

    // Build HTML result string
    const resultArray = result.split('[');
    result = resultArray[0];
    for (let i = 1; resultArray && i < resultArray.length; i++) {
      if (i < resultArray.length) {
        const posStr = resultArray[i++];
        const posInfo = pos[posStr];
        const html = `<a class='resultstring btn-link' data-toggle='tooltip' data-placement='top'
                    title='${posInfo.description}\n\n${posInfo.example}'><sub>${posStr}</sub></a>`;
        result += html + resultArray[i];
      }
    }

    // Return HTML parts of speech and then the other
    return result;
  }

  ngOnDestroy() {
    // console.log('Checking DETACH status', this.ref['destroyed']);
    this.ref.detach();
  }

  private refresh() {
    if (!this.ref['destroyed']) {
      this.ref.detectChanges();
    }
  }

  public speechParametersCallback(speechParameters: string) {
    this.clearOptions = true;
    this._speechParameters = '';
    for (let i = 0; speechParameters && i < speechParameters.length; i++) {
      this._speechParameters += speechParameters[i] + `<sub>[` + i + `]</sub>`;
      if (i < speechParameters.length - 1) {
        this._speechParameters += ', ';
      }
    }
    this.refresh();
  }

  closePaperTapeModal() {
    this.display = 'none';
    const modalBlockEl: HTMLElement = document.getElementsByClassName('drag-block')[0] as HTMLElement;
    // console.log('Inside closeDebugModal: ', modalBlockEl);
    modalBlockEl.style.display = 'none'; // Set block css  }
  }

}

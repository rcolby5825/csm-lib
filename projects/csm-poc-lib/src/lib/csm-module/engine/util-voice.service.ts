import {Injectable} from '@angular/core';

@Injectable({ providedIn: 'root', })
export class UtilVoiceService {

    private textToNumber = {
        'zero': '0',
        'oh': '0',
        'o': '0',
        'one': '1',
        'first': '1',
        '1st': '1',
        'two': '2',
        'to': '2',
        'second': '2',
        '2nd': '2',
        'three': '3',
        'third': '3',
        '3rd': '3',
        'four': '4',
        'fourth': '4',
        '4th': '4',
        'for': '4',
        'five': '5',
        'fifth': '5',
        'V': '5',
        '5th': '5',
        'six': '6',
        'sixth': '6',
        '6th': '6',
        'sex': '6',
        'seven': '7',
        'seventh': '7',
        '7th': '7',
        'eight': '8',
        'eighth': '8',
        '8th': '8',
        'ate': '8',
        'nine': '9',
        'ninth': '9',
        '9th': '9',
        'ten': '10',
        'tenth': '10',
        '10th': '10',
        'eleven': '11',
        'eleventh': '11',
        '11th': '11',
        'XI': '11',
        'twelve': '12',
        'twelfth': '12',
        '12th': '12',
        'thirteen': '13',
        'thirteenth': '13',
        '13th': '13',
        'fourteen': '14',
        'fourteenth': '14',
        '14th': '14',
        'fifteen': '15',
        '15th': '15',
        'sixteen': '16',
        '16th': '16',
        'XVI': '16',
        'seventeen': '17',
        'seventeenth': '17',
        '17th': '17',
        'eighteen': '18',
        'eighteenth': '18',
        '18th': '18',
        'nineteen': '19',
        'nineteenth': '19',
        '19th': '19',
        'twenty': '20',
        'twenty-first': '21',
        '21st': '21',
        'twenty-second': '22',
        '22nd': '22',
        'XXII': '22',
        'twenty-third': '23',
        '23rd': '23',
        'twenty-fourth': '24',
        '24th': '24',
        'twenty-fifth': '25',
        '25th': '25',
        'twenty-sixth': '26',
        '26th': '26',
        'twenty-seventh': '27',
        '27th': '27',
        'twenty-eighth': '28',
        '28th': '28',
        'twenty-ninth': '29',
        '29th': '29',
        'thirty': '30',
        '30th': '30',
        'thirtieth': '30',
        'thirty-first': '31',
        '31st': '31',
        'XXXI': '31'
    };

    private largeOrdinal = [
        ['twenty', '2'],
        ['thirty', '3'],
        ['fourty', '4'],
        ['fifty', '5'],
        ['sixty', '6'],
        ['seventy', '7'],
        ['eighty', '8'],
        ['ninety', '9']
    ];

    private smallOrdinal = [
        ['zero', '0'],
        ['oh', '0'],
        ['o', '0'],
        ['one', '1'],
        ['two', '2'],
        ['to', '2'],
        ['three', '3'],
        ['four', '4'],
        ['for', '4'],
        ['five', '5'],
        ['six', '6'],
        ['seven', '7'],
        ['eight', '8'],
        ['ate', '8'],
        ['nine', '9']
    ];

    private monthToNumber = {
        'january': '01',
        'jan': '01',
        'february': '02',
        'feb': '02',
        'march': '03',
        'mar': '03',
        'april': '04',
        'may': '05',
        'june': '06',
        'july': '07',
        'august': '08',
        'aug': '08',
        'september': '09',
        'sept': '09',
        'october': '10',
        'oct': '10',
        'november': '11',
        'nov': '11',
        'december': '12',
        'dec': '12'
    };

    private email = {
        'at': '@'
    };

    public capitalizeFirstLetter(word: string): string {
        // console.log('Capitalize: ', word);
        return (word.charAt(0).toUpperCase() + word.slice(1));
    }

    public isNumber(str: string): boolean {
        let i = 0;
        for (i = 0; i < str.length; i++) {
            if ('0123456789-'.indexOf(str.charAt(i)) === -1) {
                return false;
            }
        }
        return true;
    }

    public spell(str: string): string {
        let text = '';
        let i = 0;
        for (i = 0; i < str.length; i++) {
            let char = str.charAt(i);
            char = (char === '-') ? 'dash, ' : char + ' ';
            text += char;
        }
        return text;
    }

    /**
     * Translate speech misinterpretations.
     *
     * @param str - spoken speech
     * @returns corrected speech
     */
    public translate(str: string): string {
        // Perform text replacements to correct common misinterpretations of speech
        switch (str.toLowerCase()) {
            case 'reid health':
                str = 'read help';
                break;
            case 'crutchfield':
                str = 'current field';
                break;
            case 'next forum':
                str = 'next form';
                break;
            case 'chingy':
                str = 'Tingey';
                break;
            case 'empty':
                str = '';
                break;
        }

        return str;
    }

    public splitNouns(str: string, verb: string): any {
        // console.log('Split Nouns: ', str, ' verb: ', verb);
        const index: number = str.indexOf(verb);
        if (index === -1) {
            return {
                first: '',
                second: this.capitalizeFirstLetter(str)
            };
        } else {
            return {
                first: str.substring(0, index).trim(),
                second: this.capitalizeFirstLetter(str.substring(index + verb.length).trim())
            };
        }
    }

    public militarySpelling(ch: string): string {
        const char: string = ch.charAt(0);
        switch (char) {
            case 'a': return 'alpha';
            case 'b': return 'bravo';
            case 'c': return 'charlie';
            case 'd': return 'delta';
            case 'e': return 'echo';
            case 'f': return 'foxtrot';
            case 'g': return 'golf';
            case 'h': return 'hotel';
            case 'i': return 'india';
            case 'j': return 'juliett';
            case 'k': return 'kilo';
            case 'l': return 'lima';
            case 'm': return 'mike';
            case 'n': return 'november';
            case 'o': return 'oscar';
            case 'p': return 'papa';
            case 'q': return 'quebec';
            case 'r': return 'romeo';
            case 's': return 'sierra';
            case 't': return 'tango';
            case 'u': return 'uniform';
            case 'v': return 'victor';
            case 'w': return 'whiskey';
            case 'x': return 'xray';
            case 'y': return 'yankee';
            case 'z': return 'zulu';
            case '0': return '0';
            case '1': return '1';
            case '2': return '2';
            case '3': return '3';
            case '4': return '4';
            case '5': return '5';
            case '6': return '6';
            case '7': return '7';
            case '8': return '8';
            case '9': return '9';
        }
    }

    /**
     * Remove escapes from string.
     *
     * @param text to unescape
     * @result unescaped string
     */
    private unescapeString(text: string): string {
        const amp = '&amp;';
        const ampre = new RegExp(amp, 'g');
        text = text.replace(ampre, '&');
        const quot = '&quot;';
        const quotre = new RegExp(quot, 'g');
        text = text.replace(quotre, `"`);
        const apos = '&apos;';
        const aposre = new RegExp(apos, 'g');
        text = text.replace(aposre, '\'');
        const lt = '&lt;';
        const ltre = new RegExp(lt, 'g');
        text = text.replace(ltre, '<');
        const gt = '&gt;';
        const gtre = new RegExp(gt, 'g');
        text = text.replace(gtre, '>');
        return text;
    }

    public convertToType(text: string, type: string): string {
        // Prepare return type
        let result = text.trim();

        switch (type) {
            case 'Phone':
            case 'Number':
                //            debugger;
                result = this.convertOrdinalToNumber(result);
                result = this.convertFromSet(result, this.textToNumber, /[\s-]/);
                break;

            case 'Datetime':
                result = this.convertOrdinalToNumber(result);
                result = this.convertFromSet(result, this.textToNumber, /[\s-,]/, ' ', true);
                result = this.convertFromSet(result, this.monthToNumber, /[\s-,]/);
                if (result.length === 8) {
                    result = result.substring(0, 2) + '/' + result.substring(2, 4) + '/' + result.substring(4);
                }
                break;

            case 'Email':
                result = this.convertFromSet(result, this.email, /[\s]/);
                break;

            case 'Currency':
                result = this.convertOrdinalToNumber(result);
                result = this.convertFromSet(result, this.textToNumber, /[\s]/);
                break;
        }

        return result;
    }

    private convertFromSet(text: string, set: any, regEx: any, delimiter?: string, lead0?: boolean): string {
        let result = '';
        const resultArray = text.split(regEx);
        result = '';
        for (let i = 0; i < resultArray.length; i++) {
            const alternate = set[resultArray[i].toLowerCase()];
            const addLeadingZero = true;
            if (alternate) {
                resultArray[i] = alternate;
//                addLeadingZero = false;                     // If there was a substitution, don't add leading zero. Thio fixes cases like oh 704 1776 for July 4 1776
            }
            if (lead0 && addLeadingZero && resultArray[i].length === 1) {
                resultArray[i] = '0' + resultArray[i];
            }
            result += resultArray[i];
            if (delimiter && i !== resultArray.length - 1) {
                result += delimiter;
            }
        }
        return result;
    }

    private convertOrdinalToNumber(text: string): string {
        for (let i = 0; i < this.largeOrdinal.length; i++) {
            for (let j = 0; j < this.smallOrdinal.length; j++) {
                const ordinal = this.largeOrdinal[i] + ' ' + this.smallOrdinal[j];
                const index = text.indexOf(ordinal);
                if (index !== -1) {
                    text = text.substring(0, index) + this.largeOrdinal[i] + this.smallOrdinal[j] + text.substring(index + ordinal.length);
                }
            }
        }

        return text;
    }
}

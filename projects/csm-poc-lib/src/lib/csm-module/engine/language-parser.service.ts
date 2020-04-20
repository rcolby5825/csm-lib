import {Injectable} from '@angular/core';
import {InferenceEngineService} from './inference-engine.service';
// import {PatternMatcher} from 'nlcst-pattern-match';
// import {EnglishParser} from 'nlcst-parse-english';

/**
* English language parser.
*/
@Injectable({ providedIn: 'root', })
export class LanguageParserService {

/**
  * Constructor.
  */
  constructor() {
  } // end constructor

  /**
   * Get identifiers (names, numbers, etc) for given text.
   *
   * @param text - string of sentences to evaluate
   * @returns Array of sentences that contain identifiers and start position in text
   */
  // public getIdentifiers(text: string): any[] {
  //   const sentences = [];
  //
  //   // Remove all tabs
  //   text = text.replace(/\t/g, ' ');
  //   text = text.replace(/_/g, ' ');
  //
  //   // Get array of sentences with parts of speech to evaluate
  //   const parseResults = this.getPOSTemplate(text);
  //
  //   // Evaluate each sentence
  //   for (let i = 0; i < parseResults.length; i++) {
  //     sentences.push({
  //       'identifier': this.getIdentifier(['NNP', 'CD', 'JJ'/*, 'NN', 'VBZ'*/], parseResults[i].results),
  //       'start': parseResults[i].start
  //     });
  //   }
  //   //    mike2: allow groupings of POS
  //   return sentences;
  // }

  /**
   * Get identifiers within sentence.
   *
   * @param partOfSpeech - array of parts of speech for determining identifiers
   * @param posData - data structure of text, parts of speech, and positions within a sentence
   * @returns array of identifiers including start and end positions within sentence, and start offset to sentence
   */
  private getIdentifier(partOfSpeech: any[], posData: any): any[] {
    const results = [];

    // Look at sentences
    let startPosition = -1;
    let endPosition = -1;
    let previousPartOfSpeech = '';
    for (let i = 0; posData && i < posData.length; i++) {
      const sentence = posData[i];

      // Look at nodes
      const nodeList = sentence.nodeList;
      for (let j = 0; nodeList && j < nodeList.length; j++) {

        // Look at words
        const node = nodeList[j];
        if (node.type === 'WordNode') {
          let pos = node.data.pos;

          // Check for single character (initial in name?) after plural noun
          const word = node.children[0].value;
          //          console.log('# ' + word + ' = ' + pos);
          if (previousPartOfSpeech === 'NNP' && word.length === 1 && word === word.toUpperCase()) {
            pos = 'NNP';
          }

          // If POS type changed, push word, and check for next POS type
          let continueLoop = pos === previousPartOfSpeech;
          if (!continueLoop) {
            if (startPosition !== -1) {
              results.push({'start': startPosition, 'end': endPosition, 'pos': previousPartOfSpeech});
              startPosition = -1;
            }
            for (let k = 0; k < partOfSpeech.length; k++) {
              if (pos === partOfSpeech[k]) {
                previousPartOfSpeech = partOfSpeech[k];
                startPosition = node.position.start.offset;
                endPosition = node.position.end.offset;
                continueLoop = true;
                break;
              }
            }
          }

          if (continueLoop) {
            if (startPosition === -1) {
              startPosition = node.position.start.offset;
              endPosition = node.position.end.offset;
            }

            const children = node.children;
            for (let k = 0; children && k < children.length; k++) {
              // Output word information
              const word2 = children[k];

              // Save the last valid character position
              endPosition = word2.position.end.offset;
            }
          }
        }
      }
    }

    // Add last word if it is at end of sentence.
    if (startPosition !== -1) {
      results.push({'start': startPosition, 'end': endPosition, 'pos': previousPartOfSpeech});
    }

    return results;
  }

  /**
   * Mark identifiers within set of sentences using identifiers array.
   *
   * @param text - text including sentences to mark
   * @param identifiers - array of sentence identifiers to mark up
   */
  public markIdentifiers(text: string, identifiers: any[], sourceID: string): any[] {
    const results = [];

    // Mark sentence
    for (let j = identifiers.length - 1; j >= 0; j--) {
      // Mark text for each row of identifiers
      const identifier = identifiers[j].identifier;
      const start = identifiers[j].start;
      for (let i = identifier.length - 1; i >= 0; i--) {
        const thisIdentifier = identifier[i];
        const type = thisIdentifier['type'];
        const plainText = text.substring(start + thisIdentifier.end);
        if (plainText.length > 0) {
          results.unshift({text: plainText});
        }
        text = text.substring(0, start + thisIdentifier.end);
        const identifierText = text.substring(start + thisIdentifier.start);
        if (type) {
          results.unshift({text: identifierText, identifier: identifierText, type: type, source: sourceID});
        } else {
          results.unshift({text: identifierText, source: sourceID});
        }
        text = text.substring(0, start + thisIdentifier.start);
      }
    }

    if (text + 0) {
      results.unshift({text: text, source: sourceID});
    }

    return results;
  }

  /**
   * Create POS template for natural language parsing.
   *
   * @param command English text command with parts of speech (POS) and regular expressions
   * @return NLP query string with POS embedded
   */
  // public getPOSTemplate(command: string): any[] {
  //   const englishParser = new EnglishParser();
  //   const patternMatcher = new PatternMatcher({
  //     parser: englishParser
  //   });
  //
  //   // Create parser object
  //   const sentences = [];
  //   let results;
  //   let pos;
  //   let startOfSentence = 0;
  //   while (command.startsWith(' ')) {
  //     command = command.substring(1);
  //     startOfSentence++;
  //   }
  //   while (command.trim().length > 0) {
  //     // Get pattern
  //     const patternStr = 'patternMatcher.tag\`' + command + '\`';
  //     const pattern = eval(patternStr); //tslint:disable-line
  //
  //     // Evaluate spoken text against pattern
  //     results = patternMatcher.match(command, pattern);
  //     pos = this.createPartsOfSpeech(results);
  //
  //     // Evaluate next sentence
  //     let lastCharacter = results[0].position.end.offset;
  //     command = command.substring(lastCharacter);
  //     while (command.startsWith(' ')) {
  //       command = command.substring(1);
  //       lastCharacter++;
  //     }
  //     sentences.push({'results': results, 'start': startOfSentence});
  //     startOfSentence += lastCharacter;
  //   }
  //
  //   return sentences;
  // }

  /**
   * Create parts of speech based on parts of speech.
   *
   * @param results - results of parts of speech matching
   * @returns string representing parts of speech
   */
  public createPartsOfSpeech(results: any): string {
    let result = '';

    // Look at sentences
    for (let i = 0; results && i < results.length; i++) {
      const sentence = results[i];

      // Look at nodes
      const nodeList = sentence.nodeList;
      for (let j = 0; nodeList && j < nodeList.length; j++) {

        // Look at words
        const node = nodeList[j];
        if (node.type === 'WordNode') {
          const pos = node.data.pos;
          const children = node.children;
          for (let k = 0; children && k < children.length; k++) {
            // Output word information
            const word = children[k];
            result += word.value + '[' + pos + ']';
            if (pos !== 'CD') {
              result += ' ';
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Filter identifiers from identifier mapping.
   *
   * @params text
   * @params identifiers
   * @params identifierMapping
   * @params inferenceEngineService
   * @params excludeSource
   * @params identifyAll (optional)
   */
  public filterIdentifiers(text: string, identifiers: any, identifierMapping: any, inferenceEngineService: InferenceEngineService,
                           excludeSource: string, identifyAll?: boolean): void {
    for (let i = 0; i < identifiers.length; i++) {
      const identifierJSON = identifiers[i];
      const identifierArray = identifierJSON.identifier;
      for (let j = 0; j < identifierArray.length; j++) {
        const identifier = identifierArray[j];
        const identifierText = text.substring(identifier.start, identifier.end);

        if (!identifyAll) {
          // Check if this identifier is in identifierMapping, and add type
          const parts = this.getIdentifierParts(identifierText);
          for (let k = 0; k < parts.length; k++) {
            const part = parts[k];
            // Search for this part in the array of identifiers
            let type;
            for (let m = 0; m < identifierMapping.length; m++) {
              if (identifierMapping[part.toLowerCase()]) {
                type = identifierMapping[part.toLowerCase()];
                identifier['type'] = type;
                identifier['action'] = 'search';
                break;
              }
            }

            // Determine if content should be referenced
            if (type === undefined) {
              const packet = {};
              packet[part] = identifier.pos;
              const relatedPackets = inferenceEngineService.getRelatedPackets(packet, excludeSource);
              if (relatedPackets.length > 0) {
                identifier['type'] = identifier.pos;
                identifier['action'] = 'show';
                identifier['packets'] = relatedPackets;
              }
            }
          }
        }
      }
    }
  }

  /**
   * Build identifier mapping from datalist.
   *
   * @params dataList
   * @returns identifierMapping
   */
  public buildIndentifierMapping(dataList: any): any {
    // Build array of mappings for current page. This is TEMP. The back-end should provide the mapping
    const mappingResults = [];
    for (let i = 0; dataList && i < dataList.length; i++) {
      const identifierMapping = {};
      mappingResults.push(identifierMapping);
      for (const key of dataList[i]) {
        const value = dataList[i][key] + '';
        const parts = this.getIdentifierParts(value);
        for (let j = 0; j < parts.length; j++) {
          identifierMapping[parts[j].toLowerCase()] = key;
        }
      }
    }

    return mappingResults;
  }

  /**
   * Get identifier parts.
   *
   * @params value
   * @returns identifier parts array
   */
  private getIdentifierParts(value: string): string[] {
    const results = [];
    if (value) {
      if (value !== '') {
        results.push(value);
      }
      if (value.indexOf(' ') !== -1) {
        const splitValue = value.split(' ');
        for (let j = 0; j < splitValue.length; j++) {
          if (splitValue[j].endsWith(',')) {
            splitValue[j] = splitValue[j].substring(0, splitValue[j].length - 1);
          }
          if (splitValue[j].length > 1) {
            results.push(splitValue[j]);
          }
        }
      }
    }

    return results;
  }
}

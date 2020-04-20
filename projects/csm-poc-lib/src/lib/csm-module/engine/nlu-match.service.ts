import {Injectable} from '@angular/core';
// import {EnglishParser} from 'nlcst-parse-english';
// import {PatternMatcher} from 'nlcst-pattern-match';
// import {CSMService} from './csm.service';
/**
* Natural Language Parser (NLP) matching service.
*/
@Injectable({ providedIn: 'root', })
export class NLUMatchService {

    // JSON structure representing Parts of Speech (POS) and related descriptions and examples
    private _pos = {
        'CC': {'description': 'conjunction, coordinating', 'example': 'and, or, but'},
        'CD': {'description': 'cardinal number', 'example': 'five, three, 13%'},
        'DT': {'description': 'determiner', 'example': 'the, a, these '},
        'EX': {'description': 'existential there', 'example': 'there were six boys '},
        'FW': {'description': 'foreign word', 'example': 'mais '},
        'IN': {'description': 'conjunction, subordinating or preposition', 'example': 'of, on, before, unless '},
        'JJ': {'description': 'adjective', 'example': 'nice, easy'},
        'JJR': {'description': 'adjective, comparative', 'example': 'nicer, easier'},
        'JJS': {'description': 'adjective, superlative', 'example': 'nicest, easiest '},
        'LS': {'description': 'list item marker', 'example': ' '},
        'MD': {'description': 'verb, modal auxillary', 'example': 'may, should '},
        'NN': {'description': 'noun, singular or mass', 'example': 'tiger, chair, laughter '},
        'NNS': {'description': 'noun, plural', 'example': 'tigers, chairs, insects '},
        'NNP': {'description': 'noun, proper singular', 'example': 'Germany, God, Alice '},
        'NNPS': {'description': 'noun, proper plural', 'example': 'we met two Christmases ago '},
        'PDT': {'description': 'predeterminer', 'example': 'both his children '},
        'POS': {'description': 'possessive ending', 'example': '\'s'},
        'PRP': {'description': 'pronoun, personal', 'example': 'me, you, it '},
        'PRP$': {'description': 'pronoun, possessive', 'example': 'my, your, our '},
        'RB': {'description': 'adverb', 'example': 'extremely, loudly, hard  '},
        'RBR': {'description': 'adverb, comparative', 'example': 'better '},
        'RBS': {'description': 'adverb, superlative', 'example': 'best '},
        'RP': {'description': 'adverb, particle', 'example': 'about, off, up '},
        'SYM': {'description': 'symbol', 'example': '% '},
        'TO': {'description': 'infinitival to', 'example': 'what to do? '},
        'UH': {'description': 'interjection', 'example': 'oh, oops, gosh '},
        'VB': {'description': 'verb, base form', 'example': 'think '},
        'VBZ': {'description': 'verb, 3rd person singular present', 'example': 'she thinks '},
        'VBP': {'description': 'verb, non-3rd person singular present', 'example': 'I think '},
        'VBD': {'description': 'verb, past tense', 'example': 'they thought '},
        'VBN': {'description': 'verb, past participle', 'example': 'a sunken ship '},
        'VBG': {'description': 'verb, gerund or present participle', 'example': 'thinking is fun '},
        'WDT': {'description': 'wh-determiner', 'example': 'which, whatever, whichever '},
        'WP': {'description': 'wh-pronoun, personal', 'example': 'what, who, whom '},
        'WP$': {'description': 'wh-pronoun, possessive', 'example': 'whose, whosever '},
        'WRB': {'description': 'wh-adverb', 'example': 'where, when '},
        '.': {'description': 'punctuation mark, sentence closer', 'example': '.;?* '},
        ',': {'description': 'punctuation mark, comma', 'example': ', '},
        ':': {'description': 'punctuation mark, colon', 'example': ': '},
        '(': {'description': 'contextual separator, left paren', 'example': '( '},
        ')': {'description': 'contextual separator, right paren', 'example': ') '}
    };

  /**
     * Constructor.
     */
    constructor(
    ) {}

    /**
     * Match user speech against command object.
     *
     * This command may be a sentence including parts of speech.
     *
     * @param userSays - user speech
     * @param command - state machine command optionally containing parts of speech
     * @return true if the user speech is the same as the state machine command
     */
    // public matchCommand(userSays: string, command: string, forceEvaluation?: boolean): any[] {
    //     // If this command uses parts of speech, do NLP pattern matching
    //     let results;
    //     if (command.indexOf('${') !== -1 || forceEvaluation) {             // Only check parts of speech if the are in string
    //         const englishParser = new EnglishParser();
    //         const patternMatcher = new PatternMatcher({
    //             parser: englishParser
    //         });
    //
    //         // Create parser object
    //         const patternStr = 'patternMatcher.tag\`' + command + '\`';
    //         const pattern = eval(patternStr);// tslint:disable-line
    //
    //         results = patternMatcher.match(userSays, pattern);
    //
    //         // Update userSays with remaining sentences. PatternMatcher only processes 1 at a time.
    //         //      if (results && results.length > 0) {
    //         //        const nodeList = results[0].nodeList;
    //         //        const endOfSentence = nodeList[nodeList.length - 1].position.end.column;
    //         //        const userSays2 = userSays.substring(endOfSentence);
    //         //      }
    //     }
    //
    //     return results;
    // }

    /**
     * Expand command with parts of speech directives.
     *
     * @param text - original state machine command
     * @returns state machine command with parts of speech directives expanded
     */
    public getPOS(text: string): string {
        // Prepare default results
        let result = text;

        // Check if there is a variant
        let alteredText = text;
        let index = text.indexOf('/');
        if (index !== -1) {
            // Get first part of phrase
            const firstStr = alteredText.substring(0, index);
            alteredText = alteredText.substring(index + 1);

            // Get middle and last parts of phrase
            index = alteredText.indexOf('/');
            if (index !== -1) {
                const variant = alteredText.substring(0, index);
                const secondStr = alteredText.substring(index + 1);

                // Check if this is a POS or RegEx
                let replacement = `{{type: 'PatternNode',pattern: &` + variant + `&}}`;
                if (this._pos[variant]) {
                    replacement = `{{type: '*',data: {pos: &` + variant + `&}}}`;
                }

                // Build strings out of variants
                alteredText = firstStr + '$' + replacement + secondStr;
                // Keeping the '$' separate prevents the $(___) object from being evaluated

                while (alteredText.indexOf('  ') !== -1) {
                    alteredText = alteredText.replace('  ', ' ');
                }
                result = this.getPOS(alteredText.trim());
            }
        }

        return result;
    }

    /**
     * Return Parts of Speech definitions.
     *
     * @return parts of speech definitions
     */
    public getPOSDefinitions(): any {
        return this._pos;
    }

    // public validate(csmService: CSMService, text: string, regEx: string): boolean {
    //     let result = true;
    //
    //     if (regEx) {
    //         const pos = csmService.getNLUMatchService().getPOS(regEx);
    //         const variants = [];
    //         csmService.getProcessCommandService().addVariant(variants, pos);
    //         for (let i = 0; i < variants.length; i++) {
    //             const results = csmService.getProcessCommandService().finalSpeechResp.matchResults;
    //             // const results = csmService.getNLUMatchService().matchCommand(text, variants[i]);
    //             result = results && results.length > 0;
    //             if (result) {
    //                 break;
    //             }
    //         }
    //     }
    //
    //     return result;
    // }
}

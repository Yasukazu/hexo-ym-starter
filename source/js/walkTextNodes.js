export {walkTextNodes, SearchFilter};
//@ts-check
/**
 * dirask: JavaScript - iterate text nodes only in DOM tree
 * @param {Node} node 
 * @typedef {({index: number, str: string})} FilterResult
 * @typedef {function(string): FilterResult} Filter 
 * @param {Filter} filter 
 * @returns {{indices: Array<number>, buffer: string}}
 */
function walkTextNodes(node, filter) {
    let pointer = 0;
    let buffer = '';
    const indices = [];
    /**
     * @param {Node} nod 
     */
    const execute = nod => {
        let child = nod.firstChild;
        while (child) {
            switch (child.nodeType) {
                case Node.TEXT_NODE:
                    const data = child.data;
                    if (!data) {
                      console.error("child.data is empty!");
                      break;
                    }
                    const {index, text} = filter(data);
                    if (index >= 0) {
                      if (!text) {
                        throw Error(`text is empty!`);
                      }
                      indices.push(pointer + index);
                      buffer += text + ' ';
                      pointer += text.length + 1;
                    }
                    break;
                case Node.ELEMENT_NODE:
                    execute(child);
                    break;
            }
            child = child.nextSibling;
        }
    }
    if (node) {
        execute(node);
    }
    else {
        throw Error("No node!");
    }
    return {indices, buffer};
}

class SearchFilter {
  static combining_chars_regex = /\p{Mark}/gu;

  /**
   * @param {string} query 
   * @param {{ignore_case: boolean, ignore_accents: boolean}} 
   */
  constructor(query, { ignore_case = true, ignore_accents = true }) {
    this.ignore_case = ignore_case;
    this.ignore_accents = ignore_accents;
    this.re = RegExp(query, ignore_case ? 'ui' : 'u');
    /**
    * @param {string} text 
    * @returns {{index: number, text: string}}
    */
    this.filter = (text) => {
      console.assert(text, "filter is called for an empty text!");
      text = text.trim().normalize('NFKD').replace(/[\s\n]+/gu, ' ');
      console.assert(text, "text became empty after trimming, normalizing and replacing spaces!");
      if (this.ignore_accents) {
        text = text.replace(SearchFilter.combining_chars_regex, '');
        console.assert(text, "text became empty after replacing accents!");
      }
      const i = text.search(this.re); 
      if (i >= 0) {
        console.assert(text, `text is empty when search found regex: ${this.re}!`)
        return {index: i, text: text};
      }
      else {
        return {index: -1, text: ''};
      }
    }
  }
}
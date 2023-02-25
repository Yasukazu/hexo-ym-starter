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
                    const {index, text} = filter(data);
                    if (index >= 0) {
                        indices.push(pointer + index);
                    }
                    buffer += text + ' ';
                    pointer += text.length + 1;
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
   */
  constructor(query, {ignore_case = true, ignore_accents = true}) {
    this.ignore_case = ignore_case;
    this.ignore_accents = ignore_accents;
    this.re = RegExp(query, ignore_case ? 'ui' : 'u');
  /**
   * @type {Filter} filter
   */
    this.filter = (text) => {
      text = text.trim().normalize('NFKD').replace(/[\s\n]+/gu, ' ');
      if (this.ignore_accents) {
        text = text.replace(SearchFilter.combining_chars_regex, '');
      }
      return {index: text.search(this.re), str: text};
    };
  }

}
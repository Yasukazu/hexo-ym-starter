export {walkTextNodes, SearchFilter, IndexText, IndicesText};
//@ts-check

class IndexText {
  /**
   * 
   * @param {number} index 
   * @param {string} str 
   */
  constructor(index, str) {
    if (index >= str.length) {
      throw Error(`index must be less than str.length)index: ${index} , str.length: ${str.length}  !`);
    }
    this._index = index;
    this.str = str;
  }

  /**
   * @returns {boolean}
   */
  get isValid() {
    return this._index >= 0;
  }

  /**
   * 
   * @returns {number}
   */
  get index() {
    return this._index;
  }

  /**
   * 
   * @returns {string}
   */
  get text() {
    return this.str;
  }
}

class IndicesText {
  constructor() {
    /** @type {Array<IndexString>} */
    this.buffer = [];
  }

  /**
   * @param {IndexString} indexString
   */
  push(indexString) {
    this.buffer.push(indexString);
  }

  /**
   * @returns {boolean}
   */
  get isValid() {
    for (let buff of this.buffer) {
      if (buff.isValid) {
        return true;
      }
    } 
    return false;
  }

  /**
   * @returns {{indices: Array<number>, text: string}}
   */
  get indices() {
    /** @type {Array<number>} */
    const _indices = [];
    const text = '';
    for (let buff of this.buffer) {
      if (buff.index >= 0) {
        _indices.push(text.length + buff.index);
      }
      text += buff.text + ' ';
    }
    return _indices;
  }

  /**
   * returns empty indices if no found text.
   * @returns {{indices: Array<number>, text: {string}}}
   */
  get join() {
    /** @type {Array<number>} */
    const indices = [];
    let text = '';
    for (let buff of this.buffer) {
      if (buff.index >= 0) {
        indices.push(text.length + buff.index);
      }
      text += buff.text + ' ';
    }
    text.trim();
    return {indices, text};
  }
}

/**
 * dirask: JavaScript - iterate text nodes only in DOM tree
 * @param {Node} node 
 * @typedef {function(string): IndexText} Filter 
 * @param {Filter} filter 
 * @returns {IndicesText}
 */
function walkTextNodes(node, filter) {
    const buffer = new IndicesText();
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
                    const indexText = filter(data);
                    buffer.push(indexText);
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
    return buffer;
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
    * @returns {IndexText}
    */
    this.filter = (text) => {
      console.assert(text, "filter is called for an empty text!");
      text = text.trim().normalize('NFKD').replace(/[\s\n]+/gu, ' ');
      if (!text) {
        console.log("text became empty after trimming, normalizing and replacing spaces.");
        return new IndexText(-1, '');
      }
      if (this.ignore_accents) {
        text = text.replace(SearchFilter.combining_chars_regex, '');
        console.assert(text, "text became empty after replacing accents!");
      }
      const i = text.search(this.re); 
      if (i >= 0 && !text) {
        console.assert(text, `text is empty when search found regex: ${this.re}!`)
      }
      return new IndexText(i, text);
    }
  }
}
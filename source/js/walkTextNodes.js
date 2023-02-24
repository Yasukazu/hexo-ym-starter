/**
 * dirask: JavaScript - iterate text nodes only in DOM tree
 * @param {Element} node 
 * @param {Element => Array<string>} filter 
 * @returns 
 */
function walkTextNodes(node, filter = SearchFilter.filer) {
    let index = 0;
    const buffer = '';
    const indices = [];
    const execute = node => {
        let child = node.firstChild;
        while (child) {
            switch (child.nodeType) {
                case Node.TEXT_NODE:
                    const text = child.data;
                    const {pos, trimmed} = filter(text);
                    if (pos >= 0) {
                        indices.push(index + pos);
                    }
                    buffer += trimmed + ' ';
                    index += trimmed.length + 1;
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
  constructor(keyword) {
    this.re = RegExp(keyword);
  }

  /**
   * 
   * @param {string} str 
   * @returns {{number, string}}
   */
  filter(str) {
    str = str.trim().replace(/[\s\n]+/gu, ' ');
    return {pos: str.search(this.re), trimmed: str};
  }

}

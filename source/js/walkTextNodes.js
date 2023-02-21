/**
 * dirask: JavaScript - iterate text nodes only in DOM tree
 * @param {Element} node 
 * @param {Element => Array<string>} filter 
 * @returns 
 */
function walkTextNodes(node, filter = node => { // this filter removes text nodes that contains white characters only
    return /^(\s|\n)+$/gi.test(node.data) ? false : true;
}) {
    const result = [];
    const execute = node => {
        let child = node.firstChild;
        while (child) {
            switch (child.nodeType) {
                case Node.TEXT_NODE:
                    if (filter(child)) {
                        result.push(child);
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
    return result;
}
//@ts-check
import {SearchFilter, walkTextNodes} from "./walkTextNodes.js";
export {exec_search, analyzeData, fetchData};

  /**
   * Picks up query-matching entries
   * @param {Document} document // XML
   * @param {string} query_str // Regex expression
   * @param {{ignore_case: boolean, ignore_accents: boolean}}
   * @yields {indices:{Array<number>}, buffer:{string}}
   */
  function* analyzeData(document, query_str, {ignore_case = true, ignore_accents = true}) {
    const entries = document.getElementsByTagName('entry');
    const matchEntries = [];
    const matchItems = [];
    const matchPoses = [];
    const matchTexts = []
    let query = query_str.normalize('NFKD');
    const combining_chars_regex = ignore_accents ? /\p{Mark}/gu : '';
    if (ignore_accents) {
      query = query.replace(combining_chars_regex, '');
    }
    // const query_regex = RegExp(query, ignore_case ? 'ui' : 'u');
    const filter = new SearchFilter(query, {ignore_case, ignore_accents});
    const test_items = {'title':'text', 'content':'html'};
    for (let entry of entries) {
      let content = '';
      for (const [item, type] of test_items.entries()) { 
        let indices = [];
        let text = entry.querySelector(item)?.textContent;
        if (text) {
          const texts = [];
          if (type == 'html') {
            const content_tree = new DOMParser().parseFromString(text, "text/html");
            if (!content_tree) {
              throw Error(`Failed to parse from string text/html at entry:${entry.TEXT_NODE}`);
            }
            yield walkTextNodes(content_tree, filter.filter);
          }
          else {
            let {index, str} = filter.filter(text);
            yield {indices: [index], buffer: str};
          }
        }
      }
    }
  }

/**
 * @param {Promise} fetch_data
 * @param {string} queryWord
 * @param {{ignore_case: boolean, ignore_accents: boolean}}
 * @returns {boolean}
 */
   function exec_search(fetch_data = fetchData(), queryWord, {ignore_case = true, ignore_accents = true}) {
        fetch_data.then(xml => {
          const analyzer = this.analyzeData(xml, queryWord, {ignore_case, ignore_accents});
          debugger;
          const next = analyzer.next();
          console.log(next);

        }, reason => {
            throw Error(`exec_search failed. reason:${reason}`);
        })
        return true;
      }

      const fetch_path = '/search.xml';
      /**
       * 
       * @param {string} fetchUrl 
       * @returns {Promise}
       */
      function fetchData(fetchUrl = fetch_path) {
        return new Promise(resolve => {
          const xhr = new XMLHttpRequest()
          xhr.open('GET', fetchUrl, true)
          xhr.responseType = 'document'
          xhr.overrideMimeType('text/xml')
          xhr.onreadystatechange = () => {
            if (xhr.readyState === xhr.DONE) {
              if (xhr.status === 200 || xhr.status === 304) {
                resolve(xhr.response)
              }
            }
          }
          xhr.send(null)
        })
      }
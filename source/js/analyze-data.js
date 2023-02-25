//@ts-check
import {SearchFilter, walkTextNodes} from "./walkTextNodes.js";
export {exec_search, analyzeData, fetchData, search_input, search_id};

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
function exec_search(fetch_data = fetchData(), queryWord, { ignore_case = true, ignore_accents = true }) {
  fetch_data.then(xml => {
    const analyzer = analyzeData(xml, queryWord, { ignore_case, ignore_accents });
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

/**
 * 
 * @param {Promise} fetch_data 
 * @param {{submit_search_id: string, search_text_id: string, search_result_output_id: string, ignore_case_id: string, ignore_accents_id: string}} 
 */
function search_input(fetch_data = fetchData(), { submit_search_id, search_text_id, search_result_output_id, ignore_case_id, ignore_accents_id }) {
  const submit_search_button = document.getElementById(submit_search_id);
  const search_text_input = document.getElementById(search_text_id);
  const search_result_output = document.querySelector(search_result_output_id);
  if (submit_search_button && search_text_input && search_result_output) {
  debugger;
      let queryWord = search_text_input.value;
      if (queryWord) {
        const ignore_case = document.querySelector('#' + ignore_case_id)?.checked ? true : false;
        const ignore_accents = document.querySelector('#' + ignore_accents_id)?.checked ? true : false;
        debugger;
        exec_search(fetch_data, queryWord, { ignore_case, ignore_accents });
      }
  }
  else
    throw Error(`!No ${submit_search_id}, ${search_text_id} and ${search_result_output_id}`);
}      

/**
 * 
 * @param {{search_text_id: string, ignore_case_id: string, ignore_accents_id: string}} 
 */
function search_id({search_text_id, ignore_case_id, ignore_accents_id}) {
  const input = document.getElementById(search_text_id);
  if (!input)
    throw Error(`No ${search_text_id}`);
  if (input.value) {
    const ignore_case_element = document.getElementById(ignore_case_id);
    const ignore_case = ignore_case_element?.checked ? true : false;
    const ignore_accents_element = document.getElementById(ignore_accents_id);
    const ignore_accents = ignore_accents_element?.checked ? true : false;
    exec_search(fetchData(), input.value, {ignore_case, ignore_accents});
  }
  else
    console.log(`No input value.`);
}
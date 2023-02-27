//@ts-check
import {SearchFilter, walkTextNodes, IndexText, IndicesText} from "./walkTextNodes.js";
import { SearchOutput } from "./search-output.js";
export {exec_search, analyzeData, fetchData, search_input, search_id};

  /**
   * Picks up query-matching entries
   * @param {Document} document // XML
   * @param {string} query_str // Regex expression
   * @param {SearchOutput} searchOutput
   * @param {{ignore_case: boolean, ignore_accents: boolean}}
   * @yields {{entry: Element, itemMap: Map<string, IndicesText>}}
   */
  function* analyzeData(document, query_str, searchOutput, {ignore_case = true, ignore_accents = true}) {
    const entries = document.getElementsByTagName('entry');
    let query = query_str.normalize('NFKD');
    const combining_chars_regex = ignore_accents ? /\p{Mark}/gu : '';
    if (ignore_accents) {
      query = query.replace(combining_chars_regex, '');
    }
    const searchFilter = new SearchFilter(query, {ignore_case, ignore_accents});
    /** @type {(str: string) => IndexText} */
    const filter = searchFilter.filter;
    const test_items = ['title:text', 'content:html'];
    for (const entry of entries) {
      for (const item_type of test_items) { 
        /** @type {Set<string>} */
        const validSet = new Set();
        /** @type {Map<string, IndicesText>} */
        const itemMap = new Map();
        const [item, type] = item_type.split(':');
        const content = entry.querySelector(item)?.textContent;
        if (content) {
          if (type == 'html') {
            const content_tree = new DOMParser().parseFromString(content, "text/html");
            if (!content_tree) {
              throw Error(`Failed to parse from string text/html at entry:${entry.TEXT_NODE}`);
            }
            const {pushedSet, indicesText} = walkTextNodes(content_tree, filter);
            itemMap.set(item, indicesText);
            if (indicesText.isValid) {
              validSet.add(item);
              console.assert(pushedSet.size > 0, `pushedSet.size=${pushedSet.size}`) 
            }
          }
          else {
            const indexText = filter(content);
            const indicesText = new IndicesText();
            indicesText.push(indexText);
            itemMap.set(item, indicesText);
            if (indexText.isValid) {
              validSet.add(item);
            }
          }
        }
        else {
          console.info(`No content in ${item} of ${entry} !`);
        }
        if (validSet.size > 0) {
          yield {entry, itemMap};
        }
      } // test_items
    } // entries
  }

/**
 * @param {Promise} fetch_data
 * @param {string} queryWord
 * @param {{ignore_case: boolean, ignore_accents: boolean}}
 * @returns {boolean}
 */
function exec_search(fetch_data = fetchData(), queryWord, { ignore_case = true, ignore_accents = true }) {
  fetch_data.then(xml => {
    const output = new SearchOutput();
    /** @type {{entry: Element, itemMap: Map<string, IndicesText>}} */
    for (const {entry, itemMap} of analyzeData(xml, queryWord, output, { ignore_case, ignore_accents })) {
      const url = entry.querySelector('url')?.textContent; // 2
      if (!url)
        throw Error("No 'url' in entry!");
      console.info(`Reached to get analyzeData : Url = ${url}\n`);
      let title = '';
      const titleIndicesText = itemMap.get('title');
      if (!titleIndicesText)
        console.error(`No title key!`);
      else {
        const {indices, text} = titleIndicesText.join;
        title = text;
        console.info(` title: ${title}`);
      }
      let content = '';
      const contentIndicesText = itemMap.get('content');
      if (!contentIndicesText)
        console.error(`No content !`);
      else {
        const {indices, text} = contentIndicesText.join;
        content = mark_text(text, queryWord.length, indices);
        console.info(` content: ${content}`);
      }

    }
  }, reason => {
    throw Error(`exec_search failed. reason:${reason}`);
  })
  return true;
}

/**
 * 
 * @param {string} text 
 * @param {number} len 
 * @param {Array<number>} indices 
 * @returns {string}
 */
function mark_text(text, len, indices, mark_start = "<mark>", mark_end = "</mark>") {
  let buffer = '';
  let pos = 0;
  for (const index of indices) {
    buffer += text.slice(pos, index);
    buffer += mark_start;
    pos += index;
    buffer += text.slice(pos, pos + len);
    pos += len;
    buffer += mark_end;
    if (pos >= text.length) 
      break;
  }
  if (pos < text.length - 1) {
    buffer += text.slice(pos)
  }
  return buffer;
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
      let queryWord = search_text_input.value;
      if (queryWord) {
        const ignore_case = document.querySelector('#' + ignore_case_id)?.checked ? true : false;
        const ignore_accents = document.querySelector('#' + ignore_accents_id)?.checked ? true : false;
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
    console.debug(`No input value.`);
}
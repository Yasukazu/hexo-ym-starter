//@ts-check
export {Search};

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


class Search {
  /**
   * check container element of #search
   * @param {Element} search_result_output 
   * @param {string} search_result_container 
   * @param {string} search_result 
   */
  constructor(fetchdata_promise = fetchData(), {search_result_output,  search_result_container_template_selector = "template#search-result-container", search_result_entry_template_selector = "template#search-result-entry", search_result_container_entries_selector = ".entries"}={}) {
    this.fetch_data = fetchdata_promise;
    if (!this.fetch_data)
      throw Error('!No fetch data promise!');
    this.search_result_output = search_result_output
    if (!this.search_result_output)
      Error(`No ${search_result_output_selector} !`);
    this.search_result_container_template = document.querySelector(search_result_container_template_selector);
    if (!this.search_result_container_template)
      throw Error(`!No ${search_result_container_template_selector}!`);
    this.search_result_entry_template = document.querySelector(search_result_entry_template_selector);
    if (!this.search_result_entry_template)
      throw Error('!No search entry template!');
    this.search_result_container_entries_selector = search_result_container_entries_selector;
  }

  /**
   * Picks up query-matching entries
   * @param {Document} document // XML
   * @param {string} query_str // Regex expression
   * @param {boolean} ignore_case
   * @param {boolean} ignore_accents
   * @returns {({Array<Element>, Array<string>, Array<number>, Array<string>})}
   */
  analyzeData(document, query_str, ignore_case, ignore_accents) {
    const entries = document.getElementsByTagName('entry');
    const matchEntries = [];
    const matchItems = [];
    const matchPoses = [];
    const matchTexts = []
    const query = query_str.normalize('NFKD');
    const combining_chars_regex = ignore_accents ? /\p{Mark}/gu : '';
    if (ignore_accents) {
      query.replace(combining_chars_regex, '');
    }
    const query_regex = RegExp(query, ignore_case ? 'ui' : 'u');
    const test_items = {'title':'text', 'content':'html'};
    for (let entry of entries) {
      let content = '';
      for (const [item, type] of test_items.entries()) { 
        let match = [];
        let text = entry.querySelector(item)?.textContent;
        if (text) {
          const texts = [];
          if (type == 'html') {
            const content_tree = new DOMParser().parseFromString(text, "text/html");
            if (content_tree) {
              walkTextNodes(content_tree, space_filter, texts);
            }
          }
          else {
            const without_space = text.replace(/\s+/ug, '');
            if (without_space)
              texts.push(text);
          }
          for (const [i, text] of texts.entries()) {
            content = text.normalize('NFKD');
            if (ignore_accents)
              content.replace(combining_chars_regex, "");
            if (content && query_regex.test(content)) {
              match.push(i);
            }
          }
          if (match.length > 0) {
            matchEntries.push(entry);
            matchItems.push(item);
            matchPoses.push(match);
            matchTexts.push(texts);
          }
        }
      }
    }
    return { 'entries': matchEntries, 'items': matchItems, 'texts': matchTexts, 'match-poses': matchPoses };
  }

  /**
   * 
   * @param {Array<Element>} entries
   * @param {Array<string>} items 
   * @returns {Element}
   */
  makeSearchResultFromTemplates(entries, items) {
    const search_result_container = document.importNode(this.search_result_container_template.content, true);
    if (!search_result_container) 
      throw Error(`Failed to build a search_result_container from its template!`);
    const search_result_entries = search_result_container.querySelector(this.search_result_container_entries_selector);
    if (!search_result_entries) 
      throw Error(`An element with entries selector(${this.search_result_container_entries_selector}) is not found in search result container template!`);
    for (const [index, entry] of entries.entries()) {
      const entry_output = document.importNode(this.search_result_entry_template.content, true);
      if (!entry_output)
        throw Error("Failed to import a node from the 'search result entry template'!");
      const title = entry.querySelector('title')?.textContent; // children[0]
      if (!title)
        throw Error("No title in entry!");
      const url = entry.querySelector('url')?.textContent; // 2
      if (!url)
        throw Error("No 'url' in entry!");
      const ar = entry_output.querySelector('a.title');
      if (!ar)
        throw Error("No 'a' in template!");
      ar.href = url;
      ar.innerText = title;
      const date_str = startsFromDate(url);
      if (date_str) {
        const dt = entry_output.querySelector('.date');
        if (dt) {
          dt.innerText = date_str;
        }
      }
      const ct = entry_output.querySelector('.content');
      if (ct) {
        const content_elem = entry.querySelector('content'); // ?.textContent;
        if (content_elem && content_elem.textContent) {
          const content_tree = new DOMParser().parseFromString(content_elem.textContent, "text/html");
          const innerHTML = content_tree?.children[0]?.innerHTML; // textContent;
          if (innerHTML) {
            const cpcp = Array.from(innerHTML.replace(/<[^>]*>/gu, ' ')); // code point sequences
            const length = ct.getAttribute('data-length');
            let len = 300;
            if (length) {
              const _len = parseInt(length, 10);
              if (_len) {
                len = _len;
              }
            }
            const { output: limitedStr, on_break: onBreak } = getFirstNChars(cpcp, len);
            ct.innerText = limitedStr + (onBreak ? '...' : '');
            const img_out = entry_output.querySelector('img');
            if (img_out) {
              const img_in = content_tree.querySelector('img');
              if (img_in) {
                const img_src = img_in.getAttribute('src');
                if (img_src) {
                  img_out.setAttribute('src', img_src);
                }
              }
            }
          }
        }
      }
      const it = entry_output.querySelector('.found-in');
      if (it) {
        it.innerText += items[index];
      }
      search_result_entries.append(entry_output);
    }
    return search_result_container;
  }

  /**
 * @param {string} queryWord
 * @param {boolean} ignore_case
 * @param {boolean} ignore_accents
 * @returns {boolean}
 */
  exec_search(queryWord, ignore_case = true, ignore_accents = true) {
    this.fetch_data.then(document => {
      const { entries, items } = this.analyzeData(document, queryWord, ignore_case, ignore_accents);
      if (entries.length > 0) {
        while (this.search_result_output?.firstChild) {
          this.search_result_output?.firstChild.remove();
        }
        const search_result = this.makeSearchResultFromTemplates(entries, items);
        if (search_result) {
          this.search_result_output?.append(search_result);
        }
      }
    }, reason => {
        throw Error(`exec_search failed. reason:${reason}`);
    })
    return true;
  }

}

class SearchInput {
  /** @typedef {(input: string, ignore_case: boolean, ignore_accents: boolean) => boolean} Callback
   * 
   */
  static combining_chars_regex = /\p{Mark}/gu;
  /**
   * check container element of #search
   * @param {Callback} callback
   * @param {string} ignore_case 
   * @param {string} ignore_accents 
   * @param {string} search_text 
   */
  constructor(callback = new Search().exec_search, ignore_case = "ignore-case", ignore_accents = "ignore-accents", search_text = "search-text") {
    /**
     * @type {Callback|null}
     */
    this.callback = callback;

    this.ignore_accents = document.querySelector("input#" + ignore_accents);
    if (!this.ignore_accents)
      throw Error('!No input#' + ignore_accents);
    this.ignore_case = document.querySelector("input#" + ignore_case);
    if (!this.ignore_case)
      throw Error('!No input#' + ignore_case);
    this.search_text = document.querySelector("input#" + search_text);
    if (!search_text)
      throw Error('!No input#' + search_text);
  }

  /**
   * @param {Callback} callback 
   */
  setCallback(callback) {
    this.callback = callback;
  }
}


/**
 * 
 * @param {string[]} src 
 * @param {Number} n 
 * @returns {Object}
 */
function getFirstNChars(src, n) {
  let lc = '';
  let i = 0;
  let out = '';
  let on_break = false;
  for (let c of src) {
    if (lc === ' ' && lc === c) {
      continue;
    }
    else {
      lc = c;
    }
    out += c;
    if (++i >= n) {
      on_break = true;
      break;
    }
  }
  return { output: out, on_break: on_break };
}

/**
 * Check url string represents a valid date
 * @param {string} url 
 * @returns {string}
 */
function startsFromDate(url) {
  const re = /(\d\d\d\d)\/(\d\d)\/(\d\d)/;
  const date = re.exec(url);
  if (date && date.length > 3) {
    const dt = [date[1], date[2], date[3]].join('-');
    const dateNum = Date.parse(dt);
    if (!isNaN(dateNum))
      return dt;
  }
  return '';
}

/**
 * dirask: JavaScript - iterate text nodes only in DOM tree
 * @param {Document} node 
 * @param {({data: string}) => boolean} filter 
 * @param {Array<string>} result
 * @returns {Array<string>}
 */
function walkTextNodes(node, filter, result = []) {
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

/**
 * this filter removes text nodes that contains white characters only
 * @param {{data: string}} node 
 * @returns {boolean}
 */
function space_filter(node) {
  return /^(\s|\n)+$/gi.test(node.data) ? false : true;
}

//@ts-check

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

class SearchInput {
  /** @typedef {(input: string, ignore_case: boolean|null, ignore_accents: boolean|null) => boolean} Callback
   * 
   */
  static combining_chars_regex = /\p{Mark}/gu;
  /**
   * check container element of #search
   * @param {string} submit_search 
   * @param {string} ignore_case 
   * @param {string} ignore_accents 
   * @param {string} search_text 
   */
  constructor(submit_search = "submit-search", ignore_case = "ignore-case", ignore_accents = "ignore-accents", search_text = "search-text") {
    /**
     * @type {Callback|null}
     */
    this.callback = null;
    this.submit_search_button = document.querySelector("button#" + submit_search);
    if (this.submit_search_button) {
      this.submit_search_button.addEventListener("click", function (event) {
        if (this.callback) {
          let queryWord = this.search_text.value;
          if (!queryWord || queryWord.length <= 0) {
            console.log("No search_text.value or search_text.length <= 0 !");
            return false;
          }
          else {
            queryWord = queryWord.normalize('NFKD');
            if (ignore_accents.checked) {
              queryWord.replace(SearchInput.combining_chars_regex, '');
            }
          }
          this.callback(queryWord, ignore_case?.checked, ignore_accents?.checked);
        }
        else 
          console.error(`!No callback function`);
        event.preventDefault();
      });
    }
    else
      throw Error('!No button#' + submit_search);
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

class Search {
  /**
   * check container element of #search
   * @param {string} submit_search 
   * @param {string} search_result_container 
   * @param {string} search_result 
   */
  constructor(fetchdata_promise = fetchData(), submit_search = "submit-search", search_result_container = "search-result-container", search_result = "search-result", ignore_case_checkbox = "ignore-case-checkbox", ignore_accents_checkbox = "ignore-accents-checkbox", search_text = "search-text") {

    this.fetch_data = fetchdata_promise;
    if (!this.fetch_data)
      throw Error('!No fetch data.');

    this.submit_search_button = document.querySelector("button#" + submit_search);
    if (this.submit_search_button) {
      this.submit_search_button.addEventListener("click", function (event) {
        this.search();
        event.preventDefault();
      });
    }
    else
      throw Error('!No button#' + submit_search);
    this.search_result_container_template = document.querySelector("template#" + search_result_container);
    if (!this.search_result_container_template)
      throw Error('!No template#' + search_result_container);
    this.search_result_template = document.querySelector("template#" + search_result);
    if (!this.search_result_template)
      throw Error('!No template#' + search_result);
    this.ignore_case_checkbox = document.querySelector("input#" + ignore_case_checkbox);
    if (!this.ignore_case_checkbox)
      throw Error('!No input#' + ignore_case_checkbox);
    this.ignore_accents_checkbox = document.querySelector("input#" + ignore_accents_checkbox);
    if (!this.ignore_accents_checkbox)
      throw Error('!No input#' + ignore_accents_checkbox);
    this.fetch_data = fetchdata_promise;
    if (!this.fetch_data)
      throw Error("!No fetch_data promise.");
    this.search_text = document.querySelector("input#" + search_text);
    if (!search_text)
      throw Error('!No input#' + search_text);
  }

  /**
   * Picks up query-matching entries
   * @param {Document} document // XML
   * @param {string} query_str // Regex expression
   * @returns {Object< Array<Element>, Array<string> >}
   */
  analyzeData(document, query_str, ignore_case, ignore_accents) {
    // const ignore_accents = (!this.ignore_accents_checkbox.checked) ? false : true;
    // const ignore_case = (!this.ignore_case_checkbox.checked) ? false : true;
    const entries = document.getElementsByTagName('entry');
    const matchEntries = [];
    const matchItems = [];
    const query = query_str.normalize('NFKD');
    const combining_chars_regex = ignore_accents ? /\p{Mark}/gu : '';
    if (ignore_accents) {
      query.replace(combining_chars_regex, '');
    }
    const query_regex = RegExp(query, ignore_case ? 'ui' : 'u');
    // const test_children = [0, 2];
    const test_items = ['title', 'content'];
    for (let entry of entries) {
      let match = false;
      let content = '';
      let item = '';
      for (item of test_items) { // for (let cn of test_children) {
        const element = entry.querySelector(item);
        if (element) {
          let text = element.textContent?.replace(/<[^>]*>/gu, ' ');
          if (text) {
            content = text.normalize('NFKD');
            if (ignore_accents)
              content.replace(combining_chars_regex, "");
            if (content && query_regex.test(content)) {
              match = true;
              break;
            }
          }
        }
      }
      if (match)
        matchEntries.push(entry);
      matchItems.push(item);
    }
    return { 'entries': matchEntries, 'items': matchItems };
  }

  /**
   * 
   * @param {Array<Element>} entries
   * @param {Array<string>} items 
   * @returns {Element}
   */
  makeSearchResultFromTemplates(entries, items) {
    const search_result_container = document.importNode(this.search_result_container_template.content, true);
    if (!search_result_container) throw Error(`Failed to get a search_result_container from its template!`);
    const search_result_entries = search_result_container.querySelector('.entries');
    if (!search_result_entries) throw Error(`An element with entries class is not found in search result container template!`);
    for (const [index, entry] of entries.entries()) {
      const entry_output = document.importNode(this.search_result_template.content, true);
      if (!entry_output) throw Error(`!Failed to import node from search_result_template`);
      const title = entry.querySelector('title')?.textContent; // children[0]
      if (!title) throw Error("No title in entry!");
      const url = entry.querySelector('url')?.textContent; // 2
      if (!url) throw Error("No 'url' in entry!");
      const ar = entry_output.querySelector('a.title');
      if (!ar) throw Error("No 'a' in template!)";
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
   * @returns {boolean}
   */
  /* search() {
    if (!this.fetch_data) 
      throw Error("'Cause fetch_data is null, exiting search()..");
    if (!this.search_result_template) 
      throw Error(`!No search result template`);
    if (!this.search_text) 
      throw Error(`!No search text`);
    const queryWord = this.search_text.value;
    if (!queryWord || queryWord.length <= 0) {
      console.log("No search_text.value or search_text.length <= 0 !");
      return false;
    }
    // let search_result = `FetchData from ${fetch_path} with ${queryWord}`;
    this.fetch_data.then(document => {
      const { entries, items } = this.analyzeData(document, queryWord);
      if (entries.length <= 0) {
        console.log("entries.length is zero.");
      }
      while (this.search_result_template.firstChild) {
        this.search_result_template.firstChild.remove();
      }
      const search_result = this.makeSearchResultFromTemplates(entries, items);
      if (search_result) {
        this.search_result_template.append(search_result);
      }
      // search_result_template.innerHTML = search_result;
      // Event.preventDefault();
    })
    return true;
  } */

  /**
 * @param {string} queryWord
 * @param {boolean|null} ignore_case
 * @param {boolean|null} ignore_accents
 * @returns {boolean}
 */
  search_func(queryWord, ignore_case = true, ignore_accents = true) {
    // let search_result = `FetchData from ${fetch_path} with ${queryWord}`;
    this.fetch_data.then(document => {
      const { entries, items } = this.analyzeData(document, queryWord, ignore_case, ignore_accents);
      if (entries.length <= 0) {
        console.log("entries.length is zero.");
      }
      while (this.search_result_template.firstChild) {
        this.search_result_template.firstChild.remove();
      }
      const search_result = this.makeSearchResultFromTemplates(entries, items);
      if (search_result) {
        this.search_result_template.append(search_result);
      }
      // search_result_template.innerHTML = search_result;
      // Event.preventDefault();
    })
    return true;
  }
}

const search_input = new SearchInput();
const search = new Search();
search_input.setCallback(search.search_func);

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
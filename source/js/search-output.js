//@ts-check
import { startsFromDate, getFirstNChars } from "./search.js";
import { mark_text } from "./analyze-data.js";
export { SearchOutput };

class SearchOutput {
  /**
   * check container element of #search
   * @param { {search_result_output: string, search_result_container_template: string, search_result_entry_template: string, search_result_entries: string } }
   */
  constructor({ search_result_output = "#search-result-output", search_result_container_template = "template#search-result-container", search_result_entry_template = "template#search-result-entry", search_result_entries = ".entries" } = {}) {
    this._search_result_output = document.querySelector(search_result_output);
    if (!this._search_result_output)
      Error(`No element selector: ${search_result_output} !`);
    const _search_result_container_template = document.querySelector(search_result_container_template);
    if (!_search_result_container_template)
      throw Error(`!No template selector: ${search_result_container_template}!`);
    this._search_result_container = document.importNode(_search_result_container_template.content, true);
    if (!this._search_result_container)
      throw Error(`Failed to build a search_result_container from its template: ${search_result_container_template}!`);
    this.search_result_entries = this._search_result_container.querySelector(search_result_entries);
    if (!this.search_result_entries)
      throw Error(`No ${search_result_entries}!`);
    this.search_result_entry_template = document.querySelector(search_result_entry_template);
    if (!this.search_result_entry_template)
      throw Error(`!No template selector: ${search_result_entry_template}!`);
  }

  close() {
    /** @type {ChildNode|null|undefined} */
    if (this._search_result_output) {
      let child = null;
      while (child = this._search_result_output.firstChild) {
        this._search_result_output.removeChild(child);
      }
      if (this._search_result_container && this.search_result_entries?.firstChild)
        this._search_result_output.appendChild(this._search_result_container);
      else
        console.info(`Nothing to append to ${this._search_result_output}`);
    }
    else {
      console.error(`Close failed!: No _search_result_output`);
    }
  }

  /**
   * @param { {entry: Element, url: string, title: string, content: string, ii: Array<number>} }
   */
  addSearchResult({ entry, url, title, content, ii}) {
    if (!this.search_result_entries)
      throw Error(`No built search_result_entries !`);
    const entry_output = document.importNode(this.search_result_entry_template.content, true);
    debugger;
    if (!entry_output)
      console.error(`Failed to import entry_output from template: ${this.search_result_entry_template}!`);
    const ar = entry_output.querySelector('a.title');
    if (!ar)
      throw Error("No 'a' in template!");
    ar.href = url;
    ar.innerText = title.length > 0 ? title : url;
    const date_str = startsFromDate(url);
    if (date_str) {
      const dt = entry_output.querySelector('.date');
      if (dt) {
        dt.innerText = date_str;
        console.debug(`Output date_str: ${date_str}`);
      }
    }
    const ct = entry_output.querySelector('.content');
    if (ct) {
      const length = ct.getAttribute('data-length');
      let len = 300;
      if (length) {
        const _len = parseInt(length, 10);
        if (_len) {
          len = _len;
        }
      }
      const { output: limitedStr, on_break: onBreak } = getFirstNChars(content, len);
      const markedText = mark_text(limitedStr, ii) + (onBreak ? '...' : '');
      ct.innerHTML = markedText;
      const img_out = entry_output.querySelector('img');
      if (img_out) {
        const img_in = entry.querySelector('img');
        if (img_in) {
          const img_src = img_in.getAttribute('src');
          if (img_src) {
            img_out.setAttribute('src', img_src);
          }
        }
      }
      /* const it = entry_output.querySelector('.found-in');
      if (it) {
        it.innerText += item;
      } */
      this.search_result_entries.appendChild(entry_output);
      console.debug(`Output entry_output: ${entry_output}`);
    }
    else
      console.error(`No entry output '.content'`);
  }
}
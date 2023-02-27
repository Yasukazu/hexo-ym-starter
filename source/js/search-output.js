//@ts-check
class SearchOutput {
    /**
     * check container element of #search
     * @param { {search_result_output: string, search_result_container_template: string, search_result_entry_template: string, search_result_entries: string } }
     */
    constructor({search_result_output = "div#search-result-output",  search_result_container_template = "template#search-result-container", search_result_entry_template = "template#search-result-entry", search_result_entries= ".entries"}) {
      this._search_result_output = document.querySelector(search_result_output);
      if (!this._search_result_output)
        Error(`No ${search_result_output} !`);
      this.search_result_container_template = document.querySelector(search_result_container_template);
      if (!this.search_result_container_template)
        throw Error(`!No ${search_result_container_template}!`);
      this.search_result_entry_template = document.querySelector(search_result_entry_template);
      if (!this.search_result_entry_template)
        throw Error(`!No ${search_result_entry_template}!`);
      this.search_result_entries = document.querySelector(search_result_entries);
      if (!this.search_result_entries)
        throw Error(`No ${search_result_entries}!`);
      this.search_result_container = document.importNode(this.search_result_container_template.content, true);
      if (!this.search_result_container) 
        throw Error(`Failed to build a search_result_container from its template!`);
    }

  /**
   * 
   * @param {Array<Element>} entries 
   * @param {Array<string>} items 
   */
  generate(entries, items) {
    if (entries.length > 0) {
        while (this.search_result_output?.firstChild) {
          this.search_result_output.firstChild.remove();
        }

        if (search_result) {
          this.search_result_output?.append(search_result);
        }
    }
  }

  makeSearchResultContainer() {
    const search_result_container = document.importNode(this.search_result_container_template.content, true);
    if (!search_result_container) 
      throw Error(`Failed to build a search_result_container from its template!`);

  }


  /**
   * @param { {url: string, text: string, item: string } }
   */
  makeSearchResultFromUrlAndMarkedText({url, text, item}) { // entries, items) {
    const search_result_container = document.importNode(this.search_result_container_template.content, true);
    if (!search_result_container) 
      throw Error(`Failed to build a search_result_container from its template!`);
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

}

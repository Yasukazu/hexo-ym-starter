class SearchOutput {
    /**
     * check container element of #search
     * @param {string} search_result_output_selector 
     * @param {string} search_result_container 
     * @param {string} search_result 
     */
    constructor({search_result_output_selector = "div#search-result-output",  search_result_container_template_selector = "template#search-result-container", search_result_entry_template_selector = "template#search-result-entry", search_result_container_entries_selector = ".entries"}={}) {
      this.search_result_output = document.querySelector(search_result_output_selector);
      if (!this.search_result_output)
        Error(`No ${search_result_output_selector} !`);
      this.search_result_container_template = document.querySelector(search_result_container_template_selector);
      if (!this.search_result_container_template)
        throw Error(`!No ${search_result_container_template_selector}!`);
      this.search_result_entry_template = document.querySelector(search_result_entry_template_selector);
      if (!this.search_result_entry_template)
        throw Error('!No search entry template!');
      this.search_result_container_entries_selector = search_result_container_entries_selector;
      this.container_template = null;
    }
  
  /**
   * 
   * @param {Array<Element>} entries 
   * @param {Array<string>} items 
   */
  generate(entries, items) {
    if (entries.length > 0) {
        while (this.search_result_output.firstChild) {
          this.search_result_output.firstChild.remove();
        }

        if (search_result) {
          this.search_result_output?.append(search_result);
        }
    }
  }
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

}

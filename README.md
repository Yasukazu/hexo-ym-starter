# ym-start

テンプレートエンジンPug で Hexo のテーマを作る ひな形の _hexo-theme-starter_ の _ym-branch_ です。スタイルシート を含みます。

This is my branch of the template for making a theme of Hexo with Pug. 

## 実装済みのレイアウト（Implemented Layout）

- index
- post
- page
- archive(contains tags and categories)
- pagination

## 必要なプラグイン (Necessary plugins)

- hexo-renderer-pug
- hexo-generator-search

## サイト内全文検索 // In-site full-text search
`themes/ym-start/layout/_include/search.pug` contains templates for search result output.

## 検索用HTMLテンプレート // HTML templates for search
- 二つのテンプレートを使います // It uses 2 templates

### Pugによるテンプレートの例 // An example of templates by Pug

```pug
-
  const search_result_container_map = {id: "search-result-container", heading: "heading", entries: "entries"}
  const search_result_entry_map = {id: "search-result-entry", url: 'entry-url', title: 'entry-title', date: 'entry-date', content: 'entry-content'}
//- Container template
template(id=search_result_container_map.id)
  div(id=search_result_container_map.id)
    h2(class=search_result_container_map.heading)
      slot(name=search_result_container_map.heading) (Search result)
    ul(class=search_result_container_map.entries)
      slot(name=search_result_container_map.entries)

//- Entry template
template(id=search_result_entry_map.id)
  li(class=search_result_entry_map.id, slot=search_result_container_map.entries)
    a(class=search_result_entry_map.url)
      span(class=search_result_entry_map.title)
    time(class=search_result_entry_map.date)
    p(class=search_result_entry_map.content, data-length=200)
    img.thumbnail
```
## カスタムタグ // custom tag

### Pugによるカスタムタグの記述
#### カスタムタグ定義
```pug
script(type="module").
  customElements.define(
  "#{search_result_container_map.id}",
  class extends HTMLElement {
    constructor() {
      super();
      const template = document.getElementById("#{search_result_container_map.id}");
      const templateContent = template.content;
      const _shadowRoot = this.attachShadow({mode: 'open'});
      const cloned = templateContent.cloneNode(true);
      _shadowRoot.appendChild(cloned);
    }
  }
  );
```

#### カスタムタグ利用 // Usage of the custom tag (Pug)
```pug
#{search_result_container_map.id}(id=search_result_container_map.id, style="color: blue;")
  span(slot=search_result_container_map.heading, class=search_result_container_map.heading) Search result:
```

### JavaScriptによるカスタムタグへのエントリー注入 // Entry injection by JavaScript into the custom tag

```js
// Import node from the entry template
const entry_node_element = document.querySelector(`template.entry`);
const entry_node = document.importNode(entry_node_element.content, true);
// ... set innerHTML or attributes of the imported node
// set slot attribute to the imported node
entry_node.children[0].setAttribute('slot', 'entry'); // the custom tag is defined using template with 'entry' name attributed slot. <slot name="entry">
// inject(as appendChild) the entry node into the custom element
document.querySelector(`custom-tag`).appendChild(entry_node);
```

The entry function for these templates is **exec_search** in a script file `themes/ym-start/source/js/analyze-data.js`.
- Keep matching slot name and slot attribute of custom tag template and entry template respectively.
- Content cut-off length is adjustable with `data-length` attribute(default=300) of an element with 'content' class.

### 検索はデフォルトで発音区別符号付きの文字(キャレット:[âîûêôÂÎÛÊÔ]、ティルダ:[ñÑ]などの発音区別符号が付いたアルファベットや日本語のひらがな/カタカナの濁点・半濁点)を付かないものと同一視し、大文字([A-Z])と小文字([a-z])も区別しない(利用者が切り替え可能)。正規表現も利用可能。 // Search, by default, ignores Unicode Combining Characters(characters with diacritical marks like _circumflex_:[âîûêôÂÎÛÊÔ], _tilde_:[ ñÑ], Japanese _dakuten_ and _handakuten_) and also case-insensitive (User can switch both with checkboxes). Reguler expression is also avilable.

 - `theme/ym-start/source/js/walkTextNodes.js#SearchFilter.filter` 
 - Using **normalize('NFKD' | 'NFKC')** method of JavaScript

## Acknoledgement
The search result part JavaScript code derives from following original repository:
[hexo-search-result by shundroid](https://github.com/shundroid/hexo-search-result "hexo-search-result repository in GitHub")
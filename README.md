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

## サイト内全文検索 (In-site full-text search)
`themes/ym-start/layout/_include/header.pug` contains templates for search result output.

```pug
template#search-result-container
  div.search-result-container
    h2.heading Search result
    ul.entries

template#search-result-entry
  li.search-result-entry
    a.title
    time.date
    p(data-length=200).content
```

These templates use a script file of `themes/ym-start/source/js/search.js`.
Don't change tag names and their class names except `h2`, `time` and `p` tags.
- Content cut-off length is adjustable with `data-length` attribute(default=300) of an element with 'content' class.

### Search ignores Unicode Combining Characters(diacritical marks like [tilde: ñ], Japanese _dakuten_ and _handakuten_)

Using **normalize('NFKD')** method of JavaScript

## Acknoledgement
The search result part JavaScript code derives from following original repository:
[hexo-search-result by shundroid](https://github.com/shundroid/hexo-search-result "hexo-search-result repository in GitHub")
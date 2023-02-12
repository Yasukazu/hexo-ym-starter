function fetchData (fetchUrl) {
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

function analyzeData(document, query) {
  const entries = document.getElementsByTagName('entry')
  const matchEntries = []
  for (var entry of entries) {
    const regExp = new RegExp(query)
    if (regExp.test(entry.children[0].textContent) ||
        regExp.test(entry.children[2].textContent)) {
      matchEntries.push(entry)
    }
  }
  return matchEntries
}

function makeSearchResult (entries) {
  let innerHTML = ''
  for (let entry of entries) {
    innerHTML += '<div class="search-result-entry">'
    const title = entry.children[0].textContent
    // const link = entry.children[1].textContent
    const url = entry.children[2].textContent
    const content = entry.children[3].textContent
    // const tags = entry.children[4].textContent
    innerHTML += '<h2><a href="' + url + '">' + title + '</a></h2>'
    const thumbnail = /<img[^>]*>/.exec(content)
    if (thumbnail && thumbnail.length >= 1) {
      innerHTML += '<div class="search-result-thumbnail">' + thumbnail[1] + '</div>'
    }
    innerHTML += content.replace(/<[^>]*>/g, '').substring(0, 300)
    innerHTML += '...</div>'
  }
  return innerHTML
}

const searchResultStr = "search-result";
const div_search_result_str = `div#${searchResultStr}`;
const form = document.querySelector("form#search");
if (!form) {
  console.log("'form#search' is not found.");
}

const fetch_path = '/search.xml';
const fetch_data = fetchData(fetch_path);
if (!fetch_data) {
  console.error("fetch_data promise is null!");
}

const search_text_tag = "input#search-text";
function search() {
  if (!fetch_data) {
    console.error("'Cause fetch_data is null, exiting search()..");
    return false;
  }
  const searchResult = document.querySelector(div_search_result_str);
  if (!searchResult) {
    console.error(div_search_result_str + " is not found!");
    return false;
  }
  const search_text = document.querySelector(search_text_tag);
  if (!search_text) {
    console.error(search_text_tag + " is not found.");
    return false;
  }
  const queryWord = search_text.value;
  if (!queryWord || queryWord.length <= 0) {
    console.error("No search_text.value or search_text.length <= 0 !");
    return false;
  }
  let search_result = `FetchData from ${fetch_path} with ${queryWord}`;
  fetch_data.then(document => {
    const entries = analyzeData(document, queryWord); 
    if (entries.length <= 0) {
      console.log("entries.length is zero.");
    }
    search_result = makeSearchResult(entries)
    searchResult.innerHTML = search_result;
  })
  return true;
}
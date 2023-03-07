
function search() {
    const input = document.getElementById("#{search_text_id}");
    if (!input)
      throw Error(`No ${search_text_id}`);
    if (input.value) {
      console.log(`Input text is set as: "${input.value}"`);
      const ignore_case_element = document.getElementById("#{ignore_case_id}");
      if (!ignore_case_element)
        throw Error(`No ${ignore_case_id} !`);
      const ignore_case = ignore_case_element.checked ? true : false;
      console.log(`Ignore case is set as: ${ignore_case}`);
      const ignore_accents_element = document.getElementById("#{ignore_accents_id}");
      if (!ignore_accents_element)
        throw Error(`No ${ignore_accents_id} !`);
      const ignore_accents = ignore_accents_element.checked ? true : false;
      console.log(`Ignore accents is set as: ${ignore_accents}`);
    exec_search(fetchData(), input.value, {ignore_case, ignore_accents}, 
     {id: "#{search_result_container_map.id}",
      heading: "#{search_result_container_map.heading}",
      entries: "#{search_result_container_map.entries}"},
      {id: "#{search_result_entry_map.id}",
       title: "#{search_result_entry_map.title}",
       date: "#{search_result_entry_map.date}",
       content: "#{search_result_entry_map.content}"});
    }
    else
      console.log(`No input text.`);
    }
  
    const submit_button = document.getElementById("#{submit_search_id}");
  
    if (!submit_button) {
      Error(`No submit_button`);
    }
    else {
      submit_button.onclick = search;
      console.log(`submit_button.onclick is set to function search()`)
    }
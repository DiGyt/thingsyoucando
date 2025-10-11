let posts = [];

// Load metadata index
fetch('/posts-index.json')
  .then(res => res.json())
  .then(data => {
    posts = data;
    renderResults(posts);
  });

// Grab filter values
function getFilterValues() {
  const country = document.getElementById('country').value;
  const time = document.getElementById('time').value;
  const onlineCheckbox = document.getElementById('online');
  const online = onlineCheckbox.checked ? true : null;

  const capabilities = Array.from(document.querySelectorAll('.capabilities:checked'))
                            .map(cb => cb.value);
  const interests = Array.from(document.querySelectorAll('.interests:checked'))
                          .map(cb => cb.value);

  return { country, time, online, capabilities, interests };
}

// Filter posts based on selected filters
function filterPosts() {
  const { country, time, online, capabilities, interests } = getFilterValues();

  const filtered = posts.filter(post =>
    (!country || post.country === country) &&
    (!time || post.time === time) &&
    (online === null || post.online === online) &&
    (capabilities.length === 0 || capabilities.every(c => post.capabilities.includes(c))) &&
    (interests.length === 0 || interests.every(i => post.interests.includes(i)))
  );

  renderResults(filtered);
}

// Render results list
function renderResults(list) {
  const results = document.getElementById('results');
  results.innerHTML = '';
  list.forEach(post => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = `/posts/${post.id}.html`; // Optional: can generate HTML from Markdown
    link.textContent = post.title;
    li.appendChild(link);
    results.appendChild(li);
  });
}

// Attach filter events
document.querySelectorAll('#filters select, #filters input').forEach(el => {
  el.addEventListener('change', filterPosts);
});

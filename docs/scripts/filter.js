let posts = [];

// Load metadata index
fetch('posts-index.json')
  .then(res => res.ok ? res.json() : Promise.reject(`Failed to fetch posts-index.json: ${res.status}`))
  .then(data => {
    posts = data;
    renderResults(posts);
  })
  .catch(err => {
    console.error(err);
    document.getElementById('results').innerHTML = '<li>Failed to load posts.</li>';
  });

// Grab filter values
function getFilterValues() {
  const country = document.getElementById('country').value;
  const time = document.getElementById('time').value;
  const online = document.getElementById('online').checked ? true : null;
  const capabilities = Array.from(document.querySelectorAll('.capabilities:checked')).map(cb => cb.value);
  const interests = Array.from(document.querySelectorAll('.interests:checked')).map(cb => cb.value);
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

// Render results list and setup modal popup
function renderResults(list) {
  const results = document.getElementById('results');
  const modal = document.getElementById('post-modal');
  const modalPost = document.getElementById('modal-post');
  const modalClose = docum

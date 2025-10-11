let posts = [];

// Load metadata index
fetch('posts-index.json')
  .then(res => {
    if (!res.ok) throw new Error(`Failed to fetch posts-index.json: ${res.status}`);
    return res.json();
  })
  .then(data => {
    posts = data;
    renderResults(posts);
  })
  .catch(err => {
    console.error(err);
    const results = document.getElementById('results');
    results.innerHTML = '<li>Failed to load posts.</li>';
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

// Render results list and setup modal popup
function renderResults(list) {
  const results = document.getElementById('results');
  const modal = document.getElementById('post-modal');
  const modalPost = document.getElementById('modal-post');
  const modalClose = document.getElementById('modal-close');

  results.innerHTML = '';
  modalPost.innerHTML = '';

  if (list.length === 0) {
    results.innerHTML = '<li>No posts match the selected filters.</li>';
    return;
  }

  list.forEach(post => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.textContent = post.title;
    button.className = 'post-button';

    // Show post in modal on click
    button.addEventListener('click', () => {
      modalPost.innerHTML = `
        <div class="post-container">
          <div class="metadata">
            <span class="tag country">${post.country}</span>
            <span class="tag time">${post.time}</span>
            <span class="tag online">${post.online ? 'Online' : 'Offline'}</span>
            ${post.capabilities.map(c => `<span class="tag capabilities">${c}</span>`).join('')}
            ${post.interests.map(i => `<span class="tag interests">${i}</span>`).join('')}
          </div>
          <div class="content">${post.content}</div>
        </div>
      `;
      modal.style.display = 'block';
      modal.scrollIntoView({ behavior: 'smooth' });
    });

    li.appendChild(button);
    results.appendChild(li);
  });

  // Close modal when clicking X
  modalClose.onclick = () => {
    modal.style.display = 'none';
    modalPost.innerHTML = '';
  };

  // Close modal when clicking outside the content box
  window.onclick = event => {
    if (event.target === modal) {
      modal.style.display = 'none';
      modalPost.innerHTML = '';
    }
  };
}

// Attach filter events
document.querySelectorAll('#filters select, #filters input').forEach(el => {
  el.addEventListener('change', filterPosts);
});

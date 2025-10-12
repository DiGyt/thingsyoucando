document.addEventListener('DOMContentLoaded', () => {
  const listContainer = document.getElementById('things-list');
  const filters = {
    country: document.getElementById('filter-country'),
    duration: document.getElementById('filter-duration'),
    online: document.getElementById('filter-online'),
    categories: Array.from(document.querySelectorAll('#filter-categories input[type=checkbox]')),
  };

  let items = [];

  fetch('/assets/data/things-metadata.json')
    .then(r => r.json())
    .then(data => {
      items = data;
      renderList();
    });

  function matchesFilters(item) {
    if (filters.country.value && item.country !== filters.country.value) return false;
    if (filters.duration.value && item.duration !== filters.duration.value) return false;
    if (filters.online.checked && !item.online) return false;
    const selectedCats = filters.categories.filter(c => c.checked).map(c => c.value);
    if (selectedCats.length && !selectedCats.every(c => item.categories.includes(c))) return false;
    return true;
  }

  function renderList() {
    listContainer.innerHTML = '';
    const visible = items.filter(matchesFilters);
    visible.forEach(item => {
      const div = document.createElement('div');
      div.className = 'thing-summary';
      div.textContent = item.title;
      div.dataset.id = item.id;

      div.addEventListener('click', () => toggleExpand(div, item));
      listContainer.appendChild(div);
    });
  }

  async function toggleExpand(div, item) {
    const existing = div.nextElementSibling;
    if (existing && existing.classList.contains('thing-detail')) {
      existing.remove();
      return;
    }

    // Collapse any other open detail
    document.querySelectorAll('.thing-detail').forEach(d => d.remove());

    // Load the full post HTML (rendered by Jekyll)
    const res = await fetch(item.url);
    const html = await res.text();

    // Extract main article content (basic method)
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const article = doc.querySelector('main, article, body');

    const detail = document.createElement('div');
    detail.className = 'thing-detail';
    detail.innerHTML = article.innerHTML;

    div.insertAdjacentElement('afterend', detail);
  }

  // Add event listeners
  Object.values(filters).forEach(f => {
    if (Array.isArray(f)) f.forEach(c => c.addEventListener('change', renderList));
    else f.addEventListener('change', renderList);
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const listContainer = document.getElementById('things-list');
  const filters = {
    country: document.getElementById('filter-country'),
    duration: document.getElementById('filter-duration'),
    online: document.getElementById('filter-online'),
    categoriesContainer: document.getElementById('filter-categories'),
    categories: [] // will populate after checkboxes are added
  };

  let items = [];

  // --- Populate filter options from filtersData ---
  if (typeof filtersData !== 'undefined') {
    // Country dropdown
    filtersData.country.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      filters.country.appendChild(opt);
    });

    // Duration dropdown
    filtersData.duration.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      filters.duration.appendChild(opt);
    });

    // Category checkboxes
    filtersData.categories.forEach(cat => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = cat;
      label.appendChild(input);
      label.append(` ${cat}`);
      filters.categoriesContainer.appendChild(label);
    });

    // Update categories array after adding checkboxes
    filters.categories = Array.from(filters.categoriesContainer.querySelectorAll('input[type=checkbox]'));
  }

  // --- Fetch items metadata ---
  fetch(`${baseurl}/assets/data/things-metadata.json`)
    .then(r => r.json())
    .then(data => {
      items = data;
      renderList();
    });

  // --- Filtering function ---
  function matchesFilters(item) {
    if (filters.country.value && item.country !== filters.country.value) return false;
    if (filters.duration.value && item.duration !== filters.duration.value) return false;
    if (filters.online.checked && !item.online) return false;
    const selectedCats = filters.categories.filter(c => c.checked).map(c => c.value);
    if (selectedCats.length && !selectedCats.every(c => item.categories.includes(c))) return false;
    return true;
  }

  // --- Render visible items ---
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

  // --- Expand/collapse item details ---
  async function toggleExpand(div, item) {
    const existing = div.nextElementSibling;
    if (existing && existing.classList.contains('thing-detail')) {
      existing.remove();
      return;
    }

    // Collapse any other open detail
    document.querySelectorAll('.thing-detail').forEach(d => d.remove());

    // Load the full post HTML (rendered by Jekyll)
    const res = await fetch(`${baseurl}${item.url}`);
    const html = await res.text();

    // Extract main article content
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const article = doc.querySelector('main, article, body');

    const detail = document.createElement('div');
    detail.className = 'thing-detail';
    detail.innerHTML = article.innerHTML;

    div.insertAdjacentElement('afterend', detail);
  }

  // --- Add event listeners for filters ---
  filters.country.addEventListener('change', renderList);
  filters.duration.addEventListener('change', renderList);
  filters.online.addEventListener('change', renderList);
  filters.categories.forEach(c => c.addEventListener('change', renderList));
});

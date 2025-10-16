document.addEventListener('DOMContentLoaded', () => {
  const listContainer = document.getElementById('things-list');
  const filters = {
    country: document.getElementById('filter-country'),
    duration: document.getElementById('filter-duration'),
    online: document.getElementById('filter-online'),
    categoriesContainer: document.getElementById('filter-categories'),
    categories: [], // will populate after checkboxes are added
    localCheckbox: document.getElementById('filter-local'),
    localWrapper: document.getElementById('local-search-settings'), // container for input + radius + button
    localLocation: document.getElementById('local-search-location'),
    localRadius: document.getElementById('local-search-radius'),
    localButton: document.getElementById('local-search-button'),
    localSuggestions: document.getElementById('local-search-suggestions') // for autocomplete dropdown
  };

  let items = [];
  let userLat = null;
  let userLng = null;
  let radiusKm = null;

  // --- Populate filter options from filtersData ---
  if (typeof filtersData !== 'undefined') {
    // Country dropdown
    filtersData.country.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      filters.country.appendChild(opt);
    });

    // Duration dropdown sorted ascending
    filtersData.duration
      .sort((a, b) => parseDuration(a) - parseDuration(b))
      .forEach(d => {
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

    filters.categories = Array.from(filters.categoriesContainer.querySelectorAll('input[type=checkbox]'));
  }

  // --- Fetch items metadata ---
  fetch(`${baseurl}/assets/data/things-metadata.json`)
    .then(r => r.json())
    .then(data => {
      items = data;
      renderList();
    });

  // --- Haversine distance ---
  function distanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLng = deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat/2) ** 2 +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLng/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
  function deg2rad(deg) { return deg * (Math.PI / 180); }

  // --- Filtering function ---
  function matchesFilters(item) {
    if (filters.country.value && item.country !== filters.country.value) return false;
    if (filters.duration.value) {
      const filterMinutes = parseDuration(filters.duration.value);
      const itemMinutes = parseDuration(item.duration);
      if (itemMinutes > filterMinutes) return false;
    }
    if (filters.online.checked && !item.online) return false;
    const selectedCats = filters.categories.filter(c => c.checked).map(c => c.value);
    if (selectedCats.length && !selectedCats.some(c => item.categories.includes(c))) return false;

    // Geo filtering
    if (userLat !== null && userLng !== null && radiusKm !== null) {
      if (item.geo_restricted) {
        if (typeof item.lat !== 'number' || typeof item.lng !== 'number') return false;
        const d = distanceKm(userLat, userLng, item.lat, item.lng);
        if (d > radiusKm) return false;
      }
    }

    return true;
  }

  function parseDuration(durationStr) {
    if (!durationStr) return Infinity;
    const [value, unit] = durationStr.split(' ');
    const num = parseFloat(value);
    return unit.startsWith('hour') ? num*60 : num;
  }

  function renderList() {
    listContainer.innerHTML = '';
    items.filter(matchesFilters).forEach(item => {
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
    if (existing && existing.classList.contains('thing-detail')) { existing.remove(); return; }
    document.querySelectorAll('.thing-detail').forEach(d => d.remove());
    const res = await fetch(`${baseurl}${item.url}`);
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const article = doc.querySelector('main, article, body');
    const detail = document.createElement('div');
    detail.className = 'thing-detail';
    detail.innerHTML = article.innerHTML;
    div.insertAdjacentElement('afterend', detail);
  }

  // --- Search Locally checkbox behavior ---
  filters.localCheckbox.addEventListener('change', () => {
    filters.localWrapper.style.display = filters.localCheckbox.checked ? 'block' : 'none';
    if (!filters.localCheckbox.checked) {
      userLat = userLng = radiusKm = null;
      renderList();
    }
  });

  // --- Search button ---
  filters.localButton.addEventListener('click', async () => {
    const location = filters.localLocation.value.trim();
    if (!location) { alert('Enter a location'); return; }
    radiusKm = parseFloat(filters.localRadius.value);

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`);
      const data = await response.json();
      if (data.length === 0) { alert('Location not found'); return; }
      userLat = parseFloat(data[0].lat);
      userLng = parseFloat(data[0].lon);
      renderList();
    } catch (err) {
      console.error('Error fetching location:', err);
      alert('Failed to fetch location');
    }
  });

  // --- Autocomplete suggestions ---
  let debounceTimer = null;
  filters.localLocation.addEventListener('input', () => {
    const query = filters.localLocation.value.trim();
    if (!query) { filters.localSuggestions.innerHTML = ''; return; }
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`);
        const suggestions = await resp.json();
        filters.localSuggestions.innerHTML = '';
        suggestions.forEach(s => {
          const li = document.createElement('li');
          li.textContent = `${s.display_name}`;
          li.dataset.lat = s.lat;
          li.dataset.lon = s.lon;
          li.addEventListener('click', () => {
            filters.localLocation.value = s.display_name;
            userLat = parseFloat(s.lat);
            userLng = parseFloat(s.lon);
            filters.localSuggestions.innerHTML = '';
          });
          filters.localSuggestions.appendChild(li);
        });
      } catch (err) { console.error('Autocomplete error', err); }
    }, 300);
  });

  // --- Other filter listeners ---
  filters.country.addEventListener('change', renderList);
  filters.duration.addEventListener('change', renderList);
  filters.online.addEventListener('change', renderList);
  filters.categories.forEach(c => c.addEventListener('change', renderList));
  filters.localRadius.addEventListener('change', () => {
    if (filters.localCheckbox.checked) filters.localButton.click();
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const listContainer = document.getElementById('things-list');
  const filters = {
    country: document.getElementById('filter-country'),
    duration: document.getElementById('filter-duration'),
    online: document.getElementById('filter-online'),
    categoriesContainer: document.getElementById('filter-categories'),
    categories: [], // will populate after checkboxes are added
    localCheckbox: document.getElementById('filter-local'),
    localLocation: document.getElementById('local-search-location'),
    localRadius: document.getElementById('local-search-radius')
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
    const R = 6371; // Earth radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLng = deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  // --- Filtering function ---
  function matchesFilters(item) {
    // Country exact match
    if (filters.country.value && item.country !== filters.country.value) return false;

    // Duration: allow smaller or equal
    if (filters.duration.value) {
      const filterMinutes = parseDuration(filters.duration.value);
      const itemMinutes = parseDuration(item.duration);
      if (itemMinutes > filterMinutes) return false;
    }

    // Online only
    if (filters.online.checked && !item.online) return false;

    // Categories OR (inclusive)
    const selectedCats = filters.categories.filter(c => c.checked).map(c => c.value);
    if (selectedCats.length && !selectedCats.some(c => item.categories.includes(c))) return false;

    // Geo filtering
    if (filters.localCheckbox.checked && userLat !== null && userLng !== null && radiusKm !== null) {
      if (item.geo_restricted) {
        if (typeof item.lat !== 'number' || typeof item.lng !== 'number') return false;
        const d = distanceKm(userLat, userLng, item.lat, item.lng);
        if (d > radiusKm) return false;
      }
      // Non-geo-restricted items are always included
    }

    return true;
  }

  // --- Parse duration helper ---
  function parseDuration(durationStr) {
    if (!durationStr) return Infinity;
    const [value, unit] = durationStr.split(' ');
    const num = parseFloat(value);
    if (unit.startsWith('hour')) return num * 60;
    return num;
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

  // --- Local search listener (geocode via Nominatim) ---
  filters.localCheckbox.addEventListener('change', async () => {
    if (!filters.localCheckbox.checked) {
      userLat = null;
      userLng = null;
      radiusKm = null;
      renderList();
      return;
    }

    const location = filters.localLocation.value.trim();
    if (!location) {
      alert('Please enter a location to search locally.');
      filters.localCheckbox.checked = false;
      return;
    }

    radiusKm = parseFloat(filters.localRadius.value);

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`);
      const data = await response.json();
      if (data.length === 0) {
        alert('Location not found.');
        filters.localCheckbox.checked = false;
        return;
      }
      userLat = parseFloat(data[0].lat);
      userLng = parseFloat(data[0].lon);
      renderList();
    } catch (err) {
      console.error('Error fetching location:', err);
      alert('Failed to get location.');
      filters.localCheckbox.checked = false;
    }
  });

  // --- Add event listeners for filters ---
  filters.country.addEventListener('change', renderList);
  filters.duration.addEventListener('change', renderList);
  filters.online.addEventListener('change', renderList);
  filters.categories.forEach(c => c.addEventListener('change', renderList));
  filters.localRadius.addEventListener('change', () => {
    if (filters.localCheckbox.checked) filters.localCheckbox.dispatchEvent(new Event('change'));
  });
  filters.localLocation.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' && filters.localCheckbox.checked) filters.localCheckbox.dispatchEvent(new Event('change'));
  });
});

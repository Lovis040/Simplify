// ── State ─────────────────────────────────────────────────────────────────────
let currentCategory = "all";
let currentSearch   = "";
let miniMapInstance = null;

const CATEGORIES = [
  { label:"All",            value:"all",           emoji:"✨" },
  { label:"Food & Drinks",  value:"food & drinks", emoji:"🍽️" },
  { label:"Sports",         value:"sports",        emoji:"⚽" },
  { label:"Arts & Culture", value:"arts & culture",emoji:"🎨" },
  { label:"Music",          value:"music",         emoji:"🎵" },
  { label:"Networking",     value:"networking",    emoji:"🤝" },
  { label:"Outdoor",        value:"outdoor",       emoji:"🌿" },
  { label:"Gaming",         value:"gaming",        emoji:"🎲" },
  { label:"Other",          value:"other",         emoji:"💡" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getCurrentUser() {
  return STATE.users.find(u => u.id === STATE.currentUserId) ?? null;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday:"short", day:"numeric", month:"short", year:"numeric" });
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });
}

function spotsText(event) {
  const left = event.maxAttendees - event.attendees.length;
  if (left === 0) return '<span class="text-red-500 font-medium">Full</span>';
  return `<span class="text-gray-400">${left} spot${left !== 1 ? "s" : ""} left</span>`;
}

// ── Render header auth ────────────────────────────────────────────────────────
function renderHeader() {
  const user = getCurrentUser();
  const el = document.getElementById("header-auth");
  if (!el) return;

  if (user) {
    el.innerHTML = `
      <div class="flex items-center gap-3">
        <a href="new-event.html" class="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
          Post Event
        </a>
        <a href="profile.html?id=${user.id}" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="${user.avatar}" class="h-8 w-8 rounded-full ring-2 ring-transparent hover:ring-indigo-400 transition-all" alt="${user.name}" />
        </a>
        <button onclick="logout()" class="text-gray-400 hover:text-gray-600 transition-colors" title="Sign out">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
        </button>
      </div>`;
  } else {
    el.innerHTML = `
      <div class="flex items-center gap-2">
        <a href="login.html" class="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">Sign in</a>
        <a href="register.html" class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors">Join free</a>
      </div>`;
  }
}

function logout() {
  STATE.currentUserId = null;
  saveState();
  renderHeader();
  renderGrid();
}

// ── Category filter ───────────────────────────────────────────────────────────
function renderCategoryFilter() {
  const el = document.getElementById("category-filter");
  if (!el) return;
  el.innerHTML = CATEGORIES.map(cat => `
    <button
      onclick="setCategory('${cat.value}')"
      data-cat="${cat.value}"
      class="category-pill shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-all ${cat.value === currentCategory ? 'active' : ''}"
    >
      <span>${cat.emoji}</span> ${cat.label}
    </button>
  `).join("");
}

function setCategory(cat) {
  currentCategory = cat;
  renderCategoryFilter();
  renderGrid();
}

// ── Event grid ────────────────────────────────────────────────────────────────
function getFiltered() {
  return STATE.events.filter(e => {
    const matchCat  = currentCategory === "all" || e.category === currentCategory;
    const q         = currentSearch.toLowerCase();
    const matchSearch = !q ||
      e.title.toLowerCase().includes(q) ||
      e.location.name.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });
}

function renderGrid() {
  const filtered = getFiltered();
  const grid  = document.getElementById("event-grid");
  const empty = document.getElementById("empty-state");
  const count = document.getElementById("event-count");

  count.textContent = `${filtered.length} event${filtered.length !== 1 ? "s" : ""} found`;

  if (filtered.length === 0) {
    grid.innerHTML  = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  grid.innerHTML = filtered.map(event => {
    const host     = STATE.users.find(u => u.id === event.hostId);
    const spotsLeft= event.maxAttendees - event.attendees.length;
    const isFull   = spotsLeft === 0;
    const isJoined = STATE.currentUserId && event.attendees.includes(STATE.currentUserId);
    const isHost   = STATE.currentUserId === event.hostId;
    const color    = CATEGORY_COLORS[event.category] ?? "#6366f1";

    return `
    <div class="event-card cursor-pointer bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-150" onclick="openModal('${event.id}')">
      ${event.imageUrl ? `
        <div class="relative h-36 overflow-hidden">
          <img src="${event.imageUrl}" alt="${event.title}" class="card-img w-full h-full object-cover" />
          <div class="absolute top-3 left-3 text-xs font-semibold text-white px-2.5 py-1 rounded-full capitalize" style="background:${color}">${event.category}</div>
          <div class="absolute top-3 right-3 ${event.price === 0 ? "bg-green-500 text-white" : "bg-white text-gray-800"} text-xs font-semibold px-2 py-1 rounded-full">
            ${event.price === 0 ? "Free" : "€" + event.price}
          </div>
        </div>` : ""}
      <div class="p-4">
        <h3 class="font-semibold text-gray-900 text-sm leading-snug mb-2 line-clamp-2">${event.title}</h3>
        <div class="space-y-1.5 text-xs text-gray-500">
          <div class="flex items-center gap-1.5">
            <svg class="h-3.5 w-3.5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke-width="2"/><line x1="16" y1="2" x2="16" y2="6" stroke-width="2"/><line x1="8" y1="2" x2="8" y2="6" stroke-width="2"/><line x1="3" y1="10" x2="21" y2="10" stroke-width="2"/></svg>
            <span>${formatDateShort(event.date)}</span>
            <svg class="h-3.5 w-3.5 text-indigo-400 shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke-width="2"/><polyline points="12 6 12 12 16 14" stroke-width="2"/></svg>
            <span>${event.time}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <svg class="h-3.5 w-3.5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <span class="truncate">${event.location.name}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <svg class="h-3.5 w-3.5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/></svg>
            <span>${event.attendees.length}/${event.maxAttendees} joined · ${spotsText(event)}</span>
          </div>
        </div>
        <div class="mt-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <img src="${host?.avatar ?? ""}" class="h-6 w-6 rounded-full" alt="${host?.name ?? ""}" />
            <span class="text-xs text-gray-500">${host?.name ?? "Unknown"}</span>
          </div>
          ${isHost   ? '<span class="text-xs font-medium text-indigo-600 border border-indigo-200 rounded-full px-2 py-0.5">Your event</span>' :
            isJoined ? '<span class="text-xs font-medium text-green-600 border border-green-200 rounded-full px-2 py-0.5">Joined</span>' : ""}
        </div>
      </div>
    </div>`;
  }).join("");
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function openModal(eventId) {
  const event = STATE.events.find(e => e.id === eventId);
  if (!event) return;

  const host      = STATE.users.find(u => u.id === event.hostId);
  const spotsLeft = event.maxAttendees - event.attendees.length;
  const isFull    = spotsLeft === 0;
  const isJoined  = STATE.currentUserId && event.attendees.includes(STATE.currentUserId);
  const isHost    = STATE.currentUserId === event.hostId;
  const color     = CATEGORY_COLORS[event.category] ?? "#6366f1";
  const mapsUrl   = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location.address)}`;

  const attendeeUsers = event.attendees
    .map(id => STATE.users.find(u => u.id === id))
    .filter(Boolean);

  let actionBtn = "";
  if (!STATE.currentUserId) {
    actionBtn = `<a href="login.html" class="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-colors">Sign in to join</a>`;
  } else if (isHost) {
    actionBtn = `<p class="text-center text-sm text-gray-400 py-2">You are hosting this event</p>`;
  } else if (isJoined) {
    actionBtn = `<button onclick="leaveEvent('${event.id}')" class="w-full border border-red-200 text-red-500 hover:bg-red-50 font-semibold py-2.5 rounded-xl transition-colors">Leave event</button>`;
  } else {
    actionBtn = `<button onclick="joinEvent('${event.id}')" ${isFull ? "disabled" : ""} class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors">${isFull ? "Event is full" : "Join event"}</button>`;
  }

  document.getElementById("modal-content").innerHTML = `
    ${event.imageUrl ? `
      <div class="relative -mx-6 -mt-6 mb-5">
        <img src="${event.imageUrl}" alt="${event.title}" class="w-full h-52 object-cover" />
        <div class="absolute bottom-3 left-6 text-xs font-semibold text-white px-3 py-1 rounded-full capitalize" style="background:${color}">${event.category}</div>
      </div>` : ""}

    <div class="flex items-start justify-between gap-3 mb-4">
      <div>
        ${!event.imageUrl ? `<span class="inline-block text-xs font-semibold text-white px-2.5 py-0.5 rounded-full capitalize mb-2" style="background:${color}">${event.category}</span>` : ""}
        <h2 class="text-xl font-bold text-gray-900 leading-tight">${event.title}</h2>
      </div>
      <span class="shrink-0 mt-1 text-xs font-semibold px-2.5 py-1 rounded-full ${event.price === 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}">${event.price === 0 ? "Free" : "€" + event.price}</span>
    </div>

    <div class="grid grid-cols-3 gap-3 mb-5">
      <div class="bg-gray-50 rounded-xl p-3">
        <svg class="h-4 w-4 text-indigo-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke-width="2"/><line x1="16" y1="2" x2="16" y2="6" stroke-width="2"/><line x1="8" y1="2" x2="8" y2="6" stroke-width="2"/><line x1="3" y1="10" x2="21" y2="10" stroke-width="2"/></svg>
        <p class="text-xs font-semibold text-gray-800 leading-tight">${formatDateShort(event.date)}</p>
        <p class="text-xs text-gray-400">${event.time}</p>
      </div>
      <div class="bg-gray-50 rounded-xl p-3">
        <svg class="h-4 w-4 text-indigo-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/></svg>
        <p class="text-xs font-semibold text-gray-800">${event.attendees.length}/${event.maxAttendees}</p>
        <p class="text-xs text-gray-400">${isFull ? "Full" : spotsLeft + " left"}</p>
      </div>
      <div class="bg-gray-50 rounded-xl p-3">
        <svg class="h-4 w-4 text-indigo-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        <p class="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">${event.location.name}</p>
      </div>
    </div>

    <p class="text-sm text-gray-600 leading-relaxed mb-5">${event.description}</p>

    <hr class="border-gray-100 mb-5" />

    <!-- Mini map -->
    <div class="mb-5">
      <div class="flex items-center justify-between mb-2">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Location</p>
        <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors">
          Open in Maps
          <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
        </a>
      </div>
      <div id="mini-map" class="h-40 rounded-xl overflow-hidden border border-gray-200 bg-gray-100"></div>
      <p class="text-xs text-gray-400 mt-1.5">${event.location.address}</p>
    </div>

    <hr class="border-gray-100 mb-5" />

    <!-- Host -->
    <div class="mb-5">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Host</p>
      <a href="profile.html?id=${host?.id}" class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors -mx-1">
        <img src="${host?.avatar ?? ""}" class="h-10 w-10 rounded-full" alt="${host?.name ?? ""}" />
        <div>
          <p class="font-semibold text-sm text-gray-900">${host?.name ?? "Unknown"}</p>
          <p class="text-xs text-gray-500 line-clamp-1">${host?.bio ?? ""}</p>
        </div>
      </a>
    </div>

    <!-- Attendees -->
    ${attendeeUsers.length > 0 ? `
    <div class="mb-5">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Attendees (${attendeeUsers.length})</p>
      <div class="flex flex-wrap gap-2">
        ${attendeeUsers.map(u => `
          <a href="profile.html?id=${u.id}" class="flex items-center gap-1.5 bg-gray-50 rounded-full px-2.5 py-1 hover:bg-gray-100 transition-colors">
            <img src="${u.avatar}" class="h-5 w-5 rounded-full" alt="${u.name}" />
            <span class="text-xs text-gray-700">${u.name}</span>
          </a>`).join("")}
      </div>
    </div>
    <hr class="border-gray-100 mb-5" />` : ""}

    <!-- Action -->
    <div>${actionBtn}</div>
  `;

  // Show modal
  const backdrop = document.getElementById("modal-backdrop");
  const panel    = document.getElementById("modal-panel");
  backdrop.classList.remove("hidden");
  panel.classList.remove("hidden");
  requestAnimationFrame(() => {
    backdrop.style.opacity = "1";
    panel.classList.remove("entering");
  });

  // Init mini map
  initMiniMap(event.location.lat, event.location.lng);

  history.pushState({ eventId }, "", `?event=${event.id}`);
}

function closeModal() {
  const backdrop = document.getElementById("modal-backdrop");
  const panel    = document.getElementById("modal-panel");
  backdrop.style.opacity = "0";
  panel.classList.add("entering");
  setTimeout(() => {
    backdrop.classList.add("hidden");
    panel.classList.add("hidden");
    destroyMiniMap();
  }, 220);
  history.pushState({}, "", window.location.pathname);
}

// Handle browser back
window.addEventListener("popstate", (e) => {
  if (!e.state?.eventId) closeModal();
});

// Click backdrop to close
document.getElementById("modal-backdrop").addEventListener("click", closeModal);

// ── Mini map ──────────────────────────────────────────────────────────────────
function initMiniMap(lat, lng) {
  destroyMiniMap();
  const el = document.getElementById("mini-map");
  if (!el) return;

  miniMapInstance = L.map("mini-map", {
    center: [lat, lng], zoom: 15,
    zoomControl: false, scrollWheelZoom: false,
    dragging: false, doubleClickZoom: false, attributionControl: false,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(miniMapInstance);

  const icon = L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;background:#6366f1;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
    iconSize: [14, 14], iconAnchor: [7, 7],
  });
  L.marker([lat, lng], { icon }).addTo(miniMapInstance);
}

function destroyMiniMap() {
  if (miniMapInstance) {
    miniMapInstance.remove();
    miniMapInstance = null;
  }
}

// ── Join / Leave ──────────────────────────────────────────────────────────────
function joinEvent(eventId) {
  const uid = STATE.currentUserId;
  if (!uid) return;
  const event = STATE.events.find(e => e.id === eventId);
  if (!event || event.attendees.includes(uid)) return;
  event.attendees.push(uid);
  const user = STATE.users.find(u => u.id === uid);
  if (user) user.eventsJoined++;
  saveState();
  openModal(eventId);  // re-render modal
  renderGrid();
}

function leaveEvent(eventId) {
  const uid = STATE.currentUserId;
  if (!uid) return;
  const event = STATE.events.find(e => e.id === eventId);
  if (!event) return;
  event.attendees = event.attendees.filter(id => id !== uid);
  const user = STATE.users.find(u => u.id === uid);
  if (user) user.eventsJoined = Math.max(0, user.eventsJoined - 1);
  saveState();
  openModal(eventId);  // re-render modal
  renderGrid();
}

// ── Search ────────────────────────────────────────────────────────────────────
document.getElementById("search")?.addEventListener("input", e => {
  currentSearch = e.target.value;
  renderGrid();
});

// ── Open from URL param ───────────────────────────────────────────────────────
function checkUrlEvent() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("event");
  if (id) openModal(id);
}

// ── Init ──────────────────────────────────────────────────────────────────────
renderHeader();
renderCategoryFilter();
renderGrid();
checkUrlEvent();

// ── State ─────────────────────────────────────────────────────────────────────
let currentCategory = "all";
let currentSearch   = "";
let miniMapInstance = null;
let nearMeMap       = null;
let nearMeMarkers   = [];
let currentTab      = "events";
let userLatLng      = null; // [lat, lng] once geolocation resolves

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

function formatDateShort(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });
}

function spotsText(event) {
  const left = event.maxAttendees - event.attendees.length;
  if (left === 0) return '<span style="color:#f87171;font-weight:600">Full</span>';
  return `<span style="color:#888">${left} spot${left !== 1 ? "s" : ""} left</span>`;
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Tab switching ─────────────────────────────────────────────────────────────
function switchTab(tab) {
  currentTab = tab;

  document.getElementById("tab-events").classList.toggle("active", tab === "events");
  document.getElementById("tab-nearme").classList.toggle("active", tab === "nearme");

  const eventsControls = document.getElementById("events-controls");
  const viewEvents     = document.getElementById("view-events");
  const viewNearme     = document.getElementById("view-nearme");

  if (tab === "events") {
    eventsControls.style.display = "";
    viewEvents.style.display     = "";
    viewNearme.style.display     = "none";
  } else {
    eventsControls.style.display = "none";
    viewEvents.style.display     = "none";
    viewNearme.style.display     = "flex";
    initNearMeMap();
  }
}

// ── Near me map ───────────────────────────────────────────────────────────────
function initNearMeMap() {
  if (nearMeMap) return; // already built

  nearMeMap = L.map("near-me-map", {
    center: [52.5200, 13.4050],
    zoom: 13,
    zoomControl: false,
  });

  L.control.zoom({ position: "bottomright" }).addTo(nearMeMap);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: "© OpenStreetMap © CARTO",
  }).addTo(nearMeMap);

  // Add all event markers
  STATE.events.forEach(event => {
    const color  = CATEGORY_COLORS[event.category] ?? "#6366f1";
    const emoji  = CATEGORY_EMOJIS[event.category] ?? "📍";

    const icon = L.divIcon({
      className: "",
      html: `<div style="
        background:${color};color:#fff;
        border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        width:36px;height:36px;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 10px rgba(0,0,0,.5);border:2px solid rgba(255,255,255,.15);
      "><span style="transform:rotate(45deg);font-size:14px">${emoji}</span></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    const marker = L.marker([event.location.lat, event.location.lng], { icon });
    const spotsLeft = event.maxAttendees - event.attendees.length;

    marker.bindTooltip(`
      <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;line-height:1.5">
        <strong>${event.title}</strong><br>
        ${formatDateShort(event.date)} · ${event.time}<br>
        ${spotsLeft > 0 ? spotsLeft + " spots left" : "<span style='color:#f87171'>Full</span>"}
      </div>`, { direction: "top", offset: [0, -10] });

    marker.on("click", () => {
      openModal(event.id);
      highlightNmCard(event.id);
    });

    marker.addTo(nearMeMap);
    nearMeMarkers.push({ id: event.id, marker });
  });

  const statusEl = document.getElementById("nm-status");
  statusEl.textContent = `${STATE.events.length} events in Berlin`;
  renderNmList(STATE.events);
}

function renderNmList(events) {
  const list = document.getElementById("nm-list");
  if (!list) return;

  list.innerHTML = events.map(event => {
    const color     = CATEGORY_COLORS[event.category] ?? "#6366f1";
    const spotsLeft = event.maxAttendees - event.attendees.length;
    const distStr   = userLatLng
      ? (() => {
          const d = distanceKm(userLatLng[0], userLatLng[1], event.location.lat, event.location.lng);
          return d < 1 ? `${Math.round(d * 1000)} m away` : `${d.toFixed(1)} km away`;
        })()
      : event.location.name;

    return `
    <div id="nm-card-${event.id}" class="nm-card p-3" onclick="nmCardClick('${event.id}')">
      <div class="flex items-start gap-3">
        ${event.imageUrl
          ? `<img src="${event.imageUrl}" style="width:52px;height:52px;border-radius:8px;object-fit:cover;flex-shrink:0" />`
          : `<div style="width:52px;height:52px;border-radius:8px;background:${color}22;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:20px">${CATEGORY_EMOJIS[event.category] ?? "📍"}</div>`}
        <div class="min-w-0 flex-1">
          <p style="font-size:13px;font-weight:600;color:#f0f0f0;line-height:1.35;margin-bottom:3px" class="line-clamp-2">${event.title}</p>
          <p style="font-size:11px;color:#888;margin-bottom:2px">${formatDateShort(event.date)} · ${event.time}</p>
          <div class="flex items-center justify-between">
            <p style="font-size:11px;color:#818cf8">${distStr}</p>
            <span style="font-size:11px;font-weight:600;color:${spotsLeft === 0 ? '#f87171' : '#34d399'}">${spotsLeft === 0 ? "Full" : spotsLeft + " left"}</span>
          </div>
        </div>
      </div>
    </div>`;
  }).join("");
}

function nmCardClick(eventId) {
  const entry = nearMeMarkers.find(m => m.id === eventId);
  if (entry) {
    const event = STATE.events.find(e => e.id === eventId);
    if (event) nearMeMap.panTo([event.location.lat, event.location.lng], { animate: true });
    entry.marker.openTooltip();
  }
  highlightNmCard(eventId);
  openModal(eventId);
}

function highlightNmCard(eventId) {
  document.querySelectorAll(".nm-card").forEach(c => c.classList.remove("highlighted"));
  const card = document.getElementById(`nm-card-${eventId}`);
  if (card) {
    card.classList.add("highlighted");
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

// ── Header ────────────────────────────────────────────────────────────────────
function renderHeader() {
  const user = getCurrentUser();
  const el = document.getElementById("header-auth");
  if (!el) return;

  if (user) {
    el.innerHTML = `
      <div class="flex items-center gap-3">
        <a href="new-event.html" class="flex items-center gap-1.5 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style="background:#4f46e5" onmouseover="this.style.background='#4338ca'" onmouseout="this.style.background='#4f46e5'">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
          Post Event
        </a>
        <a href="profile.html?id=${user.id}">
          <img src="${user.avatar}" class="h-8 w-8 rounded-full" alt="${user.name}" />
        </a>
        <button onclick="logout()" style="color:#6b6b6b" onmouseover="this.style.color='#f0f0f0'" onmouseout="this.style.color='#6b6b6b'" title="Sign out">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
        </button>
      </div>`;
  } else {
    el.innerHTML = `
      <div class="flex items-center gap-2">
        <a href="login.html" class="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors" style="color:#9ca3af"
          onmouseover="this.style.background='#1e1e1e';this.style.color='#f0f0f0'" onmouseout="this.style.background='';this.style.color='#9ca3af'">Sign in</a>
        <a href="register.html" class="text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style="background:#4f46e5" onmouseover="this.style.background='#4338ca'" onmouseout="this.style.background='#4f46e5'">Join free</a>
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
    <button onclick="setCategory('${cat.value}')" data-cat="${cat.value}"
      class="category-pill shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${cat.value === currentCategory ? 'active' : ''}">
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
    const matchCat    = currentCategory === "all" || e.category === currentCategory;
    const q           = currentSearch.toLowerCase();
    const matchSearch = !q || e.title.toLowerCase().includes(q) || e.location.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
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
    grid.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  grid.innerHTML = filtered.map(event => {
    const host      = STATE.users.find(u => u.id === event.hostId);
    const spotsLeft = event.maxAttendees - event.attendees.length;
    const isFull    = spotsLeft === 0;
    const isJoined  = STATE.currentUserId && event.attendees.includes(STATE.currentUserId);
    const isHost    = STATE.currentUserId === event.hostId;
    const color     = CATEGORY_COLORS[event.category] ?? "#6366f1";

    return `
    <div class="event-card cursor-pointer rounded-xl overflow-hidden" onclick="openModal('${event.id}')">
      ${event.imageUrl ? `
        <div class="relative h-44 overflow-hidden">
          <img src="${event.imageUrl}" alt="${event.title}" class="card-img w-full h-full object-cover" />
          <div class="absolute inset-0" style="background:linear-gradient(to top,rgba(0,0,0,.6) 0%,transparent 55%)"></div>
          <div class="absolute top-3 left-3 text-xs font-bold text-white px-2.5 py-1 rounded-full capitalize tracking-wide" style="background:${color}">${event.category}</div>
          <div class="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full" style="background:rgba(0,0,0,.55);backdrop-filter:blur(4px);color:${event.price === 0 ? '#34d399' : '#f0f0f0'}">
            ${event.price === 0 ? "Free" : "€" + event.price}
          </div>
        </div>` : ""}

      <div class="p-4">
        <!-- Title — bigger, high contrast -->
        <h3 style="font-size:15px;font-weight:700;color:#f5f5f5;line-height:1.4;margin-bottom:10px" class="line-clamp-2">
          ${event.title}
        </h3>

        <!-- Meta rows — readable grey -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <div style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:#b0b0b0">
            <svg style="width:13px;height:13px;color:#818cf8;flex-shrink:0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke-width="2"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke-width="2"/><line x1="8" y1="2" x2="8" y2="6" stroke-width="2"/>
              <line x1="3" y1="10" x2="21" y2="10" stroke-width="2"/>
            </svg>
            <span>${formatDateShort(event.date)}</span>
            <svg style="width:13px;height:13px;color:#818cf8;flex-shrink:0;margin-left:4px" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="10" stroke-width="2"/><polyline points="12 6 12 12 16 14" stroke-width="2"/>
            </svg>
            <span>${event.time}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:#b0b0b0">
            <svg style="width:13px;height:13px;color:#818cf8;flex-shrink:0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${event.location.name}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:#b0b0b0">
            <svg style="width:13px;height:13px;color:#818cf8;flex-shrink:0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/>
            </svg>
            <span>${event.attendees.length}/${event.maxAttendees} joined · ${spotsText(event)}</span>
          </div>
        </div>

        <!-- Host + badge -->
        <div style="margin-top:12px;display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:8px;min-width:0;overflow:hidden">
            <img src="${host?.avatar ?? ""}" style="width:24px;height:24px;border-radius:50%;flex-shrink:0" alt="${host?.name ?? ""}" />
            <span style="font-size:12px;font-weight:500;color:#b0b0b0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${host?.name ?? "Unknown"}</span>
            ${isSuperhost(host) ? SUPERHOST_BADGE : ""}
          </div>
          ${isHost   ? '<span style="font-size:11px;font-weight:600;color:#818cf8;border:1px solid #3730a3;background:#1e1b4b;padding:2px 8px;border-radius:9999px;flex-shrink:0">Your event</span>' :
            isJoined ? '<span style="font-size:11px;font-weight:600;color:#34d399;border:1px solid #065f46;background:#022c22;padding:2px 8px;border-radius:9999px;flex-shrink:0">Joined</span>' : ""}
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

  const attendeeUsers = event.attendees.map(id => STATE.users.find(u => u.id === id)).filter(Boolean);

  let actionBtn = "";
  if (!STATE.currentUserId) {
    actionBtn = `<a href="login.html" class="block w-full text-center text-white font-semibold py-2.5 rounded-xl transition-colors"
      style="background:#4f46e5" onmouseover="this.style.background='#4338ca'" onmouseout="this.style.background='#4f46e5'">Sign in to join</a>`;
  } else if (isHost) {
    actionBtn = `<p class="text-center text-sm py-2" style="color:#6b6b6b">You are hosting this event</p>`;
  } else if (isJoined) {
    actionBtn = `<button onclick="leaveEvent('${event.id}')" class="w-full font-semibold py-2.5 rounded-xl transition-colors"
      style="border:1px solid #7f1d1d;color:#f87171;background:transparent"
      onmouseover="this.style.background='#1c0a0a'" onmouseout="this.style.background='transparent'">Leave event</button>`;
  } else {
    actionBtn = `<button onclick="joinEvent('${event.id}')" ${isFull ? "disabled" : ""} class="w-full text-white font-semibold py-2.5 rounded-xl transition-colors"
      style="background:${isFull ? '#2a2a2a' : '#4f46e5'};cursor:${isFull ? 'not-allowed' : 'pointer'}"
      onmouseover="if(!this.disabled)this.style.background='#4338ca'" onmouseout="if(!this.disabled)this.style.background='#4f46e5'">${isFull ? "Event is full" : "Join event"}</button>`;
  }

  document.getElementById("modal-content").innerHTML = `
    ${event.imageUrl ? `
      <div class="relative -mx-6 -mt-6 mb-5">
        <img src="${event.imageUrl}" alt="${event.title}" class="w-full h-52 object-cover" />
        <div class="absolute inset-0" style="background:linear-gradient(to top,rgba(0,0,0,.65) 0%,transparent 50%)"></div>
        <div class="absolute bottom-3 left-6 text-xs font-bold text-white px-3 py-1 rounded-full capitalize tracking-wide" style="background:${color}">${event.category}</div>
      </div>` : ""}

    <div class="flex items-start justify-between gap-3 mb-4">
      <div>
        ${!event.imageUrl ? `<span class="inline-block text-xs font-bold text-white px-2.5 py-0.5 rounded-full capitalize mb-2 tracking-wide" style="background:${color}">${event.category}</span>` : ""}
        <h2 class="font-bold leading-tight" style="color:#f5f5f5;font-size:1.2rem">${event.title}</h2>
      </div>
      <span class="shrink-0 mt-1 text-xs font-bold px-2.5 py-1 rounded-full"
        style="${event.price === 0 ? "background:#022c22;color:#34d399" : "background:#1e1e1e;color:#b0b0b0"}">
        ${event.price === 0 ? "Free" : "€" + event.price}
      </span>
    </div>

    <div class="grid grid-cols-3 gap-3 mb-5">
      <div class="rounded-xl p-3" style="background:#1e1e1e">
        <svg class="h-4 w-4 mb-1" style="color:#818cf8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke-width="2"/><line x1="16" y1="2" x2="16" y2="6" stroke-width="2"/><line x1="8" y1="2" x2="8" y2="6" stroke-width="2"/><line x1="3" y1="10" x2="21" y2="10" stroke-width="2"/></svg>
        <p class="text-xs font-semibold leading-tight" style="color:#f0f0f0">${formatDateShort(event.date)}</p>
        <p class="text-xs" style="color:#888">${event.time}</p>
      </div>
      <div class="rounded-xl p-3" style="background:#1e1e1e">
        <svg class="h-4 w-4 mb-1" style="color:#818cf8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/></svg>
        <p class="text-xs font-semibold" style="color:#f0f0f0">${event.attendees.length}/${event.maxAttendees}</p>
        <p class="text-xs" style="color:#888">${isFull ? "Full" : spotsLeft + " left"}</p>
      </div>
      <div class="rounded-xl p-3" style="background:#1e1e1e">
        <svg class="h-4 w-4 mb-1" style="color:#818cf8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        <p class="text-xs font-semibold leading-tight line-clamp-2" style="color:#f0f0f0">${event.location.name}</p>
      </div>
    </div>

    <p class="text-sm leading-relaxed mb-5" style="color:#b0b0b0">${event.description}</p>

    <hr style="border-color:#2a2a2a" class="mb-5" />

    <!-- Mini map -->
    <div class="mb-5">
      <div class="flex items-center justify-between mb-2">
        <p class="text-xs font-semibold uppercase tracking-wide" style="color:#888">Location</p>
        <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-1 text-xs transition-colors" style="color:#818cf8">
          Open in Maps
          <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
        </a>
      </div>
      <div id="mini-map" class="h-40 rounded-xl overflow-hidden" style="border:1px solid #2a2a2a;background:#1a1a1a"></div>
      <p class="text-xs mt-1.5" style="color:#888">${event.location.address}</p>
    </div>

    <hr style="border-color:#2a2a2a" class="mb-5" />

    <!-- Host -->
    <div class="mb-5">
      <p class="text-xs font-semibold uppercase tracking-wide mb-2" style="color:#888">Host</p>
      <a href="profile.html?id=${host?.id}" class="flex items-center gap-3 p-3 rounded-xl -mx-1 transition-colors"
        style="color:inherit" onmouseover="this.style.background='#1e1e1e'" onmouseout="this.style.background='transparent'">
        <img src="${host?.avatar ?? ""}" class="h-10 w-10 rounded-full" alt="${host?.name ?? ""}" />
        <div>
          <p class="font-semibold text-sm flex items-center gap-2 flex-wrap" style="color:#f0f0f0">
            ${host?.name ?? "Unknown"}
            ${isSuperhost(host) ? SUPERHOST_BADGE : ""}
          </p>
          <p class="text-xs line-clamp-1" style="color:#888">${host?.bio ?? ""}</p>
        </div>
      </a>
    </div>

    ${attendeeUsers.length > 0 ? `
    <div class="mb-5">
      <p class="text-xs font-semibold uppercase tracking-wide mb-2" style="color:#888">Attendees (${attendeeUsers.length})</p>
      <div class="flex flex-wrap gap-2">
        ${attendeeUsers.map(u => `
          <a href="profile.html?id=${u.id}" class="flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors"
            style="background:#1e1e1e" onmouseover="this.style.background='#272727'" onmouseout="this.style.background='#1e1e1e'">
            <img src="${u.avatar}" class="h-5 w-5 rounded-full" />
            <span class="text-xs" style="color:#b0b0b0">${u.name}</span>
          </a>`).join("")}
      </div>
    </div>
    <hr style="border-color:#2a2a2a" class="mb-5" />` : ""}

    <div>${actionBtn}</div>
  `;

  const backdrop = document.getElementById("modal-backdrop");
  const panel    = document.getElementById("modal-panel");
  backdrop.classList.remove("hidden");
  panel.classList.remove("hidden");
  requestAnimationFrame(() => {
    backdrop.style.opacity = "1";
    panel.classList.remove("entering");
  });

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

window.addEventListener("popstate", e => { if (!e.state?.eventId) closeModal(); });
document.getElementById("modal-backdrop").addEventListener("click", closeModal);

// ── Modal mini map ────────────────────────────────────────────────────────────
function initMiniMap(lat, lng) {
  destroyMiniMap();
  if (!document.getElementById("mini-map")) return;

  miniMapInstance = L.map("mini-map", {
    center: [lat, lng], zoom: 15,
    zoomControl: false, scrollWheelZoom: false,
    dragging: false, doubleClickZoom: false, attributionControl: false,
  });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png").addTo(miniMapInstance);

  const icon = L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;background:#818cf8;border:3px solid #0c0c0c;border-radius:50%;box-shadow:0 0 0 3px rgba(129,140,248,.3),0 2px 8px rgba(0,0,0,.6)"></div>`,
    iconSize: [14, 14], iconAnchor: [7, 7],
  });
  L.marker([lat, lng], { icon }).addTo(miniMapInstance);
}

function destroyMiniMap() {
  if (miniMapInstance) { miniMapInstance.remove(); miniMapInstance = null; }
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
  openModal(eventId);
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
  openModal(eventId);
  renderGrid();
}

// ── Search ────────────────────────────────────────────────────────────────────
document.getElementById("search")?.addEventListener("input", e => {
  currentSearch = e.target.value;
  renderGrid();
});

function checkUrlEvent() {
  const id = new URLSearchParams(window.location.search).get("event");
  if (id) openModal(id);
}

// ── Init ──────────────────────────────────────────────────────────────────────
renderHeader();
renderCategoryFilter();
renderGrid();
checkUrlEvent();

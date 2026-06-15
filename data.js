const CATEGORY_COLORS = {
  "food & drinks": "#f97316",
  "sports":        "#22c55e",
  "arts & culture":"#a855f7",
  "music":         "#ec4899",
  "networking":    "#3b82f6",
  "outdoor":       "#84cc16",
  "gaming":        "#f59e0b",
  "other":         "#6366f1",
};

const CATEGORY_EMOJIS = {
  "food & drinks": "🍽️",
  "sports":        "⚽",
  "arts & culture":"🎨",
  "music":         "🎵",
  "networking":    "🤝",
  "outdoor":       "🌿",
  "gaming":        "🎲",
  "other":         "💡",
};

// Superhost: users who have hosted 8+ events
function isSuperhost(user) {
  return user && user.eventsCreated >= 8;
}

const SUPERHOST_BADGE = `
  <span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:700;
    color:#fbbf24;background:#1c1400;border:1px solid #78350f;border-radius:9999px;padding:2px 7px;
    white-space:nowrap;vertical-align:middle">
    <svg style="width:9px;height:9px;flex-shrink:0" fill="currentColor" viewBox="0 0 24 24">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
    Superhost
  </span>`;

const INITIAL_USERS = [
  { id:"user-1", name:"Alex Müller",  avatar:"https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",   bio:"Coffee addict & city explorer. Always up for something new in Berlin.",  joinedAt:"2024-01-15", eventsCreated:8,  eventsJoined:23 },
  { id:"user-2", name:"Sarah Chen",   avatar:"https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",  bio:"Food lover, digital nomad. Let's eat and explore together!",             joinedAt:"2024-02-20", eventsCreated:5,  eventsJoined:17 },
  { id:"user-3", name:"Marcus Weber", avatar:"https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus", bio:"Musician, board game nerd and Berliner by heart.",                       joinedAt:"2024-03-10", eventsCreated:12, eventsJoined:31 },
  { id:"user-4", name:"Demo User",    avatar:"https://api.dicebear.com/7.x/avataaars/svg?seed=Demo",   bio:"Just exploring Simplify!",                                               joinedAt:"2024-06-01", eventsCreated:0,  eventsJoined:0  },
];

const INITIAL_EVENTS = [
  {
    id:"evt-1", title:"Sunday Brunch at Café am Neuen See",
    description:"Join us for a laid-back Sunday brunch at one of Berlin's most beloved lake-side cafés in the Tiergarten. We'll chat, eat, and soak in the green surroundings. All backgrounds welcome!",
    category:"food & drinks", date:"2026-06-22", time:"10:30",
    location:{ name:"Café am Neuen See", address:"Lichtensteinallee 2, 10787 Berlin", lat:52.5147, lng:13.3539 },
    maxAttendees:8, attendees:["user-2","user-3"], hostId:"user-1",
    imageUrl:"https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=600", price:0,
  },
  {
    id:"evt-2", title:"Mauerpark Run 5K",
    description:"A casual 5K jog around the iconic Mauerpark. No racing, just moving together through one of Berlin's most vibrant neighbourhoods. Coffee at Prater Biergarten afterwards!",
    category:"sports", date:"2026-06-20", time:"08:00",
    location:{ name:"Mauerpark", address:"Bernauer Str. 63-64, 13355 Berlin", lat:52.5414, lng:13.4022 },
    maxAttendees:20, attendees:["user-1","user-3"], hostId:"user-2",
    imageUrl:"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600", price:0,
  },
  {
    id:"evt-3", title:"Board Game Night",
    description:"From Catan to Codenames — bring your favourite games or just yourself. Snacks and drinks provided. Beginners very welcome, veterans even more so!",
    category:"gaming", date:"2026-06-25", time:"19:00",
    location:{ name:"Spielwiese Berlin", address:"Kastanienallee 15, 10435 Berlin", lat:52.5348, lng:13.4176 },
    maxAttendees:16, attendees:["user-1","user-2"], hostId:"user-3",
    imageUrl:"https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600", price:5,
  },
  {
    id:"evt-4", title:"Jazz Night at RAW Gelände",
    description:"Live jazz under the open sky at the legendary RAW Gelände in Friedrichshain. Bring a blanket, a drink, and good vibes. Music starts at 20:30 — show up early for a good spot!",
    category:"music", date:"2026-06-28", time:"19:30",
    location:{ name:"RAW Gelände", address:"Revaler Str. 99, 10245 Berlin", lat:52.5079, lng:13.4556 },
    maxAttendees:12, attendees:[], hostId:"user-2",
    imageUrl:"https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600", price:0,
  },
  {
    id:"evt-5", title:"Startup Networking Lunch",
    description:"Founders, designers, developers — let's connect over food at betahaus. Bring your elevator pitch or just your curiosity. Great place to meet Berlin's startup scene.",
    category:"networking", date:"2026-06-19", time:"12:00",
    location:{ name:"betahaus Berlin", address:"Prinzessinnenstr. 19-20, 10969 Berlin", lat:52.4994, lng:13.4217 },
    maxAttendees:25, attendees:["user-1","user-3"], hostId:"user-1",
    imageUrl:"https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600", price:0,
  },
  {
    id:"evt-6", title:"Watercolour Workshop",
    description:"A relaxed 2-hour watercolour session for all levels. Materials provided. We'll paint the Berlin skyline step by step — no experience needed, just enthusiasm and curiosity!",
    category:"arts & culture", date:"2026-07-02", time:"15:00",
    location:{ name:"Atelier Mitte", address:"Rosenthaler Str. 36, 10178 Berlin", lat:52.5245, lng:13.4013 },
    maxAttendees:10, attendees:["user-2"], hostId:"user-3",
    imageUrl:"https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600", price:15,
  },
  {
    id:"evt-7", title:"Sunset Hike at Teufelsberg",
    description:"Hike up Berlin's legendary Cold War listening station hill for an unforgettable sunset panorama. Easy trail, about 45 minutes up. Bring water and a camera!",
    category:"outdoor", date:"2026-07-05", time:"18:30",
    location:{ name:"Teufelsberg", address:"Teufelsseechaussee 10, 14193 Berlin", lat:52.4973, lng:13.2404 },
    maxAttendees:15, attendees:["user-2","user-3"], hostId:"user-1",
    imageUrl:"https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600", price:0,
  },
  {
    id:"evt-8", title:"Techno Culture Tour — Berghain Area",
    description:"A cultural walk through the legendary Berghain/Ostbahnhof area. We explore the street art, history and club culture of Berlin's most iconic neighbourhood. No queuing required.",
    category:"arts & culture", date:"2026-07-08", time:"16:00",
    location:{ name:"Ostbahnhof", address:"Straße der Pariser Kommune 1, 10243 Berlin", lat:52.5072, lng:13.4330 },
    maxAttendees:12, attendees:["user-1"], hostId:"user-3",
    imageUrl:"https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?w=600", price:0,
  },
];

// ── Persistent state in localStorage ──────────────────────────────────────────
const DATA_VERSION = "v4-tickit";

function loadState() {
  try {
    const raw = localStorage.getItem("simplify");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === DATA_VERSION) return parsed;
    }
  } catch {}
  return { version: DATA_VERSION, users: INITIAL_USERS, events: INITIAL_EVENTS, currentUserId: "user-4" };
}

function saveState() {
  STATE.version = DATA_VERSION;
  localStorage.setItem("simplify", JSON.stringify(STATE));
}

const STATE = loadState();

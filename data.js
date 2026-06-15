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

const INITIAL_USERS = [
  { id:"user-1", name:"Alex Müller",  avatar:"https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",   bio:"Coffee addict & hiking enthusiast.",       joinedAt:"2024-01-15", eventsCreated:8,  eventsJoined:23 },
  { id:"user-2", name:"Sarah Chen",   avatar:"https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",  bio:"Food lover, digital nomad.",               joinedAt:"2024-02-20", eventsCreated:5,  eventsJoined:17 },
  { id:"user-3", name:"Marcus Weber", avatar:"https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus", bio:"Musician and board game nerd.",             joinedAt:"2024-03-10", eventsCreated:12, eventsJoined:31 },
  { id:"user-4", name:"Demo User",    avatar:"https://api.dicebear.com/7.x/avataaars/svg?seed=Demo",   bio:"Just exploring Eventure!",                 joinedAt:"2024-06-01", eventsCreated:0,  eventsJoined:0  },
];

const INITIAL_EVENTS = [
  {
    id:"evt-1", title:"Sunday Brunch Meetup",
    description:"Join us for a relaxed Sunday brunch at one of Vienna's coziest spots. We'll chat, eat, and enjoy good company. All backgrounds welcome!",
    category:"food & drinks", date:"2026-06-22", time:"10:30",
    location:{ name:"Café Central", address:"Herrengasse 14, 1010 Wien", lat:48.2102, lng:16.3662 },
    maxAttendees:8, attendees:["user-2","user-3"], hostId:"user-1",
    imageUrl:"https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=600", price:0,
  },
  {
    id:"evt-2", title:"Prater Park Run 5K",
    description:"A casual 5K jog through the beautiful Prater park. No racing, just moving together. We'll grab a coffee afterwards!",
    category:"sports", date:"2026-06-20", time:"08:00",
    location:{ name:"Prater Hauptallee", address:"Prater, 1020 Wien", lat:48.2156, lng:16.3961 },
    maxAttendees:20, attendees:["user-1","user-3"], hostId:"user-2",
    imageUrl:"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600", price:0,
  },
  {
    id:"evt-3", title:"Board Game Night",
    description:"From Catan to Codenames — bring your favourite games or just yourself. We have snacks and drinks. Beginners very welcome!",
    category:"gaming", date:"2026-06-25", time:"19:00",
    location:{ name:"SpielRaum Wien", address:"Mariahilfer Str. 10, 1060 Wien", lat:48.1969, lng:16.3536 },
    maxAttendees:16, attendees:["user-1","user-2"], hostId:"user-3",
    imageUrl:"https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600", price:5,
  },
  {
    id:"evt-4", title:"Jazz Evening at Naschmarkt",
    description:"Live jazz under the stars at the Naschmarkt. Bring a blanket and a bottle of wine. Music starts at 20:30.",
    category:"music", date:"2026-06-28", time:"19:30",
    location:{ name:"Naschmarkt", address:"Naschmarkt, 1060 Wien", lat:48.1985, lng:16.3626 },
    maxAttendees:12, attendees:[], hostId:"user-2",
    imageUrl:"https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600", price:0,
  },
  {
    id:"evt-5", title:"Startup Networking Lunch",
    description:"Founders, designers, developers — let's connect over food. Bring your elevator pitch or just your curiosity.",
    category:"networking", date:"2026-06-19", time:"12:00",
    location:{ name:"Talent Garden Vienna", address:"Liechtensteinstraße 111, 1090 Wien", lat:48.228, lng:16.362 },
    maxAttendees:25, attendees:["user-1","user-3"], hostId:"user-1",
    imageUrl:"https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600", price:0,
  },
  {
    id:"evt-6", title:"Watercolour Workshop",
    description:"A relaxed 2-hour watercolour session for all levels. Materials provided. We'll paint the Vienna skyline step by step.",
    category:"arts & culture", date:"2026-07-02", time:"15:00",
    location:{ name:"Atelier Mitte", address:"Kirchengasse 4, 1070 Wien", lat:48.2024, lng:16.3485 },
    maxAttendees:10, attendees:["user-2"], hostId:"user-3",
    imageUrl:"https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600", price:15,
  },
];

// ── Persistent state in localStorage ──────────────────────────────────────────
function loadState() {
  try {
    const raw = localStorage.getItem("eventure");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { users: INITIAL_USERS, events: INITIAL_EVENTS, currentUserId: "user-4" };
}

function saveState() {
  localStorage.setItem("eventure", JSON.stringify(STATE));
}

const STATE = loadState();

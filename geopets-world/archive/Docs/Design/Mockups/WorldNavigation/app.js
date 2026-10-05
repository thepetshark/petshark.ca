"use strict";

const svg = (body, extra = "") => `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${body}</svg>`;
const icons = {
  collection: svg('<path d="M5 6.5h9a5 5 0 0 1 5 5V27a5 5 0 0 0-5-3H5z"/><path d="M19 11.5a5 5 0 0 1 5-5h3V24h-3a5 5 0 0 0-5 3"/><path d="M8 17c1-5 6-6 6-6s1 5-4 7m0 0-1 2"/>'),
  inventory: svg('<path d="M11 8V6a5 5 0 0 1 10 0v2"/><rect x="6" y="8" width="20" height="21" rx="6"/><path d="M6 15h20M10 10v7m12-7v7"/><rect x="11" y="19" width="10" height="6" rx="2"/><path d="M15 15h2"/>'),
  market: svg('<path d="m4 12 3-7h18l3 7"/><path d="M4 12v3a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0v-3H4Z"/><path d="M6 19v9h20v-9M13 28v-8h6v8M11 5l-1 7m11-7 1 7"/>'),
  home: svg('<path d="m3 15 13-11 13 11M7 13v15h18V13M13 28V18h6v10"/><path d="M22 8V4h4v7"/>'),
  world: svg('<circle cx="16" cy="16" r="12"/><ellipse cx="16" cy="16" rx="5.5" ry="12"/><path d="M4 16h24M6.5 9.5h19m-19 13h19"/>'),
  settings: svg('<path d="m13 4-1 4-4 2-4-1-2 5 3 3v4l-2 3 4 4 4-2 4 1 2 3 5-2v-4l3-3 4-1-1-5-4-1-2-3V7l-5-2-3 2Z" transform="translate(2 0) scale(.88)"/><circle cx="16" cy="16" r="4.5"/>'),
  back: svg('<path d="m19 7-9 9 9 9M11 16h15"/>'),
  energy: svg('<path d="M27 4C14 3 4 7 5 18s13 12 18 3c4-7 4-17 4-17Z" fill="#dbe6bb"/><path d="M5 29c2-8 8-12 15-17m-9 13-1-9m5 5 7-1"/>'),
  compass: svg('<path d="m22 5-3 15-12 7 6-15Z" fill="#fff6"/><path d="m22 5-9 7 6 8Z" fill="#f8efd7"/>'),
  avatar: '<svg viewBox="0 0 56 56" aria-hidden="true"><defs><linearGradient id="avatar-coat" x2="1" y2="1"><stop stop-color="#526f59"/><stop offset="1" stop-color="#2d5043"/></linearGradient></defs><path fill="#dce1bb" d="M0 0h56v56H0z"/><path fill="#b9cbb2" d="M0 39c19-15 33-15 56 0v17H0z"/><path fill="url(#avatar-coat)" d="M7 56c1-15 10-18 21-18s20 3 21 18Z"/><path fill="#d39a70" d="M22 32h12v12l-6 6-6-6Z"/><ellipse cx="28" cy="26" rx="12" ry="15" fill="#e4b389"/><path fill="#473b2c" d="M15 25c-3-15 7-17 14-17 12 0 16 7 13 19l-5-9c-6 4-12 3-18 1l-2 12Z"/><path fill="#ceb77a" d="M10 19c5-4 9-5 14-5h19l5 6c-10 4-26 5-38-1Z"/><path fill="#e5d4a1" d="m17 16 4-11c6-3 14-2 18 3l3 9Z"/><path fill="#47674a" d="m18 13 23 1 1 4-25-1Z"/><circle cx="23.5" cy="28" r="1" fill="#4c3e30"/><circle cx="33" cy="28" r="1" fill="#4c3e30"/><path d="M25 35q3 2 6 0" stroke="#ae7256" fill="none" stroke-width="1.3" stroke-linecap="round"/><path fill="#ebe3c1" d="m21 41 7 9-4 6-9-13m20-2-7 9 4 6 9-13"/></svg>'
};

const itemIcon = (file, name) => `<figure><img src="../PublicMarket/icons/${file}.png" alt=""><figcaption>${name}</figcaption></figure>`;
const phones = [...document.querySelectorAll(".phone")].map(element => ({ element, variant: element.dataset.variant, base: "world", destination: null, profile: false }));
let lastPhone = phones[1];
const ui = {
  collection: { kicker: "Collection", title: "Your field guide", hero: "collection", heading: "Every discovery has a place", description: "A separate destination for your collection.", note: "Collection content and progression are outside this navigation study." },
  inventory: { kicker: "Inventory", title: "Your inventory", hero: "inventory", heading: "A place for your finds", description: "Your items, always one tap away.", items: true, note: "Item icons are examples. No quantities or item actions are proposed here." },
  market: { kicker: "Market", title: "My Sales", hero: "market", heading: "Your sales, within reach", description: "Manage your own listings from wherever you are.", note: "Public browsing opens through a market location on the map." },
  settings: { kicker: "Profile", title: "Settings", hero: "settings", heading: "Make yourself comfortable", description: "A separate destination for settings and account options.", note: "Settings content is outside this navigation study." }
};

function navigation(phone) {
  const last = phone.base === "home" ? "world" : "home";
  return `<nav class="navigation" aria-label="${phone.variant.toUpperCase()} primary navigation">${["profile", "collection", "inventory", "market", last].map(destination => {
    const label = destination[0].toUpperCase() + destination.slice(1);
    return `<button type="button" class="destination-button ${destination === "inventory" ? "inventory-button" : ""}" data-destination="${destination}" aria-label="${label}" ${destination === "profile" ? `aria-expanded="${phone.profile}" aria-controls="profile-${phone.variant}"` : ""} ${phone.destination === destination ? 'aria-current="page"' : ""} ${phone.profile && destination !== "profile" ? 'tabindex="-1" inert' : ""}><span class="button-disc ${destination === "profile" ? "avatar-disc" : ""}">${destination === "profile" ? icons.avatar.replaceAll("avatar-coat", `avatar-coat-${phone.variant}`) : icons[destination]}</span></button>`;
  }).join("")}</nav>`;
}

function profilePanel(phone) {
  return `<button type="button" class="profile-scrim" data-action="outside" tabindex="-1" aria-label="Close Profile panel"></button><section class="profile-panel" id="profile-${phone.variant}" role="dialog" aria-label="Profile" aria-modal="true"><h4>Your profile</h4><p class="profile-name">Explorer</p><button type="button" class="settings-button" data-destination="settings">${icons.settings}<span>Settings</span></button><div class="profile-balance"><span class="balance-label">Coins</span><div class="balance-value"><img src="../PublicMarket/icons/coin_gold.png" alt="">1,240</div><span class="balance-hint">Sample balance</span></div><div class="profile-balance"><span class="balance-label">Energy · Home reserve</span><div class="balance-value energy">${icons.energy}48</div><span class="balance-hint">Sample value · tuning TBD</span></div></section>`;
}

function destinationView(phone) {
  const data = ui[phone.destination];
  if (!data) return "";
  return `<section class="destination-view" aria-label="${data.title}"><header class="view-header"><button class="back-button" type="button" data-action="back" aria-label="Back to ${phone.base === "home" ? "Home" : "World"}">${icons.back}</button><div class="view-titles"><span class="kicker">${data.kicker}</span><h3 tabindex="-1">${data.title}</h3></div></header><div class="view-content"><div class="destination-hero">${icons[data.hero]}</div><h4>${data.heading}</h4><p>${data.description}</p>${data.items ? `<div class="item-specimens" aria-label="Illustrative item icons">${itemIcon("wheat", "Wheat")}${itemIcon("water", "Water")}${itemIcon("log", "Softwood")}</div>` : ""}<p class="destination-footnote">${data.note}</p></div><div class="preview-stamp">Navigation preview</div></section>`;
}

function render(phone) {
  const home = phone.base === "home";
  phone.element.classList.toggle("home-mode", home);
  phone.element.classList.toggle("profile-open", phone.profile);
  phone.element.dataset.currentView = phone.destination || phone.base;
  phone.element.innerHTML = `${home ? `<div class="home-background">${icons.home}<h4>Your Home goes here</h4><p>Scene placeholder · navigation only</p></div>` : '<div class="map-background" role="img" aria-label="Existing GeoPets map: green woodland, rocks and winding paths"></div>'}<div class="status-bar" aria-hidden="true"><span>9:41</span><span class="status-icons">${svg('<path d="M5 23v3m6-8v8m6-13v13m6-19v19" stroke-width="3"/>')}${svg('<path d="M3 12q13-12 26 0M8 18q8-8 16 0m-11 5q3-3 6 0" stroke-width="3"/>')}${svg('<rect x="2" y="8" width="25" height="16" rx="4"/><path d="M30 13v6"/><rect x="5" y="11" width="18" height="10" rx="1" fill="currentColor" stroke="none"/>')}</span></div><div class="compass" aria-hidden="true" ${phone.destination ? "hidden" : ""}>${icons.compass}</div>${destinationView(phone)}${navigation(phone)}${phone.profile ? profilePanel(phone) : ""}<span class="home-indicator" aria-hidden="true"></span><div class="map-attribution">${home ? "Home scene placeholder" : "© Mapbox  © OpenStreetMap"}</div><div class="sr-only" role="status" aria-live="polite">${phone.profile ? "Profile panel open" : phone.destination ? ui[phone.destination].title : home ? "Home view" : "World view"}</div>`;
}

function focusButton(phone, name) { phone.element.querySelector(`[data-destination="${name}"]`)?.focus({ preventScroll: true }); }
const hasBackLayer = phone => phone.profile || phone.destination || phone.base === "home";
const visiblePhones = () => phones.filter(phone => phone.element.getClientRects().length > 0);
let releasingBackGuard = false;
function backTarget() {
  const visible = visiblePhones();
  return visible.includes(lastPhone) && hasBackLayer(lastPhone) ? lastPhone : [...visible].reverse().find(hasBackLayer);
}
function syncBackGuard() {
  // One same-document entry lets browser Back behave like application Back.
  // Hidden comparison models cannot consume it. Explicit dismissal removes it
  // when no visible layer remains, avoiding a growing stack of empty entries.
  if (backTarget()) {
    if (!history.state?.navigationGuard && !releasingBackGuard)
      history.pushState({ worldNavigation: true, navigationGuard: true }, "");
  } else if (history.state?.navigationGuard && !releasingBackGuard) {
    releasingBackGuard = true;
    history.back();
  }
}
function closeProfile(phone, synchronize = true) {
  phone.profile = false; render(phone); focusButton(phone, "profile");
  if (synchronize) syncBackGuard();
}
function back(phone, synchronize = true) {
  if (phone.profile) { closeProfile(phone, synchronize); return true; }
  if (phone.destination) { const previous = phone.destination; phone.destination = null; render(phone); focusButton(phone, previous === "settings" ? "profile" : previous); if (synchronize) syncBackGuard(); return true; }
  if (phone.base === "home") { phone.base = "world"; render(phone); focusButton(phone, "home"); if (synchronize) syncBackGuard(); return true; }
  return false;
}
function openDestination(phone, destination) {
  lastPhone = phone;
  if (destination === "profile") {
    phone.profile = !phone.profile;
    render(phone); focusButton(phone, "profile"); syncBackGuard(); return;
  }
  phone.profile = false;
  if (destination === "home" || destination === "world") { phone.base = destination; phone.destination = null; }
  else phone.destination = destination;
  render(phone);
  if (phone.destination) phone.element.querySelector(".view-titles h3")?.focus({ preventScroll: true });
  syncBackGuard();
}
phones.forEach(phone => {
  render(phone);
  phone.element.addEventListener("pointerdown", () => { lastPhone = phone; });
  phone.element.addEventListener("focusin", () => { lastPhone = phone; });
  phone.element.addEventListener("click", event => {
    const button = event.target.closest("button"); if (!button) return;
    if (button.dataset.action === "outside") { event.preventDefault(); event.stopPropagation(); closeProfile(phone); return; }
    if (button.dataset.action === "back") { back(phone); return; }
    if (button.dataset.destination) openDestination(phone, button.dataset.destination);
  });
  phone.element.addEventListener("keydown", event => {
    if (event.key !== "Tab" || !phone.profile) return;
    const focusable = [phone.element.querySelector('[data-destination="profile"]'), phone.element.querySelector('.profile-panel [data-destination="settings"]')];
    const current = focusable.indexOf(document.activeElement);
    event.preventDefault(); focusable[(current + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length]?.focus();
  });
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" || event.key === "BrowserBack" || (event.key === "ArrowLeft" && event.altKey) || (event.key === "Backspace" && !/INPUT|TEXTAREA/.test(event.target.tagName))) {
    const target = backTarget();
    if (target && back(target)) { event.preventDefault(); event.stopPropagation(); }
  }
});
window.addEventListener("popstate", () => {
  if (releasingBackGuard) { releasingBackGuard = false; syncBackGuard(); return; }
  const target = backTarget();
  if (target) { back(target, false); syncBackGuard(); }
});
function setLayout(value) {
  document.body.classList.toggle("layout-a", value === "a"); document.body.classList.toggle("layout-b", value === "b");
  document.querySelectorAll("[data-layout]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.layout === value)));
  if (value === "a" || value === "b") lastPhone = phones.find(phone => phone.variant === value);
}
document.querySelectorAll("[data-layout]").forEach(button => button.addEventListener("click", () => { setLayout(button.dataset.layout); syncBackGuard(); }));
document.querySelector("#reset").addEventListener("click", () => { phones.forEach(phone => { phone.base = "world"; phone.destination = null; phone.profile = false; render(phone); }); syncBackGuard(); });
const params = new URLSearchParams(location.search);
const single = params.get("layout");
if (params.has("phone")) document.body.classList.add("phone-only");
setLayout(single === "a" || single === "b" ? single : params.has("phone") ? "b" : "both");
history.replaceState({ worldNavigation: true }, "");
visiblePhones().forEach(phone => { if (params.get("view") === "home") phone.base = "home"; else if (ui[params.get("view")]) phone.destination = params.get("view"); phone.profile = params.get("profile") === "open" && phone === lastPhone; render(phone); });
syncBackGuard();

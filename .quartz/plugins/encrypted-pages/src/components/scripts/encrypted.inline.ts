// @ts-nocheck
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

const PASSWORDS_KEY = "encrypted-pages-passwords";
const DECRYPTED_ENTRIES_KEY = "encrypted-pages:decryptedShadowEntries";
const SHADOW_INDEX_VERSION = 1;

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKey(password, salt, iterations) {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
}

async function decryptContent(encryptedBase64, password, iterations) {
  const data = base64ToBuffer(encryptedBase64);

  const salt = data.slice(0, SALT_LENGTH);
  const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = data.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = data.slice(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

  const ciphertextWithTag = new Uint8Array(ciphertext.length + authTag.length);
  ciphertextWithTag.set(ciphertext, 0);
  ciphertextWithTag.set(authTag, ciphertext.length);

  const aesKey = await deriveKey(password, salt, iterations);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    ciphertextWithTag,
  );

  return new TextDecoder().decode(decrypted);
}

function getCachedPasswords() {
  try {
    const raw = sessionStorage.getItem(PASSWORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function cachePassword(password) {
  const passwords = getCachedPasswords();
  if (!passwords.includes(password)) {
    passwords.push(password);
    sessionStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
  }
}

function getDecryptedShadowEntries() {
  try {
    const raw = sessionStorage.getItem(DECRYPTED_ENTRIES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function storeDecryptedShadowEntries(entries) {
  try {
    sessionStorage.setItem(DECRYPTED_ENTRIES_KEY, JSON.stringify(entries));
  } catch {
    // sessionStorage quota - fail silently
  }
}

function showError(container, message) {
  const errorEl = container.querySelector(".encrypted-page-error");
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = "block";
  }
}

function hideError(container) {
  const errorEl = container.querySelector(".encrypted-page-error");
  if (errorEl) {
    errorEl.style.display = "none";
    errorEl.textContent = "";
  }
}

function setLoading(container, loading) {
  const button = container.querySelector(".encrypted-page-submit");
  const input = container.querySelector(".encrypted-page-input");
  if (button) {
    button.disabled = loading;
    button.textContent = loading ? "Decrypting\u2026" : "Unlock";
  }
  if (input) {
    input.disabled = loading;
  }
}

function resolveShadowIndexPath() {
  const scripts = document.querySelectorAll("script");
  for (const script of scripts) {
    const text = script.textContent ?? "";
    const match = text.match(/fetch\(["']([^"']+contentIndex\.json)["']\)/);
    if (match) {
      return match[1].replace(/contentIndex\.json$/, "encryptedContentIndex.json");
    }
  }
  return new URL("static/encryptedContentIndex.json", document.baseURI).toString();
}

let shadowIndexPromise = null;
async function fetchShadowIndex() {
  if (shadowIndexPromise) return shadowIndexPromise;
  const url = resolveShadowIndexPath();
  shadowIndexPromise = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`shadow index HTTP ${r.status}`);
      return r.json();
    })
    .then((data) => {
      if (!data || data.version !== SHADOW_INDEX_VERSION || !Array.isArray(data.entries)) {
        return { version: SHADOW_INDEX_VERSION, entries: [] };
      }
      return data;
    })
    .catch(() => ({ version: SHADOW_INDEX_VERSION, entries: [] }));
  return shadowIndexPromise;
}

async function decryptShadowEntries(shadowFile, passwords, alreadyDecrypted) {
  const patch = {};
  const newDecrypted = { ...alreadyDecrypted };
  let changed = false;

  for (let i = 0; i < shadowFile.entries.length; i++) {
    const key = String(i);
    if (alreadyDecrypted[key]) {
      const cached = alreadyDecrypted[key];
      if (cached && cached.slug) {
        patch[cached.slug] = cached.entry;
      }
      continue;
    }

    const blob = shadowFile.entries[i];
    if (!blob || typeof blob.ciphertext !== "string") continue;

    for (const pw of passwords) {
      try {
        const plaintext = await decryptContent(blob.ciphertext, pw, blob.iterations);
        const decoded = JSON.parse(plaintext);
        if (decoded && typeof decoded.slug === "string" && decoded.entry) {
          patch[decoded.slug] = decoded.entry;
          newDecrypted[key] = decoded;
          changed = true;
        }
        break;
      } catch {
        // try next password
      }
    }
  }

  if (changed) {
    storeDecryptedShadowEntries(newDecrypted);
  }

  return patch;
}

async function applyShadowPatches(patch) {
  const slugs = Object.keys(patch);
  if (slugs.length === 0) return;

  try {
    const base = await (typeof fetchData !== "undefined" ? fetchData : Promise.resolve(null));
    if (!base || typeof base !== "object") return;
    const root = base.content && typeof base.content === "object" ? base.content : base;
    for (const slug of slugs) {
      if (!(slug in root)) {
        root[slug] = patch[slug];
      }
    }
  } catch {
    return;
  }

  document.dispatchEvent(new CustomEvent("content-index-updated", { detail: { slugs } }));
  document.dispatchEvent(new CustomEvent("render"));
}

let shadowUnlockInFlight = false;
async function tryUnlockShadowIndex() {
  if (shadowUnlockInFlight) return;
  const passwords = getCachedPasswords();
  if (passwords.length === 0) return;

  shadowUnlockInFlight = true;
  try {
    const shadowFile = await fetchShadowIndex();
    if (!shadowFile.entries || shadowFile.entries.length === 0) return;
    const alreadyDecrypted = getDecryptedShadowEntries();
    const patch = await decryptShadowEntries(shadowFile, passwords, alreadyDecrypted);
    await applyShadowPatches(patch);
  } finally {
    shadowUnlockInFlight = false;
  }
}

async function attemptDecrypt(container, password) {
  const encryptedData = container.getAttribute("data-encrypted");
  const iterations = parseInt(container.getAttribute("data-iterations") || "600000", 10);

  if (!encryptedData) return false;

  try {
    const html = await decryptContent(encryptedData, password, iterations);

    const parent = container.parentElement;
    if (parent) {
      const temp = document.createElement("div");
      temp.innerHTML = html;
      container.replaceWith(...temp.childNodes);
    }

    cachePassword(password);
    document.dispatchEvent(new CustomEvent("render"));
    tryUnlockShadowIndex();

    return true;
  } catch {
    return false;
  }
}

function init() {
  const containers = document.querySelectorAll(".encrypted-page");
  if (containers.length === 0) {
    tryUnlockShadowIndex();
    return;
  }

  for (const container of containers) {
    if (container.querySelector(".encrypted-page-form")) continue;

    const encryptedData = container.getAttribute("data-encrypted");
    if (!encryptedData) continue;

    const form = document.createElement("div");
    form.className = "encrypted-page-form";
    form.innerHTML = [
      '<div class="encrypted-page-icon" aria-hidden="true">',
      '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">',
      '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>',
      '<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>',
      "</svg>",
      "</div>",
      '<p class="encrypted-page-label">This page is encrypted. Enter the password to view its content.</p>',
      '<div class="encrypted-page-input-row">',
      '<input type="password" class="encrypted-page-input" placeholder="Password" autocomplete="off" />',
      '<button type="button" class="encrypted-page-submit">Unlock</button>',
      "</div>",
      '<p class="encrypted-page-error" style="display:none"></p>',
    ].join("");

    container.appendChild(form);

    const input = form.querySelector(".encrypted-page-input");
    const button = form.querySelector(".encrypted-page-submit");

    async function handleSubmit() {
      const password = input?.value;
      if (!password) return;

      hideError(container);
      setLoading(container, true);

      const success = await attemptDecrypt(container, password);

      if (!success) {
        setLoading(container, false);
        showError(container, "Incorrect password. Please try again.");
        if (input) {
          input.value = "";
          input.focus();
        }
      }
    }

    if (button) {
      button.addEventListener("click", handleSubmit);
    }

    if (input) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSubmit();
        }
      });
    }

    const cached = getCachedPasswords();
    if (cached.length > 0) {
      (async () => {
        for (const pw of cached) {
          const success = await attemptDecrypt(container, pw);
          if (success) return;
        }
      })();
    }
  }

  tryUnlockShadowIndex();
}

document.addEventListener("nav", () => {
  init();
});

document.addEventListener("render", () => {
  const containers = document.querySelectorAll(".encrypted-page");
  if (containers.length > 0) {
    init();
  }
});

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (!(node instanceof HTMLElement)) continue;
      const containers = node.classList?.contains("encrypted-page")
        ? [node]
        : [...node.querySelectorAll(".encrypted-page")];
      const uninitialized = containers.filter((c) => !c.querySelector(".encrypted-page-form"));
      if (uninitialized.length > 0) {
        init();
        return;
      }
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });

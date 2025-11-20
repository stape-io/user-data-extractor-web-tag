let isSubmitClickListenerAdded = false;
let isSubmitFormListenerAdded = false;

/**
 * User Data Auto-Collection Module
 *
 * Main entry point to automatically collects the specified User Data types from the DOM.
 *
 * @param {object} options - Configuration for the extraction process.
 * @param {HTMLElement} [options.root=document] - The root element to scan within.
 * @param {object} [options.extract] - Specifies which User Data types to extract. All are true by default.
 * @param {boolean} [options.extract.email=true] - Extract email addresses.
 * @param {boolean} [options.extract.phone=true] - Extract phone numbers.
 * @param {boolean} [options.extract.city=false] - Extract city names.
 * @param {boolean} [options.extract.country=false] - Extract country codes.
 * @param {boolean} [options.extract.postalCode=false] - Extract postal codes.
 * @param {boolean} [options.extract.firstName=false] - Extract first names.
 * @param {boolean} [options.extract.lastName=false] - Extract last names.
 * @param {boolean} [options.overrideExistingUserData=false] - Determines if the already existing captured user data should be overriden with the newly captured values.
 * @param {object} [options.autoTrackSpecificForms] - Configuration for autotracking <form> HTML element submits.
 * @param {boolean} [options.autoTrackSpecificForms.enabled=false] - If true, automatically adds a listener to re-run extraction on <form> HTML element submits.
 * @param {string|null} [options.autoTrackSpecificForms.formSelector=null] - If set, the submit listener will listener for submit at elements that matches the specified CSS selector.
 * @param {object} [options.autoTrackSpecificClicks] - Configuration for autotracking type="submit" <button> and <input> HTML element clicks.
 * @param {boolean} [options.autoTrackSpecificClicks.enabled=false] - If true, automatically adds a listener to re-run extraction on type="submit" <button> and <input> HTML element clicks.
 * @param {string|null} [options.autoTrackSpecificClicks.buttonClickSelector=null] - If set, the click listener will listener for click at elements that matches the specified CSS selector.
 * @param {object} [options.pushToDataLayer] - Configuration for pushing results to the data layer.
 * @param {boolean} [options.pushToDataLayer.enabled=false] - If true, pushes the result to the dataLayer.
 * @param {string} [options.pushToDataLayer.event='user_data_detected'] - The event name for the dataLayer push.
 * @param {string} [options.pushToDataLayer.dataLayerName='dataLayer'] - The name of the dataLayer array.
 * @param {object} [options.saveIntoStorage] - Configuration for saving results to browser storage.
 * @param {boolean} [options.saveIntoStorage.enabled=false] - If true, saves the result to session or local storage.
 * @param {string} [options.saveIntoStorage.type='session'] - The type of storage to use ('session' or 'local').
 * @param {string} [options.saveIntoStorage.key='gtm_user_data'] - The key to use when saving to storage.
 * @returns {object} An object containing the extracted User Data. Each property will only be present if a suitable candidate was found.
 * @property {string} [email] The best candidate found for the user's email address.
 * @property {string} [phone] The best candidate found for the user's phone number.
 * @property {string} [city] The best candidate found for the user's city.
 * @property {string} [country] The best candidate found for the user's country.
 * @property {string} [postal_code] The best candidate found for the user's postal code.
 * @property {string} [first_name] The best candidate found for the user's first name.
 * @property {string} [last_name] The best candidate found for the user's last name.
 */
export default function collectUserDataAuto(options = {}) {
  try {
    const defaults = {
      root: document,
      extract: {
        email: true,
        phone: true,
        city: false,
        country: false,
        postalCode: false,
        firstName: false,
        lastname: false
      },
      overrideExistingUserData: false,
      pushToDataLayer: {
        enabled: false,
        event: 'user_data_detected',
        dataLayerName: 'dataLayer'
      },
      autoTrackSpecificClicks: {
        enabled: false,
        buttonClickSelector: null
      },
      autoTrackSpecificForms: {
        enabled: false,
        formSelector: null
      },
      saveIntoStorage: {
        enabled: false,
        type: 'session',
        key: 'gtm_user_data'
      }
    };

    const config = {
      ...defaults,
      ...options,
      pushToDataLayer: { ...defaults.pushToDataLayer, ...(options.pushToDataLayer || {}) },
      autoTrackSpecificClicks: {
        ...defaults.autoTrackSpecificClicks,
        ...(options.autoTrackSpecificClicks || {})
      },
      autoTrackSpecificForms: {
        ...defaults.autoTrackSpecificForms,
        ...(options.autoTrackSpecificForms || {})
      },
      saveIntoStorage: {
        ...defaults.saveIntoStorage,
        ...(options.saveIntoStorage || {})
      }
    };

    const throttleDelay = 1000;
    const throttledCollect = throttle(
      (handlerConfig) => collectAndProcessUserData(handlerConfig),
      throttleDelay
    );
    addSubmitClickListener(config, throttledCollect);
    addSubmitFormListener(config, throttledCollect);

    const userData = collectAndProcessUserData(config);

    return userData;
  } catch (e) {
    console.error('Error in collectUserDataAuto:', e);
    return {};
  }
}

function collectAndProcessUserData(config) {
  const newUserData = runUserDataCollection(config);
  const userDataFromStorage = getFromStorage(config);
  const updatedUserData =
    { ...collectUserDataAuto.userData, ...userDataFromStorage, ...newUserData } || {};

  const userData = (collectUserDataAuto.userData = config.overrideExistingUserData
    ? newUserData
    : updatedUserData);

  pushToDataLayer(userData, config);
  saveIntoStorage(userData, config);

  return userData;
}

function runUserDataCollection(config) {
  const { root, extract } = config;

  const selection = selectOnce(root);

  const userData = {};

  if (extract.email) {
    const emailCandidates = extractEmails(selection, config);
    const bestCandidate = pickBest(emailCandidates, 'email');
    if (bestCandidate) {
      userData.email = bestCandidate.value;
    }
  }

  if (extract.phone) {
    const phoneCandidates = extractPhones(selection, config);
    const bestCandidate = pickBest(phoneCandidates, 'phone');
    if (bestCandidate) {
      userData.phone = bestCandidate.value;
    }
  }

  if (extract.city) {
    const cityCandidates = extractCities(selection, config);
    const bestCandidate = pickBest(cityCandidates, 'city');
    if (bestCandidate) {
      userData.city = bestCandidate.value;
    }
  }

  if (extract.country) {
    const countryCandidates = extractCountries(selection, config);
    const bestCandidate = pickBest(countryCandidates, 'country');
    if (bestCandidate) {
      userData.country = bestCandidate.value;
    }
  }

  if (extract.postalCode) {
    const postalCodeCandidates = extractPostalCodes(selection, config);
    const bestCandidate = pickBest(postalCodeCandidates, 'postal_code');
    if (bestCandidate) {
      userData.postal_code = bestCandidate.value;
    }
  }

  if (extract.firstName) {
    const firstNameCandidates = extractFirstNames(selection, config);
    const bestCandidate = pickBest(firstNameCandidates, 'first_name');
    if (bestCandidate) {
      userData.first_name = bestCandidate.value;
    }
  }

  if (extract.lastName) {
    const lastNameCandidates = extractLastNames(selection, config);
    const bestCandidate = pickBest(lastNameCandidates, 'last_name');
    if (bestCandidate) {
      userData.last_name = bestCandidate.value;
    }
  }

  return userData;
}

function pushToDataLayer(userData, config) {
  try {
    const {
      pushToDataLayer: { enabled, dataLayerName = 'dataLayer', event = 'user_data_detected' }
    } = config;

    if (!enabled || isEmptyObject(userData)) return;

    const dataLayerEventObject = {
      event: event,
      user_data: userData,
      _clear: true
    };

    const name = dataLayerName;
    window[name] = window[name] || [];
    window[name].push(dataLayerEventObject);
  } catch (e) {
    console.error('Error in pushToDataLayer:', e);
  }
}

function saveIntoStorage(userData, config) {
  try {
    const {
      saveIntoStorage: { enabled, type = 'session', key = 'gtm_user_data' }
    } = config;
    const storageByType = {
      session: window.sessionStorage,
      local: window.localStorage
    };

    if (!enabled || isEmptyObject(userData)) return;

    const storage = storageByType[type];
    storage.setItem(key, JSON.stringify(userData));
  } catch (e) {
    console.error('Error in saveIntoStorage:', e);
  }
}

function getFromStorage(config) {
  try {
    const {
      saveIntoStorage: { enabled, type = 'session', key = 'gtm_user_data' }
    } = config;
    const storageByType = {
      session: window.sessionStorage,
      local: window.localStorage
    };

    if (!enabled) return;

    const storage = storageByType[type];
    const userDataStringified = storage.getItem(key);
    if (!userDataStringified) return;
    return JSON.parse(userDataStringified);
  } catch (e) {
    console.error('Error in getFromStorage:', e);
  }
}

function addSubmitClickListener(config, throttledCollect) {
  try {
    const {
      autoTrackSpecificClicks: { enabled, buttonClickSelector }
    } = config;

    if (!enabled || isSubmitClickListenerAdded) return;

    const clickHandler = (event) => {
      try {
        const buttonSelector = buttonClickSelector || 'button[type="submit"], input[type="submit"]';
        const target = event.target;
        const submitButton = target.closest(buttonSelector);

        if (submitButton) {
          throttledCollect({ ...config, root: submitButton.form || document });
        }
      } catch (e) {
        console.error('Error in addSubmitClickListener click event handler:', e);
      }
    };

    document.addEventListener('click', clickHandler, true);

    isSubmitClickListenerAdded = true;
  } catch (e) {
    console.error('Error in addSubmitClickListener:', e);
  }
}

function addSubmitFormListener(config, throttledCollect) {
  try {
    const {
      autoTrackSpecificForms: { enabled, formSelector }
    } = config;

    if (!enabled || isSubmitFormListenerAdded) return;

    const submitHandler = (event) => {
      try {
        const formCSSSelector = formSelector || 'form';
        const target = event.target;
        const form = target.closest(formCSSSelector);

        if (form) {
          throttledCollect({ ...config, root: form || document });
        }
      } catch (e) {
        console.error('Error in addSubmitFormListener submit event handler:', e);
      }
    };

    document.addEventListener('submit', submitHandler, true);

    isSubmitFormListenerAdded = true;
  } catch (e) {
    console.error('Error in addSubmitFormListener:', e);
  }
}

//============================================
// PII EXTRACTORS
//============================================

function extractEmails(selection, config) {
  const { inputsAndTextAreas } = selection;
  const disallowHostMatches = true;
  const disallowWords = ['support', 'noreply'];
  const host = safeHost();
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

  const candidates = [];
  const seen = new Set();

  const normalizeEmail = (value) => {
    if (!value) return;
    return value.trim().toLowerCase();
  };

  const accept = (normalized) => {
    if (!normalized) return false;
    if (disallowWords.some((w) => normalized.includes(w))) return false;
    if (disallowHostMatches && host && belongsToHost(normalized, host)) return false;
    return true;
  };

  for (const el of inputsAndTextAreas) {
    const hint = (el.getAttribute('type') || '').toLowerCase();
    const id = (el.getAttribute('id') || '').toLowerCase();
    const name = (el.getAttribute('name') || '').toLowerCase();
    const ph = (el.getAttribute('placeholder') || '').toLowerCase();
    const looksLikeEmailField =
      hint === 'email' || id.includes('email') || name.includes('email') || ph.includes('email');

    if (!looksLikeEmailField) continue;

    const value = String(el.value || '');
    const match = value.match(emailRegex);
    if (!match) continue;

    const raw = match[0];
    const normalized = normalizeEmail(raw);
    if (accept(normalized) && !seen.has(normalized)) {
      seen.add(normalized);
      candidates.push({
        value: normalized,
        el: el,
        score: scoreCandidate({
          el,
          value: normalized,
          source: el.tagName.toLowerCase(),
          visible: isProbablyVisible(el)
        })
      });
    }
  }

  return candidates;
}

function extractPhones(selection, config) {
  const { inputsAndTextAreas } = selection;
  const STRIP_RE = /[\-@#<>'",; ]|\(|\)|\+|[a-z]/gi;
  const LEADING_ZERO_RE = /^00/;
  const DIGITS_ONLY_RE = /^\d{7,}$/;
  const INTERNATIONAL_PHONE_RE = /^\+?\d{1,4}[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;

  const candidates = [];
  const seen = new Set();

  const normalizePhone = (value) => {
    if (!value) return;
    return String(value).replace(STRIP_RE, '').replace(LEADING_ZERO_RE, '').replace(/[^\d]/g, '');
  };

  const accept = (raw, normalized) => {
    return (
      (normalized && DIGITS_ONLY_RE.test(normalized)) ||
      (typeof raw === 'string' && INTERNATIONAL_PHONE_RE.test(raw.trim()))
    );
  };

  for (const el of inputsAndTextAreas) {
    const type = (el.getAttribute('type') || '').toLowerCase();
    const id = (el.getAttribute('id') || '').toLowerCase();
    const name = (el.getAttribute('name') || '').toLowerCase();
    const ph = (el.getAttribute('placeholder') || '').toLowerCase();
    const looksLikePhone =
      type === 'tel' ||
      id.includes('phone') ||
      name.includes('phone') ||
      id.includes('tel') ||
      name.includes('tel') ||
      ph.includes('phone') ||
      ph.includes('tel');

    if (!looksLikePhone) continue;

    const raw = el.value;
    const normalized = normalizePhone(raw);
    if (accept(raw, normalized) && !seen.has(normalized)) {
      seen.add(normalized);
      candidates.push({
        value: normalized,
        el,
        score: scoreCandidate({
          el,
          value: normalized,
          source: el.tagName.toLowerCase(),
          visible: isProbablyVisible(el)
        })
      });
    }
  }

  return candidates;
}

function extractCities(selection, config) {
  const inputs = [...selection.inputsAndTextAreas, ...selection.selects];
  const CITY_FIELD_KEYS = ['city', '$city'];

  const candidates = [];
  const seen = new Set();

  const normalizeCity = (value) => {
    if (!value) return;
    return String(value).toLowerCase().trim();
  };

  const looksLikeCityField = (el, val) => {
    return looksLikeField(el, val, CITY_FIELD_KEYS);
  };

  for (const el of inputs) {
    const raw = getFieldValue(el);
    if (!raw) continue;

    if (!looksLikeCityField(el, raw)) continue;

    const normalized = normalizeCity(raw);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      candidates.push({
        value: normalized,
        el,
        score: scoreCandidate({
          el,
          value: normalized,
          source: el.tagName.toLowerCase(),
          visible: isProbablyVisible(el)
        })
      });
    }
  }

  return candidates;
}

function extractCountries(selection, config) {
  const inputs = [...selection.inputsAndTextAreas, ...selection.selects];
  const COUNTRY_FIELD_KEYS = ['country'];

  const candidates = [];
  const seen = new Set();

  const looksLikeCountryField = (el, val) => {
    return looksLikeField(el, val, COUNTRY_FIELD_KEYS);
  };

  const mapCountryToken = (token, mapping) => {
    const s = String(token || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z]/g, '');
    if (!s) return '';
    if (s.length === 2) return s;
    if (mapping[s]) return mapping[s];
    for (const key of Object.keys(mapping)) {
      if (s.includes(key)) return mapping[key];
    }
    return s;
  };

  const normalizeCountry = (value, { skipMapping = false } = {}) => {
    if (!value) return;
    let v = String(value);
    if (!skipMapping) v = mapCountryToken(v, COUNTRY_MAPPINGS);
    v = v.toLowerCase().replace(/[^a-z]/g, '');
    if (!/^[a-z]+$/.test(v)) return null;
    return v.substring(0, 2);
  };

  for (const el of inputs) {
    const raw = getFieldValue(el);
    if (!raw) continue;

    if (!looksLikeCountryField(el, raw)) continue;

    const normalized = normalizeCountry(raw);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      candidates.push({
        value: normalized,
        el,
        score: scoreCandidate({
          el,
          value: normalized,
          source: el.tagName.toLowerCase(),
          visible: isProbablyVisible(el)
        })
      });
    }
  }

  return candidates;
}

function extractPostalCodes(selection, config) {
  const inputs = [...selection.inputsAndTextAreas, ...selection.selects];
  const POSTAL_CODE_KEYS = ['zip', 'zcode', 'pcode', 'postalcode', 'postcode'];

  const candidates = [];
  const seen = new Set();

  const looksLikePostalCodeField = (el, val) => {
    return looksLikeField(el, val, POSTAL_CODE_KEYS);
  };

  const normalizePostalCode = (value) => {
    if (!value) return;
    const v = String(value).trim();
    const ZIP_CODE_REGEX = /^\d{5}(?:[-\s]\d{4})?$/;
    return ZIP_CODE_REGEX.test(v) ? v : null;
  };

  for (const el of inputs) {
    const raw = getFieldValue(el);
    if (!raw) continue;

    if (!looksLikePostalCodeField(el, raw)) continue;

    const normalized = normalizePostalCode(raw);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      candidates.push({
        value: normalized,
        el,
        score: scoreCandidate({
          el,
          value: normalized,
          source: el.tagName.toLowerCase(),
          visible: isProbablyVisible(el)
        })
      });
    }
  }

  return candidates;
}

function extractFirstNames(selection, config) {
  const { inputsAndTextAreas } = selection;

  const candidates = [];
  const seen = new Set();

  const looksLikeFirstName = (meta) => {
    const FIRST_NAME_KEYS = ['firstname', 'fn', 'fname', 'givenname', 'forename'];
    return FIRST_NAME_KEYS.some((k) => keywordHit(meta, k));
  };

  for (const el of inputsAndTextAreas) {
    const meta = buildFieldMeta(el);
    if (!meta.value) continue;

    let foundValue = null;

    if (looksLikeFirstName(meta)) {
      foundValue = meta.value;
    } else if (looksLikeFullName(meta)) {
      const [first] = splitFullName(meta.value);
      if (first) {
        foundValue = first;
      }
    }

    if (foundValue) {
      const normalized = normalizeName(foundValue);
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        candidates.push({
          value: normalized,
          el,
          score: scoreCandidate({
            el,
            value: normalized,
            source: el.tagName.toLowerCase(),
            visible: isProbablyVisible(el)
          })
        });
      }
    }
  }
  return candidates;
}

function extractLastNames(selection, config) {
  const { inputsAndTextAreas } = selection;

  const candidates = [];
  const seen = new Set();

  const looksLikeLastName = (meta) => {
    const LAST_NAME_KEYS = ['lastname', 'ln', 'lname', 'surname', 'sname', 'familyname'];
    return LAST_NAME_KEYS.some((k) => keywordHit(meta, k));
  };

  for (const el of inputsAndTextAreas) {
    const meta = buildFieldMeta(el);
    if (!meta.value) continue;

    let foundValue = null;

    if (looksLikeLastName(meta)) {
      foundValue = meta.value;
    } else if (looksLikeFullName(meta)) {
      const [, last] = splitFullName(meta.value);
      if (last) {
        foundValue = last;
      }
    }

    if (foundValue) {
      const normalized = normalizeName(foundValue);
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        candidates.push({
          value: normalized,
          el,
          score: scoreCandidate({
            el,
            value: normalized,
            source: el.tagName.toLowerCase(),
            visible: isProbablyVisible(el)
          })
        });
      }
    }
  }
  return candidates;
}

//============================================
// SCORING & SELECTION
//============================================

function scoreCandidate(c) {
  let s = 0;
  if (c.source === 'input') s += 2;
  if (c.visible) s += 2;
  if (closest(c.el, 'a')) s -= 2;
  s -= Math.min(2, Math.max(0, (c.value.length - 18) / 20)); // Penalize long strings
  return s;
}

function pickBest(list) {
  if (!list || list.length === 0) return null;

  const safeDist = (el) => {
    const d = domDistance(el, focused);
    return Number.isFinite(d) ? d : 1e9;
  };

  // Sort by score (desc), then fall back to DOM proximity to the active element.
  const focused = document.activeElement;
  return list.slice().sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return safeDist(a.el) - safeDist(b.el);
  })[0];
}

//============================================
// DOM & UTILITY HELPERS
//============================================

function selectOnce(root) {
  const inputsAndTextAreas = [];
  const selects = [];

  const elInputs = Array.from(root.querySelectorAll('input, textarea'));
  for (const el of elInputs) {
    if (!isElementUsable(el)) continue;
    inputsAndTextAreas.push(el);
  }

  const elSelects = Array.from(root.querySelectorAll('select'));
  for (const el of elSelects) {
    if (!isElementUsable(el)) continue;
    selects.push(el);
  }

  return { inputsAndTextAreas, selects };
}

function isElementUsable(el) {
  const type = (el.getAttribute('type') || '').toLowerCase();
  if (
    type === 'password' ||
    type === 'hidden' ||
    type === 'button' ||
    type === 'submit' ||
    type === 'image'
  ) {
    return false;
  }

  const tag = (el.tagName || '').toLowerCase();
  if (['script', 'style', 'noscript', 'image', 'br', 'svg', 'path', 'canvas'].includes(tag)) {
    return false;
  }

  return true;
}

function domDistance(a, b) {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  let d = 0,
    n = a;
  while (n) {
    if (n === b) return d;
    d++;
    n = n.parentElement;
  }
  return d + 1000; // Penalize non-ancestors
}

function normalizeName(value) {
  if (typeof value !== 'string' || value.length > 100) return null;
  return value.trim().toLowerCase();
}

function getFieldValue(el) {
  if (el.tagName === 'SELECT') {
    const opt = el.selectedOptions && el.selectedOptions[0];
    return ((opt && (opt.textContent || opt.value)) || '').trim();
  } else if (/^(checkbox|radio)$/i.test(el.type)) {
    if (!el.checked) return '';
    return (el.value || el.getAttribute('value') || '').trim();
  }
  return (el.value || '').trim();
}

function looksLikeField(el, val, keys) {
  const id = el.getAttribute('id') || '';
  const name = el.getAttribute('name') || '';
  const ph = el.getAttribute('placeholder') || '';
  const keywordHit = (str, key) => {
    const s = (str || '').toLowerCase();
    const k = key.toLowerCase();
    return k.length > 2 ? s.includes(k) : s === k;
  };
  return keys.some(
    (k) => keywordHit(id, k) || keywordHit(name, k) || keywordHit(ph, k) || keywordHit(val, k)
  );
}

function keywordHit(meta, keyword) {
  const hay = [meta.name, meta.id, meta.placeholder, meta.value].map((s) =>
    (s || '').toLowerCase()
  );
  const k = keyword.toLowerCase();
  if (k.length > 2) return hay.some((h) => h.includes(k));
  return hay.some((h) => h === k);
}

function buildFieldMeta(el) {
  return {
    id: (el.getAttribute('id') || '').trim(),
    name: (el.getAttribute('name') || '').trim(),
    placeholder: (el.getAttribute('placeholder') || '').trim(),
    value: getFieldValue(el),
    inputType: (el.getAttribute('type') || '').toLowerCase()
  };
}

function looksLikeFullName(meta) {
  const FULL_NAME_KEYS = ['fullname'];
  return FULL_NAME_KEYS.some((k) => keywordHit(meta, k));
}

function splitFullName(str) {
  const parts = (str || '').trim().split(/\s+/);
  const first = parts[0] || '';
  const last = parts.slice(1).join(' ').trim();
  return [first, last];
}

function belongsToHost(email, host) {
  try {
    const domain = email.split('@')[1] || '';
    return host && domain && host === domain;
  } catch (e) {
    return false;
  }
}

function safeHost() {
  try {
    return location.hostname || '';
  } catch (e) {
    return '';
  }
}

function closest(el, sel) {
  try {
    return el && el.closest ? el.closest(sel) : null;
  } catch (e) {
    return null;
  }
}

function isProbablyVisible(el) {
  const style = getComputedStyle(el);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    parseFloat(style.opacity || '1') === 0
  )
    return false;
  const rect = el.getBoundingClientRect();
  return !!(rect.width > 0 && rect.height > 0);
}

function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

function isEmptyObject(obj) {
  if (!obj || typeof obj !== 'object') return false;
  return Object.keys(obj).length === 0;
}

const COUNTRY_MAPPINGS = {
  unitedstates: 'us',
  usa: 'us',
  ind: 'in',
  afghanistan: 'af',
  alandislands: 'ax',
  albania: 'al',
  algeria: 'dz',
  americansamoa: 'as',
  andorra: 'ad',
  angola: 'ao',
  anguilla: 'ai',
  antarctica: 'aq',
  antiguaandbarbuda: 'ag',
  argentina: 'ar',
  armenia: 'am',
  aruba: 'aw',
  australia: 'au',
  austria: 'at',
  azerbaijan: 'az',
  bahamas: 'bs',
  bahrain: 'bh',
  bangladesh: 'bd',
  barbados: 'bb',
  belarus: 'by',
  belgium: 'be',
  belize: 'bz',
  benin: 'bj',
  bermuda: 'bm',
  bhutan: 'bt',
  boliviaplurinationalstateof: 'bo',
  bolivia: 'bo',
  bonairesinteustatinsandsaba: 'bq',
  bosniaandherzegovina: 'ba',
  botswana: 'bw',
  bouvetisland: 'bv',
  brazil: 'br',
  britishindianoceanterritory: 'io',
  bruneidarussalam: 'bn',
  brunei: 'bn',
  bulgaria: 'bg',
  burkinafaso: 'bf',
  burundi: 'bi',
  cambodia: 'kh',
  cameroon: 'cm',
  canada: 'ca',
  capeverde: 'cv',
  caymanislands: 'ky',
  centralafricanrepublic: 'cf',
  chad: 'td',
  chile: 'cl',
  china: 'cn',
  christmasisland: 'cx',
  cocoskeelingislands: 'cc',
  colombia: 'co',
  comoros: 'km',
  congo: 'cg',
  congothedemocraticrepublicofthe: 'cd',
  democraticrepublicofthecongo: 'cd',
  cookislands: 'ck',
  costarica: 'cr',
  cotedivoire: 'ci',
  ivorycoast: 'ci',
  croatia: 'hr',
  cuba: 'cu',
  curacao: 'cw',
  cyprus: 'cy',
  czechrepublic: 'cz',
  denmark: 'dk',
  djibouti: 'dj',
  dominica: 'dm',
  dominicanrepublic: 'do',
  ecuador: 'ec',
  egypt: 'eg',
  elsalvador: 'sv',
  equatorialguinea: 'gq',
  eritrea: 'er',
  estonia: 'ee',
  ethiopia: 'et',
  falklandislandsmalvinas: 'fk',
  faroeislands: 'fo',
  fiji: 'fj',
  finland: 'fi',
  france: 'fr',
  frenchguiana: 'gf',
  frenchpolynesia: 'pf',
  frenchsouthernterritories: 'tf',
  gabon: 'ga',
  gambia: 'gm',
  georgia: 'ge',
  germany: 'de',
  ghana: 'gh',
  gibraltar: 'gi',
  greece: 'gr',
  greenland: 'gl',
  grenada: 'gd',
  guadeloupe: 'gp',
  guam: 'gu',
  guatemala: 'gt',
  guernsey: 'gg',
  guinea: 'gn',
  guineabissau: 'gw',
  guyana: 'gy',
  haiti: 'ht',
  heardislandandmcdonaldislands: 'hm',
  holyseevaticancitystate: 'va',
  vatican: 'va',
  honduras: 'hn',
  hongkong: 'hk',
  hungary: 'hu',
  iceland: 'is',
  india: 'in',
  indonesia: 'id',
  iranislamicrepublicof: 'ir',
  iran: 'ir',
  iraq: 'iq',
  ireland: 'ie',
  isleofman: 'im',
  israel: 'il',
  italy: 'it',
  jamaica: 'jm',
  japan: 'jp',
  jersey: 'je',
  jordan: 'jo',
  kazakhstan: 'kz',
  kenya: 'ke',
  kiribati: 'ki',
  koreademocraticpeoplesrepublicof: 'kp',
  northkorea: 'kp',
  korearepublicof: 'kr',
  southkorea: 'kr',
  kuwait: 'kw',
  kyrgyzstan: 'kg',
  laopeoplesdemocraticrepublic: 'la',
  laos: 'la',
  latvia: 'lv',
  lebanon: 'lb',
  lesotho: 'ls',
  liberia: 'lr',
  libya: 'ly',
  liechtenstein: 'li',
  lithuania: 'lt',
  luxembourg: 'lu',
  macao: 'mo',
  macedoniatheformeryugoslavrepublicof: 'mk',
  macedonia: 'mk',
  madagascar: 'mg',
  malawi: 'mw',
  malaysia: 'my',
  maldives: 'mv',
  mali: 'ml',
  malta: 'mt',
  marshallislands: 'mh',
  martinique: 'mq',
  mauritania: 'mr',
  mauritius: 'mu',
  mayotte: 'yt',
  mexico: 'mx',
  micronesiafederatedstatesof: 'fm',
  micronesia: 'fm',
  moldovarepublicof: 'md',
  moldova: 'md',
  monaco: 'mc',
  mongolia: 'mn',
  montenegro: 'me',
  montserrat: 'ms',
  morocco: 'ma',
  mozambique: 'mz',
  myanmar: 'mm',
  namibia: 'na',
  nauru: 'nr',
  nepal: 'np',
  netherlands: 'nl',
  newcaledonia: 'nc',
  newzealand: 'nz',
  nicaragua: 'ni',
  niger: 'ne',
  nigeria: 'ng',
  niue: 'nu',
  norfolkisland: 'nf',
  northernmarianaislands: 'mp',
  norway: 'no',
  oman: 'om',
  pakistan: 'pk',
  palau: 'pw',
  palestinestateof: 'ps',
  palestine: 'ps',
  panama: 'pa',
  papuanewguinea: 'pg',
  paraguay: 'py',
  peru: 'pe',
  philippines: 'ph',
  pitcairn: 'pn',
  poland: 'pl',
  portugal: 'pt',
  puertorico: 'pr',
  qatar: 'qa',
  reunion: 're',
  romania: 'ro',
  russianfederation: 'ru',
  russia: 'ru',
  rwanda: 'rw',
  saintbarthelemy: 'bl',
  sainthelenaascensionandtristandacunha: 'sh',
  saintkittsandnevis: 'kn',
  saintlucia: 'lc',
  saintmartinfrenchpart: 'mf',
  saintpierreandmiquelon: 'pm',
  saintvincentandthegrenadines: 'vc',
  samoa: 'ws',
  sanmarino: 'sm',
  saotomeandprincipe: 'st',
  saudiarabia: 'sa',
  senegal: 'sn',
  serbia: 'rs',
  seychelles: 'sc',
  sierraleone: 'sl',
  singapore: 'sg',
  sintmaartenductchpart: 'sx',
  slovakia: 'sk',
  slovenia: 'si',
  solomonislands: 'sb',
  somalia: 'so',
  southafrica: 'za',
  southgeorgiaandthesouthsandwichislands: 'gs',
  southsudan: 'ss',
  spain: 'es',
  srilanka: 'lk',
  sudan: 'sd',
  suriname: 'sr',
  svalbardandjanmayen: 'sj',
  eswatini: 'sz',
  swaziland: 'sz',
  sweden: 'se',
  switzerland: 'ch',
  syrianarabrepublic: 'sy',
  syria: 'sy',
  taiwanprovinceofchina: 'tw',
  taiwan: 'tw',
  tajikistan: 'tj',
  tanzaniaunitedrepublicof: 'tz',
  tanzania: 'tz',
  thailand: 'th',
  timorleste: 'tl',
  easttimor: 'tl',
  togo: 'tg',
  tokelau: 'tk',
  tonga: 'to',
  trinidadandtobago: 'tt',
  tunisia: 'tn',
  turkey: 'tr',
  turkmenistan: 'tm',
  turksandcaicosislands: 'tc',
  tuvalu: 'tv',
  uganda: 'ug',
  ukraine: 'ua',
  unitedarabemirates: 'ae',
  unitedkingdom: 'gb',
  unitedstatesofamerica: 'us',
  unitedstatesminoroutlyingislands: 'um',
  uruguay: 'uy',
  uzbekistan: 'uz',
  vanuatu: 'vu',
  venezuelabolivarianrepublicof: 've',
  venezuela: 've',
  vietnam: 'vn',
  virginislandsbritish: 'vg',
  virginislandsus: 'vi',
  wallisandfutuna: 'wf',
  westernsahara: 'eh',
  yemen: 'ye',
  zambia: 'zm',
  zimbabwe: 'zw'
};

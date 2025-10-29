/* ---------- helpers ---------- */
const $ = (selector, ctx = document) => ctx.querySelector(selector);
const money = value => '$' + (Math.round(value * 100) / 100).toLocaleString();
const fmt = (value, decimals = 0) => Number(value).toLocaleString(undefined, { maximumFractionDigits: decimals });
const escapeHTML = value => {
  if (value == null) return '';
  return String(value).replace(/[&<>"']/g, char => {
    switch (char) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case '\'': return '&#39;';
      default: return char;
    }
  });
};
const toTable = rows => {
  if (!rows || !rows.length) return '';
  const [head, ...body] = rows;
  const thead = '<thead><tr>' + head.map(cell => `<th>${cell}</th>`).join('') + '</tr></thead>';
  const tbody = '<tbody>' + body.map(row => '<tr>' + row.map(cell => {
    const content = cell ?? '';
    const cls = (typeof content === 'string' && content.startsWith('$')) ? 'right' : '';
    return `<td class="${cls}">${content}</td>`;
  }).join('') + '</tr>').join('') + '</tbody>';
  return thead + tbody;
};
const EXPORT_KEY = 'rb_menu_export_v1';
const PRICE_SHEET = encodeURI('Prices - Prices.csv');
let priceSheetRows = null;

const CSV_FIELD_MAP = {
  'Menu price per bowl': ['pricePerBowl', 'pl_price'],
  'Packaging cost per bowl': ['costPack', 'pl_packCost'],
  'Chicken (raw)': ['costChicken'],
  'Pork (raw)': ['costPork'],
  'Gyro blend (raw)': ['costGyro'],
  'Jasmine rice (dry)': ['costRice'],
  'Slaw mix': ['costSlaw'],
  'Julienne carrots': ['costCarrot'],
  'Julienne cucumbers': ['costCuke'],
  'Celery sticks': ['costCelery'],
  'Herb mix': ['costHerb'],
  'Pickled onion base': ['costOnionQt'],
  'Pickled carrot base': ['costPCarrotQt'],
  'House Green Sauce (Peruvian + Aioli Fusion)': ['costGreen'],
  'BBQ Sauce (House)': ['costBBQ'],
  'Toum Garlic Sauce': ['costToum'],
  'Buffalo Sauce': ['costBuffalo'],
  'Tzatziki': ['costTzatziki'],
  'Mustardy Habanero Hot Sauce (tamed)': ['costMojo'],
  'Bell peppers': ['costPep'],
  'Roma tomatoes': ['costTom'],
  'Red onions': ['costOnion'],
  'Cilantro': ['costCil'],
  'Lime juice': ['costLimeJuice'],
  'Salt': ['costSaltTbsp'],
  'Insurance & licenses': ['fx_insurance'],
  'Fuel & propane': ['fx_fuel'],
  'Loan or trailer payment': ['fx_note'],
  'Permits & event fees': ['fx_permits'],
  'Supplies/repairs/marketing': ['fx_misc'],
  'Commissary rent': ['fx_commissary'],
  'Festival staff count': ['fest_staff'],
  'Festival service hours': ['fest_hrs'],
  'Festival prep hours': ['fest_prep'],
  'Festival wage': ['fest_wage'],
  'Festival crew lead bonus': ['fest_lead'],
  'Community staff count': ['com_staff'],
  'Community service hours': ['com_hrs'],
  'Community prep hours': ['com_prep'],
  'Community wage': ['com_wage'],
  'Community crew lead bonus': ['com_lead'],
  'Catering staff count': ['cat_staff'],
  'Catering service hours': ['cat_hrs'],
  'Catering prep hours': ['cat_prep'],
  'Catering wage': ['cat_wage'],
  'Catering crew lead bonus': ['cat_lead']
};

const SALSA_RECIPE = {
  yieldCups: 8.25,
  cornCans: 3,
  peppers: 3,
  romaTomatoes: 6,
  redOnions: 1.5,
  cilantro: 1,
  limeJuiceCups: 0.5,
  saltTbsp: 1
};

const VEG_PER_KEY = {
  slaw: 'slaw_oz',
  onions: 'onions_oz',
  carrot: 'carrot_oz',
  cuke: 'cuke_oz',
  herb: 'herb_oz',
  pcarrot: 'pcarrot_oz',
  celery: 'celery_oz'
};

const COMPONENT_LABELS = {
  rice: 'Jasmine rice',
  salsa: 'Corn salsa',
  slaw: 'Slaw mix',
  onions: 'Pickled onions',
  carrot: 'Julienne carrots',
  cuke: 'Julienne cucumbers',
  herb: 'Herb garnish',
  pcarrot: 'Pickled carrots',
  celery: 'Celery sticks'
};

const PROTEIN_LABELS = {
  chicken: 'Chicken (4 oz cooked)',
  pork: 'Pork (4 oz cooked)',
  gyro: 'Gyro blend (4 oz cooked)'
};

const SAUCE_LABELS = {
  bbq: 'BBQ sauce',
  crema: 'Cilantro-lime crema',
  peanut: 'Bangkok peanut sauce',
  mojo: 'Pineapple mustard',
  tzatziki: 'Tzatziki',
  toum: 'Toum garlic sauce',
  buffalo: 'Buffalo sauce',
  green: 'House green sauce'
};

const DEFAULT_RECIPES = [
  {
    key: 'smoky_bbq_crema',
    label: 'Smoky BBQ + Crema (Pork) — with Corn Salsa',
    icon: '🔥',
    protein: 'pork',
    sauces: ['bbq', 'crema'],
    veg: ['slaw', 'onions', 'carrot', 'cuke', 'herb'],
    salsa: true,
    components: ['Cilantro-lime rice', 'Slaw mix', 'Smoked pork', 'BBQ sauce', 'Cilantro-lime crema', 'Corn salsa', 'Pickled onions', 'Fresh herbs'],
    steps: [
      { station: 'Base', component: 'Cilantro-Lime Rice', portion: '1 cup', notes: 'Scoop flat, spread evenly' },
      { station: 'Base', component: 'Slaw Mix (undressed)', portion: '1 small handful', notes: 'Layer over rice' },
      { station: 'Protein', component: 'Smoked / Grilled Pork', portion: '4 oz', notes: 'Hold hot in steam table' },
      { station: 'Sauce', component: 'BBQ Sauce', portion: '1 oz', notes: 'Zig-zag squeeze' },
      { station: 'Sauce', component: 'Cilantro-Lime Crema', portion: '0.75 oz', notes: 'Opposite direction of BBQ' },
      { station: 'Cold', component: 'Corn Salsa', portion: '2 oz', notes: 'Offset side of bowl' },
      { station: 'Cold', component: 'Pickled Red Onions', portion: '0.5 oz', notes: 'Top center' },
      { station: 'Garnish', component: 'Fresh Cilantro / Chives', portion: 'pinch', notes: 'Sprinkle before lid' }
    ]
  },
  {
    key: 'caribbean_jerk_chicken',
    label: 'Caribbean Jerk Bowl (Chicken) — Mustardy Habanero + Caribbean Sauce',
    icon: '🌴',
    protein: 'chicken',
    sauces: ['mojo', 'crema'],
    veg: ['slaw', 'onions', 'carrot', 'cuke', 'herb'],
    salsa: false,
    components: ['Jasmine rice', 'Slaw mix', 'Jerk chicken', 'Caribbean jerk-pineapple sauce', 'Mustardy habanero hot sauce', 'Cilantro-lime crema', 'Grilled pineapple', 'Pickled onions', 'Fresh herbs'],
    steps: [
      { station: 'Base', component: 'Jasmine Rice', portion: '1 cup', notes: 'Scoop evenly' },
      { station: 'Base', component: 'Slaw Mix (undressed)', portion: '1 handful', notes: 'Layer on rice' },
      { station: 'Protein', component: 'Jerk Chicken', portion: '4 oz', notes: 'Toss in jerk marinade if hot' },
      { station: 'Sauce', component: 'Caribbean Jerk-Pineapple Sauce', portion: '1 oz', notes: 'Across protein' },
      { station: 'Sauce', component: 'Mustardy Habanero Hot Sauce (tamed)', portion: '0.75 oz', notes: 'Cross-drizzle for heat' },
      { station: 'Sauce', component: 'Cilantro-Lime Crema', portion: '0.75 oz', notes: 'Adds cool balance' },
      { station: 'Cold', component: 'Grilled Pineapple', portion: '1 oz', notes: 'Opposite side' },
      { station: 'Cold', component: 'Pickled Red Onions', portion: '0.5 oz', notes: 'Add for color' },
      { station: 'Garnish', component: 'Cilantro or Scallions', portion: 'pinch', notes: 'Finish with fresh herbs' }
    ]
  },
  {
    key: 'caribbean_jerk_pork',
    label: 'Caribbean Jerk Bowl (Pork) — Mustardy Habanero + Caribbean Sauce',
    icon: '🌴',
    protein: 'pork',
    sauces: ['mojo', 'crema'],
    veg: ['slaw', 'onions', 'carrot', 'cuke', 'herb'],
    salsa: false,
    components: ['Jasmine rice', 'Slaw mix', 'Jerk pork', 'Caribbean jerk-pineapple sauce', 'Mustardy habanero hot sauce', 'Cilantro-lime crema', 'Grilled pineapple', 'Pickled onions', 'Fresh herbs'],
    steps: [
      { station: 'Base', component: 'Jasmine Rice', portion: '1 cup', notes: 'Scoop evenly' },
      { station: 'Base', component: 'Slaw Mix (undressed)', portion: '1 handful', notes: 'Layer on rice' },
      { station: 'Protein', component: 'Jerk Pork', portion: '4 oz', notes: 'Finish hot with jerk glaze' },
      { station: 'Sauce', component: 'Caribbean Jerk-Pineapple Sauce', portion: '1 oz', notes: 'Across protein' },
      { station: 'Sauce', component: 'Mustardy Habanero Hot Sauce (tamed)', portion: '0.75 oz', notes: 'Cross-drizzle for heat' },
      { station: 'Sauce', component: 'Cilantro-Lime Crema', portion: '0.75 oz', notes: 'Adds cool balance' },
      { station: 'Cold', component: 'Grilled Pineapple', portion: '1 oz', notes: 'Opposite side' },
      { station: 'Cold', component: 'Pickled Red Onions', portion: '0.5 oz', notes: 'Add for color' },
      { station: 'Garnish', component: 'Cilantro or Scallions', portion: 'pinch', notes: 'Finish with fresh herbs' }
    ]
  },
  {
    key: 'island_satay',
    label: 'Island Satay Bowl — Jerk Chicken, Peanut + Pineapple Jam',
    icon: '🥭',
    protein: 'chicken',
    sauces: ['peanut', 'mojo'],
    veg: ['slaw', 'onions', 'carrot', 'cuke', 'herb'],
    salsa: false,
    components: ['Jasmine rice', 'Slaw mix', 'Jerk chicken', 'Thai peanut sauce', 'Caribbean jerk-pineapple sauce', 'Mustardy habanero hot sauce', 'Pickled onions', 'Fresh pineapple', 'Cilantro / peanuts'],
    steps: [
      { station: 'Base', component: 'Jasmine Rice', portion: '1 cup', notes: 'Spread evenly' },
      { station: 'Base', component: 'Slaw Mix', portion: '1 handful', notes: 'Crunch layer' },
      { station: 'Protein', component: 'Jerk Chicken', portion: '4 oz', notes: 'Warm, flat top finish' },
      { station: 'Sauce', component: 'Thai Peanut Sauce', portion: '1 oz', notes: 'Warm squeeze bottle' },
      { station: 'Sauce', component: 'Caribbean Jerk-Pineapple Sauce', portion: '0.75 oz', notes: 'Opposite side swirl' },
      { station: 'Sauce', component: 'Mustardy Habanero Hot Sauce (tamed)', portion: '0.5 oz', notes: 'Accent heat line' },
      { station: 'Cold', component: 'Pickled Onions', portion: '0.5 oz', notes: 'Adds acid' },
      { station: 'Cold', component: 'Fresh Pineapple', portion: '1 oz', notes: 'Optional sweet contrast' },
      { station: 'Garnish', component: 'Cilantro / Chopped Peanut', portion: 'pinch', notes: 'Balanced finish' }
    ]
  },
  {
    key: 'cairo_gyro',
    label: 'Cairo Gyro Bowl — Beef/Pork + Tzatziki',
    icon: '🇬🇷',
    protein: 'gyro',
    sauces: ['tzatziki'],
    veg: ['slaw', 'onions', 'carrot', 'cuke', 'herb'],
    salsa: false,
    components: ['Jasmine rice', 'Slaw mix', 'Gyro beef/pork', 'Tzatziki', 'Pickled onions', 'Cucumber tomato', 'Dill / parsley'],
    steps: [
      { station: 'Base', component: 'Jasmine Rice', portion: '1 cup', notes: 'Scoop even' },
      { station: 'Base', component: 'Slaw Mix (light)', portion: '1 handful', notes: 'Adds crunch' },
      { station: 'Protein', component: 'Gyro (Beef/Pork Mix)', portion: '4 oz', notes: 'Off grill or flattop' },
      { station: 'Sauce', component: 'Tzatziki', portion: '1 oz', notes: 'Spoon center' },
      { station: 'Cold', component: 'Pickled Red Onions', portion: '0.5 oz', notes: 'Adds acidity' },
      { station: 'Cold', component: 'Cucumber + Tomato Dice', portion: '1 oz', notes: 'Mediterranean topping' },
      { station: 'Garnish', component: 'Dill / Parsley', portion: 'pinch', notes: 'Light sprinkle' }
    ]
  },
  {
    key: 'shawarma_street',
    label: 'Shawarma Street Bowl — Toum + Mustard',
    icon: '🧄',
    protein: 'chicken',
    sauces: ['toum', 'mojo'],
    veg: ['slaw', 'onions', 'carrot', 'cuke', 'herb'],
    salsa: false,
    components: ['Jasmine rice', 'Slaw mix', 'Shawarma chicken', 'Toum garlic sauce', 'Mojo mustard', 'Pickled onions', 'Parsley / lemon'],
    steps: [
      { station: 'Base', component: 'Jasmine Rice', portion: '1 cup', notes: 'Base layer' },
      { station: 'Base', component: 'Slaw Mix', portion: '1 handful', notes: 'For crunch' },
      { station: 'Protein', component: 'Shawarma Chicken', portion: '4 oz', notes: 'Tossed in spice mix' },
      { station: 'Sauce', component: 'Toum (Garlic Sauce)', portion: '0.75 oz', notes: 'Squeeze center' },
      { station: 'Sauce', component: 'Mojo Mustard', portion: '0.75 oz', notes: 'Cross drizzle' },
      { station: 'Cold', component: 'Pickled Red Onions', portion: '0.5 oz', notes: 'Bright accent' },
      { station: 'Garnish', component: 'Parsley / Lemon wedge', portion: 'pinch', notes: 'Optional paprika dust' }
    ]
  },
  {
    key: 'bangkok_smoke',
    label: 'Bangkok Smoke Bowl — Peanut-Lime',
    icon: '🥜',
    protein: 'chicken',
    sauces: ['peanut'],
    veg: ['slaw', 'onions', 'carrot', 'cuke', 'herb'],
    salsa: false,
    components: ['Jasmine rice', 'Julienne cucumber', 'Julienne carrot', 'Grilled chicken', 'Thai peanut sauce', 'Lime crema', 'Pickled onions', 'Chopped peanuts', 'Cilantro'],
    steps: [
      { station: 'Base', component: 'Jasmine Rice', portion: '1 cup', notes: 'Scoop & spread' },
      { station: 'Base', component: 'Julienne Cucumber + Carrot', portion: '1.5 oz total', notes: 'Fresh prep' },
      { station: 'Protein', component: 'Grilled Chicken', portion: '4 oz', notes: 'Toss in warm peanut sauce optional' },
      { station: 'Sauce', component: 'Thai Peanut Sauce', portion: '1 oz', notes: 'Drizzle or ladle warm' },
      { station: 'Sauce', component: 'Lime Drizzle / Crema', portion: '0.5 oz', notes: 'Adds brightness' },
      { station: 'Cold', component: 'Pickled Red Onions', portion: '0.5 oz', notes: 'For acid and color' },
      { station: 'Garnish', component: 'Chopped Peanuts + Cilantro', portion: 'pinch', notes: 'Optional squeeze lime wedge' }
    ]
  },
  {
    key: 'cajun_buffalo',
    label: 'Cajun Buffalo Bowl — Buffalo + Crema',
    icon: '🌶️',
    protein: 'chicken',
    sauces: ['buffalo', 'crema'],
    veg: ['slaw', 'onions', 'carrot', 'cuke', 'herb', 'pcarrot', 'celery'],
    salsa: false,
    components: ['Jasmine rice', 'Slaw mix', 'Buffalo chicken', 'Buffalo sauce', 'Crema', 'Pickled carrots & celery', 'Pickled onions', 'Green onion / chives'],
    steps: [
      { station: 'Base', component: 'Jasmine Rice', portion: '1 cup', notes: 'Base layer' },
      { station: 'Base', component: 'Slaw Mix', portion: '1 handful', notes: 'Neutral layer under heat' },
      { station: 'Protein', component: 'Grilled Chicken', portion: '4 oz', notes: 'Tossed in buffalo sauce' },
      { station: 'Sauce', component: 'Buffalo Sauce', portion: '1 oz', notes: 'Warm squeeze bottle' },
      { station: 'Sauce', component: 'Crema', portion: '0.75 oz', notes: 'Balances heat' },
      { station: 'Cold', component: 'Pickled Carrots + Celery', portion: '1.5 oz', notes: 'Buffalo extras' },
      { station: 'Cold', component: 'Pickled Onions', portion: '0.5 oz', notes: 'Color accent' },
      { station: 'Garnish', component: 'Green Onion / Chives', portion: 'pinch', notes: 'Optional micro celery leaf' }
    ]
  }
];

const STORAGE_RECIPES_KEY = 'rb_recipes_v1';
let recipes = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_RECIPES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (_) {
    // ignore
  }
  return DEFAULT_RECIPES.slice();
})();
recipes = recipes.map(r => ({
  ...r,
  sauces: Array.isArray(r.sauces) ? r.sauces : [],
  veg: Array.isArray(r.veg) ? r.veg : [],
  components: Array.isArray(r.components) ? r.components : [],
  steps: Array.isArray(r.steps) ? r.steps : []
}));

const getRecipes = () => recipes;
const saveRecipes = () => {
  try {
    localStorage.setItem(STORAGE_RECIPES_KEY, JSON.stringify(recipes));
  } catch (_) {
    // storage may be unavailable (e.g., privacy mode)
  }
  if (typeof PrepBoard !== 'undefined' && PrepBoard && typeof PrepBoard.refresh === 'function') {
    PrepBoard.refresh();
  }
};
const findRecipe = key => getRecipes().find(r => r.key === key);
const slugify = str => (str || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')
  .slice(0, 60) || 'recipe';
const ensureUniqueKey = base => {
  let key = base;
  let i = 1;
  while (findRecipe(key)) key = `${base}_${i++}`;
  return key;
};
let activeRecipeKey = getRecipes()[0]?.key || null;
let editingRecipeKey = activeRecipeKey;
let editingIsNew = false;
let recipeManagerInitialized = false;

const parseCSV = text => {
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      if (row.some(cell => cell !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    if (row.some(cell => cell !== '')) rows.push(row);
  }
  return rows;
};

const parseNumber = value => {
  if (value == null) return null;
  const cleaned = String(value).replace(/[$,%]/g, '').trim();
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
};

const rowsToCSV = rows => {
  if (!Array.isArray(rows)) return '';
  return rows.map(row => row.map(cell => {
    const str = cell == null ? '' : String(cell);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  }).join(',')).join('\n');
};

const TIME_FILES = {
  time: encodeURI('Rice Co - Time Study.csv'),
  drinks: encodeURI('Rice Co - Drinks.csv'),
  equipment: encodeURI('Rice Co - Equipment.csv'),
  prices: encodeURI('Rice Co - Prices.csv'),
  sauces: encodeURI('Rice Co - Sauces.csv'),
  seasoning: encodeURI('Rice Co - Seasoning.csv')
};
const TIME_STATE_KEY = 'rb_time_checks_v1';

const loadTimeState = () => {
  try {
    const raw = localStorage.getItem(TIME_STATE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_) {
    return {};
  }
};

const saveTimeState = state => {
  try {
    localStorage.setItem(TIME_STATE_KEY, JSON.stringify(state));
  } catch (_) {
    // storage may be unavailable (e.g., privacy mode)
  }
};

const parseFrequencyMultiplier = freq => {
  if (!freq) return 1;
  const normalized = String(freq).trim().toLowerCase();
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*x\s*(?:per|\/)?\s*week/);
  if (match) return Number(match[1]);
  if (normalized.includes('daily')) return 7;
  if (normalized.includes('biweekly') || normalized.includes('every other week')) return 0.5;
  if (normalized.includes('monthly')) return 1 / 4;
  if (normalized.includes('as needed') || normalized.includes('as-needed')) return 0;
  return 1;
};

const formatHours = value => {
  const num = Math.max(0, Number(value) || 0);
  if (!num) return '0 hr';
  const rounded = Math.round(num * 100) / 100;
  const text = rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  return `${text} hr`;
};

const fetchCSV = async path => {
  try {
    const response = await fetch(path, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const rows = parseCSV(text);
    return Array.isArray(rows) ? rows : null;
  } catch (error) {
    console.warn(`Failed to load ${path}:`, error);
    return null;
  }
};

const parseTimeTasks = rows => {
  if (!rows || rows.length < 2) return [];
  const tasks = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const category = (row[0] || '').trim();
    if (!category || /totals?/i.test(category)) continue;
    const taskName = (row[2] || '').trim();
    if (!taskName) continue;
    const frequency = (row[3] || '').trim();
    const hands = parseNumber(row[4]) || 0;
    const elapsed = parseNumber(row[5]) || 0;
    const notes = row.slice(6).filter(Boolean).map(val => val.trim()).join(', ');
    const multiplier = parseFrequencyMultiplier(frequency);
    const weeklyHands = hands * multiplier;
    const weeklyElapsed = elapsed * multiplier;
    const stepRaw = row[1] || '';
    const stepOrder = parseNumber(stepRaw);
    tasks.push({
      id: `${category}::${stepRaw}::${taskName}`,
      category,
      step: stepRaw,
      orderValue: Number.isFinite(stepOrder) ? stepOrder : i,
      task: taskName,
      frequency,
      hands,
      elapsed,
      weeklyHands,
      weeklyElapsed,
      multiplier,
      notes
    });
  }
  return tasks;
};

const buildTimeCategories = tasks => {
  const order = [];
  const map = new Map();
  tasks.forEach(task => {
    let cat = map.get(task.category);
    if (!cat) {
      cat = { key: task.category, tasks: [], weeklyHands: 0, weeklyElapsed: 0 };
      map.set(task.category, cat);
      order.push(cat);
    }
    cat.tasks.push(task);
    cat.weeklyHands += task.weeklyHands;
    cat.weeklyElapsed += task.weeklyElapsed;
  });
  order.forEach(cat => {
    cat.tasks.sort((a, b) => {
      if (a.orderValue === b.orderValue) return a.task.localeCompare(b.task);
      return (a.orderValue || 0) - (b.orderValue || 0);
    });
  });
  const totals = order.reduce((acc, cat) => {
    acc.hands += cat.weeklyHands;
    acc.elapsed += cat.weeklyElapsed;
    return acc;
  }, { hands: 0, elapsed: 0 });
  return { categories: order, totals };
};

const parseDrinks = rows => {
  if (!rows || rows.length < 2) return [];
  return rows.slice(1).filter(row => row && row[1]).map(row => ({
    name: row[1],
    profile: row[2],
    ingredients: row[3],
    cost: row[4],
    unit: row[5],
    pairings: row[6]
  }));
};

const parseSauces = rows => {
  if (!rows || rows.length < 2) return [];
  return rows.slice(1).filter(row => row && row[1]).map(row => ({
    name: row[1],
    ingredients: row[2],
    profile: row[3],
    cost: row[4],
    unit: row[5],
    pairings: row[6]
  }));
};

const parseEquipment = rows => {
  if (!rows || rows.length < 2) return [];
  return rows.slice(1).filter(row => row && row[1]).map(row => ({
    category: row[0],
    name: row[1],
    notes: row[2]
  }));
};

const parseSeasoning = rows => {
  if (!rows || rows.length < 2) return [];
  return rows.slice(1).filter(row => row && row[0]).map(row => ({
    ingredient: row[0],
    amount: row[1]
  }));
};

const parsePrices = rows => {
  if (!rows || rows.length < 2) return [];
  return rows.slice(1).filter(row => row && row[1]).map(row => ({
    category: row[0],
    label: row[1],
    value: row[2],
    unit: row[3],
    source: row[4],
    notes: row[5]
  }));
};

const TimeBoard = (() => {
  let tasks = [];
  let categories = [];
  let totals = { hands: 0, elapsed: 0 };
  let refs = null;
  let state = loadTimeState();
  let handlersBound = false;

  const getSummaryEl = () => $('#timeSummary');
  const getChecklistEl = () => $('#timeChecklist');
  const getReferencesEl = () => $('#timeReferenceBody');

  const renderSummary = () => {
    const el = getSummaryEl();
    if (!el) return;
    if (!categories.length) {
      el.innerHTML = '<div class="muted">Awaiting time study data…</div>';
      return;
    }
    const completed = tasks.reduce((acc, task) => {
      if (!state[task.id]) return acc;
      acc.count += 1;
      acc.hands += task.weeklyHands || 0;
      acc.elapsed += task.weeklyElapsed || 0;
      return acc;
    }, { count: 0, hands: 0, elapsed: 0 });
    const pills = [
      `<div class="pill"><span>Hands-on logged</span><strong>${escapeHTML(formatHours(completed.hands))}</strong></div>`,
      `<div class="pill"><span>Unattended logged</span><strong>${escapeHTML(formatHours(completed.elapsed))}</strong></div>`,
      `<div class="pill"><span>Checklist complete</span><strong>${completed.count}/${tasks.length}</strong></div>`
    ];
    el.innerHTML = pills.join('');
  };

  const renderChecklist = () => {
    const el = getChecklistEl();
    if (!el) return;
    if (!categories.length) {
      el.innerHTML = '<div class="muted">No time study tasks found.</div>';
      return;
    }
    const makeTaskHtml = task => {
      const checked = state[task.id] ? ' checked' : '';
      const attrId = encodeURIComponent(task.id);
      const metaParts = [
        task.frequency ? `${task.frequency}` : null,
        task.weeklyHands ? `Hands-on: ${formatHours(task.weeklyHands)}/week` : null,
        task.weeklyElapsed ? `Unattended: ${formatHours(task.weeklyElapsed)}/week` : null
      ].filter(Boolean).map(part => escapeHTML(part)).join(' • ');
      const notes = task.notes ? `<div class="time-task-notes">${escapeHTML(task.notes)}</div>` : '';
      return `<li class="time-task">
        <label>
          <input type="checkbox" data-time-task="${attrId}"${checked}>
          <div>
            <div class="time-task-main">${escapeHTML(task.task)}</div>
            ${metaParts ? `<div class="time-task-meta">${metaParts}</div>` : ''}
          </div>
        </label>
        ${notes}
      </li>`;
    };
    const html = categories.map(cat => {
      const meta = [
        cat.weeklyHands ? `Hands-on: ${formatHours(cat.weeklyHands)}/week` : null,
        cat.weeklyElapsed ? `Unattended: ${formatHours(cat.weeklyElapsed)}/week` : null
      ].filter(Boolean).map(part => escapeHTML(part)).join(' • ');
      const tasksHtml = cat.tasks.map(makeTaskHtml).join('');
      return `<div class="time-category">
        <div>
          <div class="time-category-title">${escapeHTML(cat.key)}</div>
          ${meta ? `<div class="time-category-meta">${meta}</div>` : ''}
        </div>
        <ul class="time-tasks">${tasksHtml}</ul>
      </div>`;
    }).join('');
    el.innerHTML = html;
  };

  const renderReferences = () => {
    const el = getReferencesEl();
    if (!el) return;
    if (!refs) {
      el.innerHTML = '<div class="muted">Reference sheets unavailable.</div>';
      return;
    }
    const sections = [];

    if (refs.drinks && refs.drinks.length) {
      const items = refs.drinks.slice(0, 4).map(item => {
        const metaParts = [
          item.profile ? `Profile: ${item.profile}` : null,
          item.pairings ? `Pairs: ${item.pairings}` : null,
          item.cost ? `Cost: ${item.cost}${item.unit ? ` ${item.unit}` : ''}` : null
        ].filter(Boolean).map(escapeHTML).join(' • ');
        const ingredients = item.ingredients ? `<small>${escapeHTML(item.ingredients)}</small>` : '';
        return `<li><strong>${escapeHTML(item.name)}</strong>${metaParts ? `<small>${metaParts}</small>` : ''}${ingredients}</li>`;
      }).join('');
      sections.push(`<div class="time-ref-card"><h4>Drinks Batching</h4><ul>${items}</ul></div>`);
    }

    if (refs.sauces && refs.sauces.length) {
      const items = refs.sauces.slice(0, 4).map(item => {
        const metaParts = [
          item.profile ? `Profile: ${item.profile}` : null,
          item.cost ? `Cost: ${item.cost}${item.unit ? ` ${item.unit}` : ''}` : null,
          item.pairings ? `Pairs: ${item.pairings}` : null
        ].filter(Boolean).map(escapeHTML).join(' • ');
        const ingredients = item.ingredients ? `<small>${escapeHTML(item.ingredients)}</small>` : '';
        return `<li><strong>${escapeHTML(item.name)}</strong>${metaParts ? `<small>${metaParts}</small>` : ''}${ingredients}</li>`;
      }).join('');
      sections.push(`<div class="time-ref-card"><h4>Sauce Prep</h4><ul>${items}</ul></div>`);
    }

    if (refs.equipment && refs.equipment.length) {
      const items = refs.equipment.slice(0, 6).map(item => {
        const meta = [item.category, item.notes].filter(Boolean).map(escapeHTML).join(' • ');
        return `<li><strong>${escapeHTML(item.name)}</strong>${meta ? `<small>${meta}</small>` : ''}</li>`;
      }).join('');
      sections.push(`<div class="time-ref-card"><h4>Equipment &amp; Tools</h4><ul>${items}</ul></div>`);
    }

    if (refs.seasoning && refs.seasoning.length) {
      const items = refs.seasoning.map(item => `<li><strong>${escapeHTML(item.ingredient)}</strong><small>${escapeHTML(item.amount || '')}</small></li>`).join('');
      sections.push(`<div class="time-ref-card"><h4>House Seasoning</h4><ul>${items}</ul></div>`);
    }

    if (refs.prices && refs.prices.length) {
      const filtered = refs.prices.filter(item => ['Menu Pricing', 'Proteins', 'Staples'].includes(item.category)).slice(0, 6);
      if (filtered.length) {
        const items = filtered.map(item => {
          const metaParts = [
            item.value ? `Default: ${item.value}${item.unit ? ` ${item.unit}` : ''}` : null,
            item.notes ? item.notes : null
          ].filter(Boolean).map(escapeHTML).join(' • ');
          return `<li><strong>${escapeHTML(item.label)}</strong>${metaParts ? `<small>${metaParts}</small>` : ''}</li>`;
        }).join('');
        sections.push(`<div class="time-ref-card"><h4>Cost Cues</h4><ul>${items}</ul></div>`);
      }
    }

    el.innerHTML = sections.length ? sections.join('') : '<div class="muted">Reference sheets unavailable.</div>';
  };

  const bindHandlers = () => {
    if (handlersBound) return;
    handlersBound = true;
    const checklist = getChecklistEl();
    if (checklist) {
      checklist.addEventListener('change', evt => {
        const target = evt.target;
        if (!target || !target.matches('[data-time-task]')) return;
        const rawId = target.getAttribute('data-time-task');
        const id = rawId ? decodeURIComponent(rawId) : null;
        if (!id) return;
        if (target.checked) {
          state[id] = true;
        } else {
          delete state[id];
        }
        saveTimeState(state);
        renderSummary();
      });
    }
    const resetBtn = $('#timeResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state = {};
        saveTimeState(state);
        const el = getChecklistEl();
        if (el) {
          el.querySelectorAll('input[data-time-task]').forEach(input => {
            input.checked = false;
          });
        }
        renderSummary();
      });
    }
  };

  const loadData = async () => {
    const summaryEl = getSummaryEl();
    if (!summaryEl) return;
    const [timeRows, drinkRows, equipmentRows, priceRows, sauceRows, seasoningRows] = await Promise.all([
      fetchCSV(TIME_FILES.time),
      fetchCSV(TIME_FILES.drinks),
      fetchCSV(TIME_FILES.equipment),
      fetchCSV(TIME_FILES.prices),
      fetchCSV(TIME_FILES.sauces),
      fetchCSV(TIME_FILES.seasoning)
    ]);
    if (!timeRows) {
      summaryEl.innerHTML = '<div class="muted">Time study sheet not found.</div>';
      return;
    }
    tasks = parseTimeTasks(timeRows);
    const built = buildTimeCategories(tasks);
    categories = built.categories;
    totals = built.totals;
    refs = {
      drinks: parseDrinks(drinkRows),
      equipment: parseEquipment(equipmentRows),
      prices: parsePrices(priceRows),
      sauces: parseSauces(sauceRows),
      seasoning: parseSeasoning(seasoningRows)
    };
    renderChecklist();
    renderSummary();
    renderReferences();
  };

  const init = () => {
    if (!getSummaryEl()) return;
    bindHandlers();
    loadData();
  };

  return { init };
})();

const PrepBoard = (() => {
  const getSummaryEl = () => $('#prepSummary');
  const getSauceListEl = () => $('#prepSauceList');
  const getRecipeListEl = () => $('#prepRecipeList');
  const getSalsaListEl = () => $('#prepSalsaList');
  const getMeatListEl = () => $('#prepMeatList');
  const getPickleListEl = () => $('#prepPickleList');

  let sauces = [];
  let recipes = [];
  let salsaTasks = [];
  let meatTasks = [];
  let pickleTasks = [];

  const splitIngredients = text => {
    if (!text) return [];
    const trimmed = text.trim();
    if (!trimmed) return [];
    if (/store\s*bought/i.test(trimmed)) return [trimmed];
    const parts = trimmed.split(/\),\s*/).map(part => {
      if (!part) return null;
      return part.endsWith(')') ? part : `${part})`;
    }).filter(Boolean);
    return parts.length ? parts : [trimmed];
  };

  const ensureDollar = value => {
    if (!value) return '';
    const str = String(value).trim();
    if (!str) return '';
    if (/^\$/.test(str) || /free/i.test(str)) return str;
    if (Number.isFinite(Number(str))) return `$${str}`;
    return str;
  };

  const renderSummary = () => {
    const el = getSummaryEl();
    if (!el) return;
    if (!sauces.length && !recipes.length && !salsaTasks.length && !meatTasks.length && !pickleTasks.length) {
      el.textContent = 'Prep data not available.';
      return;
    }
    const parts = [];
    if (recipes.length) parts.push(`${recipes.length} bowl builds`);
    if (sauces.length) parts.push(`${sauces.length} sauce batches`);
    if (salsaTasks.length) parts.push('corn salsa workflow');
    if (meatTasks.length) parts.push('meat production timeline');
    if (pickleTasks.length) parts.push('pickled onion checklist');
    el.textContent = `Loaded ${parts.join(' + ')}. Measurements stay in grams for precise scaling.`;
  };

  const renderSauces = () => {
    const listEl = getSauceListEl();
    if (!listEl) return;
    if (!sauces.length) {
      listEl.innerHTML = '<div class="muted">No sauce recipes found.</div>';
      return;
    }
    const cards = sauces.map(item => {
      const ingredients = splitIngredients(item.ingredients);
      const ingredientList = ingredients.map(entry => `<li>${escapeHTML(entry)}</li>`).join('');
      const metaLines = [];
      if (item.profile) metaLines.push(`Flavor: ${item.profile}`);
      if (item.cost || item.unit) {
        const costLine = [ensureDollar(item.cost), item.unit].filter(Boolean).join(' ');
        if (costLine) metaLines.push(`Est. Cost: ${costLine}`);
      }
      const metaBlock = metaLines.length ? `<div class="prep-meta">${metaLines.map(line => `<span>${escapeHTML(line)}</span>`).join('')}</div>` : '';
      const pairings = item.pairings ? item.pairings.split(/,\s*/).filter(Boolean) : [];
      const tags = pairings.length ? `<div class="prep-tags">${pairings.map(name => `<span class="prep-tag">${escapeHTML(name)}</span>`).join('')}</div>` : '';
      return `<article class="prep-card">
        <h4>${escapeHTML(item.name || 'Sauce')}</h4>
        ${metaBlock}
        ${ingredients.length ? `<ul class="prep-ingredients">${ingredientList}</ul>` : ''}
        ${tags}
      </article>`;
    }).join('');
    listEl.innerHTML = cards;
  };

  const formatTaskMeta = task => {
    const parts = [];
    if (task.frequency) parts.push(task.frequency);
    if (task.weeklyHands) parts.push(`Hands-on ${formatHours(task.weeklyHands)} / wk`);
    if (task.weeklyElapsed) parts.push(`Unattended ${formatHours(task.weeklyElapsed)} / wk`);
    return parts.map(escapeHTML).join(' • ');
  };

  const renderTaskCards = (listEl, title, tasks, extraMeta = []) => {
    if (!listEl) return;
    if (!tasks.length) {
      listEl.innerHTML = '<div class="muted">No tasks found.</div>';
      return;
    }
    const metaBlock = extraMeta.length ? `<div class="prep-meta">${extraMeta.map(line => `<span>${escapeHTML(line)}</span>`).join('')}</div>` : '';
    const items = tasks.map((task, idx) => {
      const stepLabel = task.step ? `Step ${task.step}` : `Step ${idx + 1}`;
      const meta = formatTaskMeta(task);
      const notes = task.notes ? `<small>${escapeHTML(task.notes)}</small>` : '';
      return `<li><strong>${escapeHTML(stepLabel)}: ${escapeHTML(task.task)}</strong>${meta ? `<span>${meta}</span>` : ''}${notes}</li>`;
    }).join('');
    listEl.innerHTML = `<article class="prep-card prep-card--task">
      <h4>${escapeHTML(title)}</h4>
      ${metaBlock}
      <ul class="prep-steps">${items}</ul>
    </article>`;
  };

  const renderSalsa = () => {
    const listEl = getSalsaListEl();
    const meta = SALSA_RECIPE ? [
      `${fmt(SALSA_RECIPE.yieldCups, 2)} cups yield`,
      `${SALSA_RECIPE.cornCans} cans corn`,
      `${SALSA_RECIPE.peppers} peppers`,
      `${SALSA_RECIPE.romaTomatoes} roma tomatoes`,
      `${fmt(SALSA_RECIPE.redOnions, 2)} lb red onion`,
      `${SALSA_RECIPE.cilantro} bunch cilantro`
    ] : [];
    renderTaskCards(listEl, 'Corn Salsa Batch Flow', salsaTasks, meta.filter(Boolean));
  };

  const renderMeat = () => {
    const listEl = getMeatListEl();
    renderTaskCards(listEl, 'Sous-Vide Meat Production', meatTasks);
  };

  const renderPickle = () => {
    const listEl = getPickleListEl();
    renderTaskCards(listEl, 'Pickled Red Onions & Garnish', pickleTasks);
  };

  const renderRecipes = () => {
    const listEl = getRecipeListEl();
    if (!listEl) return;
    if (!recipes.length) {
      listEl.innerHTML = '<div class="muted">No recipes saved yet.</div>';
      return;
    }
    const cards = recipes.map(recipe => {
      const saucesList = (recipe.sauces || []).map(key => SAUCE_LABELS[key] || key);
      const vegList = (recipe.veg || []).map(key => COMPONENT_LABELS[key] || key);
      const components = getRecipeComponents(recipe);
      const steps = Array.isArray(recipe.steps) ? recipe.steps : [];
      const tags = [];
      if (recipe.protein) tags.push(recipe.protein);
      if (recipe.salsa) tags.push('Corn salsa');
      const titleIcon = recipe.icon ? `<span class="icon">${escapeHTML(recipe.icon)}</span>` : '';
      const saucesBlock = saucesList.length ? `<div class="prep-pill-group">${saucesList.map(name => `<span class="prep-pill">${escapeHTML(name)}</span>`).join('')}</div>` : '';
      const vegBlock = vegList.length ? `<div class="prep-pill-group">${vegList.map(name => `<span class="prep-pill">${escapeHTML(name)}</span>`).join('')}</div>` : '';
      const componentsBlock = components.length ? `<div><strong class="muted">Components</strong><ul class="prep-components">${components.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul></div>` : '';
      const stepsBlock = steps.length ? `<div><strong class="muted">Line build steps</strong><ul class="prep-steps">${steps.map(step => {
        const station = step.station ? `<strong>${escapeHTML(step.station)}</strong>` : '';
        const detail = [step.component, step.portion, step.notes].filter(Boolean).map(escapeHTML).join(' • ');
        return `<li>${station}${detail ? `<span>${station ? ' ' : ''}${detail}</span>` : ''}</li>`;
      }).join('')}</ul></div>` : '';
      const tagBlock = tags.length ? `<div class="prep-tags">${tags.map(tag => `<span class="prep-tag">${escapeHTML(tag)}</span>`).join('')}</div>` : '';
      return `<article class="prep-card prep-card--recipe">
        <div class="prep-title-row">
          ${titleIcon}
          <div class="title">
            <h4>${escapeHTML(recipe.label || 'Recipe')}</h4>
            <small>${escapeHTML(recipe.key || '')}</small>
          </div>
        </div>
        ${tagBlock}
        ${saucesBlock}
        ${vegBlock}
        ${componentsBlock}
        ${stepsBlock}
      </article>`;
    }).join('');
    listEl.innerHTML = cards;
  };

  const renderAll = () => {
    renderSummary();
    renderRecipes();
    renderSauces();
    renderSalsa();
    renderMeat();
    renderPickle();
  };

  const loadSauces = async () => {
    const rows = await fetchCSV(TIME_FILES.sauces);
    sauces = rows ? parseSauces(rows) : [];
    renderAll();
  };

  const loadRecipes = () => {
    recipes = getRecipes ? getRecipes().map(r => ({ ...r })) : [];
    renderAll();
  };

  const loadTimeStudy = async () => {
    const rows = await fetchCSV(TIME_FILES.time);
    const tasks = rows ? parseTimeTasks(rows) : [];
    const sorted = tasks.slice().sort((a, b) => (a.orderValue || 0) - (b.orderValue || 0));
    meatTasks = sorted.filter(task => task.category === 'Meat');
    salsaTasks = sorted.filter(task => /corn\s+salsa/i.test(task.task));
    pickleTasks = sorted.filter(task => /onion/i.test(task.task) && /pickle/i.test(task.task));
    renderAll();
  };

  const init = () => {
    if (!getSummaryEl()) return;
    loadRecipes();
    loadSauces();
    loadTimeStudy();
  };

  return {
    init,
    refresh: () => loadRecipes()
  };
})();

const updateRowsFromInputs = rows => {
  if (!Array.isArray(rows)) return rows;
  const updated = rows.map(r => r.slice());
  const index = new Map();
  for (let i = 1; i < updated.length; i++) {
    const label = updated[i][1];
    if (label) index.set(label.trim(), i);
  }

  Object.entries(CSV_FIELD_MAP).forEach(([label, ids]) => {
    if (!index.has(label)) return;
    const rowIdx = index.get(label);
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      const raw = el.value;
      if (raw === '' || raw == null) continue;
      if (el.type === 'number') {
        const num = Number(raw);
        updated[rowIdx][2] = Number.isFinite(num) ? num : raw;
      } else {
        updated[rowIdx][2] = raw;
      }
      break;
    }
  });
  return updated;
};

const getRecipeComponents = recipe => {
  if (!recipe) return [];
  if (Array.isArray(recipe.components) && recipe.components.length) return recipe.components.slice();
  const components = new Set();
  components.add(COMPONENT_LABELS.rice);
  if (recipe.protein) components.add(PROTEIN_LABELS[recipe.protein] || recipe.protein);
  (recipe.veg || []).forEach(v => {
    const label = COMPONENT_LABELS[v];
    if (label) components.add(label);
  });
  if (recipe.salsa) components.add(COMPONENT_LABELS.salsa);
  (recipe.sauces || []).forEach(s => {
    const label = SAUCE_LABELS[s] || s;
    components.add(label);
  });
  return Array.from(components);
};

const applyPriceDefaults = rows => {
  const byLabel = new Map();
  rows.slice(1).forEach(cells => {
    const label = cells[1];
    const value = cells[2];
    if (label) byLabel.set(label.trim(), value);
  });

  let applied = false;
  Object.entries(CSV_FIELD_MAP).forEach(([label, ids]) => {
    if (!byLabel.has(label)) return;
    const rawValue = byLabel.get(label);
    const num = parseNumber(rawValue);
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (num != null) {
        el.value = el.type === 'number' ? num : num.toString();
        applied = true;
      }
    });
  });
  return applied;
};

const loadDefaultsFromCSV = async () => {
  try {
    const response = await fetch(PRICE_SHEET, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const rows = parseCSV(text);
    if (!rows || rows.length < 2) return false;
    priceSheetRows = rows.map(r => r.slice());
    return applyPriceDefaults(rows);
  } catch (error) {
    console.warn('Price sheet load failed:', error);
    return false;
  }
};

const recipeEls = {};

const ensureActiveRecipe = () => {
  if (!activeRecipeKey || !findRecipe(activeRecipeKey)) {
    activeRecipeKey = getRecipes()[0]?.key || null;
  }
  editingRecipeKey = activeRecipeKey;
  editingIsNew = false;
};

const renderRecipeSidebar = (filter = '') => {
  const nav = recipeEls.nav;
  if (!nav) return;
  const term = filter.trim().toLowerCase();
  const list = getRecipes().filter(r => !term || r.label.toLowerCase().includes(term) || (r.protein || '').includes(term));
  if (list.length === 0) {
    nav.innerHTML = '<div class="recipe-nav-empty">No recipes match.</div>';
    return;
  }
  nav.innerHTML = list.map(r => {
    const active = r.key === activeRecipeKey ? ' active' : '';
    const proteinLabel = r.protein ? (PROTEIN_LABELS[r.protein] || r.protein) : 'No protein';
    const saucesLabel = r.sauces && r.sauces.length ? `${r.sauces.length} sauce${r.sauces.length>1?'s':''}` : 'No sauces';
    return `<button type="button" class="recipe-nav-item${active}" data-key="${r.key}">
      <span class="recipe-nav-icon">${r.icon || '🍚'}</span>
      <span class="recipe-nav-info">
        <span class="recipe-nav-title">${r.label}</span>
        <span class="recipe-nav-sub">${proteinLabel} • ${saucesLabel}</span>
      </span>
    </button>`;
  }).join('');
};

const highlightActiveRecipe = () => {
  const nav = recipeEls.nav;
  if (!nav) return;
  nav.querySelectorAll('.recipe-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.key === activeRecipeKey);
  });
};

const renderOptionChips = () => {
  if (recipeEls.saucesWrap) {
    recipeEls.saucesWrap.innerHTML = Object.entries(SAUCE_LABELS).map(([key, label]) => (
      `<label class="chip checkbox">
        <input type="checkbox" value="${key}">
        <span>${label}</span>
      </label>`
    )).join('');
  }
  if (recipeEls.vegWrap) {
    recipeEls.vegWrap.innerHTML = Object.keys(VEG_PER_KEY).map(key => (
      `<label class="chip checkbox">
        <input type="checkbox" value="${key}">
        <span>${COMPONENT_LABELS[key]}</span>
      </label>`
    )).join('');
  }
};

const clearRecipeForm = () => {
  if (!recipeEls.form) return;
  recipeEls.icon.value = '';
  recipeEls.name.value = '';
  recipeEls.key.value = 'auto-generated';
  recipeEls.protein.value = '';
  recipeEls.salsa.checked = false;
  recipeEls.components.value = '';
  recipeEls.saucesWrap?.querySelectorAll('input[type=checkbox]').forEach(cb => { cb.checked = false; });
  recipeEls.vegWrap?.querySelectorAll('input[type=checkbox]').forEach(cb => { cb.checked = false; });
  renderStepRows([]);
  updateRecipePreview(null);
};

const setFormFromRecipe = recipe => {
  if (!recipe || !recipeEls.form) return;
  recipeEls.icon.value = recipe.icon || '';
  recipeEls.name.value = recipe.label || '';
  recipeEls.key.value = recipe.key;
  recipeEls.protein.value = recipe.protein || '';
  recipeEls.salsa.checked = !!recipe.salsa;
  recipeEls.components.value = (recipe.components || []).join(', ');
  recipeEls.saucesWrap?.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.checked = Array.isArray(recipe.sauces) ? recipe.sauces.includes(cb.value) : false;
  });
  recipeEls.vegWrap?.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.checked = Array.isArray(recipe.veg) ? recipe.veg.includes(cb.value) : false;
  });
  renderStepRows(recipe.steps || []);
  updateRecipePreview(recipe);
};

const renderStepRows = steps => {
  if (!recipeEls.stepsWrap) return;
  recipeEls.stepsWrap.innerHTML = '';
  (steps && steps.length ? steps : [{}]).forEach(step => addStepRow(step));
  refreshStepNumbers();
};

const refreshStepNumbers = () => {
  if (!recipeEls.stepsWrap) return;
  recipeEls.stepsWrap.querySelectorAll('.step-row').forEach((row, idx) => {
    const num = row.querySelector('.step-num');
    if (num) num.textContent = idx + 1;
  });
};

const addStepRow = (step = {}) => {
  if (!recipeEls.stepsWrap) return;
  const row = document.createElement('div');
  row.className = 'step-row';
  row.innerHTML = `
    <span class="step-num"></span>
    <input type="text" class="step-input step-station" placeholder="Station" value="${step.station ?? ''}">
    <input type="text" class="step-input step-component" placeholder="Component" value="${step.component ?? ''}">
    <input type="text" class="step-input step-portion" placeholder="Portion" value="${step.portion ?? ''}">
    <input type="text" class="step-input step-notes" placeholder="Notes" value="${step.notes ?? ''}">
    <button type="button" class="secondary small step-remove">Remove</button>
  `;
  row.querySelector('.step-remove').addEventListener('click', () => {
    row.remove();
    if (!recipeEls.stepsWrap.querySelector('.step-row')) addStepRow({});
    refreshStepNumbers();
  });
  recipeEls.stepsWrap.appendChild(row);
  refreshStepNumbers();
};

const collectRecipeForm = (strict = true) => {
  if (!recipeEls.form) return null;
  const label = recipeEls.name.value.trim();
  if (strict && !label) {
    window.alert('Name your recipe first.');
    recipeEls.name.focus();
    return null;
  }
  const safeLabel = label || 'Untitled Recipe';
  const icon = recipeEls.icon.value.trim();
  const protein = recipeEls.protein.value || '';
  const salsa = recipeEls.salsa.checked;
  const sauceInputs = recipeEls.saucesWrap ? recipeEls.saucesWrap.querySelectorAll('input[type=checkbox]:checked') : [];
  const vegInputs = recipeEls.vegWrap ? recipeEls.vegWrap.querySelectorAll('input[type=checkbox]:checked') : [];
  const sauces = Array.from(sauceInputs).map(cb => cb.value);
  const veg = Array.from(vegInputs).map(cb => cb.value);
  const components = (recipeEls.components?.value || '').split(/[,\\n]/).map(s => s.trim()).filter(Boolean);
  const stepRows = recipeEls.stepsWrap ? Array.from(recipeEls.stepsWrap.querySelectorAll('.step-row')) : [];
  const steps = stepRows.map((row, idx) => {
    const station = row.querySelector('.step-station').value.trim();
    const component = row.querySelector('.step-component').value.trim();
    const portion = row.querySelector('.step-portion').value.trim();
    const notes = row.querySelector('.step-notes').value.trim();
    if (!station && !component && !portion && !notes) return null;
    return { step: idx + 1, station, component, portion, notes };
  }).filter(Boolean);
  return { label: safeLabel, icon, protein, salsa, sauces, veg, components, steps };
};

const updateRecipePreview = recipe => {
  if (!recipeEls.preview) return;
  if (!recipe) {
    recipeEls.preview.innerHTML = '<div class="recipe-preview-empty">Details will appear here once you save.</div>';
    return;
  }
  const comps = getRecipeComponents(recipe);
  const metaBits = [
    recipe.protein ? `Protein: ${PROTEIN_LABELS[recipe.protein] || recipe.protein}` : null,
    recipe.sauces?.length ? `Sauces: ${recipe.sauces.map(s => SAUCE_LABELS[s] || s).join(', ')}` : null,
    recipe.salsa ? 'Includes corn salsa' : null
  ].filter(Boolean);
  const steps = recipe.steps || [];
  recipeEls.preview.innerHTML = `
    <div class="recipe-card">
      <h4><span class="recipe-icon">${recipe.icon || '🍚'}</span>${recipe.label}</h4>
      <div class="recipe-meta">${metaBits.map(m => `<span>${m}</span>`).join('') || '<span>Standard rice bowl base</span>'}</div>
      <div class="recipe-components">${comps.map(c => `<span>${c}</span>`).join('') || '<span>No components listed</span>'}</div>
      ${steps.length ? `<div class="recipe-steps">
        <table class="steps-table">
          <thead><tr><th>Step</th><th>Station</th><th>Component</th><th>Portion</th><th>Notes</th></tr></thead>
          <tbody>
            ${steps.map((s, idx) => `<tr>
              <td>${s.step ?? idx + 1}</td>
              <td>${s.station ?? ''}</td>
              <td>${s.component ?? ''}</td>
              <td>${s.portion ?? ''}</td>
              <td>${s.notes ?? ''}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>` : ''}
    </div>
  `;
};

const loadRecipeIntoForm = key => {
  const recipe = findRecipe(key);
  if (!recipe) {
    ensureActiveRecipe();
    clearRecipeForm();
    return;
  }
  activeRecipeKey = recipe.key;
  editingRecipeKey = recipe.key;
  editingIsNew = false;
  highlightActiveRecipe();
  setFormFromRecipe(recipe);
};

const handleRecipeSave = evt => {
  evt.preventDefault();
  const formData = collectRecipeForm();
  if (!formData) return;
  let key = editingRecipeKey;
  if (editingIsNew || !key) {
    const base = ensureUniqueKey(slugify(formData.label));
    key = base;
    recipes = [...getRecipes(), { key, ...formData }];
  } else {
    recipes = getRecipes().map(r => (r.key === key ? { ...r, ...formData, key } : r));
  }
  saveRecipes();
  activeRecipeKey = key;
  editingRecipeKey = key;
  editingIsNew = false;
  renderRecipeSidebar(recipeEls.search?.value || '');
  highlightActiveRecipe();
  loadRecipeIntoForm(key);
  MB.syncRecipes();
  const select = $('#menuSelect');
  if (select && findRecipe(key)) select.value = key;
};

const handleRecipeDelete = () => {
  if (editingIsNew || !editingRecipeKey) {
    clearRecipeForm();
    editingIsNew = true;
    return;
  }
  const recipe = findRecipe(editingRecipeKey);
  if (!recipe) return;
  if (!window.confirm(`Delete "${recipe.label}"? This removes it from tonight's list.`)) return;
  recipes = getRecipes().filter(r => r.key !== recipe.key);
  saveRecipes();
  MB.removeItemsByRecipeKey(recipe.key);
  if (!recipes.length) {
    activeRecipeKey = null;
    editingRecipeKey = null;
    editingIsNew = true;
  renderRecipeSidebar(recipeEls.search?.value || '');
  highlightActiveRecipe();
  handleRecipeAdd();
  MB.syncRecipes();
  const select = $('#menuSelect');
  if (select) select.value = '';
  return;
}
ensureActiveRecipe();
renderRecipeSidebar(recipeEls.search?.value || '');
highlightActiveRecipe();
loadRecipeIntoForm(activeRecipeKey);
MB.syncRecipes();
const select = $('#menuSelect');
if (select && activeRecipeKey) select.value = activeRecipeKey;
};

const handleRecipeAdd = () => {
  editingIsNew = true;
  editingRecipeKey = null;
  activeRecipeKey = null;
  highlightActiveRecipe();
  clearRecipeForm();
  if (recipeEls.name) recipeEls.name.focus();
};

const initRecipeManager = () => {
  if (recipeManagerInitialized) {
    ensureActiveRecipe();
    renderRecipeSidebar(recipeEls.search?.value || '');
    highlightActiveRecipe();
    loadRecipeIntoForm(activeRecipeKey);
    return;
  }
  recipeManagerInitialized = true;
  recipeEls.nav = $('#recipeNav');
  recipeEls.search = $('#recipeSearch');
  recipeEls.addBtn = $('#recipeAddBtn');
  recipeEls.form = $('#recipeForm');
  recipeEls.icon = $('#recipeIcon');
  recipeEls.name = $('#recipeName');
  recipeEls.key = $('#recipeKey');
  recipeEls.protein = $('#recipeProtein');
  recipeEls.salsa = $('#recipeSalsa');
  recipeEls.saucesWrap = $('#recipeSauces');
  recipeEls.vegWrap = $('#recipeVeg');
  recipeEls.components = $('#recipeComponents');
  recipeEls.stepsWrap = $('#recipeSteps');
  recipeEls.stepAddBtn = $('#recipeStepAdd');
  recipeEls.deleteBtn = $('#recipeDeleteBtn');
  recipeEls.preview = $('#recipePreview');

  renderOptionChips();

  if (recipeEls.stepAddBtn) recipeEls.stepAddBtn.addEventListener('click', () => addStepRow({}));
  if (recipeEls.addBtn) recipeEls.addBtn.addEventListener('click', handleRecipeAdd);
  if (recipeEls.deleteBtn) recipeEls.deleteBtn.addEventListener('click', handleRecipeDelete);
  if (recipeEls.form) {
    recipeEls.form.addEventListener('submit', handleRecipeSave);
    const previewUpdater = () => {
      const draft = collectRecipeForm(false);
      if (!draft) {
        updateRecipePreview(null);
        return;
      }
      const hasContent = recipeEls.name.value.trim().length > 0 ||
        draft.sauces.length > 0 ||
        draft.veg.length > 0 ||
        draft.components.length > 0 ||
        draft.steps.length > 0 ||
        draft.protein ||
        draft.salsa;
      if (!hasContent) {
        updateRecipePreview(null);
        return;
      }
      updateRecipePreview({ key: editingRecipeKey || 'draft', ...draft });
    };
    recipeEls.form.addEventListener('input', previewUpdater);
    recipeEls.form.addEventListener('change', previewUpdater);
  }
  if (recipeEls.search) recipeEls.search.addEventListener('input', () => {
    renderRecipeSidebar(recipeEls.search.value);
    highlightActiveRecipe();
  });
  if (recipeEls.nav) {
    recipeEls.nav.addEventListener('click', evt => {
      const btn = evt.target.closest('.recipe-nav-item');
      if (!btn) return;
      activeRecipeKey = btn.dataset.key;
      editingRecipeKey = activeRecipeKey;
      editingIsNew = false;
      highlightActiveRecipe();
      loadRecipeIntoForm(activeRecipeKey);
    });
  }

  ensureActiveRecipe();
  renderRecipeSidebar();
  highlightActiveRecipe();
  loadRecipeIntoForm(activeRecipeKey);
};

const toggleModal = (id, show) => {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.toggle('show', show);
  modal.setAttribute('aria-hidden', show ? 'false' : 'true');
};

const toggleSideNav = show => {
  const nav = document.getElementById('sideNav');
  const hamburger = document.getElementById('navToggle');
  if (!nav || !hamburger) return;
  const next = typeof show === 'boolean' ? show : !nav.classList.contains('show');
  nav.classList.toggle('show', next);
  hamburger.classList.toggle('active', next);
};

/* ---------- tabs ---------- */
const setActiveTab = key => {
  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === key);
  });
  document.querySelectorAll('.tab').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${key}`);
  });
};

document.querySelectorAll('.nav-link[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    setActiveTab(btn.dataset.tab);
    toggleSideNav(false);
  });
});

/* ---------- MENU BUILDER (MB namespace) ---------- */
const MB = (() => {
  const qt = oz => oz / 32;
  const gal = oz => oz / 128;
  const FL_OZ_PER_CUP = 8;
  const ROMA_PER_LB = 7.5;
  const ONIONS_PER_LB = 1.5;
  const PB_LB_PER_CUP = 0.59;

  const LS_KEY = 'rb_menu_v11_items';
  let items = [];

  const renderSelect = () => {
    const select = $('#menuSelect');
    if (!select) return;
    const list = getRecipes();
    const previous = select.value;
    if (!list.length) {
      select.innerHTML = '<option value="">No recipes available</option>';
      select.disabled = true;
      return;
    }
    select.disabled = false;
    select.innerHTML = list.map(entry => `<option value="${entry.key}">${entry.label}</option>`).join('');
    if (!list.some(entry => entry.key === previous)) {
      select.value = list[0].key;
    }
  };

  const save = () => localStorage.setItem(LS_KEY, JSON.stringify(items));
  const load = () => {
    try {
      items = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    } catch (_) {
      items = [];
    }
  };

  const setExportBadge = ok => {
    const badge = $('#exportStatus');
    if (!badge) return;
    if (ok) {
      badge.textContent = 'Exported to Planner';
      badge.style.color = '#5af2b5';
      badge.style.borderColor = '#5af2b5';
    } else {
      badge.textContent = 'Not exported yet';
      badge.style.color = '';
      badge.style.borderColor = '';
    }
  };

  const renderItems = () => {
    const rows = [['Menu Item', 'Components', 'Qty', 'Actions']].concat(items.map(item => {
      const data = findRecipe(item.key);
      const label = data ? data.label : item.key;
      const components = data ? getRecipeComponents(data) : [];
      const compHTML = components.length ? components.map(c => `<span class="badge">${c}</span>`).join(' ') : '—';
      return [
        label,
        compHTML,
        `<input type="number" value="${item.qty}" min="0" style="width:90px" oninput="MB.updateQty('${item.id}', this.value)">`,
        `<button class="secondary" type="button" onclick="MB.removeItem('${item.id}')">Remove</button>`
      ];
    }));
    $('#itemsTable').innerHTML = toTable(rows);
  };

  const addItem = () => {
    const select = $('#menuSelect');
    const list = getRecipes();
    if (!select || !list.length) {
      window.alert('Add at least one recipe before planning.');
      return;
    }
    const key = select.value || list[0].key;
    const qty = Math.max(1, parseInt($('#menuQty').value || '0', 10));
    const entry = { id: Date.now() + '_' + Math.random().toString(16).slice(2), key, qty };
    items.push(entry);
    save();
    renderItems();
    calcMenu();
  };

  const clearItems = () => {
    if (!window.confirm('Clear all items?')) return;
    items = [];
    save();
    renderItems();
    calcMenu();
  };

  const updateQty = (id, val) => {
    const item = items.find(x => x.id === id);
    if (!item) return;
    item.qty = Math.max(0, parseInt(val || '0', 10));
    save();
    calcMenu();
  };

  const removeItem = id => {
    items = items.filter(x => x.id !== id);
    save();
    renderItems();
    calcMenu();
  };

  const calcMenu = () => {
    const per = {
      rice_cups: +$('#ps_rice_cups').value,
      slaw_oz: +$('#ps_slaw_oz').value,
      onions_oz: +$('#ps_onions_oz').value,
      carrot_oz: +$('#ps_carrot_oz').value,
      cuke_oz: +$('#ps_cuke_oz').value,
      herb_oz: +$('#ps_herb_oz').value,
      pcarrot_oz: +$('#ps_pcarrot_oz').value,
      celery_oz: +$('#ps_celery_oz').value,
      salsa_oz: +$('#ps_salsa_oz').value,
      chicken_oz: +$('#ps_chicken_oz').value,
      pork_oz: +$('#ps_pork_oz').value,
      gyro_oz: +$('#ps_gyro_oz').value,
      bbq_oz: +$('#ps_bbq_oz').value,
      green_oz: +$('#ps_green_oz').value,
      toum_oz: +$('#ps_toum_oz').value,
      crema_oz: +$('#ps_crema_oz').value,
      peanut_oz: +$('#ps_peanut_oz').value,
      buffalo_oz: +$('#ps_buffalo_oz').value,
      tzatziki_oz: +$('#ps_tzatziki_oz').value,
      mojo_oz: +$('#ps_mojo_oz').value
    };
    const yields = {
      chicken: +$('#yield_chicken').value,
      pork: +$('#yield_pork').value,
      gyro: +$('#yield_gyro').value
    };
    const riceBatchCups = Math.max(1, +$('#riceBatchCups').value);

    let bowlsTotal = 0;
    const bowlsByProtein = { chicken: 0, pork: 0, gyro: 0 };
    const sauceOz = { bbq: 0, green: 0, toum: 0, crema: 0, peanut: 0, buffalo: 0, tzatziki: 0, mojo: 0 };
    const vegOz = { slaw: 0, onions: 0, carrot: 0, cuke: 0, herb: 0, pcarrot: 0, celery: 0 };
    let salsaOzTotal = 0;

    items.forEach(item => {
      const menu = findRecipe(item.key);
      if (!menu || !item.qty) return;
      const qty = item.qty;
      bowlsTotal += qty;
      if (menu.protein) bowlsByProtein[menu.protein] += qty;
      (menu.sauces || []).forEach(s => {
        const key = `${s}_oz`;
        sauceOz[s] = (sauceOz[s] || 0) + (per[key] || 0) * qty;
      });
      (menu.veg || []).forEach(v => {
        const key = VEG_PER_KEY[v];
        if (!key) return;
        vegOz[v] = (vegOz[v] || 0) + (per[key] || 0) * qty;
      });
      if (menu.salsa) salsaOzTotal += per.salsa_oz * qty;
    });

    const rice_cups_cooked = per.rice_cups * bowlsTotal;
    const cookedToDryRiceCup = 1 / 3;
    const lbPerCupDryRice = 0.41;
    const rice_dry_cups = rice_cups_cooked * cookedToDryRiceCup;
    const rice_dry_lbs = rice_dry_cups * lbPerCupDryRice;
    const rice_batches = Math.ceil(rice_cups_cooked / riceBatchCups);

    const cooked_oz = {
      chicken: per.chicken_oz * bowlsByProtein.chicken,
      pork: per.pork_oz * bowlsByProtein.pork,
      gyro: per.gyro_oz * bowlsByProtein.gyro
    };
    const cooked_lb = {
      chicken: cooked_oz.chicken / 16,
      pork: cooked_oz.pork / 16,
      gyro: cooked_oz.gyro / 16
    };
    const raw_lb = {
      chicken: yields.chicken ? cooked_lb.chicken / yields.chicken : 0,
      pork: yields.pork ? cooked_lb.pork / yields.pork : 0,
      gyro: yields.gyro ? cooked_lb.gyro / yields.gyro : 0
    };

    const peanut_scale = sauceOz.peanut / 16;
    const peanut_pb_lb = 0.75 * peanut_scale * PB_LB_PER_CUP;
    const peanut_soy_gal = (0.25 / 16) * peanut_scale;
    const peanut_coco_cans = (0.75 / (13.5 / 8)) * peanut_scale;
    const peanut_vin_cup = (1 / 8) * peanut_scale;
    const peanut_sugar_lb = 0.03125 * peanut_scale;

    const salsaYieldCups = SALSA_RECIPE.yieldCups;
    const salsaYieldOz = salsaYieldCups * FL_OZ_PER_CUP;
    const salsaBatches = salsaYieldOz > 0 ? (salsaOzTotal / salsaYieldOz) : 0;
    const salsa = {
      cornCans: SALSA_RECIPE.cornCans * salsaBatches,
      peppers: SALSA_RECIPE.peppers * salsaBatches,
      tomatoesLb: (SALSA_RECIPE.romaTomatoes * salsaBatches) / ROMA_PER_LB,
      onionsLb: (SALSA_RECIPE.redOnions * salsaBatches) / ONIONS_PER_LB,
      cilantroBunch: SALSA_RECIPE.cilantro * salsaBatches,
      limeCups: SALSA_RECIPE.limeJuiceCups * salsaBatches,
      saltTbsp: SALSA_RECIPE.saltTbsp * salsaBatches
    };

    const rows = [
      ['Item', 'Amount', 'Notes'],
      ['Bowls (total)', fmt(bowlsTotal, 0), '—'],
      ['Jasmine rice (cooked cups)', fmt(rice_cups_cooked, 1), `≈ ${fmt(rice_dry_cups, 1)} cups dry • ${fmt(rice_dry_lbs, 1)} lb • ${rice_batches} batches`],
      bowlsByProtein.chicken ? ['Chicken — cooked (lb)', fmt(cooked_lb.chicken, 2), `Raw ~ ${fmt(raw_lb.chicken, 2)} lb @ ${Math.round(yields.chicken * 100)}%`] : null,
      bowlsByProtein.pork ? ['Pork — cooked (lb)', fmt(cooked_lb.pork, 2), `Raw ~ ${fmt(raw_lb.pork, 2)} lb @ ${Math.round(yields.pork * 100)}%`] : null,
      bowlsByProtein.gyro ? ['Gyro — cooked (lb)', fmt(cooked_lb.gyro, 2), `Raw ~ ${fmt(raw_lb.gyro, 2)} lb @ ${Math.round(yields.gyro * 100)}%`] : null,
      vegOz.slaw ? ['Slaw, undressed (oz)', fmt(vegOz.slaw, 0), `≈ ${fmt(vegOz.slaw / 16, 2)} lb`] : null,
      vegOz.onions ? ['Pickled onions (oz)', fmt(vegOz.onions, 0), `≈ ${fmt(qt(vegOz.onions), 2)} qt`] : null,
      vegOz.pcarrot ? ['Pickled carrots (oz)', fmt(vegOz.pcarrot, 0), `≈ ${fmt(qt(vegOz.pcarrot), 2)} qt`] : null,
      vegOz.celery ? ['Celery julienne (oz)', fmt(vegOz.celery, 0), `≈ ${fmt(vegOz.celery / 16, 2)} lb`] : null,
      vegOz.carrot ? ['Julienne carrots (oz)', fmt(vegOz.carrot, 0), `≈ ${fmt(vegOz.carrot / 16, 2)} lb`] : null,
      vegOz.cuke ? ['Julienne cucumbers (oz)', fmt(vegOz.cuke, 0), `≈ ${fmt(vegOz.cuke / 16, 2)} lb`] : null,
      vegOz.herb ? ['Herbs (oz)', fmt(vegOz.herb, 0), `≈ ${fmt(vegOz.herb / 16, 2)} lb`] : null,
      sauceOz.bbq ? ['BBQ sauce (oz)', fmt(sauceOz.bbq, 0), `≈ ${fmt(qt(sauceOz.bbq), 2)} qt • ${fmt(gal(sauceOz.bbq), 2)} gal`] : null,
      sauceOz.green ? ['Peruvian green (oz)', fmt(sauceOz.green, 0), `≈ ${fmt(qt(sauceOz.green), 2)} qt • ${fmt(gal(sauceOz.green), 2)} gal`] : null,
      sauceOz.toum ? ['Toum (oz)', fmt(sauceOz.toum, 0), `≈ ${fmt(qt(sauceOz.toum), 2)} qt • ${fmt(gal(sauceOz.toum), 2)} gal`] : null,
      sauceOz.crema ? ['Cilantro-lime aioli / Crema (oz)', fmt(sauceOz.crema, 0), `≈ ${fmt(qt(sauceOz.crema), 2)} qt • ${fmt(gal(sauceOz.crema), 2)} gal`] : null,
      sauceOz.buffalo ? ['Buffalo sauce (oz)', fmt(sauceOz.buffalo, 0), `≈ ${fmt(qt(sauceOz.buffalo), 2)} qt • ${fmt(gal(sauceOz.buffalo), 2)} gal`] : null,
      sauceOz.tzatziki ? ['Tzatziki (oz)', fmt(sauceOz.tzatziki, 0), `≈ ${fmt(qt(sauceOz.tzatziki), 2)} qt • ${fmt(gal(sauceOz.tzatziki), 2)} gal`] : null,
      sauceOz.mojo ? ['Cuban Mojo Mustard (oz)', fmt(sauceOz.mojo, 0), `≈ ${fmt(qt(sauceOz.mojo), 2)} qt • ${fmt(gal(sauceOz.mojo), 2)} gal`] : null,
      sauceOz.peanut ? ['Thai Peanut (oz)', fmt(sauceOz.peanut, 0), `PB ${fmt(peanut_pb_lb, 2)} lb • Soy ${fmt(peanut_soy_gal, 2)} gal • Coconut ${fmt(peanut_coco_cans, 2)} cans • Vinegar ${fmt(peanut_vin_cup, 2)} cups • Sugar ${fmt(peanut_sugar_lb, 2)} lb`] : null,
      salsaOzTotal ? ['Corn Salsa (total oz)', fmt(salsaOzTotal, 0), `Batches ≈ ${fmt(salsaYieldOz ? (salsaOzTotal / salsaYieldOz) : 0, 2)} • Yield ${SALSA_RECIPE.yieldCups} cups/batch`] : null,
      salsaOzTotal ? ['Corn cans (15 oz)', fmt(salsa.cornCans, 2), ''] : null,
      salsaOzTotal ? ['Bell peppers (ea)', fmt(salsa.peppers, 2), ''] : null,
      salsaOzTotal ? ['Roma tomatoes (lb)', fmt(salsa.tomatoesLb, 2), ''] : null,
      salsaOzTotal ? ['Red onions (lb)', fmt(salsa.onionsLb, 2), ''] : null,
      salsaOzTotal ? ['Cilantro (bunches)', fmt(salsa.cilantroBunch, 2), ''] : null,
      salsaOzTotal ? ['Lime juice (cups)', fmt(salsa.limeCups, 2), ''] : null,
      salsaOzTotal ? ['Salt (Tbsp)', fmt(salsa.saltTbsp, 2), ''] : null
    ].filter(Boolean);
    $('#table').innerHTML = toTable(rows);
    window._shoppingRows = rows;

    const cost = {
      pricePerBowl: +$('#pricePerBowl').value,
      pack: +$('#costPack').value,
      chicken: +$('#costChicken').value,
      pork: +$('#costPork').value,
      gyro: +$('#costGyro').value,
      rice: +$('#costRice').value,
      slaw: +$('#costSlaw').value,
      carrot: +$('#costCarrot').value,
      cuke: +$('#costCuke').value,
      celery: +$('#costCelery').value,
      herb: +$('#costHerb').value,
      onionQt: +$('#costOnionQt').value,
      pcarrotQt: +$('#costPCarrotQt').value,
      bbqGal: +$('#costBBQ').value,
      greenGal: +$('#costGreen').value,
      toumGal: +$('#costToum').value,
      cremaGal: +$('#costCrema').value,
      buffaloGal: +$('#costBuffalo').value,
      tzatzikiGal: +$('#costTzatziki').value,
      mojoGal: +$('#costMojo').value,
      peanutLb: +$('#costPeanutLb').value,
      soyGal: +$('#costSoyGal').value,
      cocoCan: +$('#costCoconutCan').value,
      vinCup: +$('#costVinegarCup').value,
      sugarLb: +$('#costSugarLb').value,
      cornCan: +$('#costCornCan').value,
      pep: +$('#costPep').value,
      tom: +$('#costTom').value,
      onion: +$('#costOnion').value,
      cil: +$('#costCil').value,
      limeJuice: +$('#costLimeJuice').value,
      saltTbsp: +$('#costSaltTbsp').value
    };

    const riceCost = rice_dry_lbs * cost.rice;
    const slawCost = (vegOz.slaw / 16) * cost.slaw;
    const onionCost = qt(vegOz.onions) * cost.onionQt;
    const pcarrotCost = qt(vegOz.pcarrot) * cost.pcarrotQt;
    const carrotCost = (vegOz.carrot / 16) * cost.carrot;
    const celeryCost = (vegOz.celery / 16) * cost.celery;
    const cukeCost = (vegOz.cuke / 16) * cost.cuke;
    const herbCost = (vegOz.herb / 16) * cost.herb;

    const chickenCost = raw_lb.chicken * cost.chicken;
    const porkCost = raw_lb.pork * cost.pork;
    const gyroCost = raw_lb.gyro * cost.gyro;

    const bbqCost = gal(sauceOz.bbq) * cost.bbqGal;
    const greenCost = gal(sauceOz.green) * cost.greenGal;
    const toumCost = gal(sauceOz.toum) * cost.toumGal;
    const cremaCost = gal(sauceOz.crema) * cost.cremaGal;
    const buffaloCost = gal(sauceOz.buffalo) * cost.buffaloGal;
    const tzatzikiCost = gal(sauceOz.tzatziki) * cost.tzatzikiGal;
    const mojoCost = gal(sauceOz.mojo) * cost.mojoGal;

    const pbCost = peanut_pb_lb * cost.peanutLb;
    const soyCost = peanut_soy_gal * cost.soyGal;
    const cocoCost = peanut_coco_cans * cost.cocoCan;
    const vinCost = peanut_vin_cup * cost.vinCup;
    const sugarCost = peanut_sugar_lb * cost.sugarLb;
    const peanutCostTotal = sauceOz.peanut ? (pbCost + soyCost + cocoCost + vinCost + sugarCost) : 0;

    const salsaCost = salsaOzTotal ? (
      salsa.cornCans * cost.cornCan +
      salsa.peppers * cost.pep +
      salsa.tomatoesLb * cost.tom +
      salsa.onionsLb * cost.onion +
      salsa.cilantroBunch * cost.cil +
      salsa.limeCups * cost.limeJuice +
      salsa.saltTbsp * cost.saltTbsp
    ) : 0;

    const packagingCost = bowlsTotal * cost.pack;
    const seasoningCost = bowlsTotal * SEASONING_COST_PER_BOWL;

    const totalCost = [
      riceCost, slawCost, onionCost, pcarrotCost, carrotCost, celeryCost, cukeCost, herbCost,
      chickenCost, porkCost, gyroCost,
      bbqCost, greenCost, toumCost, cremaCost, buffaloCost, tzatzikiCost, mojoCost,
      peanutCostTotal, salsaCost, packagingCost, seasoningCost
    ].reduce((acc, val) => acc + (val || 0), 0);
    const revenue = bowlsTotal * cost.pricePerBowl;
    const grossProfit = revenue - totalCost;
    const perBowlCost = bowlsTotal ? totalCost / bowlsTotal : 0;
    const perBowlProfit = cost.pricePerBowl - perBowlCost;
    const gm = cost.pricePerBowl ? (perBowlProfit / cost.pricePerBowl) * 100 : 0;

    const costRows = [
      ['Metric', 'Value'],
      ['Bowls (total)', fmt(bowlsTotal, 0)],
      ['Revenue', money(revenue)],
      ['Total Cost', money(totalCost)],
      ['Gross Profit', money(grossProfit)],
      ['Per-Bowl Cost', money(perBowlCost)],
      ['Per-Bowl Profit', money(perBowlProfit)],
      ['Gross Margin %', fmt(gm, 1) + '%']
    ];

    const breakdown = [
      ['Category', 'Cost ($)'],
      ['Rice (dry)', money(riceCost)],
      vegOz.slaw ? ['Slaw', money(slawCost)] : null,
      vegOz.onions ? ['Pickled onion base', money(onionCost)] : null,
      vegOz.pcarrot ? ['Pickled carrot base', money(pcarrotCost)] : null,
      vegOz.carrot ? ['Julienne carrots', money(carrotCost)] : null,
      vegOz.celery ? ['Celery julienne', money(celeryCost)] : null,
      vegOz.cuke ? ['Cucumbers', money(cukeCost)] : null,
      vegOz.herb ? ['Herbs', money(herbCost)] : null,
      bowlsByProtein.chicken ? ['Chicken (raw)', money(chickenCost)] : null,
      bowlsByProtein.pork ? ['Pork (raw)', money(porkCost)] : null,
      bowlsByProtein.gyro ? ['Gyro (raw)', money(gyroCost)] : null,
      sauceOz.bbq ? ['BBQ sauce', money(bbqCost)] : null,
      sauceOz.green ? ['Peruvian green', money(greenCost)] : null,
      sauceOz.toum ? ['Toum', money(toumCost)] : null,
      sauceOz.crema ? ['Cilantro-lime Aioli / Crema', money(cremaCost)] : null,
      sauceOz.buffalo ? ['Buffalo sauce', money(buffaloCost)] : null,
      sauceOz.tzatziki ? ['Tzatziki', money(tzatzikiCost)] : null,
      sauceOz.mojo ? ['Mojo Mustard', money(mojoCost)] : null,
      sauceOz.peanut ? ['Thai Peanut (ingredients)', money(peanutCostTotal)] : null,
      salsaOzTotal ? ['Corn Salsa (ingredients)', money(salsaCost)] : null,
      ['Packaging', money(packagingCost)],
      seasoningCost ? ['Seasoning blend (.03/bowl)', money(seasoningCost)] : null
    ].filter(Boolean);

    $('#summary').innerHTML = `Items: <b>${items.length}</b> • Bowls: <b>${fmt(bowlsTotal, 0)}</b> • Rice batches: <b>${rice_batches}</b>` +
      (salsaOzTotal ? ` • Salsa batches: <b>${fmt(salsaYieldOz ? (salsaOzTotal / salsaYieldOz) : 0, 2)}</b>` : '');
    $('#costs').innerHTML = toTable(costRows) + toTable(breakdown);

    const foodOnlyPerBowl = bowlsTotal ? ((totalCost - packagingCost) / bowlsTotal) : 0;
    const exportObj = {
      pricePerBowl: +$('#pricePerBowl').value,
      packPerBowl: +$('#costPack').value,
      foodPerBowl: +foodOnlyPerBowl.toFixed(4),
      perBowlCost: +perBowlCost.toFixed(4),
      perBowlProfit: +perBowlProfit.toFixed(4),
      bowlsTotal: bowlsTotal | 0,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(EXPORT_KEY, JSON.stringify(exportObj));
      setExportBadge(true);
    } catch (_) {
      setExportBadge(false);
    }
  };

  const exportCSV = () => {
    if (!window._shoppingRows) calcMenu();
    const rows = window._shoppingRows || [];
    const lines = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'shopping_list.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const init = () => {
    renderSelect();
    load();
    renderItems();
    calcMenu();
  };

  const removeItemsByRecipeKey = key => {
    const before = items.length;
    items = items.filter(it => it.key !== key);
    if (items.length !== before) {
      save();
      renderItems();
      calcMenu();
    }
  };

  const syncRecipes = () => {
    renderSelect();
    renderItems();
    calcMenu();
  };

  return { addItem, clearItems, updateQty, removeItem, exportCSV, init, recalc: calcMenu, syncRecipes, removeItemsByRecipeKey };
})();

/* ---------- PLANNER (PL namespace) ---------- */
const SEASONING_COST_PER_BOWL = 0.03;

const PL = (() => {
  const readInputs = () => ({
    price: +$('#pl_price').value,
    food: +$('#pl_foodCost').value,
    pack: +$('#pl_packCost').value,
    activeMonths: +$('#pl_activeMonths').value,
    drinkShare: Math.max(0, Math.min(100, +$('#drink_share_pct').value || 0)) / 100,
    drinkPrice: +$('#drink_price').value,
    drinkCost: +$('#drink_cost').value,
    drinkRoundTo: Math.max(1, +$('#drink_round_to').value | 0),
    fixedMonthlyTotal: [
      +$('#fx_commissary').value,
      +$('#fx_insurance').value,
      +$('#fx_fuel').value,
      +$('#fx_note').value,
      +$('#fx_permits').value,
      +$('#fx_misc').value
    ].reduce((acc, val) => acc + (+val || 0), 0),
    types: [
      {
        key: 'Festival',
        ev: +$('#fest_events').value,
        bowls: +$('#fest_bowls').value,
        fee: +$('#fest_fee').value,
        ops: +$('#fest_ops').value,
        staff: +$('#fest_staff').value,
        hrs: +$('#fest_hrs').value,
        prep: +$('#fest_prep').value,
        wage: +$('#fest_wage').value,
        lead: +$('#fest_lead').value
      },
      {
        key: 'Community',
        ev: +$('#com_events').value,
        bowls: +$('#com_bowls').value,
        fee: +$('#com_fee').value,
        ops: +$('#com_ops').value,
        staff: +$('#com_staff').value,
        hrs: +$('#com_hrs').value,
        prep: +$('#com_prep').value,
        wage: +$('#com_wage').value,
        lead: +$('#com_lead').value
      },
      {
        key: 'Catering',
        ev: +$('#cat_events').value,
        bowls: +$('#cat_bowls').value,
        fee: +$('#cat_fee').value,
        ops: +$('#cat_ops').value,
        staff: +$('#cat_staff').value,
        hrs: +$('#cat_hrs').value,
        prep: +$('#cat_prep').value,
        wage: +$('#cat_wage').value,
        lead: +$('#cat_lead').value
      }
    ]
  });

  const roundDrinks = (count, step) => {
    if (!step || step <= 1) return Math.round(count);
    return Math.round(count / step) * step;
  };

  const perEvent = (globals, type) => {
    const varPerBowl = globals.food + globals.pack + SEASONING_COST_PER_BOWL;

    const bowlRevenue = type.bowls * globals.price;
    const bowlCOGS = type.bowls * varPerBowl;

    const rawDrinks = type.bowls * globals.drinkShare;
    const drinksCount = roundDrinks(rawDrinks, globals.drinkRoundTo);
    const drinkRevenue = drinksCount * globals.drinkPrice;
    const drinkCOGS = drinksCount * globals.drinkCost;

    const revenue = bowlRevenue + drinkRevenue;
    const cogs = bowlCOGS + drinkCOGS;

    const labor = (type.staff * type.hrs + type.staff * type.prep) * type.wage + (type.lead || 0);
    const fees = (type.fee || 0) + (type.ops || 0);

    return {
      bowls: type.bowls,
      drinks: drinksCount,
      bowlRevenue,
      bowlCOGS,
      drinkRevenue,
      drinkCOGS,
      revenue,
      cogs,
      gross: revenue - cogs,
      labor,
      fees,
      opBeforeFixed: revenue - cogs - labor - fees
    };
  };

  const calc = () => {
    const globals = readInputs();
    const totalEvents = globals.types.reduce((acc, type) => acc + (type.ev || 0), 0);
    const annualFixed = globals.fixedMonthlyTotal * Math.max(1, globals.activeMonths | 0);
    const fixedPerEvent = totalEvents > 0 ? annualFixed / totalEvents : 0;

    const perEventRows = [['Event Type', 'Bowls', 'Drinks (calc)', 'Revenue (incl. drinks)', 'COGS (incl. drinks)', 'Labor', 'Fees', 'Gross Profit', 'Profit (before fixed)', 'Profit (after fixed)']];
    const agg = {
      bowls: 0,
      drinks: 0,
      revenue: 0,
      cogs: 0,
      labor: 0,
      fees: 0,
      gross: 0,
      opBeforeFixed: 0,
      afterFixed: 0,
      bowlRev: 0,
      drinkRev: 0,
      bowlCogs: 0,
      drinkCogs: 0
    };

    globals.types.forEach(type => {
      const stats = perEvent(globals, type);
      perEventRows.push([
        type.key,
        fmt(stats.bowls),
        fmt(stats.drinks),
        money(stats.revenue),
        money(stats.cogs),
        money(stats.labor),
        money(stats.fees),
        money(stats.gross),
        money(stats.opBeforeFixed),
        money(stats.opBeforeFixed - fixedPerEvent)
      ]);

      agg.bowls += type.ev * stats.bowls;
      agg.drinks += type.ev * stats.drinks;
      agg.revenue += type.ev * stats.revenue;
      agg.cogs += type.ev * stats.cogs;
      agg.labor += type.ev * stats.labor;
      agg.fees += type.ev * stats.fees;
      agg.gross += type.ev * stats.gross;
      agg.opBeforeFixed += type.ev * stats.opBeforeFixed;
      agg.bowlRev += type.ev * stats.bowlRevenue;
      agg.drinkRev += type.ev * stats.drinkRevenue;
      agg.bowlCogs += type.ev * stats.bowlCOGS;
      agg.drinkCogs += type.ev * stats.drinkCOGS;
    });
    agg.afterFixed = agg.opBeforeFixed - annualFixed;

    $('#perEventTbl').innerHTML = toTable(perEventRows);

    const annualRows = [
      ['Metric', 'Value'],
      ['Active months / year', fmt(globals.activeMonths)],
      ['Events / year', fmt(totalEvents)],
      ['Bowls / year', fmt(agg.bowls)],
      ['Drinks / year (calc)', fmt(agg.drinks)],
      ['—', '—'],
      ['Revenue — Bowls', money(agg.bowlRev)],
      ['Revenue — Drinks', money(agg.drinkRev)],
      ['Revenue — Total', money(agg.revenue)],
      ['—', '—'],
      ['COGS — Bowls (food+pack)', money(agg.bowlCogs)],
      ['COGS — Drinks', money(agg.drinkCogs)],
      ['COGS — Total', money(agg.cogs)],
      ['—', '—'],
      ['Labor / year', money(agg.labor)],
      ['Event fees + per-event ops / year', money(agg.fees)],
      ['Gross profit', money(agg.gross)],
      ['Op profit before fixed', money(agg.opBeforeFixed)],
      ['Annual fixed costs', money(annualFixed)],
      ['Net profit (after fixed)', money(agg.afterFixed)]
    ];
    $('#annualTbl').innerHTML = toTable(annualRows);

    $('#kpi_events').textContent = fmt(totalEvents);
    $('#kpi_bowls').textContent = fmt(agg.bowls);
    $('#kpi_rev').textContent = money(agg.revenue);
    $('#kpi_net').textContent = money(agg.afterFixed);

    window._csvBlocks = { perEventRows, annualRows };
  };

  const exportCSV = () => {
    if (!window._csvBlocks) calc();
    const { perEventRows, annualRows } = window._csvBlocks || {};
    const sections = [
      ['Per Event Economics'],
      ...(perEventRows || []),
      [''],
      ['Annual Projection'],
      ...(annualRows || [])
    ];
    const lines = sections.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = ($('#pl_csvName').value || 'scale_staffing_summary.csv').trim() || 'scale_staffing_summary.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const presetSolo = () => {
    $('#fest_events').value = 8;
    $('#fest_bowls').value = 300;
    $('#fest_fee').value = 200;
    $('#fest_ops').value = 60;
    $('#fest_staff').value = 1;
    $('#fest_hrs').value = 8;
    $('#fest_prep').value = 1;
    $('#fest_wage').value = 0;
    $('#fest_lead').value = 0;

    $('#com_events').value = 10;
    $('#com_bowls').value = 180;
    $('#com_fee').value = 100;
    $('#com_ops').value = 40;
    $('#com_staff').value = 1;
    $('#com_hrs').value = 6;
    $('#com_prep').value = 1;
    $('#com_wage').value = 0;
    $('#com_lead').value = 0;

    $('#cat_events').value = 5;
    $('#cat_bowls').value = 125;
    $('#cat_fee').value = 0;
    $('#cat_ops').value = 25;
    $('#cat_staff').value = 1;
    $('#cat_hrs').value = 4;
    $('#cat_prep').value = 1;
    $('#cat_wage').value = 0;
    $('#cat_lead').value = 0;

    $('#drink_share_pct').value = 35;
    $('#drink_price').value = 5.00;
    $('#drink_cost').value = 1.40;
    $('#drink_round_to').value = 10;
    $('#pl_activeMonths').value = 8;
    calc();
  };

  const presetCrew = () => {
    $('#fest_events').value = 12;
    $('#fest_bowls').value = 350;
    $('#fest_fee').value = 200;
    $('#fest_ops').value = 75;
    $('#fest_staff').value = 3;
    $('#fest_hrs').value = 8;
    $('#fest_prep').value = 2;
    $('#fest_wage').value = 15;
    $('#fest_lead').value = 25;

    $('#com_events').value = 12;
    $('#com_bowls').value = 200;
    $('#com_fee').value = 100;
    $('#com_ops').value = 50;
    $('#com_staff').value = 2;
    $('#com_hrs').value = 6;
    $('#com_prep').value = 1;
    $('#com_wage').value = 15;
    $('#com_lead').value = 20;

    $('#cat_events').value = 7;
    $('#cat_bowls').value = 125;
    $('#cat_fee').value = 0;
    $('#cat_ops').value = 35;
    $('#cat_staff').value = 2;
    $('#cat_hrs').value = 4;
    $('#cat_prep').value = 1;
    $('#cat_wage').value = 15;
    $('#cat_lead').value = 15;

    $('#drink_share_pct').value = 45;
    $('#drink_price').value = 5.00;
    $('#drink_cost').value = 1.50;
    $('#drink_round_to').value = 10;
    $('#pl_activeMonths').value = 8;
    calc();
  };

  const presetMulti = () => {
    $('#fest_events').value = 24;
    $('#fest_bowls').value = 380;
    $('#fest_fee').value = 250;
    $('#fest_ops').value = 90;
    $('#fest_staff').value = 4;
    $('#fest_hrs').value = 8;
    $('#fest_prep').value = 2;
    $('#fest_wage').value = 16;
    $('#fest_lead').value = 40;

    $('#com_events').value = 36;
    $('#com_bowls').value = 220;
    $('#com_fee').value = 120;
    $('#com_ops').value = 60;
    $('#com_staff').value = 3;
    $('#com_hrs').value = 6;
    $('#com_prep').value = 1;
    $('#com_wage').value = 16;
    $('#com_lead').value = 25;

    $('#cat_events').value = 12;
    $('#cat_bowls').value = 150;
    $('#cat_fee').value = 0;
    $('#cat_ops').value = 40;
    $('#cat_staff').value = 3;
    $('#cat_hrs').value = 4;
    $('#cat_prep').value = 1;
    $('#cat_wage').value = 16;
    $('#cat_lead').value = 20;

    $('#drink_share_pct').value = 50;
    $('#drink_price').value = 5.50;
    $('#drink_cost').value = 1.65;
    $('#drink_round_to').value = 12;
    $('#pl_activeMonths').value = 8;
    calc();
  };

  const refreshImport = () => {
    const raw = localStorage.getItem(EXPORT_KEY);
    const msg = $('#importMsg');
    if (!raw) {
      msg.textContent = 'No export found. Make a change in Menu Builder so it recalculates, then come back.';
      return;
    }
    let obj = null;
    try {
      obj = JSON.parse(raw);
    } catch (_) {
      obj = null;
    }
    if (!obj) {
      msg.textContent = 'Export found but could not parse.';
      return;
    }
    const when = new Date(obj.timestamp || Date.now()).toLocaleString();
    msg.innerHTML = `Found export from <b>${when}</b><br>
      Bowls total: <b>${obj.bowlsTotal || 0}</b> • Food-only per bowl: <b>$${(+obj.foodPerBowl || 0).toFixed(2)}</b> • Packaging: <b>$${(+obj.packPerBowl || 0).toFixed(2)}</b><br>
      Price per bowl: <b>$${(+obj.pricePerBowl || 0).toFixed(2)}</b> • Profit/bowl: <b>$${(+obj.perBowlProfit || 0).toFixed(2)}</b>`;
    window._imported = obj;
  };

  const applyImported = () => {
    if (!window._imported) refreshImport();
    const obj = window._imported;
    if (!obj) return;
    $('#pl_price').value = (+obj.pricePerBowl || 12).toFixed(2);
    $('#pl_foodCost').value = (+obj.foodPerBowl || 2.11).toFixed(2);
    $('#pl_packCost').value = (+obj.packPerBowl || 0.60).toFixed(2);
    calc();
  };

  return { calc, exportCSV, presetSolo, presetCrew, presetMulti, refreshImport, applyImported };
})();

const ensurePriceSheetLoaded = async () => {
  if (priceSheetRows) return true;
  const applied = await loadDefaultsFromCSV();
  return applied || Boolean(priceSheetRows);
};

const downloadPriceSheet = async () => {
  const ready = await ensurePriceSheetLoaded();
  if (!ready || !priceSheetRows) {
    window.alert('Unable to load price sheet for download.');
    return;
  }
  const rows = updateRowsFromInputs(priceSheetRows);
  priceSheetRows = rows.map(r => r.slice());
  const csv = rowsToCSV(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `food_truck_prices_${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const handlePriceUpload = async event => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const rows = parseCSV(text);
    if (!rows || rows.length < 2) {
      window.alert('CSV appears empty or malformed.');
      return;
    }
    priceSheetRows = rows.map(r => r.slice());
    const applied = applyPriceDefaults(rows);
    if (!applied) {
      window.alert('No matching fields found in CSV.');
      return;
    }
    MB.recalc();
    PL.calc();
    PL.refreshImport();
  } catch (error) {
    console.warn('CSV upload failed:', error);
    window.alert('Failed to read CSV.');
  } finally {
    event.target.value = '';
  }
};

const printPrepSection = sectionId => {
  const node = document.getElementById(sectionId);
  if (!node) return;
  const sectionNode = node.closest('.card') || node;
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) return;
  const stylesheet = document.querySelector('link[rel="stylesheet"]')?.getAttribute('href') || 'styles.css';
  const content = sectionNode.outerHTML;
  win.document.write(`<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Prep Print — ${sectionId}</title>
      <link rel="stylesheet" href="${stylesheet}">
      <style>
        body{background:#fff;color:#000;padding:20px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,Helvetica,Arial,sans-serif;}
        .card{background:#fff;color:#000;box-shadow:none;border:1px solid #ccc;}
        .prep-card{background:#fff;color:#000;border-color:#ccc;}
        .prep-tags .prep-tag,.prep-pill{background:#f0f4ff;color:#000;border-color:#b0c4ff;}
        .muted{color:#555;}
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>`);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 200);
};

/* ---------- init ---------- */
MB.init();
TimeBoard.init();
PrepBoard.init();
PL.refreshImport();
PL.calc();
loadDefaultsFromCSV().then(applied => {
  if (applied) {
    MB.recalc();
    PL.calc();
    PL.refreshImport();
  }
});

const priceDownloadBtn = $('#priceDownload');
if (priceDownloadBtn) priceDownloadBtn.addEventListener('click', downloadPriceSheet);
const priceUploadBtn = $('#priceUploadBtn');
const priceFileInput = $('#priceFile');
if (priceUploadBtn && priceFileInput) {
  priceUploadBtn.addEventListener('click', () => priceFileInput.click());
}
if (priceFileInput) priceFileInput.addEventListener('change', handlePriceUpload);

const recipeBtn = $('#recipeModalBtn');
if (recipeBtn) recipeBtn.addEventListener('click', () => {
  initRecipeManager();
  toggleModal('recipesModal', true);
  toggleSideNav(false);
});
document.querySelectorAll('[data-close="recipesModal"]').forEach(el => {
  el.addEventListener('click', () => toggleModal('recipesModal', false));
});
document.addEventListener('keydown', evt => {
  if (evt.key === 'Escape') toggleModal('recipesModal', false);
  if (evt.key === 'Escape') toggleSideNav(false);
});

const navToggleBtn = document.getElementById('navToggle');
if (navToggleBtn) navToggleBtn.addEventListener('click', () => toggleSideNav());

const recipeModalLink = document.getElementById('recipeModalLink');
if (recipeModalLink) recipeModalLink.addEventListener('click', () => {
  initRecipeManager();
  toggleModal('recipesModal', true);
  toggleSideNav(false);
});

const downloadPricesLink = document.getElementById('downloadPrices');
if (downloadPricesLink) downloadPricesLink.addEventListener('click', () => {
  downloadPriceSheet();
  toggleSideNav(false);
});

const uploadPricesLink = document.getElementById('uploadPrices');
if (uploadPricesLink) uploadPricesLink.addEventListener('click', () => {
  const fileInput = document.getElementById('priceFile');
  if (fileInput) fileInput.click();
  toggleSideNav(false);
});

document.querySelectorAll('[data-print-section]').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-print-section');
    if (targetId) printPrepSection(targetId);
  });
});

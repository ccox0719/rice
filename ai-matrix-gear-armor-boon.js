const CLASSES = {
  Rogue:     { STR:2, DEX:5, INT:2, stealth:6, athletics:2, arcana:1, survival:3, persuasion:3, acrobatics:5, perception:4, intimidation:2 },
  Warrior:   { STR:6, DEX:2, INT:1, stealth:1, athletics:6, arcana:0, survival:3, persuasion:2, acrobatics:2, perception:3, intimidation:5 },
  Wizard:    { STR:1, DEX:2, INT:6, stealth:2, athletics:1, arcana:6, survival:2, persuasion:4, acrobatics:2, perception:3, intimidation:1 },
  Ranger:    { STR:3, DEX:4, INT:3, stealth:4, athletics:3, arcana:2, survival:5, persuasion:2, acrobatics:4, perception:5, intimidation:2 },
  Paladin:   { STR:5, DEX:2, INT:2, stealth:2, athletics:5, arcana:3, survival:3, persuasion:5, acrobatics:2, perception:3, intimidation:4 },
  Bard:      { STR:2, DEX:3, INT:3, stealth:4, athletics:2, arcana:3, survival:2, persuasion:6, acrobatics:5, perception:4, intimidation:3 },
  Druid:     { STR:2, DEX:3, INT:4, stealth:3, athletics:3, arcana:5, survival:6, persuasion:3, acrobatics:2, perception:4, intimidation:2 },
  Barbarian: { STR:7, DEX:2, INT:1, stealth:2, athletics:6, arcana:0, survival:4, persuasion:1, acrobatics:3, perception:3, intimidation:6 },
  Cleric:    { STR:4, DEX:2, INT:3, stealth:1, athletics:4, arcana:4, survival:4, persuasion:5, acrobatics:1, perception:4, intimidation:2 },
  Assassin:  { STR:3, DEX:6, INT:2, stealth:6, athletics:2, arcana:1, survival:3, persuasion:1, acrobatics:6, perception:5, intimidation:4 },
  Monk:      { STR:3, DEX:5, INT:3, stealth:4, athletics:4, arcana:2, survival:3, persuasion:3, acrobatics:6, perception:4, intimidation:2 },
  Warlock:   { STR:2, DEX:3, INT:5, stealth:3, athletics:2, arcana:6, survival:3, persuasion:4, acrobatics:3, perception:3, intimidation:5 },
  Shaman:    { STR:3, DEX:2, INT:4, stealth:2, athletics:3, arcana:5, survival:5, persuasion:2, acrobatics:2, perception:5, intimidation:2 },
  Hunter:    { STR:4, DEX:4, INT:2, stealth:4, athletics:4, arcana:1, survival:6, persuasion:2, acrobatics:3, perception:5, intimidation:3 },
  Templar:   { STR:5, DEX:3, INT:2, stealth:2, athletics:5, arcana:3, survival:4, persuasion:3, acrobatics:2, perception:3, intimidation:5 },
  Illusionist:{ STR:1, DEX:4, INT:6, stealth:5, athletics:1, arcana:6, survival:2, persuasion:4, acrobatics:4, perception:4, intimidation:1 }
};

const WEAPONS = {
  Sword:{ attr:"STR", dc:13 }, Bow:{ attr:"DEX", dc:14 }, Dagger:{ attr:"DEX", dc:12 },
  Axe:{ attr:"STR", dc:14 }, Mace:{ attr:"STR", dc:13 }, Warhammer:{ attr:"STR", dc:15 },
  Staff:{ attr:"INT", dc:13 }, Crossbow:{ attr:"DEX", dc:14 }, Spear:{ attr:"STR", dc:13 },
  Whip:{ attr:"DEX", dc:13 }, Claws:{ attr:"DEX", dc:12 }, MagicBlast:{ attr:"INT", dc:15 },
  Chakram:{ attr:"DEX", dc:14 }, FlameRod:{ attr:"INT", dc:16 }, Glaive:{ attr:"STR", dc:15 },
  Slingshot:{ attr:"DEX", dc:12 }, ShadowBlade:{ attr:"DEX", dc:15 }, MindSpike:{ attr:"INT", dc:16 },
  Maul:{ attr:"STR", dc:16 }, IceShard:{ attr:"INT", dc:14 }, VineWhip:{ attr:"DEX", dc:13 },
  ThunderAxe:{ attr:"STR", dc:17 }, SoulDagger:{ attr:"INT", dc:14 }, PhantomBow:{ attr:"DEX", dc:15 }
};

const SKILLS = {
  Stealth:{ attr:"stealth", dc:13 }, Athletics:{ attr:"athletics", dc:13 },
  Arcana:{ attr:"arcana", dc:14 }, Survival:{ attr:"survival", dc:13 },
  Persuasion:{ attr:"persuasion", dc:13 }, Acrobatics:{ attr:"acrobatics", dc:13 },
  Perception:{ attr:"perception", dc:13 }, Intimidation:{ attr:"intimidation", dc:13 },
  Insight:{ attr:"WIS", dc:13 }, Deception:{ attr:"CHA", dc:13 },
  Nature:{ attr:"INT", dc:14 }, History:{ attr:"INT", dc:14 },
  Medicine:{ attr:"WIS", dc:13 }, Religion:{ attr:"INT", dc:14 },
  Investigation:{ attr:"INT", dc:15 }, Performance:{ attr:"CHA", dc:13 }
};

function rollD20() {
  return Math.floor(Math.random() * 20) + 1;
}

function buildMatrix() {
  let html = '<h2>Simulated Roll Matrix (Class Reference)</h2>';
  html += '<table><thead><tr><th>Class</th><th>Type</th><th>Action</th><th>Roll</th><th>Mod</th><th>Total</th><th>DC</th><th>✓/✗</th></tr></thead><tbody>';

  for (const cls in CLASSES) {
    const stats = CLASSES[cls];

    for (const weapon in WEAPONS) {
      const { attr, dc } = WEAPONS[weapon];
      const mod = stats[attr] ?? 0;
      const roll = rollD20();
      const total = roll + mod;
      const pass = total >= dc ? '✓' : '✗';
      html += `<tr><td>${cls}</td><td>Weapon</td><td>${weapon}</td><td>${roll}</td><td>${mod}</td><td>${total}</td><td>${dc}</td><td>${pass}</td></tr>`;
    }

    for (const skill in SKILLS) {
      const { attr, dc } = SKILLS[skill];
      const mod = stats[attr] ?? 0;
      const roll = rollD20();
      const total = roll + mod;
      const pass = total >= dc ? '✓' : '✗';
      html += `<tr><td>${cls}</td><td>Skill</td><td>${skill}</td><td>${roll}</td><td>${mod}</td><td>${total}</td><td>${dc}</td><td>${pass}</td></tr>`;
    }
  }

  html += '</tbody></table>';
  const div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div);
}

window.onload = buildMatrix;

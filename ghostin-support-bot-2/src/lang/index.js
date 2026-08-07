const en = require('./en');
const es = require('./es');

const LANGS = { en, es };

function t(lang, key, vars = {}) {
  const dict = LANGS[lang] || LANGS.en;
  let str = dict[key] || LANGS.en[key] || key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.split(`{${k}}`).join(v);
  }
  return str;
}

module.exports = { t, LANGS };

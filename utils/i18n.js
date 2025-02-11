const i18n = require('i18n');
const path = require('path');

i18n.configure({
  locales: ['en', 'ru'],
  directory: path.join(__dirname, '../locales'),
  defaultLocale: 'en',
  queryParameter: 'lang'
});

module.exports = i18n;

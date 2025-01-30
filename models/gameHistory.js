const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  query: { type: String, required: true },
  results: { type: Array, required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.models.SearchHistory || mongoose.model('SearchHistory', searchHistorySchema);

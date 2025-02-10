const mongoose = require('mongoose');

// Валидатор, чтобы массив содержал ровно 3 изображения
function arrayLimit(val) {
  return Array.isArray(val) && val.length === 3;
}

const itemSchema = new mongoose.Schema({
  images: {
    type: [String],
    required: true,
    validate: [arrayLimit, '{PATH} must have exactly 3 images']
  },
  name_en: { type: String, required: true },
  name_ru: { type: String, required: true },
  description_en: { type: String, required: true },
  description_ru: { type: String, required: true },
  // Поле для мягкого удаления; если установлено, элемент считается удалённым
  deletedAt: { type: Date, default: null }
}, { timestamps: true }); // автоматически добавляет createdAt и updatedAt

module.exports = mongoose.model('Item', itemSchema);

const express = require('express');
const router = express.Router();
const Item = require('../models/item');

// Middleware для проверки авторизации и прав администратора
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) return next();
  res.redirect('/login');
}

function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.isAdmin) return next();
  res.status(403).send('Access denied. Admins only.');
}

// Список элементов (не удалённых)
router.get('/items', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const items = await Item.find({ deletedAt: null }).sort({ createdAt: -1 });
    res.render('admin/items', { items, user: req.session.user, currentRoute: '/admin' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Форма для добавления нового элемента
router.get('/items/new', isAuthenticated, isAdmin, (req, res) => {
  res.render('admin/new-item', { user: req.session.user, currentRoute: '/admin' });
});

// Создание нового элемента
router.post('/items', isAuthenticated, isAdmin, async (req, res) => {
  try {
    let images = req.body.images;
    // Если изображения передаются в виде строки (через запятую), преобразуем в массив
    if (typeof images === 'string') {
      images = images.split(',').map(url => url.trim());
    }
    if (images.length !== 3) {
      return res.status(400).send("Exactly 3 images are required.");
    }
    const newItem = new Item({
      images,
      name_en: req.body.name_en,
      name_ru: req.body.name_ru,
      description_en: req.body.description_en,
      description_ru: req.body.description_ru
    });
    await newItem.save();
    res.redirect('/admin/items');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Форма редактирования элемента
router.get('/items/:id/edit', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item || item.deletedAt) return res.status(404).send("Item not found");
    res.render('admin/edit-item', { item, user: req.session.user, currentRoute: '/admin' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Обновление элемента (PUT)
router.put('/items/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    let images = req.body.images;
    if (typeof images === 'string') {
      images = images.split(',').map(url => url.trim());
    }
    if (images.length !== 3) {
      return res.status(400).send("Exactly 3 images are required.");
    }
    await Item.findByIdAndUpdate(req.params.id, {
      images,
      name_en: req.body.name_en,
      name_ru: req.body.name_ru,
      description_en: req.body.description_en,
      description_ru: req.body.description_ru
    });
    res.redirect('/admin/items');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Мягкое удаление элемента (DELETE)
router.delete('/items/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await Item.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });
    res.redirect('/admin/items');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;

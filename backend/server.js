const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// База данных товаров в оперативной памяти
let products = [
  { id: "1", name: "Молоко 3.2% Домик в деревне", price: 450, category: "Молочные продукты", stock: 15, image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400" },
  { id: "2", name: "Хлеб Бородинский нарезка", price: 180, category: "Хлеб", stock: 8, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400" },
  { id: "3", name: "Яблоки Гала (кг)", price: 650, category: "Фрукты", stock: 20, image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=400" },
  { id: "4", name: "Coca-Cola 1.5л", price: 420, category: "Напитки", stock: 5, image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400" }
];

let orders = [];

// 1. Получить все товары
app.get('/api/products', (req, res) => {
  res.json(products);
});

// 2. Создать новый заказ (с защитой от вывода ID вместо названия при ошибках)
app.post('/api/orders', (req, res) => {
  const { customerName, phone, flatNumber, items, comment } = req.body;

  if (!customerName || !phone || !flatNumber || !items || items.length === 0) {
    return res.status(400).json({ success: false, error: "Заполните обязательные поля." });
  }

  let totalPrice = 0;
  let orderItemsDetailed = [];

  for (const item of items) {
    if (!item.id) {
      return res.status(400).json({ success: false, error: "Передан товар без ID." });
    }

    const product = products.find(p => p.id.toString() === item.id.toString());
    const finalProduct = product || products.find(p => p.name.toLowerCase() === item.id.toString().toLowerCase());

    if (!finalProduct) {
      return res.status(404).json({ 
        success: false, 
        error: `Товар с кодом/названием "${item.id}" отсутствует в базе магазина.` 
      });
    }
    
    if (finalProduct.stock < item.quantity) {
      return res.status(400).json({ success: false, error: `Товара "${finalProduct.name}" недостаточно. Осталось: ${finalProduct.stock} шт.` });
    }
    
    finalProduct.stock -= Number(item.quantity); 
    totalPrice += finalProduct.price * Number(item.quantity);
    
    // Передаем полные данные о товаре для корректного отображения в админке
    orderItemsDetailed.push({
      id: finalProduct.id,
      name: finalProduct.name,
      title: finalProduct.name,
      quantity: Number(item.quantity),
      price: finalProduct.price
    });
  }

  // Уникальный ID заказа на базе таймстампа
  const orderId = Date.now();

  const newOrder = {
    id: orderId, 
    customerName, 
    phone, 
    flatNumber, 
    comment,
    items: orderItemsDetailed, 
    totalPrice,
    status: "Готовится", // Начальный статус заказа
    createdAt: new Date().toLocaleString()
  };

  orders.push(newOrder);
  res.status(201).json({ success: true, message: "Заказ успешно принят!", order: newOrder });
});

// 3. Получить все заказы (Админка)
app.get('/api/admin/orders', (req, res) => {
  res.json(orders);
});

// 4. Изменить статус конкретного заказа по ID (Админка)
app.patch('/api/admin/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["Готовится", "В пути", "Доставлено"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: "Неверный статус заказа" });
  }

  const order = orders.find(o => o.id.toString() === id.toString());
  if (!order) {
    return res.status(404).json({ success: false, error: "Заказ не найден" });
  }

  order.status = status;
  res.json({ success: true, message: `Статус заказа успешно изменен на "${status}"`, orders });
});

// 5. Удалить конкретный заказ по ID (Админка)
app.delete('/api/admin/orders/:id', (req, res) => {
  const { id } = req.params;
  
  const orderIndex = orders.findIndex(o => o.id.toString() === id.toString());
  if (orderIndex === -1) {
    return res.status(404).json({ success: false, error: "Заказ не найден" });
  }

  orders.splice(orderIndex, 1);
  res.json({ success: true, message: "Заказ успешно удален", orders });
});

// 6. Удалить ВСЕ заказы (Админка)
app.delete('/api/admin/orders', (req, res) => {
  orders = [];
  res.json({ success: true, message: "Все старые заказы были успешно удалены." });
});

// 7. Поставки / Обновление остатков товаров (Админка)
app.post('/api/admin/products/update-stock', (req, res) => {
  const { id, quantityToAdd } = req.body;
  
  if (!id) {
    return res.status(400).json({ success: false, error: "Не указан ID товара" });
  }

  const product = products.find(p => p.id.toString() === id.toString());
  
  if (!product) {
    return res.status(404).json({ success: false, error: "Товар не найден" });
  }

  if (quantityToAdd !== undefined) {
    product.stock += Number(quantityToAdd);
  } else {
    return res.status(400).json({ success: false, error: "Не передано количество для добавления (quantityToAdd)" });
  }

  res.json({ 
    success: true, 
    message: `Поставка принята. Новый остаток "${product.name}": ${product.stock} шт.`,
    products: products 
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
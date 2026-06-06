import React, { useState, useEffect } from 'react';
import { CATEGORIES } from './mockData';

export default function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  
  const [activeTab, setActiveTab] = useState("catalog");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  const [formData, setFormData] = useState({
    customerName: "", phone: "", flatNumber: "", comment: ""
  });

  const loadProducts = () => {
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Ошибка загрузки товаров:", err));
  };

  const loadOrders = () => {
    fetch('http://localhost:5000/api/admin/orders')
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(err => console.error("Ошибка загрузки заказов:", err));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleAdminLogin = () => {
    if (isAdminLoggedIn) {
      setActiveTab("admin");
      loadOrders();
      return;
    }

    const password = prompt("Введите пароль администратора:");
    if (password === "admin123") {
      setIsAdminLoggedIn(true);
      setActiveTab("admin");
      loadOrders();
    } else if (password !== null) {
      alert("Неверный пароль!");
    }
  };

  // Кнопка добавления поставок (Суммирует значения)
  const handleStockUpdate = (productId, currentStock, productName) => {
    const input = prompt(`Товар: "${productName}"\nТекущий остаток: ${currentStock} шт.\n\nВведите КОЛИЧЕСТВО ТОВАРA из новой поставки (оно прибавится к текущему):`);
    
    if (input === null || input.trim() === "" || isNaN(input)) {
      return; 
    }

    const quantityToAddValue = Number(input);

    fetch('http://localhost:5000/api/admin/products/update-stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id: productId.toString(),
        quantityToAdd: quantityToAddValue
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert(data.message);
        // Синхронно обновляем стейт из ответа бэкенда
        setProducts(data.products); 
      } else {
        alert("Ошибка сервера: " + data.error);
      }
    })
    .catch(err => console.error("Критическая ошибка отправки поставки:", err));
  };

  // Смена статуса конкретного заказа
  const handleUpdateStatus = (orderId, newStatus) => {
    fetch(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setOrders(data.orders);
      } else {
        alert("Ошибка изменения статуса: " + data.error);
      }
    })
    .catch(err => console.error("Ошибка сети при смене статуса:", err));
  };

  // Удаление ОДНОГО конкретного заказа
  const handleDeleteOrder = (orderId) => {
    if (!window.confirm(`Вы уверены, что хотите удалить этот заказ?`)) {
      return;
    }

    fetch(`http://localhost:5000/api/admin/orders/${orderId}`, {
      method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert(data.message);
        setOrders(data.orders);
      } else {
        alert("Ошибка удаления заказа: " + data.error);
      }
    })
    .catch(err => console.error("Ошибка сети при удалении заказа:", err));
  };

  // Удаление ВСЕХ заказов
  const handleClearOrders = () => {
    if (!window.confirm("Вы уверены, что хотите безвозвратно удалить ВСЕ старые заказы?")) {
      return;
    }

    fetch('http://localhost:5000/api/admin/orders', {
      method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert(data.message);
        setOrders([]); 
      } else {
        alert("Ошибка при удалении: " + data.error);
      }
    })
    .catch(err => console.error("Ошибка удаления заказов:", err));
  };

  const handleCheckout = (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.phone || !formData.flatNumber) {
      alert("Заполните обязательные поля формы.");
      return;
    }

    const orderData = {
      ...formData,
      items: cart.map(item => ({ 
        id: item.id.toString(), 
        quantity: Number(item.quantity) 
      }))
    };

    fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert(data.message);
        setCart([]);
        setFormData({ customerName: "", phone: "", flatNumber: "", comment: "" });
        setActiveTab("catalog");
        loadProducts();
      } else {
        alert("Ошибка оформления: " + data.error);
      }
    })
    .catch(err => console.error("Ошибка при оформлении:", err));
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id.toString() === product.id.toString());
      if (existing) {
        return prev.map(item => item.id.toString() === product.id.toString() ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (id, amount) => {
    setCart(prev => prev.map(item => {
      if (item.id.toString() === id.toString()) {
        const newQty = item.quantity + amount;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getStatusColor = (status) => {
    switch(status) {
      case "В пути": return "#3b82f6"; 
      case "Доставлено": return "#10b981"; 
      default: return "#f59e0b"; 
    }
  };

  return (
    <div>
      {/* Шапка */}
      <header className="site-header">
        <div className="header-container">
          <div className="logo-area" onClick={() => setActiveTab("catalog")} style={{ cursor: 'pointer' }}>
            <h1 className="logo-title">ЕСБОСЫН</h1>
            <span className="geo-tag">📍 ЖК Доставка</span>
          </div>
          
          <div className="search-container">
            {activeTab === "catalog" && (
              <input 
                type="text" 
                placeholder="Поиск продуктов..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={handleAdminLogin}
              className={`admin-nav-btn ${activeTab === 'admin' ? 'active-tab' : ''}`}
            >
              💼 Панель Владельца {isAdminLoggedIn && "✓"}
            </button>

            <button 
              className={`cart-button ${activeTab === 'cart' ? 'active-tab' : ''}`} 
              onClick={() => setActiveTab(activeTab === "cart" ? "catalog" : "cart")}
            >
              🛒 {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Основной макет */}
      <div className="main-layout">
        {activeTab === "catalog" && (
          <aside className="sidebar">
            <h3 className="sidebar-title">Категории</h3>
            <ul className="category-list">
              <li className="category-item">
                <button onClick={() => setSelectedCategory("")} className={`category-button ${!selectedCategory ? 'active' : ''}`}>Все товары</button>
              </li>
              {CATEGORIES.map(cat => (
                <li key={cat} className="category-item">
                  <button onClick={() => setSelectedCategory(cat)} className={`category-button ${selectedCategory === cat ? 'active' : ''}`}>{cat}</button>
                </li>
              ))}
            </ul>
          </aside>
        )}

        <main className="catalog-content">
          {/* КАТАЛОГ */}
          {activeTab === "catalog" && (
            <>
              <div className="catalog-header">
                <h2 className="catalog-title">{selectedCategory || "Все товары"}</h2>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="products-grid">
                  {filteredProducts.map(product => {
                    const isOutOfStock = product.stock === 0;
                    return (
                      <div key={product.id} className="product-card">
                        <div>
                          <div className="image-container">
                            <img src={product.image} alt={product.name} className={`product-image ${isOutOfStock ? 'grayscale' : ''}`} />
                            {isOutOfStock && <span className="out-of-stock-badge">Закончился</span>}
                          </div>
                          <h3 className="product-name">{product.name}</h3>
                          <div className="stars-rating">⭐⭐⭐⭐⭐ <span className="rating-count">({product.stock} шт.)</span></div>
                        </div>
                        <div className="card-footer">
                          <span className="product-price">{product.price} ₸</span>
                          <button disabled={isOutOfStock} onClick={() => handleAddToCart(product)} className="add-to-cart-btn">+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-products">Товары не найдены</div>
              )}
            </>
          )}

          {/* КОРЗИНА */}
          {activeTab === "cart" && (
            <div className="cart-page">
              <h2 className="catalog-title" style={{ marginBottom: '24px' }}>Оформление заказа</h2>
              {cart.length === 0 ? (
                <div className="no-products"><p>Ваша корзина пока пуста.</p></div>
              ) : (
                <div className="cart-grid">
                  <div className="cart-items-list">
                    {cart.map(item => (
                      <div key={item.id} className="cart-item-row">
                        <div className="cart-item-info">
                          <h4 className="cart-item-name">{item.name}</h4>
                          <p className="cart-item-price">{item.price} ₸</p>
                        </div>
                        <div className="quantity-controls">
                          <button onClick={() => handleUpdateQuantity(item.id, -1)} className="qty-btn">-</button>
                          <span className="qty-val">{item.quantity}</span>
                          <button onClick={() => handleUpdateQuantity(item.id, 1)} className="qty-btn">+</button>
                        </div>
                        <div className="cart-item-subtotal">{item.price * item.quantity} ₸</div>
                      </div>
                    ))}
                    <div className="cart-total-summary"><span>Итого:</span><strong>{totalPrice} ₸</strong></div>
                  </div>

                  <div className="checkout-form-container">
                    <form onSubmit={handleCheckout}>
                      <div className="form-group"><label>Имя жильца *</label><input type="text" required value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} /></div>
                      <div className="form-group"><label>Телефон *</label><input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
                      <div className="form-group"><label>Номер квартиры *</label><input type="text" required value={formData.flatNumber} onChange={(e) => setFormData({...formData, flatNumber: e.target.value})} /></div>
                      <div className="form-group"><label>Комментарий курьеру</label><textarea value={formData.comment} onChange={(e) => setFormData({...formData, comment: e.target.value})} /></div>
                      <button type="submit" className="submit-order-btn">Отправить заказ</button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* АДМИН-ПАНЕЛЬ */}
          {activeTab === "admin" && isAdminLoggedIn && (
            <div className="admin-page">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <h2 className="catalog-title" style={{ margin: 0 }}>Панель управления «Есбосын»</h2>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 32px 0' }}>Режим владельца магазина</p>
                </div>
                
                {orders.length > 0 && (
                  <button 
                    onClick={handleClearOrders} 
                    style={{
                      marginLeft: 'auto',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '13px'
                    }}
                  >
                    🗑️ Удалить все старые заказы
                  </button>
                )}
              </div>

              <div className="admin-sections-grid">
                {/* Таблица остатков */}
                <div className="admin-card">
                  <h3 className="admin-card-title">📦 Остатки товаров на складе</h3>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Продукт</th>
                        <th>Категория</th>
                        <th>На складе</th>
                        <th>Действие</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id}>
                          <td><strong>{p.name}</strong></td>
                          <td><span className="table-badge">{p.category}</span></td>
                          <td>
                            <span className={`stock-indicator ${Number(p.stock) === 0 ? 'empty' : 'fine'}`}>
                              {p.stock} шт.
                            </span>
                          </td>
                          <td>
                            <button className="update-stock-btn" onClick={() => handleStockUpdate(p.id, p.stock, p.name)}>
                              Добавить поставку
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Список оформленных заказов */}
                <div className="admin-card" style={{ marginTop: '32px' }}>
                  <h3 className="admin-card-title">📜 Все оформленные заказы ({orders.length})</h3>
                  {orders.length === 0 ? (
                    <p style={{ padding: '16px', color: '#9ca3af' }}>Заказов пока не поступало.</p>
                  ) : (
                    <div className="orders-list-container">
                      {orders.map((order, idx) => (
                        <div key={order.id || idx} className="admin-order-row" style={{ position: 'relative', marginBottom: '20px', padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                          
                          {/* Кнопка удаления конкретного заказа (Крестик) */}
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            style={{
                              position: 'absolute',
                              top: '16px',
                              right: '16px',
                              backgroundColor: '#fee2e2',
                              color: '#ef4444',
                              border: 'none',
                              borderRadius: '4px',
                              width: '28px',
                              height: '28px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px'
                            }}
                            title="Удалить этот заказ"
                          >
                            ✕
                          </button>

                          <div className="order-row-header" style={{ paddingRight: '40px' }}>
                            <h4>Заказ №{idx + 1} <span className="order-time">({order.createdAt})</span></h4>
                            <span className="order-total-badge">{order.totalPrice} ₸</span>
                          </div>
                          
                          <div className="order-customer-details" style={{ margin: '10px 0' }}>
                            <p>👤 <strong>Покупатель:</strong> {order.customerName} ({order.phone})</p>
                            <p>🏢 <strong>Номер квартиры:</strong> кв. {order.flatNumber}</p>
                            {order.comment && <p>💬 <strong>Комментарий:</strong> <em>{order.comment}</em></p>}
                          </div>

                          {/* Интерактивное управление статусом заказа */}
                          <div style={{ margin: '14px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                            <strong>Статус заказа:</strong>
                            <span 
                              style={{ 
                                backgroundColor: getStatusColor(order.status), 
                                color: 'white', 
                                padding: '3px 8px', 
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                fontSize: '12px'
                              }}
                            >
                              {order.status || "Готовится"}
                            </span>
                            
                            <select
                              value={order.status || "Готовится"}
                              onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid #d1d5db',
                                cursor: 'pointer',
                                fontSize: '13px',
                                marginLeft: '8px'
                              }}
                            >
                              <option value="Готовится">Готовится</option>
                              <option value="В пути">В пути</option>
                              <option value="Доставлено">Доставлено</option>
                            </select>
                          </div>

                          <div className="order-items-subtable" style={{ marginTop: '12px' }}>
                            <h5 style={{ margin: '0 0 6px 0' }}>Содержимое заказа:</h5>
                            <ul style={{ paddingLeft: '0', margin: '0' }}>
                              {order.items && order.items.map((item, index) => (
                                <li key={index} style={{ marginBottom: '4px', listStyleType: 'none' }}>
                                  • <strong>{item.name || item.title || `Товар (код: ${item.id})`}</strong> — {item.quantity} шт. × {item.price || 0} ₸
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
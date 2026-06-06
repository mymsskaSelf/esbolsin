import React from 'react';

export default function Header({ searchQuery, setSearchQuery, cartCount }) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Логотип */}
        <div className="flex items-center space-x-6">
          <h1 className="text-2xl font-black tracking-wider text-black uppercase">ЕСБОСЫН</h1>
          <span className="hidden md:inline text-xs text-gray-400">📍 Доставка в вашем ЖК</span>
        </div>
        
        {/* Поиск товаров по названию */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <input 
            type="text" 
            placeholder="Поиск продуктов..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-1.5 bg-gray-100 border border-transparent rounded-md focus:outline-none focus:border-black text-sm"
          />
        </div>

        {/* Корзина */}
        <div className="flex items-center space-x-4">
          <button className="relative p-2" onClick={() => alert('Оформление заказа доступно через API')}>
            <span className="text-xl">🛒</span>
            <span className="absolute -top-1 -right-1 bg-black text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
import React from 'react';
import { CATEGORIES } from '../mockData';

export default function Sidebar({ selectedCategory, setSelectedCategory }) {
  return (
    <aside className="w-64 shrink-0 hidden md:block">
      <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-4">Категории</h3>
      <ul className="space-y-1">
        <li>
          <button 
            onClick={() => setSelectedCategory("")}
            className={`w-full text-left px-3 py-2 text-sm rounded transition ${!selectedCategory ? 'bg-black text-white font-medium' : 'hover:bg-gray-100'}`}
          >
            Все товары
          </button>
        </li>
        {CATEGORIES.map(cat => (
          <li key={cat}>
            <button 
              onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left px-3 py-2 text-sm rounded transition ${selectedCategory === cat ? 'bg-black text-white font-medium' : 'hover:bg-gray-100'}`}
            >
              {cat}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
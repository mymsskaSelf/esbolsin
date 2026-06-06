import React from 'react';

export default function ProductCard({ product, onAddToCart }) {
  const isOutOfStock = product.stock === 0;

  return (
    <div className="group relative flex flex-col justify-between bg-white p-2 rounded-md border border-transparent hover:border-gray-100 transition">
      <div>
        {/* Контейнер изображения */}
        <div className="aspect-square w-full overflow-hidden bg-gray-50 rounded-md mb-3 relative border border-gray-100">
          <img 
            src={product.image} 
            alt={product.name} 
            className={`h-full w-full object-cover object-center group-hover:opacity-85 transition ${isOutOfStock ? 'grayscale' : ''}`}
          />
          {isOutOfStock && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">
              Закончился
            </span>
          )}
        </div>
        
        {/* Метаданные */}
        <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 h-10">{product.name}</h3>
        <div className="text-[11px] text-yellow-500 mb-2">⭐⭐⭐⭐⭐ <span className="text-gray-400">(0)</span></div>
      </div>
      
      {/* Цена и Действие */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
        <span className="text-base font-bold text-black">{product.price} ₸</span>
        <button 
          disabled={isOutOfStock}
          onClick={() => onAddToCart(product)}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-light transition ${
            isOutOfStock 
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
              : 'bg-gray-100 text-black hover:bg-black hover:text-white'
          }`}
        >
          +
        </button>
      </div>
    </div>
  );
}
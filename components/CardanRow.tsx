import React, { useState } from 'react';
import { CardanData } from '../types';
import { CopyIcon, CheckIcon, CartPlusIcon } from './Icons';

interface CardanRowProps {
  item: CardanData;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onAddToCart?: () => void;
  isInCart?: boolean;
  isDarkMode?: boolean;
}

const CardanRow: React.FC<CardanRowProps> = ({ 
  item, 
  quantity,
  onIncrement,
  onDecrement,
  onAddToCart,
  isInCart = false,
  isDarkMode = false
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const value = item.valor;
  const hasPrice = value && value !== '0,00' && value.trim() !== '' && value !== '-';

  return (
    <tr className={`transition-colors border-b last:border-0 group ${isDarkMode ? 'hover:bg-slate-800/50 border-slate-800' : 'hover:bg-slate-50 border-slate-100'}`}>
      
      {/* Cód. Interno */}
      <td className="py-2.5 pl-4 pr-2 whitespace-nowrap align-middle align-top">
        <div className="flex items-center gap-2 text-[11px] font-medium">
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>{item.codInterno}</span>
            <button 
                onClick={() => copyToClipboard(item.codInterno)}
                className={`transition-all p-0.5 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 ${copied ? 'text-green-500 bg-green-50 opacity-100' : 'text-slate-300 hover:text-blue-500 hover:bg-slate-100'}`}
                title={copied ? "Copiado!" : "Copiar código"}
            >
                {copied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
            </button>
        </div>
      </td>

      {/* Med. Tubo */}
      <td className="py-2.5 px-2 align-middle align-top">
        <span className={`text-[11px] font-medium block leading-snug ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          {item.medTubo || '-'}
        </span>
      </td>

      {/* ≠ Peças */}
      <td className="py-2.5 px-2 align-middle align-top">
        <span className={`text-[11px] block leading-snug ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          {item.pecas || '-'}
        </span>
      </td>

      {/* Cruzeta */}
      <td className="py-2.5 px-2 align-middle align-top">
        <span className={`text-[11px] font-semibold block leading-snug ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          {item.cruzeta || '-'}
        </span>
      </td>

      {/* Med. Cruzeta */}
      <td className="py-2.5 px-2 align-middle align-top">
        <span className={`text-[11px] block leading-snug ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          {item.medCruzeta || '-'}
        </span>
      </td>

      {/* Observações (Nova Coluna) */}
      <td className="py-2.5 px-2 align-middle align-top">
        <span className={`text-[10px] block leading-tight whitespace-normal min-w-[150px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {item.observacoes || '-'}
        </span>
      </td>

      {/* Valor */}
      <td className="py-2.5 px-2 whitespace-nowrap text-right align-middle align-top">
        {hasPrice ? (
          <span className={`font-bold text-[11px] ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>R$ {value}</span>
        ) : null}
      </td>

      {/* Qtd. */}
      <td className="py-2.5 px-2 align-middle align-top">
        {hasPrice && (
          <div className="flex items-center justify-center gap-1">
            <button 
              onClick={onDecrement}
              className={`w-5 h-5 flex items-center justify-center rounded border text-[10px] transition-colors cursor-pointer disabled:opacity-50 ${isDarkMode ? 'border-slate-700 text-slate-500 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}
              disabled={quantity === 0}
            >
              -
            </button>
            <div className={`w-6 text-center text-[11px] font-medium ${quantity > 0 ? (isDarkMode ? 'text-blue-400 font-bold' : 'text-blue-600 font-bold') : (isDarkMode ? 'text-slate-400' : 'text-slate-700')}`}>
              {quantity}
            </div>
            <button 
              onClick={onIncrement}
              className={`w-5 h-5 flex items-center justify-center rounded border text-[10px] transition-colors cursor-pointer ${isDarkMode ? 'border-slate-700 text-slate-500 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}
            >
              +
            </button>
          </div>
        )}
      </td>

      {/* ADIC. */}
      <td className="py-2.5 px-2 align-middle text-center pr-4 align-top">
        {hasPrice && onAddToCart && (
            <button 
                onClick={onAddToCart}
                className={`w-5 h-5 flex items-center justify-center rounded border transition-colors cursor-pointer mx-auto 
                  ${isInCart 
                    ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100' 
                    : (isDarkMode ? 'border-slate-700 text-slate-500 hover:bg-slate-800 hover:text-blue-400' : 'border-slate-200 text-slate-400 hover:bg-blue-50 hover:text-blue-600')
                  }`}
                title={isInCart ? "Item já no pedido (Adicionar mais)" : "Adicionar ao Pedido"}
            >
               <CartPlusIcon className="w-3.5 h-3.5" />
            </button>
        )}
      </td>
    </tr>
  );
};

export default CardanRow;
import React from 'react';
import { KitItemData } from '../types';
import { CopyIcon, CheckIcon, CartPlusIcon } from './Icons';

interface KitRowProps {
  kit: KitItemData;
  activeRate?: 'icms17' | 'icms12' | 'icms7';
  showVehicleColumn?: boolean;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onAddToCart?: () => void;
  isInCart?: boolean;
  isDarkMode?: boolean;
}

const KitRow: React.FC<KitRowProps> = ({ 
  kit, 
  activeRate = 'icms17', 
  showVehicleColumn = false,
  quantity,
  onIncrement,
  onDecrement,
  onAddToCart,
  isInCart = false,
  isDarkMode = false
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPriceDisplay = () => {
    switch (activeRate) {
      case 'icms12':
        return { value: kit.icms12 };
      case 'icms7':
        return { value: kit.icms7 };
      default:
        return { value: kit.icms17 };
    }
  };

  const { value } = getPriceDisplay();
  const hasPrice = kit.found && value && value !== '0,00' && value.trim() !== '' && value !== '-';
  const hasContent = kit.found;

  if (!hasContent) {
     return (
        <tr className={`transition-colors border-b last:border-0 ${isDarkMode ? 'hover:bg-slate-800/50 border-slate-800 text-slate-600' : 'hover:bg-slate-50 border-slate-100 text-slate-400'}`}>
          {showVehicleColumn && (
             <td className="py-2.5 pl-4 pr-3 whitespace-nowrap align-middle">
               <span className="text-[11px]">{kit.veiculo}</span>
             </td>
          )}
           <td className={`py-2.5 ${showVehicleColumn ? 'px-3' : 'pl-4 pr-3'} whitespace-nowrap align-middle`}>
            <span className="font-medium text-[11px]">{kit.tipoItem}</span>
          </td>
          <td colSpan={6} className="py-2.5 px-3 text-[11px] italic">
            -
          </td>
        </tr>
     )
  }

  return (
    <tr className={`transition-colors border-b last:border-0 group ${isDarkMode ? 'hover:bg-slate-800/50 border-slate-800' : 'hover:bg-slate-50 border-slate-100'}`}>
      {showVehicleColumn && (
        <td className="py-2.5 pl-4 pr-3 whitespace-nowrap align-middle">
          <span className={`font-bold text-[10px] px-2 py-0.5 rounded border ${isDarkMode ? 'text-blue-400 bg-blue-900/20 border-blue-900/30' : 'text-blue-800 bg-blue-50 border-blue-100'}`}>
            {kit.veiculo}
          </span>
        </td>
      )}

      <td className={`py-2.5 ${showVehicleColumn ? 'px-3' : 'pl-4 pr-3'} align-middle`}>
        <span className={`font-bold text-[11px] block max-w-[80px] whitespace-normal leading-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
          {kit.tipoItem}
        </span>
      </td>

      <td className="py-2.5 px-3 whitespace-nowrap align-middle">
        {kit.codInterno && (
          <div className="flex items-center gap-2 text-[11px] font-medium">
            <span className={isDarkMode ? 'text-slate-500' : 'text-slate-500'}>{kit.codInterno}</span>
            <button 
              onClick={() => copyToClipboard(kit.codInterno)}
              className={`transition-all p-0.5 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 ${copied ? 'text-green-500 bg-green-50 opacity-100' : 'text-slate-300 hover:text-blue-500 hover:bg-slate-100'}`}
              title={copied ? "Copiado!" : "Copiar código"}
            >
              {copied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
            </button>
          </div>
        )}
      </td>

      <td className="py-2.5 px-3 whitespace-nowrap align-middle">
        <span className={`font-semibold text-[11px] ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{kit.codFreiocar}</span>
      </td>

      <td className="py-2.5 px-3 align-middle">
        <span className={`text-[11px] block min-w-[200px] leading-snug uppercase ${kit.found ? (isDarkMode ? 'text-slate-400' : 'text-slate-600') : 'text-red-400 italic'}`}>
          {kit.descricao}
        </span>
      </td>

      <td className="py-2.5 px-3 whitespace-nowrap text-right align-middle">
        {hasPrice ? (
          <span className={`font-bold text-[11px] ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>R$ {value}</span>
        ) : null}
      </td>

      {/* Coluna Quantidade Centralizada */}
      <td className="py-2.5 px-3 align-middle">
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

      {/* Coluna Adicionar (Carrinho) */}
      <td className="py-2.5 px-3 align-middle text-center">
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

export default KitRow;
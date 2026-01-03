import React from 'react';
import { KitItemData } from '../types';
import { CopyIcon, CheckIcon } from './Icons';

interface KitRowProps {
  kit: KitItemData;
  activeRate?: 'icms17' | 'icms12' | 'icms7';
  showVehicleColumn?: boolean;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  isDarkMode?: boolean;
}

const KitRow: React.FC<KitRowProps> = ({ 
  kit, 
  activeRate = 'icms17', 
  showVehicleColumn = false,
  quantity,
  onIncrement,
  onDecrement,
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
             <td className="py-4 pl-4 pr-3 whitespace-nowrap align-middle">
               <span className="text-xs">{kit.veiculo}</span>
             </td>
          )}
           <td className={`py-4 ${showVehicleColumn ? 'px-3' : 'pl-4 pr-3'} whitespace-nowrap align-middle`}>
            <span className="font-medium text-xs">{kit.tipoItem}</span>
          </td>
          <td colSpan={5} className="py-4 px-3 text-xs italic">
            -
          </td>
        </tr>
     )
  }

  return (
    <tr className={`transition-colors border-b last:border-0 group ${isDarkMode ? 'hover:bg-slate-800/50 border-slate-800' : 'hover:bg-slate-50 border-slate-100'}`}>
      {showVehicleColumn && (
        <td className="py-4 pl-4 pr-3 whitespace-nowrap align-middle">
          <span className={`font-bold text-xs px-2 py-1 rounded border ${isDarkMode ? 'text-blue-400 bg-blue-900/20 border-blue-900/30' : 'text-blue-800 bg-blue-50 border-blue-100'}`}>
            {kit.veiculo}
          </span>
        </td>
      )}

      <td className={`py-4 ${showVehicleColumn ? 'px-3' : 'pl-4 pr-3'} align-middle`}>
        {/* Alterado: text-xs, max-w-[80px], whitespace-normal e leading-tight para forçar a quebra em 2 linhas */}
        <span className={`font-bold text-xs block max-w-[80px] whitespace-normal leading-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
          {kit.tipoItem}
        </span>
      </td>

      <td className="py-4 px-3 whitespace-nowrap align-middle">
        {kit.codInterno && (
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className={isDarkMode ? 'text-slate-500' : 'text-slate-500'}>{kit.codInterno}</span>
            <button 
              onClick={() => copyToClipboard(kit.codInterno)}
              className={`transition-all p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 ${copied ? 'text-green-500 bg-green-50 opacity-100' : 'text-slate-300 hover:text-blue-500 hover:bg-slate-100'}`}
              title={copied ? "Copiado!" : "Copiar código"}
            >
              {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </td>

      <td className="py-4 px-3 whitespace-nowrap align-middle">
        <span className={`font-semibold text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{kit.codFreiocar}</span>
      </td>

      <td className="py-4 px-3 align-middle">
        <span className={`text-xs block min-w-[200px] leading-snug uppercase ${kit.found ? (isDarkMode ? 'text-slate-400' : 'text-slate-600') : 'text-red-400 italic'}`}>
          {kit.descricao}
        </span>
      </td>

      <td className="py-4 px-3 whitespace-nowrap text-right align-middle">
        {hasPrice ? (
          <span className={`font-bold text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>R$ {value}</span>
        ) : null}
      </td>

      <td className="py-4 px-3 text-right pr-4 align-middle">
        {hasPrice && (
          <div className="flex items-center justify-end gap-1">
            <button 
              onClick={onDecrement}
              className={`w-6 h-6 flex items-center justify-center rounded border text-xs transition-colors cursor-pointer disabled:opacity-50 ${isDarkMode ? 'border-slate-700 text-slate-500 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}
              disabled={quantity === 0}
            >
              -
            </button>
            <div className={`w-8 text-center text-xs font-medium ${quantity > 0 ? (isDarkMode ? 'text-blue-400 font-bold' : 'text-blue-600 font-bold') : (isDarkMode ? 'text-slate-400' : 'text-slate-700')}`}>
              {quantity}
            </div>
            <button 
              onClick={onIncrement}
              className={`w-6 h-6 flex items-center justify-center rounded border text-xs transition-colors cursor-pointer ${isDarkMode ? 'border-slate-700 text-slate-500 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}
            >
              +
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

export default KitRow;
import React from 'react';
import { Kit3EixoData } from '../types';
import { CopyIcon, CheckIcon } from './Icons';

interface Kit3EixoRowProps {
  item: Kit3EixoData;
  activeRate?: 'icms17' | 'icms12' | 'icms7';
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  isDarkMode?: boolean;
}

const Kit3EixoRow: React.FC<Kit3EixoRowProps> = ({ 
  item, 
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

  const value = item.valor;
  const hasPrice = value && value !== '0,00' && value.trim() !== '' && value !== '-';

  // Lógica: Se descrição estiver vazia, usa a configuração
  const descriptionToDisplay = item.descricao && item.descricao.trim() !== '' 
    ? item.descricao 
    : item.configuracao;

  return (
    <tr className={`transition-colors border-b last:border-0 group ${isDarkMode ? 'hover:bg-slate-800/50 border-slate-800' : 'hover:bg-slate-50 border-slate-100'}`}>
      
      {/* Coluna 1: Tipo (Com quebra de linha forçada e max-width) */}
      <td className="py-2.5 pl-4 pr-3 align-middle">
        <span className={`font-bold text-[11px] block max-w-[80px] whitespace-normal leading-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
           {item.tipo}
        </span>
      </td>

       {/* Coluna 2: Cód. Interno (Trocado de lugar com Freiocar) */}
      <td className="py-2.5 px-3 whitespace-nowrap align-middle">
        {item.codInterno && (
          <div className="flex items-center gap-2 text-[11px] font-medium">
            <span className={isDarkMode ? 'text-slate-500' : 'text-slate-500'}>{item.codInterno}</span>
            <button 
              onClick={() => copyToClipboard(item.codInterno)}
              className={`transition-all p-0.5 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 ${copied ? 'text-green-500 bg-green-50 opacity-100' : 'text-slate-300 hover:text-blue-500 hover:bg-slate-100'}`}
              title={copied ? "Copiado!" : "Copiar código"}
            >
              {copied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
            </button>
          </div>
        )}
      </td>

      {/* Coluna 3: Cód. Freiocar */}
      <td className="py-2.5 px-3 whitespace-nowrap align-middle">
        <span className={`font-semibold text-[11px] ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{item.codFreiocar}</span>
      </td>

      {/* Coluna 4: Descrição (Ou Configuração se Descrição for vazia) */}
      <td className="py-2.5 px-3 align-middle">
        <span className={`text-[11px] font-medium block leading-snug uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>
          {descriptionToDisplay}
        </span>
      </td>

      {/* Coluna 5: Valor */}
      <td className="py-2.5 px-3 whitespace-nowrap text-right align-middle">
        {hasPrice ? (
          <span className={`font-bold text-[11px] ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>R$ {value}</span>
        ) : null}
      </td>

      {/* Coluna 6: QTD */}
      <td className="py-2.5 px-3 text-right pr-4 align-middle w-24">
        {hasPrice && (
          <div className="flex items-center justify-end gap-1">
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
    </tr>
  );
};

export default Kit3EixoRow;
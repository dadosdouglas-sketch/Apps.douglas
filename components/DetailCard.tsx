import React, { useState } from 'react';
import { PartData } from '../types';
import { CopyIcon, CheckIcon } from './Icons';

interface DetailCardProps {
  part: PartData;
  activeRate?: 'icms17' | 'icms12' | 'icms7';
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  isDarkMode?: boolean;
}

const DetailCard: React.FC<DetailCardProps> = ({ 
  part, 
  activeRate = 'icms17',
  quantity,
  onIncrement,
  onDecrement,
  isDarkMode = false
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPriceDisplay = () => {
    switch (activeRate) {
      case 'icms12':
        return { value: part.icms12, label: 'ICMS 12%' };
      case 'icms7':
        return { value: part.icms7, label: 'ICMS 7%' };
      default:
        return { value: part.icms17, label: 'ICMS 17%' };
    }
  };

  const { value } = getPriceDisplay();
  const hasPrice = value && value !== '0,00' && value.trim() !== '' && value !== '-';

  const descriptionClass = `py-2.5 px-2 text-[11px] align-middle ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`;
  const dimClass = `py-2.5 px-2 text-center text-[11px] w-10 align-middle ${isDarkMode ? 'text-slate-500' : 'text-slate-600'}`;

  return (
    <tr className={`transition-colors group border-b last:border-0 ${isDarkMode ? 'hover:bg-slate-800/50 border-slate-800' : 'hover:bg-slate-50 border-slate-100'}`}>
      <td className="py-2.5 pl-3 pr-2 w-[85px] align-middle">
        <span className={`font-bold text-[11px] block leading-tight whitespace-normal ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{part.veiculo}</span>
      </td>

      <td className="py-2.5 px-2 whitespace-nowrap align-middle">
        <div className="flex items-center gap-2 text-[11px] font-medium">
          <span className={isDarkMode ? 'text-slate-500' : 'text-slate-500'}>{part.codInterno}</span>
          <button 
            onClick={() => copyToClipboard(part.codInterno)}
            className={`transition-all p-0.5 rounded-md ${copied ? 'text-green-500 bg-green-50' : 'text-slate-300 hover:text-blue-500 hover:bg-slate-100'}`}
            title={copied ? "Copiado!" : "Copiar código"}
          >
            {copied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
          </button>
        </div>
      </td>

      <td className="py-2.5 px-2 whitespace-nowrap align-middle">
        <span className={`font-semibold text-[11px] ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{part.codFreiocar}</span>
      </td>

      <td className={`${descriptionClass} whitespace-nowrap`}>
        {part.modelo}
      </td>

      <td className={`${descriptionClass} min-w-[140px] max-w-[220px] leading-tight whitespace-normal`}>
        {part.aplicacao}
      </td>

      {/* Coluna Lado em Negrito */}
      <td className={`${descriptionClass} whitespace-nowrap font-bold`}>
        {part.lado}
      </td>

      <td className={dimClass}>{part.dimA}</td>
      <td className={dimClass}>{part.dimB}</td>
      <td className={dimClass}>{part.dimC}</td>
      <td className={dimClass}>{part.dimD}</td>

      <td className="py-2.5 px-2 whitespace-nowrap text-right pr-4 align-middle">
        <div className="flex flex-col items-end gap-0.5">
           <span className={`font-bold text-[11px] ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>R$ {value}</span>
        </div>
      </td>

      <td className="py-2.5 px-2 text-right pr-4 align-middle w-24">
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

export default DetailCard;
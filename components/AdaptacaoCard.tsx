import React, { useState, useId } from 'react';
import { AdaptacaoData } from '../types';
import { TagIcon, CopyIcon, CheckIcon, PrinterIcon } from './Icons';

interface AdaptacaoCardProps {
  data: AdaptacaoData;
  isDarkMode?: boolean;
}

const AdaptacaoCard: React.FC<AdaptacaoCardProps> = ({ data, isDarkMode = false }) => {
  const [copied, setCopied] = useState(false);
  
  // Gera um ID único e seguro para o DOM
  const uniqueId = `adaptacao-card-${useId().replace(/:/g, '')}`;

  const copyToClipboard = () => {
    if (data.codProduto) {
      navigator.clipboard.writeText(data.codProduto);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    const cardElement = document.getElementById(uniqueId);
    if (!cardElement) return;

    // Clonar o elemento para manipulação
    const clone = cardElement.cloneNode(true) as HTMLElement;
    
    // Remover o botão de imprimir do clone para não aparecer na impressão
    const printBtn = clone.querySelector('.print-btn');
    if (printBtn) printBtn.remove();

    // Abrir janela de impressão
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Imprimir Cartão</title>');
    // Injetar Tailwind
    printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
    // Estilos de impressão
    printWindow.document.write(`
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { 
          font-family: 'Inter', sans-serif; 
          padding: 20px; 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact;
          display: flex;
          justify-content: center;
        }
        /* Forçar layout do cartão para impressão */
        #${uniqueId} {
            width: 100% !important;
            max-width: 800px !important;
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
        }
      </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write(clone.outerHTML);
    printWindow.document.write('<script>window.onload = function() { window.print(); window.close(); }</script>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
  };

  // Componente de Campo de Destaque (Estilo Placa, mas fonte Sans e alinhado)
  const HighlightField = ({ label, value }: { label: string, value: string }) => (
    <div className="flex flex-col items-center justify-center w-full">
      <span className="text-[10px] text-slate-400 uppercase font-bold mb-0.5 tracking-wide">{label}</span>
      <div className={`
        ${isDarkMode ? 'text-blue-400' : 'text-blue-700'} 
        text-xs font-bold font-sans 
        uppercase 
        truncate
        w-full
        text-center
        leading-tight
      `}>
        {value || '-'}
      </div>
    </div>
  );

  // Componente de Campo Secundário
  const InfoField = ({ label, value, align = 'left' }: { label: string, value: string, align?: 'left' | 'center' | 'right' }) => (
    <div className={`flex flex-col ${align === 'right' ? 'items-end' : (align === 'center' ? 'items-center' : 'items-start')}`}>
       <span className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">{label}</span>
       <div className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'} truncate`}>{value || '-'}</div>
    </div>
  );

  return (
    <div id={uniqueId} className={`p-4 rounded-xl shadow-sm border relative font-sans w-full mx-auto mb-3 transition-colors animate-fade-in-up ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
      
      {/* Top Grid: Identificadores Principais (Alinhados) */}
      <div className={`grid grid-cols-3 gap-4 mb-3 pb-3 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
         <HighlightField label="Nº Série" value={data.nSerie} />
         <HighlightField label="Nota Fiscal" value={data.notaFiscal} />
         <HighlightField label="Certificado Garantia" value={data.certGarantia} />
      </div>

      {/* Rows: Especificações Técnicas */}
      <div className="mb-4 space-y-3">
          {/* Row 1: Cert. Cardan & Fabricação (Extremos) */}
          <div className="flex justify-between items-center">
               <InfoField label="Cert. Cardan" value={data.certCardan} />
               <InfoField label="Fabricação" value={data.dataFabricacao} align="right" />
          </div>

           {/* Row 2: Modelo & PBT (Extremos) */}
          <div className="flex justify-between items-center">
              <InfoField label="Modelo" value={data.modeloCaminhao} />
              <InfoField label="PBT" value={data.pbt} align="right" />
          </div>
      </div>

      {/* Product Highlight Box */}
      <div className={`p-3 rounded-lg mb-3 ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
        <div className="flex items-center justify-between mb-2">
            <div>
                 <span className="text-[10px] text-slate-400 uppercase font-bold">Código</span>
                 <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold text-sm ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{data.codProduto}</span>
                    <button 
                    onClick={copyToClipboard}
                    className={`transition-all p-1 rounded-md ${
                        copied 
                        ? 'text-green-500 bg-green-50' 
                        : 'text-slate-300 hover:text-blue-500 hover:bg-slate-200'
                    }`}
                    title={copied ? "Copiado!" : "Copiar código"}
                    >
                    {copied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
                    </button>
                 </div>
            </div>
        </div>
        <div>
             <span className="text-[10px] text-slate-400 uppercase font-bold block">Descrição</span>
             <div className={`text-sm font-bold leading-tight ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                {data.descProduto}
             </div>
        </div>
      </div>

      {/* Traceability Grid */}
      <div className={`grid grid-cols-3 gap-2 mb-3 pt-3 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
         <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Rast. Flange</span>
            <span className="font-mono text-[10px] text-slate-500">{data.rastFlange}</span>
         </div>
         <div className="text-center flex flex-col items-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Ponteira</span>
            <span className="font-mono text-[10px] text-slate-500">{data.ponteira}</span>
         </div>
         <div className="text-right flex flex-col items-end">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Rast. Tubo</span>
            <span className="font-mono text-[10px] text-slate-500">{data.rastTubo}</span>
         </div>
      </div>

      {/* Footer Minimal Info & Print Button */}
      <div className="pt-1 mt-1">
        {/* Linha 1: Informações distribuídas (Restaurado) */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
            <span>Conc: <strong className="text-slate-600">{data.concessionaria}</strong></span>
            <span>Ped: <strong className="text-slate-600">{data.pedido}</strong></span>
            <span>OP: <strong className="text-slate-600">{data.op}</strong></span>
        </div>

        {/* Linha 2: Botão de Impressão (Abaixo do OP / Direita) */}
        <div className="flex justify-end mt-2">
            <button 
                onClick={handlePrint}
                className={`
                    print-btn
                    p-1.5 rounded-lg transition-colors
                    ${isDarkMode ? 'text-slate-500 hover:text-blue-400 hover:bg-slate-800' : 'text-slate-300 hover:text-blue-600 hover:bg-slate-100'}
                `}
                title="Imprimir Cartão"
            >
                <PrinterIcon className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdaptacaoCard;
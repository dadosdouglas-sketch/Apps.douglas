import React, { useState, useEffect, useMemo } from 'react';
import { fetchSheetData, RawKitRow } from './services/sheetService';
import { PartData, KitItemData, LoadingState, AdaptacaoData, Kit3EixoData, UserCredential } from './types';
import DetailCard from './components/DetailCard';
import KitRow from './components/KitRow';
import Kit3EixoRow from './components/Kit3EixoRow';
import AdaptacaoCard from './components/AdaptacaoCard';
import { SearchIcon, RefreshIcon, WrenchIcon, DiscIcon, FaTruckMoving, AxleIcon, LogoutIcon, UserIcon, ChevronLeftIcon, ChevronRightIcon, InfoIcon, ShoppingCartIcon, BrakeDiscIcon, FastTruckIcon, SlackAdjusterIcon, TruckIcon } from './components/Icons';

// =========================================================
// PONTO DE RESTAURAÇÃO: CONFIGURAÇÃO ESTÁVEL DE INTERFACE
// =========================================================
const UI_STABLE_CONFIG = {
  version: "2.3.5-compact-ui",
  primaryColor: "bg-blue-600",
  secondaryColor: "bg-white",
  // Cores atualizadas para o novo estilo minimalista com barra indicadora e rodapé fixo
  footerBg: "bg-white border-slate-200",
  mainBg: "bg-slate-50",
  loginBgUrl: "https://lh3.googleusercontent.com/d/1nGDJhj0wbPwkjXeEemmJSgc8QG0dUFZA",
  logoUrl: "https://lh3.googleusercontent.com/d/1M6qN4seZa2cLgXU2j6Ehdhjj_XzauBCs", // Logo Preto (Login)
  headerLogoUrl: "https://lh3.googleusercontent.com/d/1N39JjKJuqlB55sDdesPsd9n1jUsojVBZ", // Logo Branco (App Expandido)
  collapsedLogoUrl: "https://lh3.googleusercontent.com/d/1KVKYO0kGBxB03DlZtfqj099uqkllOF8k" // Logo Branco (App Comprimido)
};

const BRAZILIAN_STATES = [
  { name: 'Acre', uf: 'AC', rate: 'icms7' },
  { name: 'Alagoas', uf: 'AL', rate: 'icms7' },
  { name: 'Amapá', uf: 'AP', rate: 'icms7' },
  { name: 'Amazonas', uf: 'AM', rate: 'icms7' },
  { name: 'Bahia', uf: 'BA', rate: 'icms7' },
  { name: 'Ceará', uf: 'CE', rate: 'icms7' },
  { name: 'Distrito Federal', uf: 'DF', rate: 'icms7' },
  { name: 'Espírito Santo', uf: 'ES', rate: 'icms7' },
  { name: 'Goiás', uf: 'GO', rate: 'icms7' },
  { name: 'Maranhão', uf: 'MA', rate: 'icms7' },
  { name: 'Mato Grosso', uf: 'MT', rate: 'icms7' },
  { name: 'Mato Grosso do Sul', uf: 'MS', rate: 'icms7' },
  { name: 'Minas Gerais', uf: 'MG', rate: 'icms12' },
  { name: 'Pará', uf: 'PA', rate: 'icms7' },
  { name: 'Paraíba', uf: 'PB', rate: 'icms7' },
  { name: 'Paraná', uf: 'PR', rate: 'icms12' },
  { name: 'Pernambuco', uf: 'PE', rate: 'icms7' },
  { name: 'Piauí', uf: 'PI', rate: 'icms7' },
  { name: 'Rio de Janeiro', uf: 'RJ', rate: 'icms12' },
  { name: 'Rio Grande do Norte', uf: 'RN', rate: 'icms7' },
  { name: 'Rio Grande do Sul', uf: 'RS', rate: 'icms17' },
  { name: 'Rondônia', uf: 'RO', rate: 'icms7' },
  { name: 'Roraima', uf: 'RR', rate: 'icms7' },
  { name: 'Santa Catarina', uf: 'SC', rate: 'icms12' },
  { name: 'São Paulo', uf: 'SP', rate: 'icms12' },
  { name: 'Sergipe', uf: 'SE', rate: 'icms7' },
  { name: 'Tocantins', uf: 'TO', rate: 'icms7' },
];

type TabType = 'catracas' | 'kits' | 'kit3eixo' | 'adaptacoes' | 'pedidos';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('kits');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [authorizedUsers, setAuthorizedUsers] = useState<UserCredential[]>([]);
  
  const [catracasData, setCatracasData] = useState<PartData[]>([]);
  const [kitRows, setKitRows] = useState<RawKitRow[]>([]);
  const [adaptacoesData, setAdaptacoesData] = useState<AdaptacaoData[]>([]);
  const [kit3EixoData, setKit3EixoData] = useState<Kit3EixoData[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  
  const [selectedVeiculo, setSelectedVeiculo] = useState<string>('');
  const [selectedUF, setSelectedUF] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const isRestrictedUser = useMemo(() => loginUser.toLowerCase().trim() === 'schunemann', [loginUser]);

  const [kitQuantities, setKitQuantities] = useState<Record<string, number>>({});
  const [catracaQuantities, setCatracaQuantities] = useState<Record<string, number>>({});
  const [kit3EixoQuantities, setKit3EixoQuantities] = useState<Record<string, number>>({});
  const [isConsumerFinal, setIsConsumerFinal] = useState<boolean>(false);
  
  // Novos estados para Cuica Simples e Dupla
  const [isCuicaSimples, setIsCuicaSimples] = useState<boolean>(false);
  const [isCuicaDupla, setIsCuicaDupla] = useState<boolean>(false);

  // Novos estados para Eixo Redondo e Tubular
  const [isEixoRedondo, setIsEixoRedondo] = useState<boolean>(false);
  const [isEixoTubular, setIsEixoTubular] = useState<boolean>(false);

  useEffect(() => { loadData(); }, []);

  // Regra automática: Gerenciar quantidades quando o veículo selecionado muda
  useEffect(() => {
    // Resetar quantidades das outras abas
    setKitQuantities({});
    setCatracaQuantities({});

    // Para Kit 3º Eixo: Preencher com quantidades padrão da planilha
    if (selectedVeiculo && kit3EixoData.length > 0) {
      const defaults: Record<string, number> = {};
      
      // Filtrar itens do veículo selecionado para extrair defaults
      const vehicleItems = kit3EixoData.filter(item => item.veiculo === selectedVeiculo);
      
      vehicleItems.forEach(item => {
        // Se houver quantidade padrão definida e o item tiver código
        if (item.qtdPadrao > 0 && item.codInterno) {
          defaults[item.codInterno] = item.qtdPadrao;
        }
      });
      
      setKit3EixoQuantities(defaults);
    } else {
      // Se nenhum veículo selecionado, zerar tudo
      setKit3EixoQuantities({});
    }
  }, [selectedVeiculo, kit3EixoData]);

  const loadData = async () => {
    setLoadingState(LoadingState.LOADING);
    try {
      const { catracas, kitRows, adaptacoes, kit3Eixo, users } = await fetchSheetData();
      setCatracasData(catracas);
      setKitRows(kitRows);
      setAdaptacoesData(adaptacoes);
      setKit3EixoData(kit3Eixo);
      setAuthorizedUsers(users);
      setLoadingState(LoadingState.SUCCESS);
    } catch (error) {
      console.error(error);
      setLoadingState(LoadingState.ERROR);
    }
  };

  const handleClearFilters = () => {
    setSelectedVeiculo('');
    setSelectedUF('');
    setSearchTerm('');
    setKitQuantities({});
    setCatracaQuantities({});
    setKit3EixoQuantities({});
    setIsConsumerFinal(false);
    setIsCuicaSimples(false);
    setIsCuicaDupla(false);
    setIsEixoRedondo(false);
    setIsEixoTubular(false);
  };

  const isCredentialValid = useMemo(() => {
    if (!loginUser || !loginPass) return false;
    return authorizedUsers.some(u => u.usuario.toLowerCase() === loginUser.toLowerCase().trim() && u.senha === loginPass);
  }, [loginUser, loginPass, authorizedUsers]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCredentialValid) {
      setIsLoggedIn(true);
      if (isRestrictedUser) setActiveTab('kit3eixo');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginUser('');
    setLoginPass('');
    setActiveTab('kits');
    handleClearFilters();
  };

  const activeRate = useMemo<'icms17' | 'icms12' | 'icms7'>(() => {
    if (!selectedUF) return 'icms17';
    const state = BRAZILIAN_STATES.find(s => s.uf === selectedUF);
    return (state?.rate as 'icms17' | 'icms12' | 'icms7') || 'icms17';
  }, [selectedUF]);

  const uniqueVehicles = useMemo(() => Array.from(new Set(catracasData.map(item => item.veiculo))).sort(), [catracasData]);
  const uniqueKitsVehicles = useMemo(() => Array.from(new Set(kitRows.map(item => item.veiculo))).sort(), [kitRows]);
  const unique3EixoVehicles = useMemo(() => Array.from(new Set(kit3EixoData.map(item => item.veiculo))).sort(), [kit3EixoData]);

  const filteredCatracas = useMemo(() => {
    let result = catracasData;
    if (selectedVeiculo) result = result.filter(item => item.veiculo === selectedVeiculo);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(item => 
        item.codInterno.toLowerCase().includes(term) ||
        item.codFreiocar.toLowerCase().includes(term) ||
        item.modelo.toLowerCase().includes(term) ||
        item.aplicacao.toLowerCase().includes(term)
      );
    }
    return (!selectedVeiculo && !searchTerm.trim()) ? [] : result;
  }, [catracasData, selectedVeiculo, searchTerm]);

  const filtered3EixoItems = useMemo(() => {
    let result = kit3EixoData;
    
    // 1. Filtragem por Veículo
    if (selectedVeiculo) {
      result = result.filter(item => item.veiculo === selectedVeiculo);
    }
    
    // 2. Filtragem Dinâmica por Botões (Baseado na Coluna Configuração E Tipo como Fallback)
    result = result.filter(item => {
      const config = (item.configuracao || '').toUpperCase();
      const tipo = (item.tipo || '').toUpperCase();
      const fullText = `${config} ${tipo}`;

      if (isEixoRedondo && (fullText.includes('RETANGULAR') || fullText.includes('TUBULAR'))) return false;
      if (isEixoTubular && fullText.includes('REDONDO')) return false;
      if (isCuicaSimples && fullText.includes('DUPLA')) return false;
      if (isCuicaDupla && fullText.includes('SIMPLES')) return false;

      return true;
    });

    if (!selectedVeiculo && !searchTerm.trim()) return [];

    return result;
  }, [kit3EixoData, selectedVeiculo, searchTerm, isEixoRedondo, isEixoTubular, isCuicaSimples, isCuicaDupla]);

  const filteredAdaptacoes = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase().trim();
    return adaptacoesData.filter(item => 
      item.notaFiscal.toLowerCase().includes(term) || 
      item.nSerie.toLowerCase().includes(term) || 
      item.certGarantia.toLowerCase().includes(term)
    );
  }, [adaptacoesData, searchTerm]);

  const extractKitItemsFromRow = (row: RawKitRow): KitItemData[] => {
    const raw = row.data;
    const extractItem = (label: string, start: number): KitItemData => {
      const codF = raw[start + 1]?.trim() || '';
      const codI = raw[start + 2]?.trim() || '';
      return {
        veiculo: row.veiculo,
        tipoItem: label,
        codInterno: codI === label || codI === '-' ? '' : codI,
        codFreiocar: codF === label || codF === '-' ? '' : codF,
        descricao: raw[start + 3]?.trim() || '',
        icms17: raw[start + 4]?.trim() || '0,00',
        icms12: raw[start + 5]?.trim() || '0,00',
        icms7: raw[start + 6]?.trim() || '0,00',
        found: codI !== '' || codF !== ''
      };
    };
    return [
      extractItem('Freio Lado Esquerdo', 1),
      extractItem('Freio Lado Direito', 8),
      extractItem('Kit de Instalação', 15),
      extractItem('Camara (cuica)', 22),
      extractItem('Tambor de Freio', 29)
    ];
  };

  const filteredKitItems = useMemo(() => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      const allItems = kitRows.flatMap(row => extractKitItemsFromRow(row));
      
      return allItems.filter(item => 
        item.found && (
          item.codInterno.toLowerCase().includes(term) ||
          item.codFreiocar.toLowerCase().includes(term) ||
          item.descricao.toLowerCase().includes(term)
        )
      );
    }
    if (selectedVeiculo) {
      const row = kitRows.find(k => k.veiculo === selectedVeiculo);
      const items = row ? extractKitItemsFromRow(row) : [];
      return items.filter(i => i.found);
    }
    return [];
  }, [kitRows, selectedVeiculo, searchTerm]);

  const parsePrice = (priceStr: string): number => {
    if (!priceStr) return 0;
    const cleanStr = priceStr.replace(/[^\d,]/g, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanStr) || 0;
  };

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const totals = useMemo(() => {
    let subtotal = 0;
    if (activeTab === 'kits') {
      Object.entries(kitQuantities).forEach(([key, qty]) => {
        const item = filteredKitItems.find(i => i.tipoItem === key); 
        if (item) subtotal += parsePrice(activeRate === 'icms12' ? item.icms12 : (activeRate === 'icms7' ? item.icms7 : item.icms17)) * qty;
      });
    } else if (activeTab === 'catracas') {
      Object.entries(catracaQuantities).forEach(([id, qty]) => {
        const part = catracasData.find(p => p.codInterno === id);
        if (part) subtotal += parsePrice(activeRate === 'icms12' ? part.icms12 : (activeRate === 'icms7' ? part.icms7 : part.icms17)) * qty;
      });
    } else if (activeTab === 'kit3eixo') {
      filtered3EixoItems.forEach(item => subtotal += parsePrice(item.valor) * (kit3EixoQuantities[item.codInterno] || 0));
    }
    const ipi = subtotal * 0.0325;
    let total = subtotal + ipi;
    if (isConsumerFinal) total *= 1.05;
    return { subtotal, ipi, total };
  }, [kitQuantities, catracaQuantities, kit3EixoQuantities, activeTab, filteredKitItems, catracasData, filtered3EixoItems, activeRate, isConsumerFinal, filtered3EixoItems]);

  const selectedKitObservation = useMemo(() => {
    if (activeTab !== 'kits' || !selectedVeiculo) return '';
    const row = kitRows.find(r => r.veiculo === selectedVeiculo);
    return row?.data[36]?.trim() || '';
  }, [activeTab, selectedVeiculo, kitRows]);

  // LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-center bg-cover bg-no-repeat" style={{ backgroundImage: `url(${UI_STABLE_CONFIG.loginBgUrl})` }} />
        <div className="absolute inset-0 z-0 bg-slate-900/40 backdrop-blur-[2px]" />
        <div className="relative z-10 bg-white p-8 rounded-2xl shadow-2xl max-w-xs w-full animate-fade-in-up border border-slate-100">
          <div className="flex justify-center mb-6">
            <img src={UI_STABLE_CONFIG.logoUrl} alt="Freiocar Logo" className="h-6 object-contain" />
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Usuário</label>
              <input type="text" value={loginUser} onChange={e => setLoginUser(e.target.value.toUpperCase())} className="w-full bg-slate-100 border-none p-2 text-[11px] rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-800 font-semibold uppercase h-8" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Senha</label>
              <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} className="w-full bg-slate-100 border-none p-2 text-[11px] rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-800 font-semibold h-8" />
            </div>
            <div className="flex flex-col items-center gap-3 pt-3">
              <button type="submit" disabled={!isCredentialValid} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-full font-bold text-xs tracking-wide shadow-md hover:shadow-lg transition-all disabled:bg-slate-300 disabled:shadow-none uppercase">ENTRAR</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- APP LAYOUT (SIDEBAR + CONTENT) ---

  const renderControls = (vehicles: string[], label: string, showSearchAndState: boolean = true) => {
    const activeStateObj = BRAZILIAN_STATES.find(s => s.uf === selectedUF);
    const icmsValue = activeStateObj ? activeStateObj.rate.replace('icms', '') : '17';
    const icmsDisplay = `${icmsValue}% ICMS`;

    return (
      <div className="flex flex-col gap-3 mb-4 animate-fade-in-up">
        {/* Linha 1: Filtros Principais */}
        <div className="flex flex-col md:flex-row gap-3 items-end">
          
          {/* Seletor de Veículo */}
          <div className="flex-1 w-full">
            <label className="block text-[9px] font-bold text-black uppercase mb-1 ml-1">{label}</label>
            <div className="relative">
              <select
                value={selectedVeiculo}
                onChange={e => setSelectedVeiculo(e.target.value)}
                className="w-full h-8 pl-3 pr-8 border border-slate-300 rounded-lg bg-white text-[11px] font-medium text-slate-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none transition-all shadow-sm"
              >
                <option value="">Selecione...</option>
                {vehicles.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <ChevronRightIcon className="h-3 w-3 rotate-90" />
              </div>
            </div>
          </div>

          {/* Filtros de Estado e ICMS (Apenas quando aplicável) */}
          {showSearchAndState && (
            <>
                <div className="w-full md:w-56">
                   <label className="block text-[9px] font-bold text-black uppercase mb-1 ml-1">Estado</label>
                   <div className="relative">
                     <select
                       value={selectedUF}
                       onChange={e => setSelectedUF(e.target.value)}
                       className="w-full h-8 pl-3 pr-8 border border-slate-300 rounded-lg bg-white text-[11px] font-medium text-slate-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none transition-all shadow-sm"
                     >
                       <option value="">Selecione...</option>
                       {BRAZILIAN_STATES.map(state => (
                         <option key={state.uf} value={state.uf}>{state.uf} - {state.name}</option>
                       ))}
                     </select>
                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                       <ChevronRightIcon className="h-3 w-3 rotate-90" />
                     </div>
                   </div>
                </div>
                
                {/* Campo Visual do ICMS */}
                <div className="w-full md:w-28">
                    <label className="block text-[9px] font-bold text-black uppercase mb-1 ml-1">ICMS</label>
                    <div className="h-8 flex items-center px-3 bg-slate-100 border border-slate-200 rounded-lg whitespace-nowrap w-full">
                        <span className="text-[11px] font-semibold text-slate-600 tracking-wide">
                            {icmsDisplay}
                        </span>
                    </div>
                </div>
            </>
          )}

          {/* Botão Limpar para telas SEM Busca (Ex: Kit 3 Eixo) */}
          {!showSearchAndState && (
            <button 
                onClick={handleClearFilters}
                className="h-8 px-3 flex items-center justify-center text-[9px] font-bold uppercase tracking-wider text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100"
                title="Limpar todos os filtros"
            >
                Limpar
            </button>
          )}
        </div>

        {/* Linha 2: Busca e Botão Limpar (Apenas quando aplicável) */}
        {showSearchAndState && (
          <div className="flex gap-2 items-center w-full">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Digite para pesquisar em todos os itens..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-8 pl-9 pr-3 border border-slate-300 rounded-lg bg-white text-[11px] font-medium text-slate-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
              />
            </div>
            
            {/* Botão Limpar Inline Minimalista */}
            <button 
                onClick={handleClearFilters}
                className="h-8 px-3 flex items-center justify-center text-[9px] font-bold uppercase tracking-wider text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100 whitespace-nowrap"
                title="Limpar todos os filtros"
            >
                Limpar
            </button>
          </div>
        )}
      </div>
    );
  };

  const menuItems = [
    { id: 'kits', label: 'Kits de Freio', icon: <BrakeDiscIcon className="w-4 h-4" />, visible: !isRestrictedUser },
    { id: 'catracas', label: 'Catracas de Freio', icon: <SlackAdjusterIcon className="w-4 h-4" />, visible: !isRestrictedUser },
    { id: 'kit3eixo', label: 'Kit 3º Eixo', icon: <AxleIcon className="w-4 h-4" />, visible: true },
    { id: 'adaptacoes', label: 'Adaptações 3º Eixo', icon: <TruckIcon className="w-4 h-4" />, visible: !isRestrictedUser },
    { id: 'pedidos', label: 'Pedido de itens', icon: <ShoppingCartIcon className="w-4 h-4" />, visible: true },
  ];

  const currentTabLabel = menuItems.find(m => m.id === activeTab)?.label;
  const showTable = selectedVeiculo || searchTerm;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-xs">
      
      {/* SIDEBAR FLUTUANTE */}
      <aside 
        className={`
          relative flex flex-col shadow-2xl z-20 transition-all duration-300 ease-in-out
          ${UI_STABLE_CONFIG.primaryColor}
          m-4 rounded-3xl h-[calc(100vh-2rem)]
          ${isSidebarCollapsed ? 'w-16' : 'w-56'}
        `}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-8 bg-white text-blue-600 rounded-full p-1 shadow-md z-30 border border-blue-50 hover:bg-slate-50 hover:scale-110 transition-transform"
        >
          {isSidebarCollapsed ? <ChevronRightIcon className="w-3.5 h-3.5" /> : <ChevronLeftIcon className="w-3.5 h-3.5" />}
        </button>

        {/* Sidebar Logo */}
        <div className={`h-14 flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'px-5'} transition-all`}>
          <img 
            src={isSidebarCollapsed ? UI_STABLE_CONFIG.collapsedLogoUrl : UI_STABLE_CONFIG.headerLogoUrl} 
            alt="Logo" 
            className={`object-contain transition-all duration-300 ${isSidebarCollapsed ? 'h-4 w-auto' : 'h-4 w-auto'}`} 
          />
        </div>

        {/* Sidebar Menu */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden py-3 custom-scrollbar-none">
          {menuItems.filter(m => m.visible).map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id as TabType); handleClearFilters(); }}
                className={`
                  w-full flex items-center rounded-lg font-medium transition-all duration-200 group relative
                  ${isSidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-1.5 text-[11px]'} 
                  ${isActive ? 'text-white bg-white/10' : 'text-blue-300 hover:text-white hover:bg-white/5'}
                `}
                title={isSidebarCollapsed ? item.label : ''}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white rounded-r-full shadow-[0_0_8px_rgba(255,255,255,0.4)]"></span>
                )}

                <span className={`shrink-0 ${isActive ? 'text-white' : 'text-blue-300 group-hover:text-white'}`}>
                  {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: "w-3.5 h-3.5" })}
                </span>
                
                <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer (Minimalist Logout) */}
        <div className={`border-t border-blue-500/30 bg-blue-700/10 transition-all duration-300 ${isSidebarCollapsed ? 'p-2 py-3' : 'p-2.5'}`}>
          <button 
            onClick={handleLogout}
            className={`
              w-full flex items-center justify-center rounded-lg text-blue-300 hover:text-white hover:bg-white/5 transition-all
              ${isSidebarCollapsed ? 'p-1.5' : 'gap-2 px-3 py-1.5'}
            `}
            title="Sair da conta"
          >
            <LogoutIcon className="w-3.5 h-3.5" />
            <span className={`text-[10px] font-medium tracking-wide ${isSidebarCollapsed ? 'hidden' : 'block'}`}>SAIR</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50">
        
        {/* Top Header - Flutuante e Fixo com Botão Carrinho */}
        <header className="bg-white mx-5 mt-5 p-3 rounded-xl shadow-sm flex items-center justify-between z-10 sticky top-5">
          <div>
            <h1 className="text-base font-bold text-slate-700 tracking-tight ml-2">{currentTabLabel}</h1>
          </div>
          
          {/* Botão de Carrinho no Cabeçalho */}
          <button
             onClick={() => setActiveTab('pedidos')}
             className={`
                relative group p-1.5 rounded-lg transition-all duration-200
                ${activeTab === 'pedidos' ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'}
             `}
             title="Ir para Pedidos"
          >
             <ShoppingCartIcon className="w-4 h-4" />
             {totals.total > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full border border-white shadow-sm"></span>
             )}
          </button>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-5 md:p-6 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-5">
            
            {activeTab === 'catracas' && (
              <div className="animate-fade-in-up">
                {renderControls(uniqueVehicles, "Modelo do Veículo", true)}
                {showTable ? (
                  <div className="border rounded-xl overflow-hidden bg-white border-slate-200 shadow-sm animate-fade-in-up">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                        <tr>
                          <th className="px-3 py-2.5">Veículo</th>
                          <th className="px-2 py-2.5">Cód. Interno</th>
                          <th className="px-2 py-2.5">Cód. Freiocar</th>
                          <th className="px-2 py-2.5">Modelo</th>
                          <th className="px-2 py-2.5">Aplicação</th>
                          <th className="px-2 py-2.5">Lado</th>
                          <th className="px-1 py-2.5 text-center">A</th>
                          <th className="px-1 py-2.5 text-center">B</th>
                          <th className="px-1 py-2.5 text-center">C</th>
                          <th className="px-1 py-2.5 text-center">D</th>
                          <th className="px-2 py-2.5 text-right">Valor</th>
                          <th className="px-2 py-2.5 text-right">Qtd.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCatracas.map(part => (
                          <DetailCard key={part.codInterno} part={part} activeRate={activeRate} quantity={catracaQuantities[part.codInterno] || 0} onIncrement={() => setCatracaQuantities(p => ({...p, [part.codInterno]: (p[part.codInterno] || 0) + 1}))} onDecrement={() => setCatracaQuantities(p => ({...p, [part.codInterno]: Math.max(0, (p[part.codInterno] || 0) - 1)}))} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                   <div className="text-center py-12 text-slate-400">
                      <SlackAdjusterIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p className="text-xs">Selecione um modelo de veículo acima para visualizar as catracas compatíveis.</p>
                   </div>
                )}
              </div>
            )}

            {activeTab === 'kits' && (
              <div className="animate-fade-in-up">
                {renderControls(uniqueKitsVehicles, "Modelo do Veículo", true)}

                {selectedKitObservation && (
                  <div className="mb-4 p-3 rounded-lg border border-amber-200 bg-amber-50 flex gap-3 animate-fade-in-up shadow-sm">
                     <InfoIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                     <div>
                        <h3 className="text-[10px] font-bold text-amber-700 uppercase mb-0.5">Observações do Veículo</h3>
                        <p className="text-[11px] text-slate-700 leading-snug">{selectedKitObservation}</p>
                     </div>
                  </div>
                )}

                {showTable ? (
                  <div className="border rounded-xl overflow-hidden bg-white border-slate-200 shadow-sm animate-fade-in-up">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                        <tr>
                          {/* Se estiver buscando globalmente, mostra coluna de veículo. Se tiver veículo selecionado (ou nada e sem busca), esconde */}
                          {(searchTerm.length > 0) && <th className="p-2.5">Veículo</th>}
                          <th className="p-2.5">Tipo</th><th className="p-2.5">Cód. Interno</th><th className="p-2.5">Cód. Freiocar</th><th className="p-2.5">Descrição</th><th className="p-2.5 text-right">Valor</th><th className="p-2.5 text-right">Qtd.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredKitItems.map((kit, idx) => (
                          <KitRow 
                              key={`${kit.tipoItem}-${idx}`} 
                              kit={kit} 
                              activeRate={activeRate} 
                              showVehicleColumn={searchTerm.length > 0} 
                              quantity={kitQuantities[kit.tipoItem] || 0} 
                              onIncrement={() => setKitQuantities(p => ({...p, [kit.tipoItem]: (p[kit.tipoItem] || 0) + 1}))} 
                              onDecrement={() => setKitQuantities(p => ({...p, [kit.tipoItem]: Math.max(0, (p[kit.tipoItem] || 0) - 1)}))} 
                          />
                        ))}
                      </tbody>
                    </table>
                    {filteredKitItems.length === 0 && (
                        <div className="p-6 text-center text-slate-400 text-xs">
                            {searchTerm ? "Nenhum item encontrado para esta busca." : "Selecione um veículo ou use a busca para visualizar os kits."}
                        </div>
                    )}
                  </div>
                ) : (
                    <div className="text-center py-12 text-slate-400">
                      <BrakeDiscIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p className="text-xs">Selecione um modelo de veículo acima para visualizar os kits de freio.</p>
                   </div>
                )}
              </div>
            )}

            {activeTab === 'kit3eixo' && (
              <div className="animate-fade-in-up">
                {renderControls(unique3EixoVehicles, "Modelo do Veículo", false)}

                {/* Novos Botões Eixo (Acima dos Botões Cuica) */}
                <div className="flex items-center gap-6 mb-2 px-1 -mt-3">
                    <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                             const newState = !isEixoRedondo;
                             setIsEixoRedondo(newState);
                             if (newState) setIsEixoTubular(false);
                          }} 
                          className={`relative w-8 h-4 rounded-full transition-colors ${isEixoRedondo ? 'bg-green-500' : 'bg-slate-200'}`}
                        >
                          <span className={`absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${isEixoRedondo ? 'translate-x-4' : ''}`} />
                        </button>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">EIXO REDONDO</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                           onClick={() => {
                             const newState = !isEixoTubular;
                             setIsEixoTubular(newState);
                             if (newState) setIsEixoRedondo(false);
                          }} 
                           className={`relative w-8 h-4 rounded-full transition-colors ${isEixoTubular ? 'bg-green-500' : 'bg-slate-200'}`}
                        >
                          <span className={`absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${isEixoTubular ? 'translate-x-4' : ''}`} />
                        </button>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">EIXO TUBULAR RETANGULAR</span>
                    </div>
                </div>

                {/* Novos Botões Cuica (Ajustada margem superior para espaçamento correto) */}
                <div className="flex items-center gap-6 mb-4 px-1">
                    <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                             const newState = !isCuicaSimples;
                             setIsCuicaSimples(newState);
                             if (newState) setIsCuicaDupla(false);
                          }} 
                          className={`relative w-8 h-4 rounded-full transition-colors ${isCuicaSimples ? 'bg-green-500' : 'bg-slate-200'}`}
                        >
                          <span className={`absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${isCuicaSimples ? 'translate-x-4' : ''}`} />
                        </button>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">CUICA SIMPLES</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                           onClick={() => {
                             const newState = !isCuicaDupla;
                             setIsCuicaDupla(newState);
                             if (newState) setIsCuicaSimples(false);
                          }} 
                           className={`relative w-8 h-4 rounded-full transition-colors ${isCuicaDupla ? 'bg-green-500' : 'bg-slate-200'}`}
                        >
                          <span className={`absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${isCuicaDupla ? 'translate-x-4' : ''}`} />
                        </button>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">CUICA DUPLA</span>
                    </div>
                </div>

                {showTable ? (
                  <div className="border rounded-xl overflow-hidden bg-white border-slate-200 shadow-sm animate-fade-in-up">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                        {/* Nova Ordem: Tipo, Cód. Interno, Cód. Freiocar, Descrição, Valor, QTD */}
                        <tr><th className="p-2.5">Tipo</th><th className="p-2.5">Cód. Interno</th><th className="p-2.5">Cód. Freiocar</th><th className="p-2.5">Descrição</th><th className="p-2.5 text-right">Valor</th><th className="p-2.5 text-right">Qtd.</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filtered3EixoItems.map(item => (
                          <Kit3EixoRow key={item.codInterno} item={item} quantity={kit3EixoQuantities[item.codInterno] || 0} onIncrement={() => setKit3EixoQuantities(p => ({...p, [item.codInterno]: (p[item.codInterno] || 0) + 1}))} onDecrement={() => setKit3EixoQuantities(p => ({...p, [item.codInterno]: Math.max(0, (p[item.codInterno] || 0) - 1)}))} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                    <div className="text-center py-12 text-slate-400">
                      <AxleIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p className="text-xs">Selecione um modelo de veículo acima para visualizar os kits de 3º eixo.</p>
                   </div>
                )}
              </div>
            )}

            {activeTab === 'adaptacoes' && (
              <div className="grid grid-cols-1 gap-4 animate-fade-in-up">
                <div className="flex flex-col gap-2 mb-4 animate-fade-in-up">
                    <label className="block text-[9px] font-bold text-black uppercase mb-1 ml-1">PESQUISAR</label>
                    <div className="flex gap-2 items-center w-full">
                        <div className="relative flex-1">
                            <SearchIcon className="absolute left-3 top-2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Pesquisar por nota fiscal, nº de série ou certificado..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full h-8 pl-9 pr-3 border border-slate-300 rounded-lg bg-white text-[11px] font-medium text-slate-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                            />
                        </div>
                        <button 
                            onClick={handleClearFilters}
                            className="h-8 px-3 flex items-center justify-center text-[9px] font-bold uppercase tracking-wider text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100 whitespace-nowrap"
                            title="Limpar pesquisa"
                        >
                            Limpar
                        </button>
                    </div>
                </div>
                {filteredAdaptacoes.map((item, idx) => <AdaptacaoCard key={idx} data={item} />)}
                {filteredAdaptacoes.length === 0 && (
                      <div className="p-10 text-center text-slate-400">
                          <TruckIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                          <p className="text-xs">Nenhuma adaptação encontrada para esta pesquisa.</p>
                      </div>
                )}
              </div>
            )}

            {activeTab === 'pedidos' && (
              <div className="animate-fade-in-up">
                 <div className="p-10 text-center text-slate-400">
                    <ShoppingCartIcon className="w-14 h-14 mx-auto mb-3 opacity-10" />
                 </div>
              </div>
            )}

            {activeTab !== 'adaptacoes' && activeTab !== 'pedidos' && totals.subtotal > 0 && (
              <div className="p-5 rounded-xl border border-blue-100 shadow-lg bg-white relative overflow-hidden animate-slide-in-right mb-4">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-10 -mt-10 blur-2xl opacity-50 pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-1"><span className="text-[11px] font-medium text-slate-500">Subtotal</span><span className="font-bold text-blue-500 text-xs">{formatCurrency(totals.subtotal)}</span></div>
                  <div className="flex justify-between items-center mb-3"><span className="text-[11px] font-medium text-slate-500">IPI (3.25%)</span><span className="font-bold text-blue-300 text-xs">{formatCurrency(totals.ipi)}</span></div>
                  <div className="flex justify-between items-end border-t border-dashed border-slate-200 pt-3">
                    <div>
                      <span className="text-xs font-bold text-blue-600 block uppercase tracking-wide">TOTAL</span>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => setIsConsumerFinal(!isConsumerFinal)} className={`relative w-8 h-4 rounded-full transition-colors ${isConsumerFinal ? 'bg-green-500' : 'bg-slate-200'}`}>
                          <span className={`absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${isConsumerFinal ? 'translate-x-4' : ''}`} />
                        </button>
                        <span className="text-[10px] font-bold text-slate-400">Consumidor Final (+5%)</span>
                      </div>
                    </div>
                    <div className="text-xl font-black text-emerald-600 tracking-tight">{formatCurrency(totals.total)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Novo Rodapé Fixo Flutuante Compacto */}
        <footer className="bg-white mx-5 mb-5 py-2 px-4 rounded-xl shadow-sm flex justify-between items-center text-[10px] z-20 shrink-0 h-10 border border-slate-100">
            <div className="text-slate-400 font-medium">© 2026 Cardancorp.app</div>
            <div className="flex items-center gap-3">
                <span className="text-[9px] text-slate-300 font-mono tracking-tight">v{UI_STABLE_CONFIG.version}</span>
                <button 
                  onClick={loadData} 
                  title="Sincronizar dados"
                  className="text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-all p-1 rounded-full group"
                >
                   <RefreshIcon className={`w-3 h-3 ${loadingState === LoadingState.LOADING ? 'animate-spin text-blue-500' : 'group-hover:rotate-180 transition-transform duration-500'}`} /> 
                </button>
            </div>
        </footer>

      </div>
    </div>
  );
};

export default App;
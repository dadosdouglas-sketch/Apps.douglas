import React, { useState, useEffect, useMemo } from 'react';
import { fetchSheetData, RawKitRow } from './services/sheetService';
import { PartData, KitItemData, LoadingState, AdaptacaoData, Kit3EixoData, CardanData, UserCredential, CartItem } from './types';
import DetailCard from './components/DetailCard';
import KitRow from './components/KitRow';
import Kit3EixoRow from './components/Kit3EixoRow';
import CardanRow from './components/CardanRow';
import AdaptacaoCard from './components/AdaptacaoCard';
import ErrorBoundary from './components/ErrorBoundary';
import { SearchIcon, RefreshIcon, WrenchIcon, DiscIcon, FaTruckMoving, AxleIcon, LogoutIcon, UserIcon, ChevronLeftIcon, ChevronRightIcon, InfoIcon, ShoppingCartIcon, BrakeDiscIcon, FastTruckIcon, SlackAdjusterIcon, TruckIcon, TrashIcon, PrinterIcon, BrakeComponentsIcon, SunIcon, MoonStarsIcon, EyeIcon, EyeOffIcon, CopyIcon, CheckIcon, PackageIcon, DownloadIcon, CardanIcon } from './components/Icons';

// =========================================================
// PONTO DE RESTAURAÇÃO: CONFIGURAÇÃO ESTÁVEL DE INTERFACE
// =========================================================
const UI_STABLE_CONFIG = {
  version: "3.5.0",
  primaryColor: "bg-blue-600",
  secondaryColor: "bg-white",
  // Cores atualizadas para o novo estilo minimalista com barra indicadora e rodapé fixo
  footerBg: "bg-white border-slate-200",
  mainBg: "bg-slate-100",
  loginBgUrl: "https://lh3.googleusercontent.com/d/1nGDJhj0wbPwkjXeEemmJSgc8QG0dUFZA", // Fundo Original Restaurado
  logoUrl: "https://lh3.googleusercontent.com/d/1BX58YbrIRFZiHCUyRlwXcXX6_Vkv079O", // Logo CardanCorp Atualizado
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

type TabType = 'catracas' | 'kits' | 'kit3eixo' | 'adaptacoes' | 'pedidos' | 'componentes' | 'cardan';

interface PendingItem {
    item: any;
    type: 'catraca' | 'kit' | 'kit3eixo';
    priceString: string;
    quantityToAdd: number;
}

interface ClientData {
  nome: string;
  cnpj: string;
  contato: string;
  telefone: string;
  email: string;
  cidade: string;
  uf: string;
  // Novos campos
  representante: string;
  pedido: string;
  pagamento: string;
  transportadora: string;
  tipoFrete: string; // Novo campo CIF/FOB
  observacao: string;
}

// Sub-componente para Linha do Carrinho (para gerenciar estado de copia individual)
const CartRow = ({ item, isDarkMode, formatCurrency, handleUpdateCartQuantity, handleRemoveFromCart }: { 
    item: CartItem, 
    isDarkMode: boolean, 
    formatCurrency: (val: number) => string,
    handleUpdateCartQuantity: (id: string, delta: number) => void,
    handleRemoveFromCart: (id: string) => void
}) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <tr className={`border-b last:border-0 transition-colors ${isDarkMode ? 'border-slate-700 hover:bg-slate-700/30' : 'border-slate-100 hover:bg-slate-50'}`}>
            <td className="px-4 py-3 align-middle">
                <div className="flex items-center gap-2">
                    <span className={`font-bold text-[10px] ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{item.codInterno}</span>
                    <button 
                        onClick={() => copyToClipboard(item.codInterno)}
                        className={`transition-all p-0.5 rounded-md ${copied ? 'text-green-500 bg-green-50' : 'text-slate-300 hover:text-blue-500 hover:bg-slate-200'}`}
                        title={copied ? "Copiado!" : "Copiar código"}
                    >
                        {copied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
                    </button>
                </div>
            </td>
            <td className="px-4 py-3 align-middle">
                <div className="text-[10px] font-bold text-blue-500">{item.codFreiocar}</div>
            </td>
            <td className="px-4 py-3 align-middle">
                <div className={`text-[10px] font-medium leading-tight max-w-xs uppercase ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{item.descricao}</div>
            </td>
            <td className={`px-4 py-3 text-right font-bold text-[10px] text-emerald-500 whitespace-nowrap align-middle`}>
                {formatCurrency(item.valorUnitario)}
            </td>
            <td className="px-4 py-3 align-middle">
                <div className="flex items-center justify-center gap-1">
                    <button onClick={() => handleUpdateCartQuantity(item.id, -1)} className={`w-5 h-5 flex items-center justify-center rounded border text-[10px] transition-colors ${isDarkMode ? 'border-slate-600 text-slate-400 hover:bg-slate-700' : 'border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>-</button>
                    <div className={`w-6 text-center font-bold text-[10px] ${isDarkMode ? 'text-blue-400' : 'text-slate-700'}`}>{item.quantidade}</div>
                    <button onClick={() => handleUpdateCartQuantity(item.id, 1)} className={`w-5 h-5 flex items-center justify-center rounded border text-[10px] transition-colors ${isDarkMode ? 'border-slate-600 text-slate-400 hover:bg-slate-700' : 'border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>+</button>
                </div>
            </td>
            <td className="px-4 py-3 text-center align-middle">
                <button 
                    onClick={() => handleRemoveFromCart(item.id)} 
                    className="text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-50"
                    title="Remover item"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </td>
        </tr>
    );
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('kits');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Login State Changes
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<'Cardancorp' | 'Concessionaria' | 'Representante' | 'Desconhecido' | null>(null);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        return saved === 'dark';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [authorizedUsers, setAuthorizedUsers] = useState<UserCredential[]>([]);
  
  const [catracasData, setCatracasData] = useState<PartData[]>([]);
  const [kitRows, setKitRows] = useState<RawKitRow[]>([]);
  const [adaptacoesData, setAdaptacoesData] = useState<AdaptacaoData[]>([]);
  const [kit3EixoData, setKit3EixoData] = useState<Kit3EixoData[]>([]);
  const [cardanData, setCardanData] = useState<CardanData[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  
  const [selectedVeiculo, setSelectedVeiculo] = useState<string>('');
  const [selectedUF, setSelectedUF] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Cardan Specific States
  const [selectedCardanModel, setSelectedCardanModel] = useState<string>('');
  const [selectedCardanVehicle, setSelectedCardanVehicle] = useState<string>('');

  const [kitQuantities, setKitQuantities] = useState<Record<string, number>>({});
  const [catracaQuantities, setCatracaQuantities] = useState<Record<string, number>>({});
  const [kit3EixoQuantities, setKit3EixoQuantities] = useState<Record<string, number>>({});
  const [cardanQuantities, setCardanQuantities] = useState<Record<string, number>>({});

  const [isConsumerFinal, setIsConsumerFinal] = useState<boolean>(false);
  
  // Novos estados para Cuica Simples e Dupla
  const [isCuicaSimples, setIsCuicaSimples] = useState<boolean>(false);
  const [isCuicaDupla, setIsCuicaDupla] = useState<boolean>(false);

  // Novos estados para Eixo Redondo e Tubular
  const [isEixoRedondo, setIsEixoRedondo] = useState<boolean>(false);
  const [isEixoTubular, setIsEixoTubular] = useState<boolean>(false);

  // Estados do Carrinho (Com Persistência)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
        const saved = localStorage.getItem('cartItems');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
  });

  const [cartRate, setCartRate] = useState<string | null>(() => {
    return localStorage.getItem('cartRate');
  });

  // Estado dos Dados do Cliente (Com Persistência)
  const [clientData, setClientData] = useState<ClientData>(() => {
    try {
        const saved = localStorage.getItem('clientData');
        return saved ? JSON.parse(saved) : {
            nome: '', cnpj: '', contato: '', telefone: '', email: '', cidade: '', uf: '',
            representante: '', pedido: '', pagamento: '', transportadora: '', tipoFrete: '', observacao: ''
        };
    } catch (e) {
        return {
            nome: '', cnpj: '', contato: '', telefone: '', email: '', cidade: '', uf: '',
            representante: '', pedido: '', pagamento: '', transportadora: '', tipoFrete: '', observacao: ''
        };
    }
  });

  // Efeito para checar Login Salvo (Lembrar-me)
  useEffect(() => {
    const savedUser = localStorage.getItem('cardan_user');
    if (savedUser) {
        setLoginUser(savedUser);
        setIsLoggedIn(true);
    }
  }, []);

  // Efeitos para salvar no LocalStorage
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    if (cartRate) localStorage.setItem('cartRate', cartRate);
    else localStorage.removeItem('cartRate');
  }, [cartItems, cartRate]);

  useEffect(() => {
    localStorage.setItem('clientData', JSON.stringify(clientData));
  }, [clientData]);

  // Estados do Modal de Conflito de ICMS
  const [showIcmsModal, setShowIcmsModal] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState<PendingItem | null>(null);

  useEffect(() => { loadData(); }, []);

  // Regra automática: Gerenciar quantidades quando o veículo selecionado muda
  useEffect(() => {
    // Resetar quantidades das outras abas
    setKitQuantities({});
    setCatracaQuantities({});
    setCardanQuantities({});

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
      const { catracas, kitRows, adaptacoes, kit3Eixo, cardan, users } = await fetchSheetData();
      setCatracasData(catracas);
      setKitRows(kitRows);
      setAdaptacoesData(adaptacoes);
      setKit3EixoData(kit3Eixo);
      setCardanData(cardan);
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
    setSelectedCardanModel('');
    setSelectedCardanVehicle('');
    setCardanQuantities({});
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação ao clicar em entrar
    if (!loginUser || !loginPass) {
        setLoginError(true);
        return;
    }

    const foundUser = authorizedUsers.find(u => u.usuario.toLowerCase() === loginUser.toLowerCase().trim() && u.senha === loginPass);

    if (foundUser) {
      setIsLoggedIn(true);
      setLoginError(false);
      const role = foundUser.tipo;
      setCurrentUserRole(role);
      
      // Lógica Lembrar-me
      if (rememberMe) {
          localStorage.setItem('cardan_user', loginUser);
      } else {
          localStorage.removeItem('cardan_user');
      }

      // Redirecionamento baseado no NOVO sistema de permissões
      if (role === 'Concessionaria') {
        setActiveTab('kit3eixo');
      } else if (role === 'Representante') {
        setActiveTab('kits');
      } else {
        // Cardancorp / Desconhecido (Geral)
        setActiveTab('kits');
      }

    } else {
        setLoginError(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginUser('');
    setLoginPass('');
    setShowPassword(false); // Reset visual state
    setLoginError(false);   // Reset visual state
    setActiveTab('kits');
    setCurrentUserRole(null);
    handleClearFilters();
    
    // Reset Theme to Normal (Light Mode)
    setIsDarkMode(false);

    // Clean Cart Data
    setCartItems([]); 
    setCartRate(null); 
    
    // Clean Client Data (IMPORTANT: Ensure fields are wiped on logout)
    setClientData({
        nome: '', cnpj: '', contato: '', telefone: '', email: '', cidade: '', uf: '',
        representante: '', pedido: '', pagamento: '', transportadora: '', tipoFrete: '', observacao: ''
    });

    localStorage.removeItem('cardan_user'); // Limpa usuário salvo ao sair manualmente
    
    // Explicitly remove persisted items just in case (useEffects will also sync the empty state)
    localStorage.removeItem('cartItems');
    localStorage.removeItem('clientData');
    localStorage.removeItem('cartRate');
  };

  // Efeito para Logout Automático por Inatividade (5 Minutos)
  useEffect(() => {
    // Configuração para ativar ou desativar o logout automático
    const ENABLE_AUTO_LOGOUT = false; // Mude para true quando quiser reativar

    if (!isLoggedIn || !ENABLE_AUTO_LOGOUT) return;

    const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 Minutos em milissegundos
    let timeoutId: any; // Usando any para compatibilidade com NodeJS.Timeout do navegador

    const triggerAutoLogout = () => {
        console.log("Sessão expirada por inatividade.");
        handleLogout();
    };

    const resetTimer = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(triggerAutoLogout, INACTIVITY_LIMIT);
    };

    // Eventos monitorados
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Inicializa
    resetTimer();

    // Adiciona listeners
    events.forEach(event => document.addEventListener(event, resetTimer));

    // Limpeza
    return () => {
        clearTimeout(timeoutId);
        events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [isLoggedIn]);

  const activeRate = useMemo<'icms17' | 'icms12' | 'icms7'>(() => {
    if (!selectedUF) return 'icms17';
    const state = BRAZILIAN_STATES.find(s => s.uf === selectedUF);
    return (state?.rate as 'icms17' | 'icms12' | 'icms7') || 'icms17';
  }, [selectedUF]);

  const parsePrice = (priceStr: string): number => {
    if (!priceStr) return 0;
    const cleanStr = priceStr.replace(/[^\d,]/g, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanStr) || 0;
  };

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleClientDataChange = (field: keyof ClientData, value: string) => {
     setClientData(prev => ({ ...prev, [field]: value }));
  };

  // --- Lógica do Carrinho ---

  const processAddToCart = (item: any, type: 'catraca' | 'kit' | 'kit3eixo', priceString: string, quantityToAdd: number, currentCart: CartItem[], rate: string | null): { newCart: CartItem[], newRate: string | null } => {
     const valorUnitario = parsePrice(priceString);
     
     let newItem: CartItem = {
        id: item.codInterno || item.tipoItem, // Fallback para ID
        codInterno: item.codInterno,
        codFreiocar: item.codFreiocar,
        descricao: item.aplicacao || item.descricao || (item.configuracao ? item.configuracao : item.tipo) || item.pecas, // Fallback de descrição
        valorUnitario: valorUnitario,
        quantidade: quantityToAdd,
        tipo: type,
        origemIcms: type === 'kit3eixo' ? 'PADRAO' : activeRate
     };

     const existingItemIndex = currentCart.findIndex(i => i.id === newItem.id);
     let updatedCart = [...currentCart];

     if (existingItemIndex >= 0) {
        updatedCart[existingItemIndex].quantidade += quantityToAdd;
     } else {
        updatedCart.push(newItem);
     }

     let updatedRate = rate;
     if (!updatedRate && type !== 'kit3eixo') {
        updatedRate = activeRate;
     }

     return { newCart: updatedCart, newRate: updatedRate };
  };
  
  const handleAddToCart = (item: any, type: 'catraca' | 'kit' | 'kit3eixo', priceString: string, quantityToAdd: number) => {
    const valorUnitario = parsePrice(priceString);
    if (valorUnitario <= 0) return;

    if (type !== 'kit3eixo') {
        if (cartItems.length > 0 && cartRate && cartRate !== activeRate) {
            setPendingCartItem({ item, type, priceString, quantityToAdd });
            setShowIcmsModal(true);
            return;
        }
    }

    const { newCart, newRate } = processAddToCart(item, type, priceString, quantityToAdd, cartItems, cartRate);
    setCartItems(newCart);
    setCartRate(newRate);
  };

  const confirmClearAndAdd = () => {
    if (pendingCartItem) {
        const { newCart, newRate } = processAddToCart(pendingCartItem.item, pendingCartItem.type, pendingCartItem.priceString, pendingCartItem.quantityToAdd, [], null);
        setCartItems(newCart);
        setCartRate(newRate);
    }
    setShowIcmsModal(false);
    setPendingCartItem(null);
  };

  const cancelAdd = () => {
    setShowIcmsModal(false);
    setPendingCartItem(null);
  };

  const handleRemoveFromCart = (id: string) => {
    const newCart = cartItems.filter(item => item.id !== id);
    setCartItems(newCart);
    if (newCart.length === 0) setCartRate(null);
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    const newCart = cartItems.map(item => {
        if (item.id === id) {
            return { ...item, quantidade: Math.max(1, item.quantidade + delta) };
        }
        return item;
    });
    setCartItems(newCart);
  };

  const handleClearCart = () => {
    setCartItems([]);
    setCartRate(null);
    setClientData({ 
        nome: '', cnpj: '', contato: '', telefone: '', email: '', cidade: '', uf: '',
        representante: '', pedido: '', pagamento: '', transportadora: '', tipoFrete: '', observacao: ''
    });
    setIsConsumerFinal(false);
  };


  const uniqueVehicles = useMemo(() => Array.from(new Set(catracasData.map(item => item.veiculo))).sort(), [catracasData]);
  const uniqueKitsVehicles = useMemo(() => Array.from(new Set(kitRows.map(item => item.veiculo))).sort(), [kitRows]);
  const unique3EixoVehicles = useMemo(() => Array.from(new Set(kit3EixoData.map(item => item.veiculo))).sort(), [kit3EixoData]);
  
  // Cardan Memoized Filters
  const uniqueCardanModels = useMemo(() => Array.from(new Set(cardanData.map(item => item.modelo))).filter(Boolean).sort(), [cardanData]);
  const availableCardanVehicles = useMemo(() => {
    if (!selectedCardanModel) return [];
    return Array.from(new Set(cardanData
        .filter(item => item.modelo === selectedCardanModel)
        .map(item => item.veiculo)
    )).filter(Boolean).sort();
  }, [cardanData, selectedCardanModel]);

  const filteredCardanItems = useMemo(() => {
    if (!selectedCardanModel || !selectedCardanVehicle) return [];
    return cardanData.filter(item => 
        item.modelo === selectedCardanModel && 
        item.veiculo === selectedCardanVehicle
    );
  }, [cardanData, selectedCardanModel, selectedCardanVehicle]);


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
    
    if (selectedVeiculo) {
      result = result.filter(item => item.veiculo === selectedVeiculo);
    }
    
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

  const totals = useMemo(() => {
    let subtotal = 0;
    
    if (activeTab === 'pedidos') {
        subtotal = cartItems.reduce((acc, item) => acc + (item.valorUnitario * item.quantidade), 0);
    } else {
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
        } else if (activeTab === 'cardan') {
            filteredCardanItems.forEach(item => subtotal += parsePrice(item.valor) * (cardanQuantities[item.codInterno] || 0));
        }
    }

    const ipi = subtotal * 0.0325;
    let total = subtotal + ipi;
    if (isConsumerFinal) total *= 1.05;
    return { subtotal, ipi, total };
  }, [kitQuantities, catracaQuantities, kit3EixoQuantities, cardanQuantities, activeTab, filteredKitItems, catracasData, filtered3EixoItems, filteredCardanItems, activeRate, isConsumerFinal, cartItems]);

  const selectedKitObservation = useMemo(() => {
    if (activeTab !== 'kits' || !selectedVeiculo) return '';
    const row = kitRows.find(r => r.veiculo === selectedVeiculo);
    return row?.data[36]?.trim() || '';
  }, [activeTab, selectedVeiculo, kitRows]);

  const handlePrintOrder = () => {
    if (cartItems.length === 0) return;

    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const filenameId = `${day}${month}${year}${hour}${minute}`;
    
    const clientName = (clientData.nome || 'Cliente').trim().replace(/[^a-zA-Z0-9 ]/g, '');
    const docTitle = `${clientName} ${filenameId}`;
    
    const printHeaderImg = "https://lh3.googleusercontent.com/d/1cfRrxRU7TfDtsbhbErDDVN48gZWpwRjV";
    
    const itemsHtml = cartItems.map(item => `
      <tr class="border-b border-slate-100">
        <td class="py-1 px-2 text-[9px] text-slate-600">${item.codInterno}</td>
        <td class="py-1 px-2 text-[9px] text-blue-600 font-medium">${item.codFreiocar}</td>
        <td class="py-1 px-2 text-[9px] text-slate-600 uppercase">${item.descricao}</td>
        <td class="py-1 px-2 text-[9px] text-right text-slate-600">${formatCurrency(item.valorUnitario)}</td>
        <td class="py-1 px-2 text-[9px] text-center text-slate-600">${item.quantidade}</td>
        <td class="py-1 px-2 text-[9px] text-right font-bold text-slate-800">${formatCurrency(item.valorUnitario * item.quantidade)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${docTitle}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            body { 
                font-family: 'Inter', sans-serif; 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
                display: flex;
                flex-direction: column;
                min-height: 100vh;
                margin: 0;
                padding: 32px;
                box-sizing: border-box;
            }
            .content-wrapper { flex: 1; }
            .print-footer {
                margin-top: auto;
                padding-top: 10px;
                border-top: 1px solid #e2e8f0;
                display: flex;
                justify-content: space-between;
                font-size: 9px;
                color: #64748b;
            }
          </style>
        </head>
        <body class="bg-white">
            <div class="content-wrapper">
                <div class="mb-6 border-b border-slate-200 pb-4">
                    <div class="flex justify-between items-start mb-3">
                        <img src="${printHeaderImg}" alt="CardanCorp" class="h-7 w-auto object-contain" />
                        <div class="text-right pt-1">
                             <p class="text-[10px] font-medium text-slate-500 mb-1">${dateStr}, ${timeStr}</p>
                             ${clientData.pedido ? `<p class="text-[10px] font-bold text-slate-700">PEDIDO: ${clientData.pedido}</p>` : ''}
                        </div>
                    </div>

                    <div class="text-[9px] text-slate-500 leading-snug w-full">
                        <p class="font-bold text-slate-800 uppercase mb-0.5">CARDANCORP</p>
                        <p class="mb-1">CNPJ: 92.765.361/0001-47</p>
                        <div class="flex justify-between items-center mt-1 pt-1 border-t border-slate-100">
                            <span>Endereço: Estr. Mun. Vicente Menezes, 515 - Linha 40,</span>
                            <span><span class="font-bold">Telefone:</span> (54) 3537-5000</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span>Caxias do Sul - RS, 95044-030</span>
                            <span><span class="font-bold">E-mail:</span> administrativo@cardancorp.com.br</span>
                        </div>
                    </div>
                </div>

                <div class="bg-slate-50 p-3 rounded-lg mb-4 border border-slate-200">
                    <h2 class="text-[10px] font-bold text-slate-500 uppercase mb-2 border-b border-slate-200 pb-1">Dados do Cliente</h2>
                    <div class="grid grid-cols-4 gap-3">
                        <div class="col-span-2">
                            <span class="block text-slate-400 font-bold text-[8px] uppercase">Nome</span>
                            <span class="block font-bold text-slate-700 text-[10px] uppercase">${clientData.nome || '-'}</span>
                        </div>
                        <div>
                            <span class="block text-slate-400 font-bold text-[8px] uppercase">CNPJ</span>
                            <span class="block font-bold text-slate-700 text-[10px] uppercase">${clientData.cnpj || '-'}</span>
                        </div>
                        <div>
                            <span class="block text-slate-400 font-bold text-[8px] uppercase">Pedido N°</span>
                            <span class="block font-bold text-slate-700 text-[10px] uppercase">${clientData.pedido || '-'}</span>
                        </div>
                        <div>
                            <span class="block text-slate-400 font-bold text-[8px] uppercase">Contato</span>
                            <span class="block font-bold text-slate-700 text-[10px] uppercase">${clientData.contato || '-'}</span>
                        </div>
                        <div>
                            <span class="block text-slate-400 font-bold text-[8px] uppercase">Telefone</span>
                            <span class="block font-bold text-slate-700 text-[10px] uppercase">${clientData.telefone || '-'}</span>
                        </div>
                        <div class="col-span-2">
                            <span class="block text-slate-400 font-bold text-[8px] uppercase">Email</span>
                            <span class="block font-bold text-slate-700 text-[10px] uppercase">${clientData.email || '-'}</span>
                        </div>
                        <div>
                            <span class="block text-slate-400 font-bold text-[8px] uppercase">Cidade/UF</span>
                            <span class="block font-bold text-slate-700 text-[10px] uppercase">${clientData.cidade || ''} ${clientData.uf ? '- ' + clientData.uf : '-'}</span>
                        </div>
                        <div>
                            <span class="block text-slate-400 font-bold text-[8px] uppercase">Representante</span>
                            <span class="block font-bold text-slate-700 text-[10px] uppercase">${clientData.representante || '-'}</span>
                        </div>
                        <div>
                            <span class="block text-slate-400 font-bold text-[8px] uppercase">Pagamento</span>
                            <span class="block font-bold text-slate-700 text-[10px] uppercase">${clientData.pagamento || '-'}</span>
                        </div>
                        <div>
                            <span class="block text-slate-400 font-bold text-[8px] uppercase">Transportadora/Frete</span>
                            <span class="block font-bold text-slate-700 text-[10px] uppercase">
                                ${clientData.transportadora || '-'} ${clientData.tipoFrete ? '- ' + clientData.tipoFrete : ''}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="mb-6">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-100 text-slate-500 uppercase text-[10px] font-bold">
                                <th class="py-2 px-2 rounded-tl-lg">Cód. Interno</th>
                                <th class="py-2 px-2">Cód. Freiocar</th>
                                <th class="py-2 px-2">Descrição</th>
                                <th class="py-2 px-2 text-right">Unitário</th>
                                <th class="py-2 px-2 text-center">Qtd</th>
                                <th class="py-2 px-2 text-right rounded-tr-lg">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                </div>

                ${clientData.observacao ? `
                <div class="mb-4 p-2 rounded border border-amber-200 bg-amber-50 flex gap-2">
                    <div style="color: #f59e0b; width: 14px; margin-top: 2px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    </div>
                    <div>
                        <h3 class="text-[9px] font-bold text-amber-700 uppercase mb-0.5">Observações do Pedido</h3>
                        <p class="text-[9px] text-slate-700 leading-snug whitespace-pre-wrap">${clientData.observacao}</p>
                    </div>
                </div>
                ` : ''}

                <div class="flex justify-end">
                    <div class="w-64">
                        <div class="flex justify-between py-1 text-xs text-slate-500">
                            <span>Subtotal</span>
                            <span class="font-medium">${formatCurrency(totals.subtotal)}</span>
                        </div>
                        <div class="flex justify-between py-1 text-xs text-slate-500 border-b border-slate-200 pb-2">
                            <span>IPI (3.25%)</span>
                            <span class="font-medium">${formatCurrency(totals.ipi)}</span>
                        </div>
                        ${isConsumerFinal ? `
                        <div class="flex justify-between py-1 text-xs text-slate-500 mt-2">
                            <span>Consumidor Final (+5%)</span>
                            <span class="font-medium">SIM</span>
                        </div>
                        ` : ''}
                        <div class="flex justify-between items-center py-2 text-xs font-bold text-slate-800 border-t border-slate-200 mt-2">
                            <span>TOTAL</span>
                            <span>${formatCurrency(totals.total)}</span>
                        </div>
                        <div class="text-[10px] text-right text-slate-400 uppercase font-bold mt-1">
                            ICMS: ${cartRate ? cartRate.replace('icms', '') + '%' : 'PADRÃO'}
                        </div>
                    </div>
                </div>
            </div>

            <div class="print-footer">
                <span>${dateStr}, ${timeStr}</span>
                <span class="font-bold">www.cardancorp.com.br</span>
                <span>CardanCorp</span>
            </div>

            <script>
                window.onload = function() { window.print(); window.close(); }
            </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const menuItems = useMemo(() => {
    // Regras de Visualização
    const isCardancorp = currentUserRole === 'Cardancorp';
    const isConcessionaria = currentUserRole === 'Concessionaria';
    const isRepresentante = currentUserRole === 'Representante';

    // Fallback para Desconhecido ou Admin (Assume Cardancorp se não bater)
    const isAdmin = isCardancorp || (!isConcessionaria && !isRepresentante);

    return [
      {
        id: 'kits',
        label: 'Kits de Freio',
        icon: <BrakeDiscIcon />,
        visible: isAdmin || isRepresentante // Cardancorp + Representante
      },
      {
        id: 'catracas',
        label: 'Catracas de Freio',
        icon: <SlackAdjusterIcon />,
        visible: isAdmin || isRepresentante // Cardancorp + Representante
      },
      {
        id: 'kit3eixo',
        label: 'Kit 3º Eixo',
        icon: <AxleIcon />,
        visible: isAdmin || isConcessionaria // Cardancorp + Concessionaria
      },
      {
        id: 'adaptacoes',
        label: 'Adaptações 3º Eixo',
        icon: <TruckIcon />,
        visible: isAdmin || isConcessionaria // Cardancorp + Concessionaria
      },
      {
        id: 'componentes',
        label: 'Componentes',
        icon: <BrakeComponentsIcon />,
        visible: isAdmin || isRepresentante // Cardancorp + Representante
      },
      {
        id: 'cardan',
        label: 'Cardan',
        icon: <CardanIcon />,
        visible: isAdmin || isRepresentante // Cardancorp + Representante
      },
      {
        id: 'pedidos',
        label: 'Pedido de Itens',
        icon: <ShoppingCartIcon />,
        visible: true // Todos
      },
    ];
  }, [currentUserRole]);

  const currentTabLabel = useMemo(() => {
    switch (activeTab) {
      case 'catracas': return 'Catracas de Freio';
      case 'kits': return 'Kits de Freio';
      case 'kit3eixo': return 'Kit 3º Eixo';
      case 'adaptacoes': return 'Adaptações 3º Eixo';
      case 'pedidos': return 'Pedido de Itens';
      case 'componentes': return 'Componentes';
      case 'cardan': return 'Cardan';
      default: return '';
    }
  }, [activeTab]);

  const showTable = useMemo(() => {
    if (activeTab === 'adaptacoes') return true; 
    if (activeTab === 'pedidos') return true;
    if (activeTab === 'componentes') return false;
    if (activeTab === 'cardan') return !!(selectedCardanModel && selectedCardanVehicle);
    return !!selectedVeiculo || searchTerm.length > 0;
  }, [activeTab, selectedVeiculo, searchTerm, selectedCardanModel, selectedCardanVehicle]);

  const renderControls = (options: string[], label: string, showSearch: boolean = true, showStateIcms: boolean = true) => {
    // Cálculo automático do ICMS baseado no estado selecionado
    let icmsValue = '17%';
    if (selectedUF) {
        const state = BRAZILIAN_STATES.find(s => s.uf === selectedUF);
        if (state) {
            icmsValue = state.rate === 'icms12' ? '12%' : state.rate === 'icms7' ? '7%' : '17%';
        }
    }

    return (
      <div className="flex flex-col gap-3 mb-6 animate-fade-in-down">
        {/* Linha 1: Filtros Principais (Veículo, Estado, ICMS) */}
        <div className="flex flex-col md:flex-row gap-4 items-end">
          
          {/* Coluna 1: Modelo do Veículo (Expandido) */}
          <div className="flex-1 w-full">
            <label className={`block text-[9px] font-bold uppercase mb-1 ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-800'}`}>
              {label}
            </label>
            <div className="relative">
              <select 
                value={selectedVeiculo} 
                onChange={e => setSelectedVeiculo(e.target.value)} 
                className={`w-full h-9 pl-3 pr-8 rounded-lg appearance-none outline-none font-semibold text-[11px] transition-all shadow-sm border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-1 focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400'}`}
              >
                <option value="">Selecione...</option>
                {options.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">
                <ChevronRightIcon className="w-4 h-4 rotate-90" />
              </div>
            </div>
          </div>

          {/* Coluna 2 e 3: Estado e ICMS (Só aparecem se a busca estiver ativa e showStateIcms for true) */}
          {showSearch && showStateIcms && (
            <>
                <div className="w-full md:w-48">
                    <label className={`block text-[9px] font-bold uppercase mb-1 ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-800'}`}>
                    Estado
                    </label>
                    <div className="relative">
                        <select 
                            value={selectedUF} 
                            onChange={e => setSelectedUF(e.target.value)} 
                            className={`w-full h-9 pl-3 pr-8 rounded-lg appearance-none outline-none font-semibold text-[11px] transition-all shadow-sm border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-1 focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400'}`}
                        >
                            <option value="">Selecione...</option>
                            {BRAZILIAN_STATES.map(state => (
                                <option key={state.uf} value={state.uf}>{state.uf}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">
                            <ChevronRightIcon className="w-4 h-4 rotate-90" />
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-32">
                    <label className={`block text-[9px] font-bold uppercase mb-1 ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-800'}`}>
                        ICMS
                    </label>
                    <div className={`w-full h-9 flex items-center px-3 rounded-lg border font-bold text-[11px] select-none ${isDarkMode ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                        {icmsValue} ICMS
                    </div>
                </div>
            </>
          )}
        </div>

        {/* Linha 2: Busca e Limpar */}
        {showSearch ? (
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input 
                      type="text" 
                      placeholder="Digite para pesquisar em todos os itens..." 
                      value={searchTerm} 
                      onChange={e => setSearchTerm(e.target.value)} 
                      className={`w-full h-9 pl-10 pr-10 rounded-lg outline-none font-medium text-[11px] transition-all shadow-sm border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500' : 'bg-white border-slate-200 text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400'}`} 
                  />
                  {searchTerm && (
                      <button 
                          onClick={() => setSearchTerm('')}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                          <span className="text-[10px] font-bold">X</span>
                      </button>
                  )}
              </div>

               <button 
                  onClick={handleClearFilters}
                  className={`h-9 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-colors whitespace-nowrap ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'}`}
               >
                  LIMPAR
               </button>
            </div>
        ) : (
             <div className="flex justify-end">
                 <button 
                  onClick={handleClearFilters}
                  className={`h-9 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-colors whitespace-nowrap ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'}`}
               >
                  LIMPAR
               </button>
             </div>
        )}
      </div>
    );
  };

  return (
    <ErrorBoundary>
        <div className={`flex h-screen overflow-hidden font-sans text-xs relative transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
        
        {/* SIDEBAR FLUTUANTE */}
        {!isLoggedIn ? null : (
            <aside 
                className={`
                relative flex flex-col shadow-2xl z-20 transition-all duration-300 ease-in-out
                ${isDarkMode ? 'bg-slate-800' : UI_STABLE_CONFIG.primaryColor}
                m-4 rounded-3xl h-[calc(100vh-2rem)]
                ${isSidebarCollapsed ? 'w-16' : 'w-56'}
                `}
            >
                <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={`absolute -right-3 top-8 text-blue-600 rounded-full p-1 shadow-md z-30 border hover:scale-110 transition-transform ${isDarkMode ? 'bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-700' : 'bg-white border-blue-50 hover:bg-slate-50'}`}
                >
                {isSidebarCollapsed ? <ChevronRightIcon className="w-3.5 h-3.5" /> : <ChevronLeftIcon className="w-3.5 h-3.5" />}
                </button>

                <div className={`h-14 flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'px-5'} transition-all`}>
                <img 
                    src={isSidebarCollapsed ? UI_STABLE_CONFIG.collapsedLogoUrl : UI_STABLE_CONFIG.headerLogoUrl} 
                    alt="Logo" 
                    className={`object-contain transition-all duration-300 ${isSidebarCollapsed ? 'h-4 w-auto' : 'h-4 w-auto'}`} 
                />
                </div>

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

                <div className={`border-t transition-all duration-300 ${isSidebarCollapsed ? 'p-2 py-3' : 'p-2.5'} ${isDarkMode ? 'border-slate-700 bg-black/20' : 'border-blue-500/30 bg-blue-700/10'}`}>
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
        )}

        {/* MAIN CONTENT AREA */}
        <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-100'}`}>
            
            {!isLoggedIn ? (
                // Login Screen (Repetido do bloco anterior para manter integridade visual no backup)
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
                        <input type="text" value={loginUser} onChange={e => {setLoginUser(e.target.value.toUpperCase()); setLoginError(false);}} className={`w-full bg-slate-100 border-none p-2 text-[11px] rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-800 font-semibold uppercase h-8 ${loginError ? 'ring-2 ring-red-500 bg-red-50' : ''}`} />
                        </div>
                        <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Senha</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={loginPass} 
                                onChange={e => {setLoginPass(e.target.value); setLoginError(false);}} 
                                className={`w-full bg-slate-100 border-none p-2 pr-8 text-[11px] rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-800 font-semibold h-8 ${loginError ? 'ring-2 ring-red-500 bg-red-50' : ''}`} 
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                            </button>
                        </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                id="rememberMe" 
                                checked={rememberMe} 
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor="rememberMe" className="text-[10px] font-medium text-slate-500 cursor-pointer select-none">Lembrar-me</label>
                        </div>

                        {loginError && (
                            <div className="text-[10px] text-red-500 font-bold text-center bg-red-50 p-1.5 rounded-lg animate-pulse">
                                Usuário ou senha incorretos.
                            </div>
                        )}

                        <div className="flex flex-col items-center gap-3 pt-1">
                        <button 
                            type="submit" 
                            className="w-full bg-slate-200 hover:bg-blue-600 text-slate-500 hover:text-white py-2 rounded-full font-bold text-xs tracking-wide shadow-sm hover:shadow-md transition-all uppercase active:bg-blue-700"
                        >
                            ENTRAR
                        </button>
                        <a
                            href="http://wa.me/54999795081"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-slate-400 hover:text-orange-500 transition-colors font-medium mt-1 cursor-pointer"
                        >
                            Esqueceu sua senha
                        </a>
                        </div>
                    </form>
                    </div>
                </div>
            ) : (
                <>
                    <header className={`mx-5 mt-5 p-3 rounded-xl shadow-sm flex items-center justify-between z-10 sticky top-5 border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-transparent'}`}>
                    <div>
                        <h1 className={`text-base font-bold tracking-tight ml-2 ${isDarkMode ? 'text-slate-100' : 'text-slate-700'}`}>{currentTabLabel}</h1>
                    </div>
                    
                    <button
                        onClick={() => setActiveTab('pedidos')}
                        className={`
                            relative group p-1.5 rounded-lg transition-all duration-200
                            ${activeTab === 'pedidos' ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'}
                        `}
                        title="Ir para Pedidos"
                    >
                        <ShoppingCartIcon className="w-4 h-4" />
                        {totals.total > 0 && activeTab !== 'pedidos' && (
                            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full border border-white shadow-sm flex items-center justify-center text-[8px] text-white font-bold animate-pulse">
                            {cartItems.reduce((acc, i) => acc + i.quantidade, 0)}
                            </span>
                        )}
                    </button>
                    </header>

                    <main className="flex-1 overflow-y-auto p-5 md:p-6 custom-scrollbar">
                    <div className="max-w-6xl mx-auto space-y-5">
                        
                        {activeTab === 'catracas' && (
                            <div className="animate-fade-in-up">
                                {renderControls(uniqueVehicles, "Modelo do Veículo", true)}
                                {showTable ? (
                                <div className={`border rounded-xl overflow-hidden shadow-sm animate-fade-in-up ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                                    <table className="w-full text-left">
                                    <thead className={`border-b font-bold uppercase tracking-wider text-[9px] ${isDarkMode ? 'bg-slate-900/50 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                        <tr>
                                        <th className="px-3 py-2.5">Veículo</th>
                                        <th className="px-2 py-2.5">Cód. Interno</th>
                                        <th className="px-2 py-2.5">Cód. Freiocar</th>
                                        <th className="px-2 py-2.5">Modelo</th>
                                        <th className="px-2 py-2.5">Descrição</th>
                                        <th className="px-2 py-2.5">Lado</th>
                                        <th className="px-1 py-2.5 text-center">A</th>
                                        <th className="px-1 py-2.5 text-center">B</th>
                                        <th className="px-1 py-2.5 text-center">C</th>
                                        <th className="px-1 py-2.5 text-center">D</th>
                                        <th className="px-2 py-2.5 text-right">Valor</th>
                                        <th className="px-2 py-2.5 text-center">Qtd.</th>
                                        <th className="px-2 py-2.5 text-center">ADIC.</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                                        {filteredCatracas.map(part => (
                                        <DetailCard 
                                            key={part.codInterno} 
                                            part={part} 
                                            activeRate={activeRate} 
                                            quantity={catracaQuantities[part.codInterno] || 0} 
                                            onIncrement={() => setCatracaQuantities(p => ({...p, [part.codInterno]: (p[part.codInterno] || 0) + 1}))} 
                                            onDecrement={() => setCatracaQuantities(p => ({...p, [part.codInterno]: Math.max(0, (p[part.codInterno] || 0) - 1)}))}
                                            onAddToCart={() => handleAddToCart(part, 'catraca', activeRate === 'icms12' ? part.icms12 : (activeRate === 'icms7' ? part.icms7 : part.icms17), Math.max(1, catracaQuantities[part.codInterno] || 0))}
                                            isInCart={cartItems.some(i => i.id === part.codInterno)}
                                            isDarkMode={isDarkMode}
                                        />
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
                                <div className={`mb-4 p-3 rounded-lg border flex gap-3 animate-fade-in-up shadow-sm ${isDarkMode ? 'bg-amber-900/20 border-amber-900/40' : 'bg-amber-50 border-amber-200'}`}>
                                    <InfoIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="text-[10px] font-bold text-amber-700 uppercase mb-0.5">Observações do Veículo</h3>
                                        <p className={`text-[11px] leading-snug ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{selectedKitObservation}</p>
                                    </div>
                                </div>
                                )}

                                {showTable ? (
                                <div className={`border rounded-xl overflow-hidden shadow-sm animate-fade-in-up ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                                    <table className="w-full text-left">
                                    <thead className={`border-b font-bold uppercase tracking-wider text-[9px] ${isDarkMode ? 'bg-slate-900/50 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                        <tr>
                                        {(searchTerm.length > 0) && <th className="p-2.5">Veículo</th>}
                                        <th className="p-2.5">Tipo</th><th className="p-2.5">Cód. Interno</th><th className="p-2.5">Cód. Freiocar</th><th className="p-2.5">Descrição</th><th className="p-2.5 text-right">Valor</th><th className="p-2.5 text-center">Qtd.</th><th className="p-2.5 text-center">ADIC.</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                                        {filteredKitItems.map((kit, idx) => (
                                        <KitRow 
                                            key={`${kit.tipoItem}-${idx}`} 
                                            kit={kit} 
                                            activeRate={activeRate} 
                                            showVehicleColumn={searchTerm.length > 0} 
                                            quantity={kitQuantities[kit.tipoItem] || 0} 
                                            onIncrement={() => setKitQuantities(p => ({...p, [kit.tipoItem]: (p[kit.tipoItem] || 0) + 1}))} 
                                            onDecrement={() => setKitQuantities(p => ({...p, [kit.tipoItem]: Math.max(0, (p[kit.tipoItem] || 0) - 1)}))} 
                                            onAddToCart={() => handleAddToCart(kit, 'kit', activeRate === 'icms12' ? kit.icms12 : (activeRate === 'icms7' ? kit.icms7 : kit.icms17), Math.max(1, kitQuantities[kit.tipoItem] || 0))}
                                            isInCart={cartItems.some(i => i.id === (kit.codInterno || kit.tipoItem))}
                                            isDarkMode={isDarkMode}
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

                        {activeTab === 'componentes' && (
                            <div className="animate-fade-in-up">
                                <div className="text-center py-12 text-slate-400">
                                    <BrakeComponentsIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs">Esta seção está em construção.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'cardan' && (
                            <div className="animate-fade-in-up">
                                <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
                                     <div className="w-full md:w-[30%]">
                                        <label className={`block text-[9px] font-bold uppercase mb-1 ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-800'}`}>
                                        MODELO
                                        </label>
                                        <div className="relative">
                                        <select 
                                            value={selectedCardanModel} 
                                            onChange={e => { setSelectedCardanModel(e.target.value); setSelectedCardanVehicle(''); }} 
                                            className={`w-full h-9 pl-3 pr-8 rounded-lg appearance-none outline-none font-semibold text-[11px] transition-all shadow-sm border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-1 focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400'}`}
                                        >
                                            <option value="">Selecione um Modelo...</option>
                                            {uniqueCardanModels.map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                        <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">
                                            <ChevronRightIcon className="w-4 h-4 rotate-90" />
                                        </div>
                                        </div>
                                    </div>
                                    <div className="w-full md:flex-1">
                                        <label className={`block text-[9px] font-bold uppercase mb-1 ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-800'}`}>
                                        VEÍCULO
                                        </label>
                                        <div className="relative">
                                        <select 
                                            value={selectedCardanVehicle} 
                                            onChange={e => setSelectedCardanVehicle(e.target.value)} 
                                            disabled={!selectedCardanModel}
                                            className={`w-full h-9 pl-3 pr-8 rounded-lg appearance-none outline-none font-semibold text-[11px] transition-all shadow-sm border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-1 focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400'} ${!selectedCardanModel ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <option value="">{selectedCardanModel ? "Selecione um Veículo..." : "Selecione primeiro o Modelo"}</option>
                                            {availableCardanVehicles.map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                        <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">
                                            <ChevronRightIcon className="w-4 h-4 rotate-90" />
                                        </div>
                                        </div>
                                    </div>
                                     <div className="w-auto">
                                        <button 
                                        onClick={handleClearFilters}
                                        className={`h-9 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-colors whitespace-nowrap border ${isDarkMode ? 'text-slate-400 border-slate-700 hover:text-white hover:bg-slate-800' : 'text-slate-500 border-slate-200 hover:text-blue-600 hover:bg-slate-50'}`}
                                        >
                                        LIMPAR
                                        </button>
                                     </div>
                                </div>
                                {showTable ? (
                                    <div className={`border rounded-xl overflow-hidden shadow-sm animate-fade-in-up ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                                        <table className="w-full text-left">
                                            <thead className={`border-b font-bold uppercase tracking-wider text-[9px] ${isDarkMode ? 'bg-slate-900/50 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                                <tr>
                                                    <th className="pl-4 pr-2 py-2.5">Cód. Interno</th>
                                                    <th className="px-2 py-2.5">Med. Tubo</th>
                                                    <th className="px-2 py-2.5">≠ Peça</th>
                                                    <th className="px-2 py-2.5">Cruzeta</th>
                                                    <th className="px-2 py-2.5">Med. Cruzeta</th>
                                                    <th className="px-2 py-2.5">Observações</th>
                                                    <th className="px-2 py-2.5 text-right">Valor</th>
                                                    <th className="px-2 py-2.5 text-center">Qtd.</th>
                                                    <th className="px-2 py-2.5 text-center pr-4">ADIC.</th>
                                                </tr>
                                            </thead>
                                            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                                                {filteredCardanItems.map((item, idx) => (
                                                    <CardanRow 
                                                        key={`${item.codInterno}-${idx}`}
                                                        item={item}
                                                        quantity={cardanQuantities[item.codInterno] || 0}
                                                        onIncrement={() => setCardanQuantities(p => ({...p, [item.codInterno]: (p[item.codInterno] || 0) + 1}))}
                                                        onDecrement={() => setCardanQuantities(p => ({...p, [item.codInterno]: Math.max(0, (p[item.codInterno] || 0) - 1)}))}
                                                        onAddToCart={() => handleAddToCart(item, 'catraca', item.valor, Math.max(1, cardanQuantities[item.codInterno] || 0))}
                                                        isInCart={cartItems.some(i => i.id === item.codInterno)}
                                                        isDarkMode={isDarkMode}
                                                    />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-slate-400">
                                        <CardanIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                        <p className="text-xs">{selectedCardanVehicle ? `Nenhum item encontrado para ${selectedCardanVehicle}` : "Selecione um modelo e veículo acima para visualizar as peças."}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'kit3eixo' && (
                            <div className="animate-fade-in-up">
                                {renderControls(unique3EixoVehicles, "Modelo do Veículo", true, false)}
                                <div className="flex items-center gap-6 mb-2 px-1 -mt-3">
                                    {/* (Botões de filtro 3º Eixo - mantidos) */}
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => { const ns = !isEixoRedondo; setIsEixoRedondo(ns); if(ns) setIsEixoTubular(false); }} className={`relative w-8 h-4 rounded-full transition-colors ${isEixoRedondo ? 'bg-green-500' : (isDarkMode ? 'bg-slate-700' : 'bg-slate-200')}`}><span className={`absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${isEixoRedondo ? 'translate-x-4' : ''}`} /></button><span className={`text-[9px] font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>EIXO REDONDO</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => { const ns = !isEixoTubular; setIsEixoTubular(ns); if(ns) setIsEixoRedondo(false); }} className={`relative w-8 h-4 rounded-full transition-colors ${isEixoTubular ? 'bg-green-500' : (isDarkMode ? 'bg-slate-700' : 'bg-slate-200')}`}><span className={`absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${isEixoTubular ? 'translate-x-4' : ''}`} /></button><span className={`text-[9px] font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>EIXO TUBULAR RETANGULAR</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 mb-4 px-1">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => { const ns = !isCuicaSimples; setIsCuicaSimples(ns); if(ns) setIsCuicaDupla(false); }} className={`relative w-8 h-4 rounded-full transition-colors ${isCuicaSimples ? 'bg-green-500' : (isDarkMode ? 'bg-slate-700' : 'bg-slate-200')}`}><span className={`absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${isCuicaSimples ? 'translate-x-4' : ''}`} /></button><span className={`text-[9px] font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>CUICA SIMPLES</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => { const ns = !isCuicaDupla; setIsCuicaDupla(ns); if(ns) setIsCuicaSimples(false); }} className={`relative w-8 h-4 rounded-full transition-colors ${isCuicaDupla ? 'bg-green-500' : (isDarkMode ? 'bg-slate-700' : 'bg-slate-200')}`}><span className={`absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${isCuicaDupla ? 'translate-x-4' : ''}`} /></button><span className={`text-[9px] font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>CUICA DUPLA</span>
                                    </div>
                                </div>

                                {showTable ? (
                                <div className={`border rounded-xl overflow-hidden shadow-sm animate-fade-in-up ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                                    <table className="w-full text-left">
                                    <thead className={`border-b font-bold uppercase tracking-wider text-[9px] ${isDarkMode ? 'bg-slate-900/50 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                        <tr><th className="p-2.5">Tipo</th><th className="p-2.5">Cód. Interno</th><th className="p-2.5">Cód. Freiocar</th><th className="p-2.5">Descrição</th><th className="p-2.5 text-right">Valor</th><th className="p-2.5 text-center">Qtd.</th><th className="p-2.5 text-center">ADIC.</th></tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                                        {filtered3EixoItems.map(item => (
                                        <Kit3EixoRow 
                                            key={item.codInterno} 
                                            item={item} 
                                            quantity={kit3EixoQuantities[item.codInterno] || 0} 
                                            onIncrement={() => setKit3EixoQuantities(p => ({...p, [item.codInterno]: (p[item.codInterno] || 0) + 1}))} 
                                            onDecrement={() => setKit3EixoQuantities(p => ({...p, [item.codInterno]: Math.max(0, (p[item.codInterno] || 0) - 1)}))}
                                            onAddToCart={() => handleAddToCart(item, 'kit3eixo', item.valor, Math.max(1, kit3EixoQuantities[item.codInterno] || 0))}
                                            isInCart={cartItems.some(i => i.id === item.codInterno)}
                                            isDarkMode={isDarkMode}
                                        />
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
                            <div className="animate-fade-in-up">
                                <div className="flex flex-col mb-4">
                                    <div className="relative">
                                        <SearchIcon className="absolute left-3 top-2 h-4 w-4 text-slate-400" />
                                        <input type="text" placeholder="Pesquisar por Nota Fiscal, Nº Série ou Garantia..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`w-full h-8 pl-9 pr-3 border rounded-lg text-[11px] font-medium outline-none transition-all shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300 text-slate-700'}`} />
                                        {searchTerm && <button onClick={handleClearFilters} className="absolute right-2 top-1 h-6 px-2 text-[9px] font-bold text-slate-400 hover:text-slate-600">LIMPAR</button>}
                                    </div>
                                    <p className={`text-[10px] mt-2 ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Digite acima para filtrar as adaptações.</p>
                                </div>
                                <div className="flex flex-wrap justify-center gap-5">
                                    {filteredAdaptacoes.map((item, idx) => (
                                        <div key={`${item.nSerie}-${idx}`} className="w-full md:w-[calc(50%-1.25rem)] xl:w-[calc(50%-1.25rem)] max-w-[650px]">
                                            <AdaptacaoCard data={item} isDarkMode={isDarkMode} />
                                        </div>
                                    ))}
                                </div>
                                {filteredAdaptacoes.length === 0 && searchTerm && <div className="p-8 text-center text-slate-400 text-xs">Nenhuma adaptação encontrada para "{searchTerm}".</div>}
                            </div>
                        )}

                        {activeTab === 'pedidos' && (
                            <div className="animate-fade-in-up space-y-4">
                                {cartItems.length > 0 && (
                                    <div className={`p-5 rounded-xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                                        <div className="flex items-center justify-between mb-4 border-b pb-2 border-slate-100/50">
                                            <div className="flex items-center gap-2">
                                                <UserIcon className={`w-3.5 h-3.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                                <h2 className={`text-xs font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Dados do Cliente</h2>
                                            </div>
                                            <button onClick={handleClearCart} className="text-[9px] font-bold text-red-500 hover:text-red-600 uppercase tracking-wide transition-colors">Limpar Pedido</button>
                                        </div>
                                        <div className="grid grid-cols-12 gap-3">
                                            <div className="col-span-12 md:col-span-5"><label className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 block">Nome do Cliente</label><input type="text" placeholder="Digite o nome completo" value={clientData.nome} onChange={e => handleClientDataChange('nome', e.target.value)} className={`w-full h-7 px-2 rounded border text-[10px] font-medium outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-600' : 'bg-white border-slate-200 text-slate-700 placeholder-slate-300'}`} /></div>
                                            <div className="col-span-12 md:col-span-3"><label className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 block">CNPJ</label><input type="text" placeholder="00.000.000/0000-00" value={clientData.cnpj} onChange={e => handleClientDataChange('cnpj', e.target.value)} className={`w-full h-7 px-2 rounded border text-[10px] font-medium outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-600' : 'bg-white border-slate-200 text-slate-700 placeholder-slate-300'}`} /></div>
                                            <div className="col-span-12 md:col-span-4"><label className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 block">Contato</label><input type="text" placeholder="Nome do responsável" value={clientData.contato} onChange={e => handleClientDataChange('contato', e.target.value)} className={`w-full h-7 px-2 rounded border text-[10px] font-medium outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-600' : 'bg-white border-slate-200 text-slate-700 placeholder-slate-300'}`} /></div>
                                            <div className="col-span-12 md:col-span-3"><label className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 block">Telefone</label><input type="text" placeholder="(00) 00000-0000" value={clientData.telefone} onChange={e => handleClientDataChange('telefone', e.target.value)} className={`w-full h-7 px-2 rounded border text-[10px] font-medium outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-600' : 'bg-white border-slate-200 text-slate-700 placeholder-slate-300'}`} /></div>
                                            <div className="col-span-12 md:col-span-4"><label className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 block">E-mail</label><input type="text" placeholder="email@exemplo.com" value={clientData.email} onChange={e => handleClientDataChange('email', e.target.value)} className={`w-full h-7 px-2 rounded border text-[10px] font-medium outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-600' : 'bg-white border-slate-200 text-slate-700 placeholder-slate-300'}`} /></div>
                                            <div className="col-span-8 md:col-span-4"><label className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 block">Cidade</label><input type="text" placeholder="Cidade" value={clientData.cidade} onChange={e => handleClientDataChange('cidade', e.target.value)} className={`w-full h-7 px-2 rounded border text-[10px] font-medium outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-600' : 'bg-white border-slate-200 text-slate-700 placeholder-slate-300'}`} /></div>
                                            <div className="col-span-4 md:col-span-1"><label className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 block">UF</label><select value={clientData.uf} onChange={e => handleClientDataChange('uf', e.target.value)} className={`w-full h-7 px-1 rounded border text-[10px] font-medium outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}><option value="">-</option>{BRAZILIAN_STATES.map(s => <option key={s.uf} value={s.uf}>{s.uf}</option>)}</select></div>
                                            <div className="col-span-12 md:col-span-3"><label className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 block">Representante</label><input type="text" placeholder="Nome do representante" value={clientData.representante} onChange={e => handleClientDataChange('representante', e.target.value)} className={`w-full h-7 px-2 rounded border text-[10px] font-medium outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-600' : 'bg-white border-slate-200 text-slate-700 placeholder-slate-300'}`} /></div>
                                            <div className="col-span-4 md:col-span-2"><label className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 block">Pedido Nº</label><input type="text" placeholder="0000" value={clientData.pedido} onChange={e => handleClientDataChange('pedido', e.target.value)} className={`w-full h-7 px-2 rounded border text-[10px] font-medium outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-600' : 'bg-white border-slate-200 text-slate-700 placeholder-slate-300'}`} /></div>
                                            <div className="col-span-12 md:col-span-3"><label className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 block">Forma de Pagamento</label><input type="text" placeholder="Ex: 30/60 dias" value={clientData.pagamento} onChange={e => handleClientDataChange('pagamento', e.target.value)} className={`w-full h-7 px-2 rounded border text-[10px] font-medium outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-600' : 'bg-white border-slate-200 text-slate-700 placeholder-slate-300'}`} /></div>
                                            <div className="col-span-8 md:col-span-3"><label className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 block">Transportadora</label><input type="text" placeholder="Nome da transportadora" value={clientData.transportadora} onChange={e => handleClientDataChange('transportadora', e.target.value)} className={`w-full h-7 px-2 rounded border text-[10px] font-medium outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-600' : 'bg-white border-slate-200 text-slate-700 placeholder-slate-300'}`} /></div>
                                            <div className="col-span-4 md:col-span-1"><label className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 block">Frete</label><select value={clientData.tipoFrete} onChange={e => handleClientDataChange('tipoFrete', e.target.value)} className={`w-full h-7 px-1 rounded border text-[10px] font-medium outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}><option value="">-</option><option value="CIF">CIF</option><option value="FOB">FOB</option><option value="RETIRA">RETIRA</option></select></div>
                                        </div>
                                    </div>
                                )}

                                <div className={`rounded-xl border shadow-sm overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                                    <div className={`px-4 py-2 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className="flex items-center gap-2">
                                            <PackageIcon className={`w-3.5 h-3.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                                            <h2 className={`text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 px-2 py-0.5 rounded ${isDarkMode ? 'bg-slate-700 text-slate-300' : ''}`}>Itens do Pedido</h2>
                                        </div>
                                    </div>
                                    {cartItems.length === 0 ? (
                                        <div className="p-10 text-center">
                                            <ShoppingCartIcon className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                                            <p className="text-slate-400 text-[11px] font-medium">Seu carrinho está vazio.</p>
                                            <button onClick={() => setActiveTab('kits')} className="mt-3 text-blue-500 text-[10px] font-bold hover:underline uppercase tracking-wide">Voltar ao catálogo</button>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className={`text-[9px] uppercase font-bold text-slate-400 border-b tracking-wider ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                                                    <tr>
                                                        <th className="px-4 py-3 w-32">Cód. Interno</th>
                                                        <th className="px-4 py-3 w-32">Cód. Freiocar</th>
                                                        <th className="px-4 py-3">Descrição</th>
                                                        <th className="px-4 py-3 text-right">Valor</th>
                                                        <th className="px-4 py-3 text-center">Qtd.</th>
                                                        <th className="px-4 py-3 text-center">Remover</th>
                                                    </tr>
                                                </thead>
                                                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                                                    {cartItems.map(item => (<CartRow key={item.id} item={item} isDarkMode={isDarkMode} formatCurrency={formatCurrency} handleUpdateCartQuantity={handleUpdateCartQuantity} handleRemoveFromCart={handleRemoveFromCart} />))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {cartItems.length > 0 && (
                                    <div className={`rounded-lg border p-3 flex gap-3 ${isDarkMode ? 'bg-amber-900/10 border-amber-900/30' : 'bg-amber-50 border-amber-100'}`}>
                                        <div className="mt-0.5"><InfoIcon className={`w-4 h-4 ${isDarkMode ? 'text-amber-500' : 'text-amber-500'}`} /></div>
                                        <div className="w-full">
                                            <h3 className={`text-[10px] font-bold uppercase mb-1 tracking-wide ${isDarkMode ? 'text-amber-500' : 'text-amber-700'}`}>Observações do Pedido</h3>
                                            <textarea value={clientData.observacao} onChange={e => handleClientDataChange('observacao', e.target.value)} placeholder="Digite aqui observações adicionais para este pedido..." className={`w-full bg-transparent outline-none text-[10px] resize-none h-12 placeholder-opacity-50 ${isDarkMode ? 'text-slate-300 placeholder-slate-500' : 'text-slate-600 placeholder-amber-400'}`}></textarea>
                                        </div>
                                    </div>
                                )}

                                {cartItems.length > 0 && totals.subtotal > 0 && (
                                    <div className={`p-5 rounded-xl border shadow-lg relative overflow-hidden animate-slide-in-right mb-4 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-blue-100'}`}>
                                        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-10 -mt-10 blur-2xl opacity-50 pointer-events-none ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}></div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-center mb-1"><span className="text-[11px] font-medium text-slate-500">Subtotal</span><span className="font-bold text-blue-500 text-xs">{formatCurrency(totals.subtotal)}</span></div>
                                            <div className="flex justify-between items-center mb-3"><span className="text-[11px] font-medium text-slate-500">IPI (3.25%)</span><span className="font-bold text-blue-300 text-xs">{formatCurrency(totals.ipi)}</span></div>
                                            <div className={`flex justify-between items-end border-t border-dashed pt-3 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                                                <div>
                                                    <span className="text-xs font-bold text-blue-600 block uppercase tracking-wide">TOTAL</span>
                                                    {activeTab !== 'pedidos' ? (
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <button onClick={() => setIsConsumerFinal(!isConsumerFinal)} className={`relative w-8 h-4 rounded-full transition-colors ${isConsumerFinal ? 'bg-green-500' : (isDarkMode ? 'bg-slate-700' : 'bg-slate-200')}`}><span className={`absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${isConsumerFinal ? 'translate-x-4' : ''}`} /></button><span className="text-[10px] font-bold text-slate-400">Consumidor Final (+5%)</span>
                                                        </div>
                                                    ) : (<div className="mt-2"></div>)}
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    <div className="text-xl font-black text-emerald-600 tracking-tight">{formatCurrency(totals.total)}</div>
                                                    {activeTab === 'pedidos' && (
                                                        <>
                                                            <div className="text-[9px] font-bold text-slate-400 mt-0.5 mb-2">ICMS APLICADO: {cartRate ? cartRate.replace('icms', '') + '%' : 'PADRÃO'}</div>
                                                            <button onClick={handlePrintOrder} className={`flex items-center gap-2 py-1 px-3 rounded-lg transition-colors text-[9px] font-bold uppercase tracking-wide ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}><PrinterIcon className="w-3 h-3" />Imprimir Pedido</button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab !== 'pedidos' && activeTab !== 'adaptacoes' && totals.subtotal > 0 && (
                            <div className={`p-5 rounded-xl border shadow-lg relative overflow-hidden animate-slide-in-right mb-4 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-blue-100'}`}>
                                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-10 -mt-10 blur-2xl opacity-50 pointer-events-none ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-center mb-1"><span className="text-[11px] font-medium text-slate-500">Subtotal</span><span className="font-bold text-blue-500 text-xs">{formatCurrency(totals.subtotal)}</span></div>
                                    <div className="flex justify-between items-center mb-3"><span className="text-[11px] font-medium text-slate-500">IPI (3.25%)</span><span className="font-bold text-blue-300 text-xs">{formatCurrency(totals.ipi)}</span></div>
                                    <div className={`flex justify-between items-end border-t border-dashed pt-3 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                                        <div>
                                            <span className="text-xs font-bold text-blue-600 block uppercase tracking-wide">TOTAL</span>
                                            <div className="flex items-center gap-2 mt-2">
                                                <button onClick={() => setIsConsumerFinal(!isConsumerFinal)} className={`relative w-8 h-4 rounded-full transition-colors ${isConsumerFinal ? 'bg-green-500' : (isDarkMode ? 'bg-slate-700' : 'bg-slate-200')}`}><span className={`absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${isConsumerFinal ? 'translate-x-4' : ''}`} /></button><span className="text-[10px] font-bold text-slate-400">Consumidor Final (+5%)</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <div className="text-xl font-black text-emerald-600 tracking-tight">{formatCurrency(totals.total)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    </main>

                    <footer className={`mx-5 mb-5 py-2 px-4 rounded-xl shadow-sm flex justify-between items-center text-[10px] z-20 shrink-0 h-10 border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                        <div className="text-slate-400 font-medium">© 2026 Cardancorp.app</div>
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] text-slate-300 font-mono tracking-tight">v{UI_STABLE_CONFIG.version}</span>
                            
                            <button
                            onClick={toggleTheme}
                            className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${isDarkMode ? 'bg-slate-600' : 'bg-slate-200'}`}
                            title={isDarkMode ? "Ativar modo claro" : "Ativar modo escuro"}
                            >
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-300 flex items-center justify-center ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`}>
                                {isDarkMode ? <MoonStarsIcon className="w-2 h-2 text-slate-700" /> : <SunIcon className="w-2 h-2 text-amber-500" />}
                            </div>
                            </button>

                            <button 
                            onClick={loadData} 
                            title="Sincronizar dados"
                            className="text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-all p-1 rounded-full group"
                            >
                            <RefreshIcon className={`w-3 h-3 ${loadingState === LoadingState.LOADING ? 'animate-spin text-blue-500' : 'group-hover:rotate-180 transition-transform duration-500'}`} /> 
                            </button>
                        </div>
                    </footer>
                </>
            )}
        </div>

        {showIcmsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                <div className={`rounded-xl shadow-2xl max-w-sm w-full p-6 animate-scale-up ${isDarkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800'}`}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                            <InfoIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold">Conflito de ICMS Detectado</h3>
                    </div>
                    <p className={`text-xs mb-6 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Você está tentando adicionar um item com uma alíquota de ICMS diferente dos itens já existentes no carrinho. <br/><br/>
                        Para prosseguir, é necessário limpar o carrinho atual ou cancelar a adição deste item.
                    </p>
                    <div className="flex gap-3 justify-end">
                        <button 
                            onClick={cancelAdd}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={confirmClearAndAdd}
                            className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-md"
                        >
                            Limpar e Adicionar
                        </button>
                    </div>
                </div>
            </div>
        )}
        </div>
    </ErrorBoundary>
  );
};

export default App;
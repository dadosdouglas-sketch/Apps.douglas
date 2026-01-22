import { PartData, KitItemData, AdaptacaoData, Kit3EixoData, CardanData, UserCredential } from '../types';

// =========================================================================================
// CONFIGURAÇÃO DOS LINKS CSV
// =========================================================================================

const MASTER_PARTS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRRP4-RXNe8K2SCM5F4eif-84bhtSflQQRH_U-vZEagd8a4CL7m5JzUAhXxPPoii6TfFUza_90eLZGA/pub?output=csv';
const KITS_FULL_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS6Xcw-LbNyXrKhle8AW37zq0eYLIpHZLwgzA9Uc87-xsFwyzJaHesHl7DECmEhsbn353qjTV0AWuMt/pub?output=csv';
const ADAPTACOES_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTtKaSH5Yjj3OawT5phTfyXKvBsUQISzGj5Zq6Ex7swLUFGJyU8resWHU9VoUG6vDr4s-n4cLgE0XPy/pub?output=csv';
const KIT_3EIXO_URL = 'https://docs.google.com/spreadsheets/d/1jopMxv3-GMKrWQGDXdsqpuf8FStACQBT4WOvGOl8pVI/export?format=csv';
const CARDAN_URL = 'https://docs.google.com/spreadsheets/d/1brLBB3K9SDaYY5DM5Axu49i2HymI9hL2G0N5Bz8rYQg/export?format=csv';

// -----------------------------------------------------------------------------------------
// CONFIGURAÇÃO DE USUÁRIOS (NOVA PLANILHA UNIFICADA)
// -----------------------------------------------------------------------------------------
// ID: 1VVOvdtbqZ_HzsEe0TGHrViaonux4RmHhLcPd1VfNEK4
const USERS_UNIFIED_URL = 'https://docs.google.com/spreadsheets/d/1VVOvdtbqZ_HzsEe0TGHrViaonux4RmHhLcPd1VfNEK4/export?format=csv';

// =========================================================================================

const parseCSV = (text: string): string[][] => {
  const arr: string[][] = [];
  let quote = false;
  let row: string[] = [];
  let col = '';
  
  for (let c = 0; c < text.length; c++) {
    let cc = text[c];
    let nc = text[c+1];
    
    if (cc === '"') {
      if (quote && nc === '"') { 
        col += '"'; 
        c++; 
      } else { 
        quote = !quote; 
      }
    } else if (cc === ',' && !quote) {
      row.push(col); 
      col = '';
    } else if (cc === '\r' && !quote && nc === '\n') {
      row.push(col); 
      col = ''; 
      arr.push(row); 
      row = []; 
      c++;
    } else if ((cc === '\r' || cc === '\n') && !quote) {
      row.push(col); 
      col = ''; 
      arr.push(row); 
      row = [];
    } else {
      col += cc;
    }
  }
  if (row.length > 0 || col.length > 0) {
    row.push(col);
    arr.push(row);
  }
  return arr;
};

const fetchCSVText = async (url: string) => {
  if (!url) return '';
  const response = await fetch(url);
  if (!response.ok) {
    console.warn(`Failed to fetch data from ${url}: ${response.statusText}`);
    return '';
  }
  return await response.text();
};

// Função para normalizar o tipo de acesso vindo da planilha
const normalizeAccessType = (rawAccess: string): 'Cardancorp' | 'Concessionaria' | 'Representante' | 'Desconhecido' => {
    const clean = rawAccess?.trim().toLowerCase() || '';
    if (clean.includes('cardan')) return 'Cardancorp';
    if (clean.includes('concession')) return 'Concessionaria';
    if (clean.includes('represent')) return 'Representante';
    return 'Desconhecido';
};

export interface RawKitRow {
  veiculo: string;
  data: string[];
}

export const fetchSheetData = async (): Promise<{ 
  catracas: PartData[], 
  kitRows: RawKitRow[],
  adaptacoes: AdaptacaoData[],
  kit3Eixo: Kit3EixoData[],
  cardan: CardanData[],
  users: UserCredential[]
}> => {
  try {
    const partsPromise = fetchCSVText(MASTER_PARTS_URL);
    const kitsPromise = fetchCSVText(KITS_FULL_URL).catch(() => '');
    const adaptacoesPromise = fetchCSVText(ADAPTACOES_URL).catch(() => '');
    const kit3EixoPromise = fetchCSVText(KIT_3EIXO_URL).catch(() => '');
    const cardanPromise = fetchCSVText(CARDAN_URL).catch(() => '');
    const usersPromise = fetchCSVText(USERS_UNIFIED_URL).catch(() => '');

    const [partsText, kitsText, adaptacoesText, kit3EixoText, cardanText, usersText] = await Promise.all([
      partsPromise, 
      kitsPromise, 
      adaptacoesPromise, 
      kit3EixoPromise,
      cardanPromise,
      usersPromise
    ]);
    
    // Process Users (Nova Lógica Unificada)
    // Espera-se colunas: Usuario, Senha, Acesso
    const userRows = parseCSV(usersText);
    // Remove cabeçalho se existir (procura linha que tem "Usuario" ou assume primeira linha como header)
    const headerIndex = userRows.findIndex(r => r[0]?.toLowerCase().includes('usu') || r[0]?.toLowerCase().includes('user'));
    const dataRows = headerIndex !== -1 ? userRows.slice(headerIndex + 1) : (userRows.length > 0 && userRows[0][0] === 'Usuario' ? userRows.slice(1) : userRows);

    const users: UserCredential[] = dataRows.map(cols => ({
        usuario: cols[0]?.trim() || '',
        senha: cols[1]?.trim() || '',
        tipo: normalizeAccessType(cols[2])
    })).filter(u => u.usuario !== '' && u.senha !== '');

    console.log("Usuários carregados (Novo Sistema):", users);

    // Process Master Parts
    const partsRows = parseCSV(partsText).slice(1);
    const catracas: PartData[] = partsRows.map(cols => ({
      veiculo: cols[0]?.trim() || 'N/A',
      codInterno: cols[1]?.trim() || '-',
      codFreiocar: cols[2]?.trim() || '-',
      modelo: cols[3]?.trim() || '-',
      aplicacao: cols[4]?.trim() || 'Sem descrição',
      dimA: cols[5]?.trim() || '-',
      dimB: cols[6]?.trim() || '-',
      dimC: cols[7]?.trim() || '-',
      dimD: cols[8]?.trim() || '-',
      lado: cols[9]?.trim() || '-',
      icms17: cols[10]?.trim() || '0,00',
      icms12: cols[11]?.trim() || '0,00',
      icms7: cols[12]?.trim() || '0,00',
    })).filter(item => item.veiculo !== 'N/A' && item.veiculo !== '');

    // Process Kits
    const kitsCSVRows = parseCSV(kitsText).slice(1);
    const kitRows: RawKitRow[] = kitsCSVRows
      .filter(cols => cols.length > 0 && cols[0]?.trim() !== '')
      .map(cols => ({
        veiculo: cols[0]?.trim(),
        data: cols 
      }));

    // Process Adaptacoes
    const adaptacoesRows = parseCSV(adaptacoesText).slice(1);
    const adaptacoes: AdaptacaoData[] = adaptacoesRows
      .filter(cols => cols.length > 5 && cols[0]?.trim() !== '')
      .map(cols => ({
        notaFiscal: cols[0]?.trim() || '',
        nSerie: cols[1]?.trim() || '',
        dataFabricacao: cols[2]?.trim() || '',
        codProduto: cols[3]?.trim() || '',
        concessionaria: cols[4]?.trim() || '',
        descProduto: cols[5]?.trim() || '',
        rastFlange: cols[6]?.trim() || '',
        rastTubo: cols[7]?.trim() || '',
        ponteira: cols[8]?.trim() || '',
        pedido: cols[9]?.trim() || '',
        op: cols[10]?.trim() || '',
        certGarantia: cols[11]?.trim() || '',
        pbt: cols[12]?.trim() || '',
        modeloCaminhao: cols[13]?.trim() || '',
        certCardan: cols[14]?.trim() || '',
      }));

    // Process Kit 3 Eixo
    const kit3EixoRows = parseCSV(kit3EixoText).slice(1);
    const kit3Eixo: Kit3EixoData[] = kit3EixoRows.map(cols => ({
      veiculo: cols[0]?.trim() || '',
      tipo: cols[1]?.trim() || '',
      codFreiocar: cols[2]?.trim() || '',
      codInterno: cols[3]?.trim() || '',
      descricao: cols[4]?.trim() || '',
      qtdPadrao: parseInt(cols[5]?.trim() || '0', 10),
      valor: cols[6]?.trim() || '0,00',
      configuracao: cols[7]?.trim() || '',
    })).filter(k => k.veiculo !== '');

    // Process Cardan
    // Modelo (0) / Veiculo (1) / Cód. Interno (2) / Med. Tubo (3) / ≠ Peças (4) / Cruzeta (5) / Med. Cruzeta (6) / Observações (7) / Valor (8)
    const cardanRows = parseCSV(cardanText).slice(1);
    const cardan: CardanData[] = cardanRows.map(cols => ({
        modelo: cols[0]?.trim() || '',
        veiculo: cols[1]?.trim() || '',
        codInterno: cols[2]?.trim() || '',
        medTubo: cols[3]?.trim() || '',
        pecas: cols[4]?.trim() || '',
        cruzeta: cols[5]?.trim() || '',
        medCruzeta: cols[6]?.trim() || '',
        observacoes: cols[7]?.trim() || '',
        valor: cols[8]?.trim() || '',
    })).filter(c => c.modelo !== '' && c.veiculo !== '');

    return { catracas, kitRows, adaptacoes, kit3Eixo, cardan, users };
  } catch (error) {
    console.error("Error fetching sheet:", error);
    throw error;
  }
};
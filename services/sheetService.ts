import { PartData, KitItemData, AdaptacaoData, Kit3EixoData, UserCredential } from '../types';

// =========================================================================================
// CONFIGURAÇÃO DOS LINKS CSV
// =========================================================================================

const MASTER_PARTS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRRP4-RXNe8K2SCM5F4eif-84bhtSflQQRH_U-vZEagd8a4CL7m5JzUAhXxPPoii6TfFUza_90eLZGA/pub?output=csv';
const KITS_FULL_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS6Xcw-LbNyXrKhle8AW37zq0eYLIpHZLwgzA9Uc87-xsFwyzJaHesHl7DECmEhsbn353qjTV0AWuMt/pub?output=csv';
const ADAPTACOES_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTtKaSH5Yjj3OawT5phTfyXKvBsUQISzGj5Zq6Ex7swLUFGJyU8resWHU9VoUG6vDr4s-n4cLgE0XPy/pub?output=csv';
const KIT_3EIXO_URL = 'https://docs.google.com/spreadsheets/d/1jopMxv3-GMKrWQGDXdsqpuf8FStACQBT4WOvGOl8pVI/export?format=csv';

// Planilha de Usuários
const USERS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_hFwZ8b8ttKNUYLdJyaGt5GrLCOALSBapWscuwytH8TXsW_zbW0Oh1FpthKm-6Yhm9FWUwB6kgBFZ/pub?output=csv';

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
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }
  return await response.text();
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
  users: UserCredential[]
}> => {
  try {
    const partsPromise = fetchCSVText(MASTER_PARTS_URL);
    const kitsPromise = fetchCSVText(KITS_FULL_URL).catch(() => '');
    const adaptacoesPromise = fetchCSVText(ADAPTACOES_URL).catch(() => '');
    const kit3EixoPromise = fetchCSVText(KIT_3EIXO_URL).catch(() => '');
    const usersPromise = fetchCSVText(USERS_URL).catch(() => '');

    const [partsText, kitsText, adaptacoesText, kit3EixoText, usersText] = await Promise.all([
      partsPromise, 
      kitsPromise, 
      adaptacoesPromise, 
      kit3EixoPromise,
      usersPromise
    ]);
    
    // Process Users
    const usersRows = parseCSV(usersText).slice(1);
    const users: UserCredential[] = usersRows.map(cols => ({
      usuario: cols[0]?.trim() || '',
      senha: cols[1]?.trim() || ''
    })).filter(u => u.usuario !== '');

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

    return { catracas, kitRows, adaptacoes, kit3Eixo, users };
  } catch (error) {
    console.error("Error fetching sheet:", error);
    throw error;
  }
};
// Lista de estados e regiões do Brasil
export interface BrazilState {
  uf: string;
  name: string;
  region: string;
}

export const brazilStates: BrazilState[] = [
  // Norte
  { uf: 'AC', name: 'Acre', region: 'Norte' },
  { uf: 'AP', name: 'Amapá', region: 'Norte' },
  { uf: 'AM', name: 'Amazonas', region: 'Norte' },
  { uf: 'PA', name: 'Pará', region: 'Norte' },
  { uf: 'RO', name: 'Rondônia', region: 'Norte' },
  { uf: 'RR', name: 'Roraima', region: 'Norte' },
  { uf: 'TO', name: 'Tocantins', region: 'Norte' },
  
  // Nordeste
  { uf: 'AL', name: 'Alagoas', region: 'Nordeste' },
  { uf: 'BA', name: 'Bahia', region: 'Nordeste' },
  { uf: 'CE', name: 'Ceará', region: 'Nordeste' },
  { uf: 'MA', name: 'Maranhão', region: 'Nordeste' },
  { uf: 'PB', name: 'Paraíba', region: 'Nordeste' },
  { uf: 'PE', name: 'Pernambuco', region: 'Nordeste' },
  { uf: 'PI', name: 'Piauí', region: 'Nordeste' },
  { uf: 'RN', name: 'Rio Grande do Norte', region: 'Nordeste' },
  { uf: 'SE', name: 'Sergipe', region: 'Nordeste' },
  
  // Centro-Oeste
  { uf: 'DF', name: 'Distrito Federal', region: 'Centro-Oeste' },
  { uf: 'GO', name: 'Goiás', region: 'Centro-Oeste' },
  { uf: 'MT', name: 'Mato Grosso', region: 'Centro-Oeste' },
  { uf: 'MS', name: 'Mato Grosso do Sul', region: 'Centro-Oeste' },
  
  // Sudeste
  { uf: 'ES', name: 'Espírito Santo', region: 'Sudeste' },
  { uf: 'MG', name: 'Minas Gerais', region: 'Sudeste' },
  { uf: 'RJ', name: 'Rio de Janeiro', region: 'Sudeste' },
  { uf: 'SP', name: 'São Paulo', region: 'Sudeste' },
  
  // Sul
  { uf: 'PR', name: 'Paraná', region: 'Sul' },
  { uf: 'RS', name: 'Rio Grande do Sul', region: 'Sul' },
  { uf: 'SC', name: 'Santa Catarina', region: 'Sul' },
];

export const brazilRegions = [
  'Norte',
  'Nordeste',
  'Centro-Oeste',
  'Sudeste',
  'Sul',
];

// Extrai o estado do DDD do telefone
export function getStateFromDDD(ddd: string): BrazilState | null {
  const dddMap: Record<string, string> = {
    // São Paulo
    '11': 'SP', '12': 'SP', '13': 'SP', '14': 'SP', '15': 'SP', 
    '16': 'SP', '17': 'SP', '18': 'SP', '19': 'SP',
    // Rio de Janeiro
    '21': 'RJ', '22': 'RJ', '24': 'RJ',
    // Espírito Santo
    '27': 'ES', '28': 'ES',
    // Minas Gerais
    '31': 'MG', '32': 'MG', '33': 'MG', '34': 'MG', '35': 'MG', 
    '37': 'MG', '38': 'MG',
    // Paraná
    '41': 'PR', '42': 'PR', '43': 'PR', '44': 'PR', '45': 'PR', '46': 'PR',
    // Santa Catarina
    '47': 'SC', '48': 'SC', '49': 'SC',
    // Rio Grande do Sul
    '51': 'RS', '53': 'RS', '54': 'RS', '55': 'RS',
    // Distrito Federal
    '61': 'DF',
    // Goiás
    '62': 'GO', '64': 'GO',
    // Tocantins
    '63': 'TO',
    // Mato Grosso
    '65': 'MT', '66': 'MT',
    // Mato Grosso do Sul
    '67': 'MS',
    // Acre
    '68': 'AC',
    // Rondônia
    '69': 'RO',
    // Bahia
    '71': 'BA', '73': 'BA', '74': 'BA', '75': 'BA', '77': 'BA',
    // Sergipe
    '79': 'SE',
    // Pernambuco
    '81': 'PE', '87': 'PE',
    // Alagoas
    '82': 'AL',
    // Paraíba
    '83': 'PB',
    // Rio Grande do Norte
    '84': 'RN',
    // Ceará
    '85': 'CE', '88': 'CE',
    // Piauí
    '86': 'PI', '89': 'PI',
    // Maranhão
    '98': 'MA', '99': 'MA',
    // Pará
    '91': 'PA', '93': 'PA', '94': 'PA',
    // Amazonas
    '92': 'AM', '97': 'AM',
    // Roraima
    '95': 'RR',
    // Amapá
    '96': 'AP',
  };
  
  const uf = dddMap[ddd];
  if (!uf) return null;
  
  return brazilStates.find(state => state.uf === uf) || null;
}

// Extrai o DDD de um número de telefone
export function extractDDD(phone: string): string | null {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length >= 2) {
    return cleanPhone.substring(0, 2);
  }
  return null;
}

// Tipos de OS
export const TIPO_OS = {
  EMPILHADEIRA: 'EMPILHADEIRA',
  CONTROLADOR: 'CONTROLADOR',
};

// Tipos de manutenção
export const TIPO_MANUTENCAO = {
  CORRETIVA: 'CORRETIVA',
  PREVENTIVA: 'PREVENTIVA',
};

// Status da OS
export const STATUS_OS = {
  RASCUNHO: 'RASCUNHO',
  FINALIZADA: 'FINALIZADA',
};

// Categorias de foto
export const CATEGORIA_FOTO = {
  HORIMETRO: 'HORIMETRO',
  PLACA_SERIE: 'PLACA_SERIE',
  ANTES: 'ANTES',
  DEPOIS: 'DEPOIS',
  PECA: 'PECA',
  OUTRO: 'OUTRO',
};

// Fotos obrigatórias antes de avançar
export const FOTOS_OBRIGATORIAS = [
  { categoria: 'HORIMETRO',   label: 'Horímetro',         icon: '⏱️' },
  { categoria: 'PLACA_SERIE', label: 'Placa / Nº de Série', icon: '🔢' },
];

// Tipos de assinatura
export const TIPO_ASSINATURA = {
  CLIENTE: 'CLIENTE',
  TECNICO: 'TECNICO',
};

// Checklist padrão — Empilhadeira (Preventiva)
export const CHECKLIST_EMPILHADEIRA = [
  { id: 'emp_freios', label: 'Freios', grupo: 'Mecânico' },
  { id: 'emp_garfos', label: 'Garfos', grupo: 'Mecânico' },
  { id: 'emp_hidraulico', label: 'Sistema Hidráulico', grupo: 'Mecânico' },
  { id: 'emp_pneus', label: 'Pneus/Rodas', grupo: 'Mecânico' },
  { id: 'emp_bateria', label: 'Bateria', grupo: 'Elétrico' },
  { id: 'emp_carregador', label: 'Carregador', grupo: 'Elétrico' },
  { id: 'emp_chicotes', label: 'Chicotes Elétricos', grupo: 'Elétrico' },
  { id: 'emp_mastro', label: 'Mastro/Correntes', grupo: 'Estrutural' },
  { id: 'emp_chassi', label: 'Chassi', grupo: 'Estrutural' },
  { id: 'emp_lubrificacao', label: 'Lubrificação Geral', grupo: 'Manutenção' },
];

// Checklist padrão — Controlador (Preventiva)
export const CHECKLIST_CONTROLADOR = [
  { id: 'ctrl_placa', label: 'Placa Controladora', grupo: 'Eletrônico' },
  { id: 'ctrl_conectores', label: 'Conectores', grupo: 'Eletrônico' },
  { id: 'ctrl_cabos', label: 'Cabos de Potência', grupo: 'Elétrico' },
  { id: 'ctrl_fusivel', label: 'Fusíveis', grupo: 'Elétrico' },
  { id: 'ctrl_calibracao', label: 'Calibração', grupo: 'Software' },
  { id: 'ctrl_firmware', label: 'Versão de Firmware', grupo: 'Software' },
  { id: 'ctrl_temperatura', label: 'Temperatura de Operação', grupo: 'Operacional' },
  { id: 'ctrl_limpeza', label: 'Limpeza Interna', grupo: 'Manutenção' },
];

// Status dos itens de checklist
export const STATUS_CHECKLIST = {
  OK: 'OK',
  AJUSTADO: 'AJUSTADO',
  SUBSTITUIDO: 'SUBSTITUIDO',
  PENDENTE: 'PENDENTE',
};

// Debounce do autosave (ms)
export const AUTOSAVE_DEBOUNCE_MS = 1500;

// URL do backend
export const API_BASE = '/api';

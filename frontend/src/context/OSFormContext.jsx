import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// ── Estado inicial de uma OS vazia ────────────────────────
const estadoInicial = {
  id: null,
  tipo_os: null,           // 'EMPILHADEIRA' | 'CONTROLADOR'
  tipo_manutencao: null,   // 'CORRETIVA' | 'PREVENTIVA'
  status: 'RASCUNHO',
  numero_os: '',
  // Dados do cliente
  cliente_nome: '',
  cliente_documento: '',
  cliente_endereco: '',
  // Dados do equipamento
  equipamento_modelo: '',
  equipamento_serie: '',
  equipamento_horimetro: '',
  // Dados do técnico e serviço
  tecnico_nome: '',
  descricao_problema: '',
  servico_executado: '',
  observacoes: '',
  // Listas
  pecas: [],
  pecas_pendentes: [],
  fotos: [],
  checklist: [],
  assinaturas: { cliente: null, tecnico: null },
  // Responsaveis pelas assinaturas
  responsavel_cliente_nome: '',
  responsavel_cliente_cpf: '',
  responsavel_tecnico_nome: '',
  responsavel_tecnico_cpf: '',
  // Controle interno
  data_inicio_servico: '',
  data_termino_servico: '',
  data_abertura: null,
  ultima_sincronizacao: null,
  // Deslocamento — leituras do odômetro
  km_odometro_saida: '',    // KM no painel antes de sair
  km_odometro_chegada: '',  // KM no painel ao chegar no cliente
};

// ── Reducer ───────────────────────────────────────────────
function osFormReducer(state, action) {
  switch (action.type) {
    case 'INICIAR_OS': {
      return {
        ...estadoInicial,
        id: uuidv4(),
        numero_os: null,           // número só é atribuído ao FINALIZAR
        tipo_os: action.payload.tipo_os,
        tipo_manutencao: action.payload.tipo_manutencao,
        data_abertura: new Date().toISOString(),
      };
    }

    case 'CARREGAR_RASCUNHO':
      return { ...estadoInicial, ...action.payload };

    case 'ATUALIZAR_CAMPO':
      return { ...state, [action.campo]: action.valor };

    case 'ATUALIZAR_CAMPOS':
      return { ...state, ...action.payload };

    // -- Peças Trocadas --
    case 'ADICIONAR_PECA':
      return { ...state, pecas: [...state.pecas, { id: uuidv4(), nome_peca: '', codigo_sku: '', quantidade: 1, observacao: '' }] };
    case 'REMOVER_PECA':
      return { ...state, pecas: state.pecas.filter(p => p.id !== action.id) };
    case 'ATUALIZAR_PECA':
      return {
        ...state,
        pecas: state.pecas.map(p => p.id === action.id ? { ...p, ...action.dados } : p)
      };

    // -- Peças Pendentes (Orçamento) --
    case 'ADICIONAR_PECA_PENDENTE':
      return { ...state, pecas_pendentes: [...state.pecas_pendentes, { id: uuidv4(), nome_peca: '', codigo_sku: '', quantidade: 1, observacao: '' }] };
    case 'REMOVER_PECA_PENDENTE':
      return { ...state, pecas_pendentes: state.pecas_pendentes.filter(p => p.id !== action.id) };
    case 'ATUALIZAR_PECA_PENDENTE':
      return {
        ...state,
        pecas_pendentes: state.pecas_pendentes.map(p => p.id === action.id ? { ...p, ...action.dados } : p)
      };

    case 'ADICIONAR_FOTO':
      return { ...state, fotos: [...state.fotos, action.payload] };

    case 'REMOVER_FOTO':
      return { ...state, fotos: state.fotos.filter(f => f.id !== action.id) };

    case 'ATUALIZAR_CHECKLIST':
      return {
        ...state,
        checklist: state.checklist.map(item =>
          item.id === action.id ? { ...item, status: action.status } : item
        )
      };

    case 'INICIALIZAR_CHECKLIST':
      return { ...state, checklist: action.payload };

    case 'SALVAR_ASSINATURA':
      return {
        ...state,
        assinaturas: { ...state.assinaturas, [action.tipo]: action.base64 }
      };

    case 'MARCAR_SINCRONIZADO':
      return { ...state, ultima_sincronizacao: new Date().toISOString() };

    case 'RESETAR':
      return estadoInicial;

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────
const OSFormContext = createContext(null);

export function OSFormProvider({ children }) {
  const [state, dispatch] = useReducer(osFormReducer, estadoInicial);

  const iniciarOS = useCallback((tipo_os, tipo_manutencao) => {
    dispatch({ type: 'INICIAR_OS', payload: { tipo_os, tipo_manutencao } });
  }, []);

  const atualizarCampo = useCallback((campo, valor) => {
    dispatch({ type: 'ATUALIZAR_CAMPO', campo, valor });
  }, []);

  const resetar = useCallback(() => {
    dispatch({ type: 'RESETAR' });
  }, []);

  return (
    <OSFormContext.Provider value={{ state, dispatch, iniciarOS, atualizarCampo, resetar }}>
      {children}
    </OSFormContext.Provider>
  );
}

export function useOSForm() {
  const ctx = useContext(OSFormContext);
  if (!ctx) throw new Error('useOSForm deve ser usado dentro de OSFormProvider');
  return ctx;
}

export default OSFormContext;

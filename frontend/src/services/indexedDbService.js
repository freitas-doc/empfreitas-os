import Dexie from 'dexie';

const db = new Dexie('EmpFreitasDatabase');

db.version(1).stores({
  ordens: 'id, tipo_os, status, atualizado_em',
  fotos: '++id, ordem_servico_id, categoria',
  pdfs: 'ordem_servico_id'
});

db.version(2).stores({
  clientes: '++id, nome, documento, endereco' // nova tabela para versão 2
});

export const indexedDbService = {
  db, // Permite acessar db.pdfs e db.ordens diretamente
  salvarOrdem: async (ordem) => {
    return db.ordens.put({ ...ordem, atualizado_em: new Date().toISOString() });
  },
  
  buscarOrdem: async (id) => {
    return db.ordens.get(id);
  },

  listarRascunhos: async () => {
    return db.ordens.where('status').equals('RASCUNHO').reverse().sortBy('atualizado_em');
  },

  deletarOrdem: async (id) => {
    return db.ordens.delete(id);
  },

  salvarFoto: async (foto) => {
    return db.fotos.put(foto);
  },

  buscarFotosDaOrdem: async (osId) => {
    return db.fotos.where('ordem_servico_id').equals(osId).toArray();
  },
  
  deletarFoto: async (id) => {
    return db.fotos.delete(id);
  },

  // ── Gestão de Clientes (Autocompletar) ──
  salvarCliente: async (cliente) => {
    return db.clientes.put({ ...cliente, atualizado_em: new Date().toISOString() });
  },

  listarClientes: async () => {
    return db.clientes.orderBy('nome').toArray();
  },

  deletarCliente: async (id) => {
    return db.clientes.delete(id);
  }
};

export default db;

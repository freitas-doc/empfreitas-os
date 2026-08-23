const BASE_URL = '/api';

async function request(method, path, body) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  const token = localStorage.getItem('token');
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const json = await res.json();

  if (!res.ok) throw new Error(json.error || json.message || `Erro ${res.status}`);
  
  // Alguns endpoints (como login) podem retornar os dados na raiz, outros dentro de 'data'
  return json.data !== undefined ? json.data : json;
}

export const api = {
  auth: {
    login: (credentials) => request('POST', '/auth/login', credentials),
  },
  admin: {
    stats: () => request('GET', '/admin/stats'),
    ordens: () => request('GET', '/admin/ordens'),
    excluirOrdem: (id) => request('DELETE', `/admin/ordens/${id}`),
    listarUsuarios: () => request('GET', '/admin/usuarios'),
    criarUsuario: (dados) => request('POST', '/admin/usuarios', dados),
    deletarUsuario: (id) => request('DELETE', `/admin/usuarios/${id}`),
  },
  ordens: {
    listar: (filtros = {}) => {
      const params = new URLSearchParams(filtros).toString();
      return request('GET', `/ordens${params ? `?${params}` : ''}`);
    },
    buscar: (id) => request('GET', `/ordens/${id}`),
    criar: (dados) => request('POST', '/ordens', dados),
    atualizar: (id, dados) => request('PUT', `/ordens/${id}`, dados),
    finalizar: (id) => request('POST', `/ordens/${id}/finalizar`),
    deletar: (id) => request('DELETE', `/ordens/${id}`),
  },
  health: () => request('GET', '/health'),
};

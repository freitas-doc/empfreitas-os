const BASE_URL = '/api';

async function request(method, path, body) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const json = await res.json();

  if (!res.ok) throw new Error(json.message || `Erro ${res.status}`);
  return json.data;
}

export const api = {
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

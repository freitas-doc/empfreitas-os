// ── Formatação de data/hora ───────────────────────────────
export function formatarData(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('pt-BR');
}

export function formatarDataHora(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString('pt-BR');
}

// ── Máscaras ──────────────────────────────────────────────
export function mascaraCPFCNPJ(valor) {
  const numeros = valor.replace(/\D/g, '');
  if (numeros.length <= 11) {
    return numeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return numeros
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function mascaraTelefone(valor) {
  const numeros = valor.replace(/\D/g, '');
  if (numeros.length <= 10) {
    return numeros.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  }
  return numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

// ── Número de OS ──────────────────────────────────────────
export function formatarNumeroOS(numero) {
  if (!numero) return '—';
  return `EMP-${String(numero).padStart(6, '0')}`;
}

// ── Truncar texto ─────────────────────────────────────────
export function truncar(texto, maxLen = 60) {
  if (!texto) return '';
  return texto.length > maxLen ? texto.slice(0, maxLen) + '...' : texto;
}

// ── Tamanho de arquivo ────────────────────────────────────
export function formatarBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

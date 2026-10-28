import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { gerarPdfOrcamento } from '../services/pdfOrcamento';

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtBRL = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const calcTotal = (maoObra, deslocamento, itens, descontoPct, impostoPct) => {
  const sub = parseFloat(maoObra || 0) + parseFloat(deslocamento || 0)
    + (itens || []).reduce((s, i) => s + parseFloat(i.quantidade || 1) * parseFloat(i.valor_unit || 0), 0);
  const desc = sub * (parseFloat(descontoPct || 0) / 100);
  const base = sub - desc;
  const imp  = base * (parseFloat(impostoPct || 0) / 100);
  return parseFloat((base + imp).toFixed(2));
};

const EMPTY_FORM = {
  data_emissao: new Date().toISOString().slice(0, 10),
  validade_dias: 15,
  prazo_entrega: '2 dias após aprovação',
  descricao_servico: '',
  valor_mao_obra: '',
  valor_deslocamento: '0',
  itens_adicionais: [],
  desconto_pct: '0',
  imposto_pct: '0',
  forma_pagamento: 'Boleto/Pix - 14.653.948/0001-50',
  garantia: '90 dias',
  problema_relatado: '',
  solucao_aplicada: '',
  servico_realizado: '',
  observacoes: '',
};

// ── Estilos ────────────────────────────────────────────────────────────────
const s = {
  card: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.1em', color: 'var(--color-text-dim)', marginBottom: 16,
  },
  label: { fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 },
  input: { width: '100%', padding: '11px 14px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '11px 14px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 },
  btn: { padding: '12px 22px', borderRadius: 'var(--radius-sm)', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all .2s' },
};

// ── Componente ─────────────────────────────────────────────────────────────
export default function AdminOrcamentos() {
  const [step, setStep]             = useState(1);   // 1 | 2 | 3
  const [ordens, setOrdens]         = useState([]);
  const [orcamentos, setOrcamentos] = useState([]);
  const [busca, setBusca]           = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [osSel, setOsSel]           = useState(null);  // OS selecionada
  const [orcSel, setOrcSel]         = useState(null);  // Orçamento em edição (null = novo)
  const [form, setForm]             = useState(EMPTY_FORM);
  const [salvando, setSalvando]     = useState(false);
  const [gerando, setGerando]       = useState(null);  // id do orc sendo baixado
  const [tab, setTab]               = useState('novo'); // 'novo' | 'lista'
  const [erro, setErro]             = useState('');

  // Carrega ordens e orçamentos existentes
  useEffect(() => {
    api.admin.ordens().then(setOrdens).catch(console.error);
    api.admin.listarOrcamentos().then(setOrcamentos).catch(console.error);
  }, []);

  const total = calcTotal(form.valor_mao_obra, form.valor_deslocamento, form.itens_adicionais, form.desconto_pct, form.imposto_pct);

  const set = (campo, val) => setForm(f => ({ ...f, [campo]: val }));

  const adicionarItem = () => setForm(f => ({
    ...f, itens_adicionais: [...f.itens_adicionais, { descricao: '', quantidade: 1, valor_unit: 0 }]
  }));

  const removerItem = (i) => setForm(f => ({
    ...f, itens_adicionais: f.itens_adicionais.filter((_, idx) => idx !== i)
  }));

  const atualizarItem = (i, campo, val) => setForm(f => ({
    ...f,
    itens_adicionais: f.itens_adicionais.map((it, idx) => idx === i ? { ...it, [campo]: val } : it)
  }));

  // Seleciona OS e pré-preenche formulário
  const selecionarOS = (os) => {
    setOsSel(os);
    setOrcSel(null);
    setForm({
      ...EMPTY_FORM,
      descricao_servico: os.equipamento_modelo ? `Serviço em ${os.equipamento_modelo} — série ${os.equipamento_serie || ''}`.trim() : '',
      problema_relatado: os.descricao_problema || '',
      solucao_aplicada:  os.servico_executado  || '',
      servico_realizado: os.observacoes        || '',
    });
    setStep(2);
    setErro('');
  };

  // Editar orçamento existente
  const editarOrcamento = async (orc) => {
    try {
      const full = await api.admin.buscarOrcamento(orc.id);
      setOrcSel(full);
      // Busca OS completa para ter os dados do cliente
      const os = await api.ordens.buscar(full.ordem_id);
      const osState = os?.dados_formulario_json ? JSON.parse(os.dados_formulario_json) : {};
      setOsSel({ ...full, ...osState, id: full.ordem_id });
      setForm({
        data_emissao:      full.data_emissao?.slice(0, 10) || EMPTY_FORM.data_emissao,
        validade_dias:     full.validade_dias || 15,
        prazo_entrega:     full.prazo_entrega || '',
        descricao_servico: full.descricao_servico || '',
        valor_mao_obra:    full.valor_mao_obra || '',
        valor_deslocamento:full.valor_deslocamento || '0',
        itens_adicionais:  Array.isArray(full.itens_adicionais) ? full.itens_adicionais : JSON.parse(full.itens_adicionais || '[]'),
        desconto_pct:      full.desconto_pct || '0',
        imposto_pct:       full.imposto_pct  || '0',
        forma_pagamento:   full.forma_pagamento || '',
        garantia:          full.garantia || '',
        problema_relatado: full.problema_relatado || '',
        solucao_aplicada:  full.solucao_aplicada  || '',
        servico_realizado: full.servico_realizado  || '',
        observacoes:       full.observacoes || '',
      });
      setTab('novo');
      setStep(2);
    } catch (e) { setErro('Erro ao carregar orçamento: ' + e.message); }
  };

  // Salva ou atualiza
  const salvar = async () => {
    if (!osSel) { setErro('Selecione uma OS primeiro.'); return; }
    if (!form.valor_mao_obra && !form.valor_deslocamento && form.itens_adicionais.length === 0) {
      setErro('Informe pelo menos o valor da mão de obra.'); return;
    }
    setSalvando(true); setErro('');
    try {
      const payload = { ...form, ordem_id: osSel.id || osSel.ordem_id };
      let saved;
      if (orcSel) {
        saved = await api.admin.atualizarOrcamento(orcSel.id, payload);
      } else {
        saved = await api.admin.criarOrcamento(payload);
      }
      // Atualiza lista
      const lista = await api.admin.listarOrcamentos();
      setOrcamentos(lista);
      setOrcSel(saved);
      setStep(3);
    } catch (e) {
      setErro('Erro ao salvar: ' + e.message);
    } finally { setSalvando(false); }
  };

  // Baixa PDF
  const baixarPdf = useCallback(async (orc) => {
    setGerando(orc.id);
    try {
      let full = orc;
      if (!orc.cliente_nome) full = await api.admin.buscarOrcamento(orc.id);
      const bytes = await gerarPdfOrcamento(full);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${full.numero_orc || orc.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Erro ao gerar PDF: ' + e.message);
    } finally { setGerando(null); }
  }, []);

  const deletar = async (id) => {
    if (!confirm('Excluir este orçamento?')) return;
    await api.admin.deletarOrcamento(id);
    setOrcamentos(o => o.filter(x => x.id !== id));
  };

  const novoOrcamento = () => {
    setOsSel(null); setOrcSel(null);
    setForm(EMPTY_FORM); setStep(1); setErro('');
  };

  // Filtro de OS
  const ordensFiltradas = ordens.filter(os => {
    const q = busca.toLowerCase();
    const match = !q || (os.cliente_nome || '').toLowerCase().includes(q)
      || (os.numero_os || '').toLowerCase().includes(q)
      || (os.equipamento_modelo || '').toLowerCase().includes(q);
    const tipo = !filtroTipo || os.tipo_manutencao === filtroTipo;
    return match && tipo;
  });

  // ── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>

      {/* ── Cabeçalho da seção ── */}
      <div style={{ borderBottom: '1px solid var(--color-border)', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: 'var(--color-surface)', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>📄 Gerador de Orçamento</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Selecione uma OS, configure os valores e gere o PDF profissional.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{ ...s.btn, background: tab === 'novo' ? 'var(--color-accent)' : 'var(--color-surface-2)', color: tab === 'novo' ? '#000' : 'var(--color-text)', border: '1px solid var(--color-border)' }}
            onClick={() => { setTab('novo'); }}
          >+ Novo Orçamento</button>
          <button
            style={{ ...s.btn, background: tab === 'lista' ? 'var(--color-accent)' : 'var(--color-surface-2)', color: tab === 'lista' ? '#000' : 'var(--color-text)', border: '1px solid var(--color-border)' }}
            onClick={() => setTab('lista')}
          >📋 Orçamentos Salvos ({orcamentos.length})</button>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px 80px' }}>

        {erro && (
          <div style={{ background: 'rgba(239,68,68,0.1)', borderLeft: '4px solid var(--color-danger)', padding: '12px 16px', borderRadius: 6, marginBottom: 20, fontSize: '0.88rem', color: '#fca5a5' }}>
            ⚠️ {erro}
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* TAB: LISTA DE ORÇAMENTOS SALVOS          */}
        {/* ════════════════════════════════════════ */}
        {tab === 'lista' && (
          <div>
            <div style={{ ...s.card }}>
              <p style={s.cardTitle}>Orçamentos Gerados</p>
              {orcamentos.length === 0 ? (
                <p style={{ color: 'var(--color-text-dim)', textAlign: 'center', padding: '40px 0' }}>Nenhum orçamento gerado ainda.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Número','OS Ref.','Cliente','Equipamento','Total','Data','Ações'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-dim)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)', textAlign: 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orcamentos.map(orc => (
                        <tr key={orc.id}
                          style={{ transition: 'background .15s' }}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--color-accent)', fontSize: '0.88rem' }}>{orc.numero_orc}</td>
                          <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{orc.numero_os}</td>
                          <td style={{ padding: '12px 14px', fontSize: '0.88rem' }}>{orc.cliente_nome}</td>
                          <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{orc.equipamento_modelo}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--color-success)' }}>{fmtBRL(orc.valor_total)}</td>
                          <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
                            {orc.data_emissao ? new Date(orc.data_emissao + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => editarOrcamento(orc)} style={{ ...s.btn, padding: '6px 12px', fontSize: '0.78rem', background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>✏️ Editar</button>
                              <button onClick={() => baixarPdf(orc)} disabled={gerando === orc.id} style={{ ...s.btn, padding: '6px 12px', fontSize: '0.78rem', background: 'var(--color-accent)', color: '#000' }}>
                                {gerando === orc.id ? '⏳' : '⬇️'} PDF
                              </button>
                              <button onClick={() => deletar(orc.id)} style={{ ...s.btn, padding: '6px 12px', fontSize: '0.78rem', background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* TAB: NOVO ORÇAMENTO (Wizard 3 passos)    */}
        {/* ════════════════════════════════════════ */}
        {tab === 'novo' && (
          <>
            {/* Stepper */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
              {[['1','Selecionar OS'], ['2','Configurar Valores'], ['3','Prévia e Gerar']].map(([n, lbl], idx) => {
                const st = parseInt(n);
                const isDone   = step > st;
                const isActive = step === st;
                return (
                  <React.Fragment key={n}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div onClick={() => step > st && setStep(st)} style={{
                        width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '0.85rem', flexShrink: 0, cursor: step > st ? 'pointer' : 'default',
                        background: isDone ? 'var(--color-success)' : isActive ? 'var(--color-accent)' : 'var(--color-surface-2)',
                        border: `2px solid ${isDone ? 'var(--color-success)' : isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        color: isDone ? '#fff' : isActive ? '#000' : 'var(--color-text-dim)',
                        boxShadow: isActive ? '0 0 20px rgba(245,158,11,0.35)' : 'none',
                        transition: 'all .3s',
                      }}>{isDone ? '✓' : n}</div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: isDone ? 'var(--color-success)' : isActive ? 'var(--color-accent)' : 'var(--color-text-dim)' }}>{lbl}</span>
                    </div>
                    {idx < 2 && <div style={{ flex: 1, height: 2, margin: '0 12px', background: step > st ? 'var(--color-success)' : 'var(--color-border)', transition: 'background .3s' }} />}
                  </React.Fragment>
                );
              })}
            </div>

            {/* ─── PASSO 1: Seleção de OS ─── */}
            {step === 1 && (
              <div>
                <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px dashed rgba(99,102,241,0.4)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: '0.82rem', color: '#a5b4fc', display: 'flex', gap: 10 }}>
                  <span>💡</span>
                  <span>Selecione a OS. Os dados do cliente e equipamento serão preenchidos automaticamente no orçamento.</span>
                </div>
                <div style={s.card}>
                  <p style={s.cardTitle}>🔍 Buscar Ordem de Serviço</p>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                    <input
                      style={{ ...s.input, flex: 1, minWidth: 200, paddingLeft: 14 }}
                      placeholder="Buscar por número, cliente ou equipamento..."
                      value={busca} onChange={e => setBusca(e.target.value)}
                    />
                    <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
                      style={{ ...s.input, width: 150 }}>
                      <option value="">Todos os tipos</option>
                      <option value="CORRETIVA">Corretiva</option>
                      <option value="PREVENTIVA">Preventiva</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {ordensFiltradas.length === 0 && (
                      <p style={{ color: 'var(--color-text-dim)', textAlign: 'center', padding: '24px 0' }}>Nenhuma OS encontrada.</p>
                    )}
                    {ordensFiltradas.map(os => {
                      const sel = osSel?.id === os.id;
                      return (
                        <div key={os.id}
                          onClick={() => setOsSel(os)}
                          style={{
                            background: sel ? 'rgba(245,158,11,0.06)' : 'var(--color-surface-2)',
                            border: `1px solid ${sel ? 'var(--color-accent)' : 'var(--color-border)'}`,
                            boxShadow: sel ? '0 0 0 1px var(--color-accent)' : 'none',
                            borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'all .2s',
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-accent)', width: 120, flexShrink: 0 }}>
                            {os.numero_os || os.id.slice(0, 8)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{os.cliente_nome || '—'}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                              {os.equipamento_modelo || '—'} {os.equipamento_serie ? `· Série: ${os.equipamento_serie}` : ''} · {os.criado_em ? new Date(os.criado_em).toLocaleDateString('pt-BR') : ''}
                            </div>
                          </div>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', flexShrink: 0,
                            background: os.tipo_manutencao === 'CORRETIVA' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.15)',
                            color: os.tipo_manutencao === 'CORRETIVA' ? '#f87171' : 'var(--color-success)',
                            border: `1px solid ${os.tipo_manutencao === 'CORRETIVA' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                          }}>{os.tipo_manutencao}</span>
                          {sel && <span style={{ color: 'var(--color-accent)', fontSize: '1.2rem' }}>✔</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', alignSelf: 'center' }}>
                    {osSel ? `✔ ${osSel.numero_os || osSel.id.slice(0,8)} — ${osSel.cliente_nome}` : 'Nenhuma OS selecionada'}
                  </span>
                  <button
                    disabled={!osSel}
                    style={{ ...s.btn, background: osSel ? 'var(--color-accent)' : 'var(--color-surface-3)', color: osSel ? '#000' : 'var(--color-text-dim)', opacity: osSel ? 1 : 0.6 }}
                    onClick={() => osSel && selecionarOS(osSel)}
                  >Avançar → Configurar Valores</button>
                </div>
              </div>
            )}

            {/* ─── PASSO 2: Configurar Valores ─── */}
            {step === 2 && (
              <div>
                {/* OS selecionada */}
                <div style={{ ...s.card, borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.04)' }}>
                  <p style={s.cardTitle}>✔ OS Selecionada</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--color-accent)' }}>{osSel?.numero_os || osSel?.id?.slice(0,8)}</div>
                      <div style={{ fontWeight: 600, marginTop: 2 }}>{osSel?.cliente_nome}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{osSel?.equipamento_modelo} {osSel?.equipamento_serie ? `· Série: ${osSel.equipamento_serie}` : ''}</div>
                    </div>
                    <button style={{ ...s.btn, padding: '8px 14px', fontSize: '0.8rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} onClick={() => setStep(1)}>← Trocar OS</button>
                  </div>
                </div>

                {/* Identificação */}
                <div style={s.card}>
                  <p style={s.cardTitle}>📋 Identificação do Orçamento</p>
                  <div style={s.grid2}>
                    <div><label style={s.label}>Número</label><input style={{ ...s.input, background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.3)' }} value={`ORC-${osSel?.numero_os || ''}`} readOnly /></div>
                    <div><label style={s.label}>Data de Emissão</label><input type="date" style={s.input} value={form.data_emissao} onChange={e => set('data_emissao', e.target.value)} /></div>
                    <div><label style={s.label}>Validade (dias)</label><input type="number" style={s.input} value={form.validade_dias} min={1} onChange={e => set('validade_dias', e.target.value)} /></div>
                    <div><label style={s.label}>Prazo de Entrega</label><input style={s.input} value={form.prazo_entrega} onChange={e => set('prazo_entrega', e.target.value)} /></div>
                  </div>
                </div>

                {/* Mão de obra */}
                <div style={s.card}>
                  <p style={s.cardTitle}>🔧 Serviço / Mão de Obra</p>
                  <div style={{ marginBottom: 14 }}>
                    <label style={s.label}>Descrição do Serviço Principal</label>
                    <input style={s.input} value={form.descricao_servico} onChange={e => set('descricao_servico', e.target.value)} placeholder="Ex: Conserto Controlador Zapi SEM 2D..." />
                  </div>
                  <div style={s.grid2}>
                    <div><label style={s.label}>Valor Mão de Obra (R$)</label><input type="number" step="0.01" style={s.input} value={form.valor_mao_obra} onChange={e => set('valor_mao_obra', e.target.value)} placeholder="0,00" /></div>
                    <div><label style={s.label}>Valor Deslocamento / KM (R$)</label><input type="number" step="0.01" style={s.input} value={form.valor_deslocamento} onChange={e => set('valor_deslocamento', e.target.value)} placeholder="0,00" /></div>
                  </div>

                  <div style={{ textAlign: 'center', position: 'relative', margin: '20px 0 14px' }}>
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--color-border)' }} />
                    <span style={{ position: 'relative', background: 'var(--color-surface)', padding: '0 14px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-dim)' }}>Itens Adicionais</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {form.itens_adicionais.map((it, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 110px 38px', gap: 8, alignItems: 'center' }}>
                        <input style={{ ...s.input, fontSize: '0.85rem' }} placeholder="Descrição do item..." value={it.descricao} onChange={e => atualizarItem(i, 'descricao', e.target.value)} />
                        <input type="number" style={{ ...s.input, fontSize: '0.85rem' }} placeholder="Qtd" min={1} value={it.quantidade} onChange={e => atualizarItem(i, 'quantidade', e.target.value)} />
                        <input type="number" step="0.01" style={{ ...s.input, fontSize: '0.85rem' }} placeholder="Valor unit." value={it.valor_unit} onChange={e => atualizarItem(i, 'valor_unit', e.target.value)} />
                        <button onClick={() => removerItem(i)} style={{ background: 'var(--color-danger)', border: 'none', color: '#fff', borderRadius: 'var(--radius-sm)', height: 38, cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
                      </div>
                    ))}
                  </div>
                  <button onClick={adicionarItem} style={{ ...s.btn, marginTop: 10, padding: '9px 16px', fontSize: '0.82rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>+ Adicionar Item</button>
                </div>

                {/* Taxas */}
                <div style={s.card}>
                  <p style={s.cardTitle}>💰 Taxas e Condições</p>
                  <div style={s.grid2}>
                    <div><label style={s.label}>Desconto (%)</label><input type="number" step="0.1" min={0} max={100} style={s.input} value={form.desconto_pct} onChange={e => set('desconto_pct', e.target.value)} /></div>
                    <div><label style={s.label}>Imposto / ISS (%)</label><input type="number" step="0.1" min={0} style={s.input} value={form.imposto_pct} onChange={e => set('imposto_pct', e.target.value)} /></div>
                    <div><label style={s.label}>Forma de Pagamento</label><input style={s.input} value={form.forma_pagamento} onChange={e => set('forma_pagamento', e.target.value)} /></div>
                    <div><label style={s.label}>Garantia</label><input style={s.input} value={form.garantia} onChange={e => set('garantia', e.target.value)} /></div>
                  </div>
                </div>

                {/* Textos técnicos */}
                <div style={s.card}>
                  <p style={s.cardTitle}>📝 Informações Técnicas para o PDF</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div><label style={s.label}>Problema Relatado</label><textarea rows={2} style={s.textarea} value={form.problema_relatado} onChange={e => set('problema_relatado', e.target.value)} /></div>
                    <div><label style={s.label}>Solução Aplicada</label><textarea rows={2} style={s.textarea} value={form.solucao_aplicada} onChange={e => set('solucao_aplicada', e.target.value)} /></div>
                    <div><label style={s.label}>Serviço Realizado</label><textarea rows={2} style={s.textarea} value={form.servico_realizado} onChange={e => set('servico_realizado', e.target.value)} /></div>
                    <div><label style={s.label}>Observações Adicionais</label><textarea rows={2} style={s.textarea} value={form.observacoes} onChange={e => set('observacoes', e.target.value)} /></div>
                  </div>
                </div>

                {/* Resumo calculado */}
                <div style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.08),rgba(245,158,11,0.03))', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 14, padding: 24, marginBottom: 20 }}>
                  <p style={{ ...s.cardTitle, color: 'var(--color-accent)', marginBottom: 16 }}>📊 Resumo do Orçamento</p>
                  {[
                    ['Mão de Obra', fmtBRL(form.valor_mao_obra)],
                    ['Deslocamento / KM', fmtBRL(form.valor_deslocamento)],
                    ['Itens Adicionais', fmtBRL(form.itens_adicionais.reduce((s, i) => s + parseFloat(i.quantidade || 1) * parseFloat(i.valor_unit || 0), 0))],
                    [`Desconto (${form.desconto_pct}%)`, `- ${fmtBRL((parseFloat(form.valor_mao_obra||0)+parseFloat(form.valor_deslocamento||0)+form.itens_adicionais.reduce((s,i)=>s+parseFloat(i.quantidade||1)*parseFloat(i.valor_unit||0),0))*(parseFloat(form.desconto_pct||0)/100))}`],
                    [`ISS / Impostos (${form.imposto_pct}%)`, fmtBRL(((parseFloat(form.valor_mao_obra||0)+parseFloat(form.valor_deslocamento||0)+form.itens_adicionais.reduce((s,i)=>s+parseFloat(i.quantidade||1)*parseFloat(i.valor_unit||0),0))*(1-parseFloat(form.desconto_pct||0)/100))*(parseFloat(form.imposto_pct||0)/100))],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{k}</span>
                      <span style={{ fontWeight: 700 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-accent)', borderTop: '2px solid rgba(245,158,11,0.3)', marginTop: 4 }}>
                    <span>TOTAL</span><span>{fmtBRL(total)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                  <button style={{ ...s.btn, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} onClick={() => setStep(1)}>← Voltar</button>
                  <button style={{ ...s.btn, background: 'var(--color-accent)', color: '#000' }} onClick={salvar} disabled={salvando}>
                    {salvando ? '⏳ Salvando...' : 'Salvar e Visualizar PDF →'}
                  </button>
                </div>
              </div>
            )}

            {/* ─── PASSO 3: Prévia + Gerar PDF ─── */}
            {step === 3 && orcSel && (
              <div>
                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: '0.88rem', color: 'var(--color-success)', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span>✅</span>
                  <span>Orçamento <strong>{orcSel.numero_orc}</strong> salvo com sucesso! Gere o PDF para enviar ao cliente.</span>
                </div>

                {/* Mini resumo */}
                <div style={s.card}>
                  <p style={s.cardTitle}>📄 Resumo do Orçamento Salvo</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
                    {[
                      ['Número', orcSel.numero_orc],
                      ['Cliente', osSel?.cliente_nome || '—'],
                      ['Equipamento', osSel?.equipamento_modelo || '—'],
                      ['Total', fmtBRL(orcSel.valor_total)],
                      ['Validade', `${orcSel.validade_dias} dias`],
                      ['Pagamento', orcSel.forma_pagamento],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-dim)', marginBottom: 4 }}>{k}</div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: k === 'Total' ? 'var(--color-accent)' : 'var(--color-text)' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid var(--color-border)', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ ...s.btn, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} onClick={() => setStep(2)}>← Ajustar Valores</button>
                    <button style={{ ...s.btn, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} onClick={novoOrcamento}>+ Novo Orçamento</button>
                  </div>
                  <button
                    style={{ ...s.btn, background: 'var(--color-success)', color: '#fff', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}
                    onClick={() => baixarPdf({ ...orcSel, ...osSel })}
                    disabled={!!gerando}
                  >
                    {gerando ? '⏳ Gerando...' : '⬇️ Gerar e Baixar PDF'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

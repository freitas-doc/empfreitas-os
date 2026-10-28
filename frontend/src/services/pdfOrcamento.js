import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// ── Helpers ────────────────────────────────────────────────────────────────
const hex = (h) => {
  const r = parseInt(h.slice(1, 3), 16) / 255;
  const g = parseInt(h.slice(3, 5), 16) / 255;
  const b = parseInt(h.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
};

const COR_PRIMARIA = hex('#0a2240');
const COR_ACCENT   = hex('#f59e0b');
const COR_TEXTO    = hex('#0f172a');
const COR_MUTED    = hex('#64748b');
const COR_LINHA    = hex('#cbd5e1');
const COR_BRANCO   = rgb(1, 1, 1);
const COR_FUNDO    = hex('#f8fafc');

const sanitize = (str) =>
  String(str ?? '')
    .normalize('NFC')
    .replace(/[^\x00-\xFF]/g, (c) => {
      const map = {
        '\u2014': '-', '\u2013': '-', '\u2192': '>',
        '\u00b7': '.', '\u00ba': 'o', '\u00aa': 'a',
        '\u2019': "'", '\u201c': '"', '\u201d': '"',
      };
      return map[c] || '?';
    });

const fmtBRL = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtData = (iso) => {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
};

// ═══════════════════════════════════════════════════════════════════
export async function gerarPdfOrcamento(orc) {
  const pdfDoc  = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const A4W = 595.28, A4H = 841.89;
  const ML = 44, MR = 44;
  const CW = A4W - ML - MR;
  const Y_MIN = 60;

  // Logo
  let logoImg = null;
  try {
    const res = await fetch('/logo-empfreitas.png');
    if (res.ok) logoImg = await pdfDoc.embedPng(await res.arrayBuffer());
  } catch (_) {}

  const ctx = { page: null };
  const BANNER_H = 68, BANNER_Y = A4H - BANNER_H;

  function novaPagina() {
    ctx.page = pdfDoc.addPage([A4W, A4H]);

    // Banner topo
    ctx.page.drawRectangle({ x: 0, y: BANNER_Y, width: A4W, height: BANNER_H, color: COR_PRIMARIA });
    ctx.page.drawRectangle({ x: 0, y: A4H - 5,  width: A4W, height: 5, color: COR_ACCENT });
    ctx.page.drawRectangle({ x: 0, y: BANNER_Y,  width: A4W, height: 5, color: COR_ACCENT });

    // Logo
    let nomeX = ML;
    if (logoImg) {
      const maxW = 80, maxH = 50;
      const scale = Math.min(maxW / logoImg.width, maxH / logoImg.height);
      const lw = logoImg.width * scale, lh = logoImg.height * scale;
      ctx.page.drawImage(logoImg, { x: ML, y: BANNER_Y + (BANNER_H - lh) / 2, width: lw, height: lh });
      nomeX = ML + lw + 8;
    }
    ctx.page.drawText('EMPFREITAS',              { x: nomeX, y: BANNER_Y + 44, size: 9,   font: bold,    color: COR_BRANCO });
    ctx.page.drawText('SOLU\u00c7\u00d5ES EM ELETR\u00d4NICA', { x: nomeX, y: BANNER_Y + 30, size: 6.5, font: regular, color: COR_ACCENT });

    // Centro: título
    ctx.page.drawText('OR\u00c7AMENTO',          { x: 246, y: BANNER_Y + 44, size: 13, font: bold,    color: COR_BRANCO });
    ctx.page.drawText(sanitize(orc.numero_orc || ''), { x: 246, y: BANNER_Y + 26, size: 9,  font: bold,    color: COR_ACCENT });

    // Direita: data
    ctx.page.drawText(sanitize(`Data: ${fmtData(orc.data_emissao)}`),
      { x: 418, y: BANNER_Y + 35, size: 7.5, font: regular, color: COR_LINHA });

    // Rodapé da página
    ctx.page.drawText('Empfreitas \u2014 Solu\u00e7\u00f5es em Eletr\u00f4nica  |  WhatsApp: (11) 97644-265  |  comercial@empfreitas.com.br',
      { x: ML, y: 18, size: 6.5, font: regular, color: COR_MUTED });

    return BANNER_Y - 18;
  }

  const td = (str, x, y, size, font, color) => {
    if (str == null) return;
    ctx.page.drawText(sanitize(str).replace(/[\r\n]/g, ' '), { x, y, size, font, color });
  };

  // Draws text right-aligned so that the rightmost character lands at xRight
  const tdRight = (str, xRight, y, size, font, color) => {
    if (str == null) return;
    const s2 = sanitize(str).replace(/[\r\n]/g, ' ');
    const w  = font.widthOfTextAtSize(s2, size);
    ctx.page.drawText(s2, { x: xRight - w, y, size, font, color });
  };

  const hrz = (y, thick = 0.5, cor = COR_LINHA) =>
    ctx.page.drawLine({ start: { x: ML, y }, end: { x: A4W - MR, y }, thickness: thick, color: cor });

  function garantirEspaco(Y, h) {
    if (Y - h < Y_MIN) return novaPagina();
    return Y;
  }

  function wrap(texto, x, Y, size, font, color, maxW) {
    if (!texto) return Y;
    const LH = size + 7;
    for (const par of sanitize(String(texto)).split(/\r?\n/)) {
      const words = par.split(' ');
      let line = '';
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (font.widthOfTextAtSize(test, size) > maxW && line) {
          Y = garantirEspaco(Y, LH + 4);
          td(line, x, Y, size, font, color);
          line = w; Y -= LH;
        } else { line = test; }
      }
      if (line) { Y = garantirEspaco(Y, LH + 4); td(line, x, Y, size, font, color); Y -= LH; }
    }
    return Y;
  }

  function secao(label, Y) {
    Y = garantirEspaco(Y, 26);
    // Faixa lateral accent
    ctx.page.drawRectangle({ x: ML, y: Y - 3, width: 3, height: 13, color: COR_ACCENT });
    td(label, ML + 8, Y, 9, bold, COR_PRIMARIA);
    return Y - 6;
  }

  // ═══ Início ═══════════════════════════════════════════════════════════
  let Y = novaPagina();

  // ── DADOS DO CLIENTE ────────────────────────────────────────────────
  Y = garantirEspaco(Y, 60);
  Y = secao('DADOS DO CLIENTE', Y);
  hrz(Y); Y -= 14;

  td('Empresa / Raz\u00e3o Social:', ML, Y, 8, bold, COR_MUTED);
  Y = wrap(orc.cliente_nome || 'N/A', ML + 108, Y, 8, bold, COR_TEXTO, CW - 108);
  Y += 2;

  td('CNPJ / CPF:', ML, Y, 8, bold, COR_MUTED);
  td(orc.cliente_documento || 'N/A', ML + 54, Y, 8, bold, COR_TEXTO);
  Y -= 13;

  td('Endere\u00e7o:', ML, Y, 8, bold, COR_MUTED);
  Y = wrap(orc.cliente_endereco || 'N/A', ML + 52, Y, 8, regular, COR_TEXTO, CW - 52);
  Y -= 12;

  // ── EQUIPAMENTO ─────────────────────────────────────────────────────
  Y = garantirEspaco(Y, 50);
  Y = secao('EQUIPAMENTO', Y);
  hrz(Y); Y -= 14;

  td('Modelo:', ML, Y, 8, bold, COR_MUTED);
  td(sanitize(orc.equipamento_modelo || 'N/A').slice(0, 40), ML + 42, Y, 8, bold, COR_TEXTO);
  td('S\u00e9rie:', 340, Y, 8, bold, COR_MUTED);
  td(sanitize(orc.equipamento_serie || 'N/A').slice(0, 20), 368, Y, 8, bold, COR_TEXTO);
  td('Tipo:', 460, Y, 8, bold, COR_MUTED);
  td(orc.tipo_manutencao || '', 487, Y, 8, bold, COR_TEXTO);
  Y -= 16;

  // ── TABELA DE SERVIÇOS ───────────────────────────────────────────────
  Y = garantirEspaco(Y, 60);
  Y = secao('DESCRI\u00c7\u00c3O DOS SERVI\u00c7OS', Y);

  // Colunas — valores alinhados à DIREITA das suas respectivas colunas
  const X_QTD    = ML;
  const X_DESC   = ML + 30;
  const X_UNIT_R = A4W - MR - 72;   // borda direita da col. "Valor Unit."
  const X_TOT_R  = A4W - MR;        // borda direita da col. "Total"
  const DESC_MAX = X_UNIT_R - 50 - X_DESC; // largura máxima da coluna Descrição

  // Cabeçalho tabela
  Y = garantirEspaco(Y, 22);
  ctx.page.drawRectangle({ x: ML, y: Y - 4, width: CW, height: 18, color: COR_PRIMARIA });
  td('Qtd',              X_QTD + 2,  Y + 1, 7, bold, COR_BRANCO);
  td('Descri\u00e7\u00e3o', X_DESC, Y + 1, 7, bold, COR_BRANCO);
  tdRight('Valor Unit.', X_UNIT_R,   Y + 1, 7, bold, COR_BRANCO);
  tdRight('Total',       X_TOT_R,    Y + 1, 7, bold, COR_BRANCO);
  Y -= 18;

  // Mão de obra calculada
  const maoObra = parseFloat(orc.valor_mao_obra || 0) + parseFloat(orc.valor_deslocamento || 0);

  // Linha principal: mão de obra
  // wrap() não deve alterar o Y das colunas de valor — capturamos yRef antes do wrap
  const LINHA_H = 16;
  Y = garantirEspaco(Y, LINHA_H);
  ctx.page.drawRectangle({ x: ML, y: Y - 4, width: CW, height: LINHA_H, color: COR_FUNDO });
  const yRef = Y;
  td('1', X_QTD + 4, yRef, 8, bold, COR_TEXTO);
  wrap(sanitize(orc.descricao_servico || 'Servi\u00e7o conforme OS'), X_DESC, yRef, 8, regular, COR_TEXTO, DESC_MAX);
  tdRight(fmtBRL(maoObra), X_UNIT_R, yRef, 8, regular, COR_MUTED);
  tdRight(fmtBRL(maoObra), X_TOT_R,  yRef, 8, bold,    COR_TEXTO);
  Y -= LINHA_H;

  // Itens adicionais
  const itens = Array.isArray(orc.itens_adicionais)
    ? orc.itens_adicionais
    : (typeof orc.itens_adicionais === 'string' ? JSON.parse(orc.itens_adicionais || '[]') : []);

  for (let i = 0; i < itens.length; i++) {
    const item = itens[i];
    const qty  = parseFloat(item.quantidade || 1);
    const unit = parseFloat(item.valor_unit || 0);
    const tot  = qty * unit;
    Y = garantirEspaco(Y, 16);
    const bgC = i % 2 === 0 ? rgb(1,1,1) : COR_FUNDO;
    ctx.page.drawRectangle({ x: ML, y: Y - 4, width: CW, height: 16, color: bgC });
    td(String(qty),                    X_QTD + 4, Y, 8, bold,    COR_TEXTO);
    td(sanitize(item.descricao || ''), X_DESC,    Y, 8, regular, COR_TEXTO);
    tdRight(fmtBRL(unit), X_UNIT_R,   Y, 8, regular, COR_MUTED);
    tdRight(fmtBRL(tot),  X_TOT_R,    Y, 8, bold,    COR_TEXTO);
    Y -= 16;
  }

  hrz(Y + 2); Y -= 6;

  // Subtotais
  const subtotal = maoObra + itens.reduce((s, i) => s + parseFloat(i.quantidade || 1) * parseFloat(i.valor_unit || 0), 0);
  const desconto = subtotal * (parseFloat(orc.desconto_pct || 0) / 100);
  const base     = subtotal - desconto;
  const imposto  = base * (parseFloat(orc.imposto_pct || 0) / 100);
  const total    = base + imposto;

  const xLabel = A4W - MR - 200;

  // Desconto e imposto — sem percentual no rótulo para não cortar o texto
  if (desconto > 0) {
    Y = garantirEspaco(Y, 14);
    td('Desconto', xLabel, Y, 8, regular, COR_MUTED);
    tdRight(`- ${fmtBRL(desconto)}`, X_TOT_R, Y, 8, regular, COR_MUTED);
    Y -= 13;
  }
  if (imposto > 0) {
    Y = garantirEspaco(Y, 14);
    td('ISS / Impostos', xLabel, Y, 8, regular, COR_MUTED);
    tdRight(fmtBRL(imposto), X_TOT_R, Y, 8, regular, COR_MUTED);
    Y -= 13;
  }

  // Total em destaque
  Y = garantirEspaco(Y, 24);
  ctx.page.drawRectangle({ x: ML, y: Y - 6, width: CW, height: 20, color: hex('#fff8e7') });
  hrz(Y + 14, 1, COR_ACCENT);
  hrz(Y - 6,  1, COR_ACCENT);
  td('TOTAL', xLabel, Y, 10, bold, COR_PRIMARIA);
  tdRight(fmtBRL(total), X_TOT_R, Y, 11, bold, COR_PRIMARIA);
  Y -= 20;

  // ── INFORMAÇÕES TÉCNICAS ─────────────────────────────────────────────
  if (orc.problema_relatado || orc.solucao_aplicada || orc.servico_realizado) {
    Y = garantirEspaco(Y, 50);
    Y = secao('INFORMA\u00c7\u00d5ES T\u00c9CNICAS', Y);
    hrz(Y); Y -= 14;

    if (orc.problema_relatado) {
      td('Problema Relatado:', ML, Y, 8, bold, COR_MUTED); Y -= 13;
      Y = wrap(orc.problema_relatado, ML, Y, 8, regular, COR_TEXTO, CW);
      Y -= 8;
    }
    if (orc.solucao_aplicada) {
      Y = garantirEspaco(Y, 30);
      td('Solu\u00e7\u00e3o Aplicada:', ML, Y, 8, bold, COR_MUTED); Y -= 13;
      Y = wrap(orc.solucao_aplicada, ML, Y, 8, regular, COR_TEXTO, CW);
      Y -= 8;
    }
    if (orc.servico_realizado) {
      Y = garantirEspaco(Y, 30);
      td('Servi\u00e7o Realizado:', ML, Y, 8, bold, COR_MUTED); Y -= 13;
      Y = wrap(orc.servico_realizado, ML, Y, 8, regular, COR_TEXTO, CW);
      Y -= 8;
    }
  }

  // ── CONDIÇÕES COMERCIAIS ─────────────────────────────────────────────
  Y = garantirEspaco(Y, 90);
  Y = secao('CONDI\u00c7\u00d5ES COMERCIAIS', Y);
  hrz(Y); Y -= 14;

  // Layout 2 colunas com offsets calculados para evitar sobreposição
  const COL1_X       = ML;
  const COL1_LABEL_W = 118;
  const COL2_X       = ML + CW / 2 + 10;
  const COL2_LABEL_W = 92;
  const COL1_VAL_X   = COL1_X + COL1_LABEL_W;
  const COL2_VAL_X   = COL2_X + COL2_LABEL_W;
  const COL2_VAL_MAX = A4W - MR - COL2_VAL_X;

  // Linha 1: Valor Total | Forma de Pagamento
  td('Valor Total:', COL1_X, Y, 8, bold, COR_MUTED);
  td(fmtBRL(total), COL1_VAL_X, Y, 8, bold, COR_TEXTO);
  td('Forma de Pagamento:', COL2_X, Y, 8, bold, COR_MUTED);
  const formaPag  = sanitize(orc.forma_pagamento || '');
  const formaPagW = regular.widthOfTextAtSize(formaPag, 8);
  if (formaPagW > COL2_VAL_MAX) {
    wrap(formaPag, COL2_VAL_X, Y, 8, regular, COR_TEXTO, COL2_VAL_MAX);
  } else {
    td(formaPag, COL2_VAL_X, Y, 8, regular, COR_TEXTO);
  }
  Y -= 14;

  // Linha 2: Prazo de Entrega | Garantia
  td('Prazo de Entrega:', COL1_X, Y, 8, bold, COR_MUTED);
  td(sanitize(orc.prazo_entrega || ''), COL1_VAL_X, Y, 8, bold, COR_TEXTO);
  td('Garantia:', COL2_X, Y, 8, bold, COR_MUTED);
  td(sanitize(orc.garantia || ''), COL2_VAL_X, Y, 8, bold, COR_TEXTO);
  Y -= 14;

  // Linha 3: Validade
  td('Validade deste Or\u00e7amento:', COL1_X, Y, 8, bold, COR_MUTED);
  td(`${orc.validade_dias || 15} dias`, COL1_VAL_X, Y, 8, bold, hex('#d97706'));
  Y -= 20;

  if (orc.observacoes) {
    Y = garantirEspaco(Y, 30);
    td('Observa\u00e7\u00f5es:', ML, Y, 8, bold, COR_MUTED); Y -= 13;
    Y = wrap(orc.observacoes, ML, Y, 8, regular, COR_TEXTO, CW);
    Y -= 10;
  }

  // Nota de validade
  Y = garantirEspaco(Y, 24);
  const nota = `Este or\u00e7amento \u00e9 v\u00e1lido por ${orc.validade_dias || 15} dias a partir da data de emiss\u00e3o. Ap\u00f3s aprova\u00e7\u00e3o, o prazo come\u00e7a a contar da confirma\u00e7\u00e3o do pagamento.`;
  Y = wrap(nota, ML, Y - 4, 7, regular, COR_MUTED, CW);

  return pdfDoc.save();
}

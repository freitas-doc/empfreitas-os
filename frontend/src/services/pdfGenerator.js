import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { formatarNumeroOS, mascaraCPFCNPJ, formatarDataHora } from '../utils/formatters.js';

// ── Helpers de cor ─────────────────────────────────────────
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

// ── Sanitizador WinAnsi ────────────────────────────────────
const sanitize = (str) =>
  String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x00-\xFF]/g, (c) => {
      const map = { '\u2014': '-', '\u2013': '-', '\u2192': '>', '\u00b7': '.', '\u00ba': 'o', '\u00aa': 'a', '\u2019': "'", '\u201c': '"', '\u201d': '"' };
      return map[c] || '?';
    });

// ═══════════════════════════════════════════════════════════
export async function gerarPdfOS(state) {
  const pdfDoc  = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const A4W      = 595.28;
  const A4H      = 841.89;
  const ML       = 40;          // margem esquerda
  const MR       = 40;          // margem direita
  const CW       = A4W - ML - MR;
  const MARGIN_B = 60;          // margem inferior de segurança
  const Y_MIN    = MARGIN_B;    // Y mínimo antes de virar página

  // ── Pré-carrega logo ──────────────────────────────────────
  let logoImg = null;
  try {
    const logoRes = await fetch('/logo-empfreitas.png');
    if (logoRes.ok) logoImg = await pdfDoc.embedPng(await logoRes.arrayBuffer());
  } catch (_) {}

  // ── Número da OS ─────────────────────────────────────────
  const numOS    = formatarNumeroOS(state.numero_os || state.id?.slice(0, 6) || '------');
  const dataOS   = formatarDataHora(state.data_fechamento || state.data_abertura || new Date());

  // ═══════════════════════════════════════════════════════════
  // CONTEXTO MUTÁVEL DE PÁGINA
  // Encapsulado num objeto para que as funções helper sempre
  // referenciem a página corrente sem re-declaração.
  // ═══════════════════════════════════════════════════════════
  const ctx = { page: null, pageNum: 0 };

  // Cria banner completo (primeira página)
  const BANNER_H = 65;
  const BANNER_Y = A4H - BANNER_H;

  function desenharBannerCompleto(pg) {
    // Fundo + faixas
    pg.drawRectangle({ x: 0, y: BANNER_Y, width: A4W, height: BANNER_H, color: COR_PRIMARIA });
    pg.drawRectangle({ x: 0, y: A4H - 4,  width: A4W, height: 4, color: COR_ACCENT });
    pg.drawRectangle({ x: 0, y: BANNER_Y, width: A4W, height: 4, color: COR_ACCENT });

    // Logo
    if (logoImg) {
      const maxW = 105, maxH = 50;
      const scale = Math.min(maxW / logoImg.width, maxH / logoImg.height);
      const lw = logoImg.width * scale, lh = logoImg.height * scale;
      pg.drawImage(logoImg, { x: ML, y: BANNER_Y + (BANNER_H - lh) / 2, width: lw, height: lh });
    } else {
      pg.drawText('EMPFREITAS', { x: ML, y: BANNER_Y + 28, size: 15, font: bold, color: COR_BRANCO });
    }

    // Título
    pg.drawText('ORDEM DE SERVIÇO', { x: 175, y: BANNER_Y + 42, size: 16, font: bold, color: COR_BRANCO });
    pg.drawText(sanitize(`${state.tipo_os}  .  ${state.tipo_manutencao}`), { x: 175, y: BANNER_Y + 22, size: 9, font: regular, color: COR_ACCENT });

    // Número e data (direita)
    pg.drawText(sanitize(numOS), { x: 395, y: BANNER_Y + 42, size: 11, font: bold, color: COR_BRANCO });
    pg.drawText(sanitize(`Data: ${dataOS}`), { x: 395, y: BANNER_Y + 24, size: 8, font: regular, color: COR_LINHA });
  }

  // Cabeçalho de continuação (páginas 2+)
  const CONT_H = 28;
  const CONT_Y = A4H - CONT_H;

  function desenharCabecalhoContinuacao(pg) {
    pg.drawRectangle({ x: 0, y: CONT_Y, width: A4W, height: CONT_H, color: COR_PRIMARIA });
    pg.drawRectangle({ x: 0, y: A4H - 3, width: A4W, height: 3, color: COR_ACCENT });
    pg.drawText('EMPFREITAS', { x: ML, y: CONT_Y + 9, size: 9, font: bold, color: COR_BRANCO });
    pg.drawText(sanitize(`OS ${numOS}  -  continuacao`), { x: 170, y: CONT_Y + 9, size: 8, font: regular, color: COR_LINHA });
    pg.drawText(sanitize(`Pagina ${ctx.pageNum}`), { x: A4W - MR - 40, y: CONT_Y + 9, size: 8, font: regular, color: COR_LINHA });
  }

  // Rodapé de página (número)
  function desenharRodape(pg, num) {
    pg.drawText(sanitize(`Pag. ${num}`), { x: A4W / 2 - 15, y: 20, size: 7, font: regular, color: COR_MUTED });
  }

  // ── Nova página ───────────────────────────────────────────
  function novaPagina(primeira = false) {
    ctx.pageNum += 1;
    ctx.page = pdfDoc.addPage([A4W, A4H]);
    if (primeira) {
      desenharBannerCompleto(ctx.page);
      return BANNER_Y - 18;
    } else {
      desenharCabecalhoContinuacao(ctx.page);
      desenharRodape(ctx.page, ctx.pageNum);
      return CONT_Y - 18;
    }
  }

  // ── Utilitários de desenho (sempre usam ctx.page) ─────────
  const td = (str, x, y, size, font, color) => {
    if (str === null || str === undefined) return;
    ctx.page.drawText(sanitize(str).replace(/[\r\n]/g, ' '), { x, y, size, font, color });
  };

  const hrz = (y, thick = 0.5, cor = COR_LINHA) =>
    ctx.page.drawLine({ start: { x: ML, y }, end: { x: A4W - MR, y }, thickness: thick, color: cor });

  // ── Verificação de quebra de página ───────────────────────
  // Retorna o Y atual (ou o novo Y caso tenha virado página)
  function garantirEspaco(Y, espacoNecessario) {
    if (Y - espacoNecessario < Y_MIN) {
      return novaPagina(false);
    }
    return Y;
  }

  // ── Texto com quebra de linha automática ─────────────────
  function wrap(texto, x, Y, size, font, color, maxW) {
    if (!texto) return Y;
    const LH = size + 7;
    const paragrafos = sanitize(String(texto)).split(/\r?\n/);
    for (const paragrafo of paragrafos) {
      const words = paragrafo.split(' ');
      let line = '';
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (font.widthOfTextAtSize(test, size) > maxW && line) {
          Y = garantirEspaco(Y, LH + 4);
          td(line, x, Y, size, font, color);
          line = w;
          Y -= LH;
        } else {
          line = test;
        }
      }
      if (line) {
        Y = garantirEspaco(Y, LH + 4);
        td(line, x, Y, size, font, color);
        Y -= LH;
      }
    }
    return Y;
  }

  // Título de seção
  function secao(label, Y) {
    Y = garantirEspaco(Y, 24);
    td(label, ML, Y, 9.5, bold, COR_PRIMARIA);
    return Y - 6;
  }

  // ═══════════════════════════════════════════════════════════
  // INÍCIO: primeira página
  // ═══════════════════════════════════════════════════════════
  let Y = novaPagina(true);

  // ── DADOS DO CLIENTE ───────────────────────────────────────
  Y = garantirEspaco(Y, 60);
  Y = secao('DADOS DO CLIENTE', Y);
  hrz(Y); Y -= 16;

  // Linha 1: Nome
  td('Nome / Razao Social:', ML, Y, 8, bold, COR_MUTED);
  Y = wrap(state.cliente_nome || 'N/A', ML + 102, Y, 8, bold, COR_TEXTO, CW - 102);
  Y += 2; // Ajuste fino pois o wrap já desconta o LH inteiro

  // Linha 2: CNPJ / CPF
  td('CNPJ / CPF:', ML, Y, 8, bold, COR_MUTED);
  td(mascaraCPFCNPJ(state.cliente_documento || '') || 'N/A', ML + 52, Y, 8, bold, COR_TEXTO);
  Y -= 14;

  // Linha 3: Endereco
  td('Endereco:', ML, Y, 8, bold, COR_MUTED);
  Y = wrap(state.cliente_endereco || 'N/A', ML + 52, Y, 8, regular, COR_TEXTO, CW - 52);
  Y -= 14;

  // ── EQUIPAMENTO ───────────────────────────────────────────
  Y = garantirEspaco(Y, 70);
  Y = secao('EQUIPAMENTO', Y);
  hrz(Y); Y -= 16;

  td('Modelo:', ML, Y, 8, bold, COR_MUTED);
  td(String(state.equipamento_modelo || 'N/A'), ML + 42, Y, 8, bold, COR_TEXTO);
  td('Serie:', 210, Y, 8, bold, COR_MUTED);
  td(String(state.equipamento_serie || 'N/A'), 240, Y, 8, bold, COR_TEXTO);
  td('Horimetro:', 370, Y, 8, bold, COR_MUTED);
  td(String(state.equipamento_horimetro || 'N/A'), 424, Y, 8, bold, COR_TEXTO);
  Y -= 16;

  td('Inicio do Serv.:', ML, Y, 8, bold, COR_MUTED);
  td(state.data_inicio_servico ? formatarDataHora(state.data_inicio_servico) : 'N/A', ML + 72, Y, 8, bold, COR_TEXTO);
  td('Termino:', 280, Y, 8, bold, COR_MUTED);
  td(state.data_termino_servico ? formatarDataHora(state.data_termino_servico) : 'N/A', 320, Y, 8, bold, COR_TEXTO);
  Y -= 16;

  // Deslocamento
  const odSaida    = parseFloat(state.km_odometro_saida)   || 0;
  const odChegada  = parseFloat(state.km_odometro_chegada) || 0;
  const kmPercorrido = odChegada > odSaida ? odChegada - odSaida : 0;
  if (odSaida > 0 || odChegada > 0) {
    td('Deslocamento:', ML, Y, 8, bold, COR_MUTED);
    td(`Saida: ${odSaida} km  /  Chegada: ${odChegada} km  >  Percorrido: ${kmPercorrido} km`, ML + 72, Y, 8, bold, COR_TEXTO);
    Y -= 16;
  }
  Y -= 10;

  // ── SERVIÇO ───────────────────────────────────────────────
  if (state.tipo_manutencao === 'CORRETIVA') {
    Y = garantirEspaco(Y, 50);
    Y = secao('SERVICO EXECUTADO - Corretiva', Y);
    hrz(Y); Y -= 16;

    td('Problema Relatado:', ML, Y, 8, bold, COR_MUTED); Y -= 14;
    Y = wrap(state.descricao_problema || 'Nenhum descrito.', ML, Y, 8, regular, COR_TEXTO, CW);
    Y -= 10;

    Y = garantirEspaco(Y, 30);
    td('Solucao Aplicada:', ML, Y, 8, bold, COR_MUTED); Y -= 14;
    Y = wrap(state.servico_executado || 'Nenhuma aplicada.', ML, Y, 8, regular, COR_TEXTO, CW);
    Y -= 10;

    if (state.observacoes) {
      Y = garantirEspaco(Y, 30);
      td('Observacoes:', ML, Y, 8, bold, COR_MUTED); Y -= 14;
      Y = wrap(state.observacoes, ML, Y, 8, regular, COR_TEXTO, CW);
      Y -= 10;
    }

  } else {
    Y = garantirEspaco(Y, 50);
    Y = secao('CHECKLIST DE MANUTENCAO PREVENTIVA', Y);
    hrz(Y); Y -= 16;

    const HALF = CW / 2 - 10;
    const itens = state.checklist || [];
    for (let i = 0; i < itens.length; i++) {
      if (i % 2 === 0) Y = garantirEspaco(Y, 20);
      const item = itens[i];
      const x = i % 2 === 0 ? ML : ML + HALF + 20;
      const corStatus = item.status === 'OK' ? hex('#15803d') : item.status === 'DEFEITO' ? hex('#b91c1c') : COR_MUTED;
      td(`• ${item.label}`, x, Y, 8, regular, COR_TEXTO);
      td(`[${item.status || 'N/A'}]`, x + HALF - 36, Y, 8, bold, corStatus);
      if (i % 2 === 1) Y -= 16;
    }
    if (itens.length % 2 !== 0) Y -= 16;
    Y -= 10;
  }

  // ── PEÇAS TROCADAS (tabela) ───────────────────────────────
  if (state.pecas && state.pecas.length > 0) {
    Y = garantirEspaco(Y, 50);
    Y = secao('PECAS TROCADAS', Y);
    hrz(Y); Y -= 16;

    // Larguras das colunas
    const C_QTD  = 36;   // Qtd
    const C_COD  = 100;  // Codigo
    const C_DESC = CW - C_QTD - C_COD - 20; // Descricao
    const X_QTD  = ML;
    const X_COD  = ML + C_QTD + 8;
    const X_DESC = X_COD + C_COD + 8;

    // Cabeçalho da tabela
    Y = garantirEspaco(Y, 20);
    ctx.page.drawRectangle({ x: ML, y: Y - 4, width: CW, height: 18, color: COR_PRIMARIA });
    td('Qtd', X_QTD + 2, Y + 1, 7.5, bold, COR_BRANCO);
    td('Codigo / SKU',   X_COD,  Y + 1, 7.5, bold, COR_BRANCO);
    td('Descricao da Peca', X_DESC, Y + 1, 7.5, bold, COR_BRANCO);
    Y -= 18;

    for (let i = 0; i < state.pecas.length; i++) {
      Y = garantirEspaco(Y, 18);
      const p   = state.pecas[i];
      const bgC = i % 2 === 0 ? hex('#f1f5f9') : rgb(1, 1, 1);
      ctx.page.drawRectangle({ x: ML, y: Y - 4, width: CW, height: 16, color: bgC });
      td(String(p.quantidade ?? 1), X_QTD + 2, Y, 8, bold, COR_TEXTO);
      td(p.codigo_sku || '-',       X_COD,      Y, 8, regular, COR_MUTED);
      td(p.nome_peca || '',         X_DESC,     Y, 8, bold,    COR_TEXTO);
      Y -= 16;
    }
    // Linha final da tabela
    hrz(Y + 2, 0.5);
    Y -= 10;
  }

  // ── PEÇAS PENDENTES (tabela) ──────────────────────────────
  if (state.pecas_pendentes && state.pecas_pendentes.length > 0) {
    Y = garantirEspaco(Y, 50);
    Y = secao('PECAS PENDENTES (ORCAMENTO / COMPRA)', Y);
    hrz(Y); Y -= 16;

    const C_QTD  = 36;
    const C_COD  = 100;
    const C_DESC = CW - C_QTD - C_COD - 20;
    const X_QTD  = ML;
    const X_COD  = ML + C_QTD + 8;
    const X_DESC = X_COD + C_COD + 8;
    const COR_PENDENTE = hex('#ea580c');

    // Cabeçalho
    Y = garantirEspaco(Y, 20);
    ctx.page.drawRectangle({ x: ML, y: Y - 4, width: CW, height: 18, color: COR_PENDENTE });
    td('Qtd', X_QTD + 2, Y + 1, 7.5, bold, COR_BRANCO);
    td('Codigo / SKU',      X_COD,  Y + 1, 7.5, bold, COR_BRANCO);
    td('Descricao da Peca', X_DESC, Y + 1, 7.5, bold, COR_BRANCO);
    Y -= 18;

    for (let i = 0; i < state.pecas_pendentes.length; i++) {
      Y = garantirEspaco(Y, 18);
      const p   = state.pecas_pendentes[i];
      const bgC = i % 2 === 0 ? hex('#fff7ed') : rgb(1, 1, 1);
      ctx.page.drawRectangle({ x: ML, y: Y - 4, width: CW, height: 16, color: bgC });
      td(String(p.quantidade ?? 1), X_QTD + 2, Y, 8, bold, COR_PENDENTE);
      td(p.codigo_sku || '-',       X_COD,      Y, 8, regular, COR_MUTED);
      td(p.nome_peca || '',         X_DESC,     Y, 8, bold,    COR_PENDENTE);
      Y -= 16;
    }
    hrz(Y + 2, 0.5);
    Y -= 10;
  }

  // ── FOTOS (grade 2×N com paginação automática) ────────────
  if (state.fotos && state.fotos.length > 0) {
    Y = garantirEspaco(Y, 40);
    Y = secao('FOTOS ANEXADAS', Y);
    hrz(Y); Y -= 14;

    const GAP    = 12;
    const FOTO_W = (CW - GAP) / 2;
    const FOTO_H = 150;
    const LEG_H  = 14;
    const CELULA = LEG_H + FOTO_H + 14; // espaço total por linha de fotos

    const LABEL_CATEGORIA = {
      HORIMETRO:  'Horimetro',
      PLACA_SERIE:'Placa / No de Serie',
      ANTES:      'Antes',
      DEPOIS:     'Depois',
      PECA:       'Peca',
      OUTRO:      'Outro',
    };

    for (let i = 0; i < state.fotos.length; i++) {
      const col = i % 2;

      // Ao iniciar nova linha (coluna esquerda), garante espaço para a linha inteira
      if (col === 0) {
        Y = garantirEspaco(Y, CELULA);
      }

      const f       = state.fotos[i];
      const fx      = ML + col * (FOTO_W + GAP);
      const cellTop = Y - LEG_H - FOTO_H;

      // Legenda
      td(LABEL_CATEGORIA[f.categoria] || f.categoria, fx, Y - 2, 8, bold, COR_MUTED);

      // Borda
      ctx.page.drawRectangle({ x: fx, y: cellTop, width: FOTO_W, height: FOTO_H, borderColor: COR_LINHA, borderWidth: 0.7 });

      // Imagem
      try {
        const b64   = f.imagem_base64;
        const type  = b64.substring(b64.indexOf(':') + 1, b64.indexOf(';'));
        const bytes = Uint8Array.from(atob(b64.split(',')[1]), c => c.charCodeAt(0));
        let img;
        if (type === 'image/png')  img = await pdfDoc.embedPng(bytes);
        if (type === 'image/jpeg') img = await pdfDoc.embedJpg(bytes);
        if (img) {
          const pad = 6;
          const s   = Math.min((FOTO_W - pad * 2) / img.width, (FOTO_H - pad * 2) / img.height);
          const iw  = img.width * s, ih = img.height * s;
          ctx.page.drawImage(img, { x: fx + (FOTO_W - iw) / 2, y: cellTop + (FOTO_H - ih) / 2, width: iw, height: ih });
        }
      } catch (_) { /* foto inválida */ }

      // Avança Y apenas ao fechar a linha (coluna direita ou último item)
      if (col === 1 || i === state.fotos.length - 1) {
        Y = cellTop - 14;
      }
    }
    Y -= 6;
  }

  // ── ASSINATURAS ───────────────────────────────────────────
  // Bloco de assinatura precisa de ~110px — sempre vira página se não couber
  const ASSIN_H = 110;
  if (Y - ASSIN_H < Y_MIN) {
    Y = novaPagina(false);
  }

  hrz(Y + 4, 1.5, COR_PRIMARIA); Y -= 8;
  Y = secao('TERMO DE ACEITE', Y) - 4;
  td('Atesto que o servico descrito acima foi concluido a contento.', ML, Y, 7.5, regular, COR_MUTED);
  Y -= 70;

  const nomeCliente = sanitize(state.responsavel_cliente_nome || state.cliente_nome || 'Cliente');
  const cpfCliente  = sanitize(state.responsavel_cliente_cpf  || '');
  const nomeTecnico = sanitize(state.responsavel_tecnico_nome || state.tecnico_nome || 'Tecnico');
  const cpfTecnico  = sanitize(state.responsavel_tecnico_cpf  || '');

  // Helper de imagem de assinatura
  const embutirImg = async (b64, x, y, bw, bh) => {
    if (!b64) return;
    try {
      const type  = b64.substring(b64.indexOf(':') + 1, b64.indexOf(';'));
      const bytes = Uint8Array.from(atob(b64.split(',')[1]), c => c.charCodeAt(0));
      let img;
      if (type === 'image/png')  img = await pdfDoc.embedPng(bytes);
      if (type === 'image/jpeg') img = await pdfDoc.embedJpg(bytes);
      if (!img) return;
      const s = Math.min(bw / img.width, bh / img.height);
      ctx.page.drawImage(img, { x: x + (bw - img.width * s) / 2, y: y + (bh - img.height * s) / 2, width: img.width * s, height: img.height * s });
    } catch (_) {}
  };

  await embutirImg(state.assinaturas?.cliente, ML, Y, 190, 52);
  ctx.page.drawLine({ start: { x: ML, y: Y - 2 }, end: { x: ML + 210, y: Y - 2 }, thickness: 0.8, color: COR_TEXTO });
  td(nomeCliente,               ML,      Y - 13, 7.5, bold,    COR_TEXTO);
  td(cpfCliente ? `CPF: ${cpfCliente}` : '', ML, Y - 23, 7,   regular, COR_MUTED);

  await embutirImg(state.assinaturas?.tecnico, 345, Y, 190, 52);
  ctx.page.drawLine({ start: { x: 345, y: Y - 2 }, end: { x: 345 + 210, y: Y - 2 }, thickness: 0.8, color: COR_TEXTO });
  td(nomeTecnico,               345,     Y - 13, 7.5, bold,    COR_TEXTO);
  td(cpfTecnico ? `CPF: ${cpfTecnico}` : '', 345, Y - 23, 7,  regular, COR_MUTED);

  if (ctx.pageNum === 1) {
    desenharRodape(ctx.page, 1);
  }

  return pdfDoc.save();
}

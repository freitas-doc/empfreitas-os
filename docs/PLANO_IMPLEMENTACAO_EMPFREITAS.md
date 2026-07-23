# Plano de Implementação — Sistema de Ordem de Serviço EMPFREITAS

**Prazo:** 4 dias
**Escopo:** Web App (PWA) para geração de Ordens de Serviço (OS) de manutenção de empilhadeiras e controladores de empilhadeiras, com captura de fotos via câmera, assinatura digital de cliente/técnico, geração de PDF e histórico local (anti-perda de dados em caso de reload).

---

## 1. Decisões de Arquitetura (e por quê, dado o prazo de 4 dias)

Dado o prazo curto, a prioridade é **1 stack só, sem infraestrutura de nuvem**, rodando 100% no navegador do celular, com um servidor local mínimo apenas para autosave/histórico.

| Camada | Escolha | Motivo |
|---|---|---|
| Frontend | **React + Vite** (PWA) | Rápido de montar, componentização de formulários, funciona bem em mobile, suporta câmera nativa via `<input capture>` |
| Backend | **Node.js + Express** (servidor local leve) | Só para autosave de rascunho (evita perda ao recarregar). Não processa PDF nem lógica pesada — isso fica no cliente |
| Banco de dados | **SQLite** (arquivo local, via `better-sqlite3`) no backend + **IndexedDB** no navegador | SQLite guarda o histórico de rascunhos/OS geradas no servidor local; IndexedDB guarda o PDF final e fotos no próprio celular (funciona mesmo offline) |
| Geração de PDF | **pdf-lib** (client-side) | Gera PDF no próprio navegador, sem depender de backend, permite desenhar assinatura e inserir fotos direto |
| Assinatura | **signature_pad** (biblioteca JS) | Captura assinatura em canvas, exporta como imagem PNG para inserir no PDF |
| Captura de foto | `<input type="file" accept="image/*" capture="environment">` | Abre a câmera diretamente (não a galeria) em navegadores mobile — é o requisito que você pediu |
| Modo instalável | **PWA (manifest + service worker)** | Permite "instalar" o app na tela do celular do técnico, funciona offline |

> **Observação importante sobre "abrir a câmera e não a galeria":** o atributo HTML `capture="environment"` é o mecanismo padrão dos navegadores (Chrome/Safari mobile) para forçar abertura da câmera traseira ao invés do seletor de galeria. Isso é 100% viável em web app/PWA, sem precisar de app nativo.

### Por que backend + SQLite local, e não só IndexedDB?
Você pediu um **servidor que guarde histórico local** para o caso de o técnico recarregar a página sem querer. IndexedDB sozinho já resolveria isso (sobrevive a reload), mas colocar também um backend com SQLite dá a você:
- Um "cofre" adicional fora do navegador (se o técnico limpar o cache do navegador, o rascunho não some).
- Base pronta para, no futuro, trocar para um banco mais robusto (Postgres/MySQL) sem reescrever a lógica de negócio, só trocando a camada de persistência.
- Possibilidade futura de multi-dispositivo/sincronização.

---

## 2. Estrutura de Pastas (Árvore do Projeto)

```
empfreitas-os/
├── backend/
│   ├── src/
│   │   ├── server.js                  # Entrada do Express
│   │   ├── db/
│   │   │   ├── database.js            # Conexão SQLite (better-sqlite3)
│   │   │   ├── schema.sql             # Criação das tabelas
│   │   │   └── migrations/
│   │   │       └── 001_init.sql
│   │   ├── routes/
│   │   │   ├── ordens.routes.js       # CRUD de OS (rascunho + finalizada)
│   │   │   └── health.routes.js
│   │   ├── controllers/
│   │   │   └── ordens.controller.js
│   │   ├── services/
│   │   │   └── ordens.service.js
│   │   └── middlewares/
│   │       └── errorHandler.js
│   ├── data/
│   │   └── empfreitas.db              # Arquivo SQLite (gerado em runtime)
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── public/
│   │   ├── manifest.json              # Configuração PWA
│   │   ├── icons/
│   │   │   ├── icon-192.png
│   │   │   └── icon-512.png
│   │   └── logo-empfreitas.png
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── router.jsx
│   │   ├── assets/
│   │   │   └── (logo, fontes, etc.)
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.jsx
│   │   │   │   └── BottomNav.jsx
│   │   │   ├── form/
│   │   │   │   ├── SeletorTipoOS.jsx          # Empilhadeira x Controlador
│   │   │   │   ├── SeletorManutencao.jsx      # Corretiva x Preventiva
│   │   │   │   ├── DadosCliente.jsx
│   │   │   │   ├── DadosEquipamento.jsx
│   │   │   │   ├── ChecklistManutencao.jsx
│   │   │   │   ├── CampoObservacoes.jsx
│   │   │   │   └── PecasTrocadas.jsx
│   │   │   ├── camera/
│   │   │   │   ├── CapturaFoto.jsx             # <input capture="environment">
│   │   │   │   ├── GaleriaFotosOS.jsx          # Miniaturas: antes/depois/peça
│   │   │   │   └── CategoriaFoto.js            # enum: ANTES, DEPOIS, PECA, OUTRO
│   │   │   ├── assinatura/
│   │   │   │   ├── PainelAssinatura.jsx        # Wrapper do signature_pad
│   │   │   │   └── AssinaturaCliente.jsx / AssinaturaTecnico.jsx
│   │   │   ├── pdf/
│   │   │   │   └── PdfPreview.jsx
│   │   │   └── ui/
│   │   │       ├── Button.jsx
│   │   │       ├── Input.jsx
│   │   │       ├── Modal.jsx
│   │   │       └── Toast.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx                        # Escolher tipo de OS
│   │   │   ├── NovaOSEmpilhadeira.jsx
│   │   │   ├── NovaOSControlador.jsx
│   │   │   ├── RevisaoAssinaturas.jsx
│   │   │   ├── HistoricoOS.jsx                 # Lista de OS salvas localmente
│   │   │   └── DetalhesOS.jsx
│   │   ├── hooks/
│   │   │   ├── useAutosave.js                  # Salva rascunho a cada mudança
│   │   │   ├── useIndexedDB.js
│   │   │   └── useCamera.js
│   │   ├── services/
│   │   │   ├── api.js                          # Chamadas ao backend local
│   │   │   ├── pdfGenerator.js                 # Monta o PDF com pdf-lib
│   │   │   ├── indexedDbService.js              # CRUD no IndexedDB (Dexie.js)
│   │   │   └── storageSync.js                  # Sincroniza IndexedDB <-> backend
│   │   ├── templates/
│   │   │   ├── layoutOSEmpilhadeira.js          # Coordenadas/campos do PDF
│   │   │   └── layoutOSControlador.js
│   │   ├── context/
│   │   │   └── OSFormContext.jsx                # Estado global do formulário atual
│   │   ├── utils/
│   │   │   ├── validators.js
│   │   │   ├── formatters.js                    # Datas, máscaras
│   │   │   └── constants.js
│   │   └── styles/
│   │       └── global.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── docs/
│   ├── PLANO_IMPLEMENTACAO_EMPFREITAS.md        # este documento
│   └── modelo-referencia-os.pdf                 # (você envia)
│
└── README.md
```

---

## 3. Modelo de Dados (SQLite — backend/src/db/schema.sql)

```sql
-- Tabela principal de Ordens de Serviço (rascunho + finalizada)
CREATE TABLE IF NOT EXISTS ordens_servico (
  id TEXT PRIMARY KEY,                 -- UUID gerado no frontend
  tipo_os TEXT NOT NULL,               -- 'EMPILHADEIRA' | 'CONTROLADOR'
  tipo_manutencao TEXT NOT NULL,       -- 'CORRETIVA' | 'PREVENTIVA'
  status TEXT NOT NULL DEFAULT 'RASCUNHO', -- 'RASCUNHO' | 'FINALIZADA'
  numero_os TEXT,                      -- número sequencial/interno
  cliente_nome TEXT,
  cliente_documento TEXT,
  cliente_endereco TEXT,
  equipamento_modelo TEXT,
  equipamento_serie TEXT,
  equipamento_horimetro TEXT,
  tecnico_nome TEXT,
  descricao_problema TEXT,
  servico_executado TEXT,
  observacoes TEXT,
  data_abertura TEXT,
  data_fechamento TEXT,
  dados_formulario_json TEXT,          -- snapshot completo do form (autosave)
  criado_em TEXT DEFAULT (datetime('now')),
  atualizado_em TEXT DEFAULT (datetime('now'))
);

-- Peças trocadas (1:N)
CREATE TABLE IF NOT EXISTS pecas_trocadas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ordem_servico_id TEXT NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  nome_peca TEXT NOT NULL,
  quantidade INTEGER DEFAULT 1,
  observacao TEXT
);

-- Fotos (1:N) — guardamos referência/base64 comprimido ou path local
CREATE TABLE IF NOT EXISTS fotos_os (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ordem_servico_id TEXT NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,             -- 'ANTES' | 'DEPOIS' | 'PECA' | 'OUTRO'
  imagem_base64 TEXT,                  -- ou caminho, dependendo do volume
  criado_em TEXT DEFAULT (datetime('now'))
);

-- Assinaturas
CREATE TABLE IF NOT EXISTS assinaturas_os (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ordem_servico_id TEXT NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,                  -- 'CLIENTE' | 'TECNICO'
  assinatura_base64 TEXT NOT NULL,
  criado_em TEXT DEFAULT (datetime('now'))
);
```

**Espelho no IndexedDB (frontend, via Dexie.js):** mesmas entidades (`ordensServico`, `fotos`, `assinaturas`), mais uma store `pdfsGerados` guardando o Blob do PDF final para o técnico reabrir/reenviar sem regerar.

---

## 4. Endpoints do Backend (Express)

| Método | Rota | Função |
|---|---|---|
| GET | `/api/ordens` | Lista OS (histórico) |
| GET | `/api/ordens/:id` | Detalhe de uma OS |
| POST | `/api/ordens` | Cria OS (rascunho) |
| PUT | `/api/ordens/:id` | Atualiza OS (autosave a cada alteração de campo, debounced) |
| POST | `/api/ordens/:id/finalizar` | Marca como finalizada (após assinaturas) |
| DELETE | `/api/ordens/:id` | Remove rascunho |
| GET | `/api/health` | Verifica se o servidor local está no ar |

> O autosave do frontend chama `PUT /api/ordens/:id` com debounce de ~1.5s a cada mudança relevante do formulário, salvando `dados_formulario_json`. Se o servidor local estiver fora do ar (ex.: rodando só como PWA offline sem backend ativo), o `useAutosave` cai automaticamente para o IndexedDB local — dupla camada de segurança.

---

## 5. Plano de Sprints (4 dias)

> Cada dia é tratado como 1 sprint de 1 dia. Cada sprint termina com um app funcional e testável — nada de "big bang" no dia 4.

### 🟦 Sprint 1 (Dia 1) — Fundação: Backend + Banco + Scaffold do Frontend

**Objetivo do dia:** ter o servidor local rodando, banco criado, e o frontend com navegação básica entre as telas (sem lógica pesada ainda).

**Backend**
- Inicializar projeto Node/Express (`backend/`)
- Configurar SQLite com `better-sqlite3` e rodar `schema.sql`
- Implementar rotas CRUD de `ordens_servico` (sem peças/fotos/assinatura ainda)
- Middleware de tratamento de erro e CORS liberado para localhost
- Testar endpoints via curl/Postman

**Frontend**
- Criar projeto Vite + React (`frontend/`)
- Configurar roteamento (`react-router-dom`)
- Criar `Home.jsx` com escolha: **Empilhadeira** ou **Controlador**
- Criar estrutura de páginas vazias: `NovaOSEmpilhadeira`, `NovaOSControlador`, `HistoricoOS`
- Configurar `OSFormContext` (estado global do formulário)
- Configurar manifest PWA básico (nome, ícone, cor do EMPFREITAS)

**Banco de Dados**
- Rodar `schema.sql` completo (as 4 tabelas)
- Criar seed simples para testes manuais

**Entregável do dia:** app abre no celular, navega entre telas, backend responde aos endpoints de teste.

---

### 🟩 Sprint 2 (Dia 2) — Formulários + Diferenciação Corretiva/Preventiva + Câmera

**Objetivo do dia:** o técnico consegue preencher a OS inteira (dados, tipo de manutenção, fotos), com autosave funcionando.

**Frontend**
- `SeletorManutencao.jsx`: toggle Corretiva x Preventiva — isso muda campos exibidos:
  - **Corretiva:** descrição do problema, causa raiz, serviço executado, peças trocadas
  - **Preventiva:** checklist padrão (itens de inspeção pré-definidos, com status OK/Ajustado/Substituído por item)
- `ChecklistManutencao.jsx`: lista de itens configurável por `tipo_os` (empilhadeira x controlador) — ex. empilhadeira: freios, garfos, hidráulico, pneus, bateria; controlador: placa, conectores, cabos, calibração
- `DadosCliente.jsx` e `DadosEquipamento.jsx`
- `PecasTrocadas.jsx`: adicionar/remover linhas de peça (nome, quantidade, obs)
- `CapturaFoto.jsx`: input com `capture="environment"`, categorizando cada foto como Antes/Depois/Peça/Outro
- `GaleriaFotosOS.jsx`: grade de miniaturas com botão de exclusão por foto
- `useAutosave.js`: hook que observa mudanças no `OSFormContext` e faz `PUT` debounced no backend + grava também no IndexedDB

**Backend**
- Endpoints de fotos: incluir no payload de `PUT /api/ordens/:id` (ou endpoint dedicado `POST /api/ordens/:id/fotos` se o volume de base64 for grande — decidir no dia conforme performance)
- Endpoint de peças trocadas

**Banco de Dados**
- Popular tabela `fotos_os` e `pecas_trocadas` via API

**Entregável do dia:** técnico preenche uma OS completa (corretiva ou preventiva), tira fotos pela câmera, fecha o navegador, reabre e o rascunho está lá.

---

### 🟨 Sprint 3 (Dia 3) — Assinaturas + Geração de PDF

**Objetivo do dia:** gerar o PDF final, fiel ao modelo de referência da EMPFREITAS, com fotos e assinaturas embutidas.

**Frontend**
- `PainelAssinatura.jsx` com `signature_pad`: canvas responsivo a touch, botão "Limpar", exporta PNG base64
- `RevisaoAssinaturas.jsx`: tela final — resumo da OS + assinatura do cliente + assinatura do técnico
- `pdfGenerator.js` (pdf-lib):
  - Carregar template-base (logo EMPFREITAS, cabeçalho, numeração da OS)
  - Preencher campos conforme `tipo_os` e `tipo_manutencao` (layout específico por combinação, usando `templates/layoutOSEmpilhadeira.js` e `layoutOSControlador.js`)
  - Inserir grade de fotos com legenda (Antes/Depois/Peça)
  - Inserir as duas assinaturas (cliente e técnico) com nome e data por baixo
  - Exportar Blob do PDF
- Salvar o Blob no IndexedDB (`pdfsGerados`) e oferecer:
  - Download direto no celular
  - Compartilhar via `navigator.share` (WhatsApp, e-mail etc., quando suportado)
- `PdfPreview.jsx`: mostrar preview do PDF antes de "fechar" a OS

**Backend**
- `POST /api/ordens/:id/finalizar`: muda status para `FINALIZADA`, grava timestamp de fechamento
- Endpoint para salvar assinaturas (`assinaturas_os`)

**Ajuste com base na sua referência**
- Assim que você enviar o PDF modelo, eu replico fielmente: posição do logo, campos do cabeçalho, numeração, rodapé, termos/observações legais que a EMPFREITAS já usa.

**Entregável do dia:** fluxo completo ponta a ponta — abrir OS, preencher, fotografar, assinar (cliente + técnico), gerar PDF, baixar/compartilhar.

---

### 🟥 Sprint 4 (Dia 4) — Histórico, Recuperação de Rascunho, Testes e Ajustes Finais

**Objetivo do dia:** garantir robustez (não perder dados), tela de histórico, testes reais no celular, polimento visual.

**Frontend**
- `HistoricoOS.jsx`: lista de todas as OS (rascunho e finalizadas) puxando do backend local + fallback IndexedDB, com filtro por tipo/status/data
- `DetalhesOS.jsx`: reabrir OS finalizada e re-exportar o PDF salvo (sem precisar gerar de novo)
- Tela/lógica de **recuperação de rascunho**: ao abrir o app, se existir rascunho não finalizado, perguntar "Continuar OS em aberto?" com resumo (cliente, tipo, última edição)
- Validações de formulário (campos obrigatórios antes de permitir assinatura)
- Ajustes de UI/UX para uso com uma mão, em campo, sol forte (contraste, botões grandes)
- Configurar Service Worker (cache de assets, funcionamento offline)

**Backend**
- Testes de carga leve (múltiplas OS, várias fotos) para checar performance do SQLite com base64
- Backup automático do arquivo `.db` (cópia simples com timestamp) — mitigação simples enquanto não há banco em nuvem

**Banco de Dados**
- Revisão de índices (ex.: índice em `status`, `tipo_os`, `criado_em` para a tela de histórico)
- Script de migração documentado (`migrations/001_init.sql`) para facilitar troca futura para Postgres/MySQL

**Testes finais**
- Testar em celular Android real (Chrome) e, se possível, iPhone (Safari) — comportamento do `capture="environment"` varia levemente entre eles
- Testar cenário de "reload no meio do preenchimento"
- Testar geração de PDF com 0, 1 e várias fotos por categoria
- Testar assinatura em tela pequena

**Entregável do dia:** sistema completo, testado em campo, pronto para uso pelos técnicos.

---

## 6. Prompts Sugeridos por Etapa (para usar com Claude Code / assistente de IA)

Estes são os prompts que você pode ir dando (por exemplo, no Claude Code) em cada etapa, na ordem do plano acima. Ajuste o caminho conforme a pasta em que estiver.

**Sprint 1**
```
Crie a estrutura inicial do projeto "empfreitas-os" com duas pastas: backend (Node.js + Express + better-sqlite3) e frontend (React + Vite). No backend, crie o schema SQLite com as tabelas ordens_servico, pecas_trocadas, fotos_os e assinaturas_os conforme especificação em docs/PLANO_IMPLEMENTACAO_EMPFREITAS.md, seção 3. Implemente as rotas CRUD básicas de ordens_servico. No frontend, configure roteamento com react-router-dom e crie as páginas Home, NovaOSEmpilhadeira, NovaOSControlador e HistoricoOS vazias, navegáveis a partir da Home.
```

**Sprint 2**
```
No frontend do projeto empfreitas-os, implemente o formulário de nova OS com: seletor de tipo de manutenção (Corretiva/Preventiva) que altera os campos exibidos, checklist de manutenção preventiva específico para empilhadeira e outro para controlador, campo de peças trocadas (lista dinâmica), e captura de fotos categorizadas (Antes, Depois, Peça, Outro) usando input file com capture="environment" para abrir a câmera do celular direto. Implemente autosave: a cada mudança relevante do formulário, salvar tanto no IndexedDB (via Dexie.js) quanto via PUT no backend local, com debounce de 1.5s.
```

**Sprint 3**
```
Implemente a geração de PDF da ordem de serviço usando pdf-lib no frontend do projeto empfreitas-os. O layout deve seguir o modelo em docs/modelo-referencia-os.pdf, incluindo logo EMPFREITAS, dados do cliente e equipamento, tipo de manutenção, checklist ou descrição do serviço (conforme corretiva/preventiva), grade de fotos com legenda por categoria, e duas assinaturas (cliente e técnico) capturadas via signature_pad, cada uma com nome e data abaixo. Salve o PDF gerado como Blob no IndexedDB e ofereça opções de download e compartilhamento via navigator.share.
```

**Sprint 4**
```
Implemente a tela de histórico de ordens de serviço do projeto empfreitas-os, listando rascunhos e OS finalizadas com filtros por tipo, status e data. Implemente a lógica de recuperação de rascunho: ao abrir o app, se houver uma OS não finalizada, perguntar ao usuário se deseja continuar de onde parou. Configure o service worker para funcionamento offline (PWA) e valide os campos obrigatórios do formulário antes de permitir a etapa de assinatura.
```

---

## 7. Riscos e Pontos de Atenção

- **`capture="environment"` em iOS/Safari:** funciona nas versões recentes, mas o comportamento exato (algumas versões antigas ainda mostram opção de galeria também) pode variar. Vamos testar no Sprint 4 e ter um fallback visual explicando "toque para tirar a foto".
- **Tamanho do PDF/base64:** muitas fotos em alta resolução podem deixar o app lento e o PDF pesado. Vamos comprimir as imagens no client antes de salvar (ex.: redimensionar para ~1280px de largura antes de gravar).
- **Backend "local":** se o app rodar só no navegador do celular sem o backend Node ativo (ex.: PWA instalado sem servidor rodando na mesma rede), o autosave cai só no IndexedDB — o que já resolve o requisito principal (não perder dados no reload). O backend com SQLite fica como camada extra, ideal para quando o técnico usa o celular conectado ao computador/servidor local da empresa.
- **Modelo de referência do PDF:** o layout exato (logo, campos, textos padrão, numeração de OS) depende do arquivo que você vai enviar — o plano já reserva o Sprint 3 para isso, sem impacto no cronograma.

---

## 8. Evolução Futura (fora do escopo dos 4 dias, só para registro)

- Trocar SQLite por PostgreSQL/MySQL em nuvem, com sincronização multi-dispositivo
- Autenticação de técnicos (login)
- Numeração sequencial automática de OS por servidor central
- Dashboard administrativo (quantas OS por mês, por cliente, por tipo)
- Assinatura com validade jurídica reforçada (certificado digital, se necessário)

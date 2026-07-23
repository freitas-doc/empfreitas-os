# EMPFREITAS OS

Sistema de Ordens de Serviço (PWA) para manutenção de empilhadeiras e controladores.

## Estrutura

```
empfreitas-os/
├── backend/     # Node.js + Express + sql.js (SQLite)
├── frontend/    # React + Vite (PWA)
└── docs/        # Plano de implementação e modelo de OS
```

## Como rodar

### Backend
```bash
cd backend
npm install
npm run dev
# Rodando em http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Rodando em http://localhost:5173
```

## Endpoints do Backend

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Status do servidor |
| GET | `/api/ordens` | Lista OS |
| GET | `/api/ordens/:id` | Detalhe de uma OS |
| POST | `/api/ordens` | Cria OS (rascunho) |
| PUT | `/api/ordens/:id` | Atualiza OS (autosave) |
| POST | `/api/ordens/:id/finalizar` | Finaliza OS |
| DELETE | `/api/ordens/:id` | Remove rascunho |

## Sprints

- ✅ **Sprint 1** — Backend + banco + scaffold do frontend (navegação básica)
- ⬜ **Sprint 2** — Formulários completos + câmera + autosave
- ⬜ **Sprint 3** — Assinaturas + geração de PDF
- ⬜ **Sprint 4** — Histórico + PWA offline + testes

# QA Platform

Plataforma interna para gestão de sessões de QA, conectada ao ClickUp e Firebase.

## Stack

- **React + Vite** — frontend
- **Firebase Firestore** — banco de dados em tempo real
- **ClickUp API v2** — importação de tarefas

---

## Setup

### 1. Instale as dependências

```bash
npm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Preencha o `.env` com:

- **VITE_CLICKUP_TOKEN** — token pessoal do ClickUp
  - Acesse: Configurações → Apps → Gerar token
- **VITE_FIREBASE_*** — dados do seu projeto Firebase
  - Acesse: [console.firebase.google.com](https://console.firebase.google.com) → Seu projeto → Configurações → Aplicativos web

### 3. Configure o Firebase

No `src/lib/firebase.js`, os valores são lidos do `.env` automaticamente.

No console do Firebase, crie um banco Firestore e use estas regras para desenvolvimento:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // trocar por autenticação em produção
    }
  }
}
```

### 4. Rode o projeto

```bash
npm run dev
```

---

## Estrutura de dados (Firestore)

### Coleção: `qa_sessions`

Cada documento representa uma sessão de QA para uma tarefa do ClickUp.

| Campo | Tipo | Descrição |
|---|---|---|
| `taskId` | string | ID da tarefa no ClickUp |
| `taskData` | object | Snapshot dos dados da tarefa |
| `qaAnalyst` | string | Nome do analista responsável |
| `status` | string | `waiting` \| `testing` \| `done` |
| `arrivedAt` | timestamp | Quando chegou para QA |
| `testingStartedAt` | timestamp | Início do teste |
| `testingFinishedAt` | timestamp | Fim do teste |
| `timerRunning` | boolean | Timer ativo? |
| `timerStartedAt` | timestamp | Último start do timer |
| `totalTimeMs` | number | Tempo acumulado em ms |
| `checklist` | array | Itens do checklist com `checked` |
| `bugs` | array | Bugs encontrados |
| `feedback` | string | Feedback principal |
| `notes` | string | Notas internas do QA |
| `result` | string | `approved` \| `approved_with_notes` \| `reproved` |
| `severity` | string | `low` \| `medium` \| `high` \| `critical` |

---

## Próximos passos planejados

- [ ] Autenticação com login por email/Google
- [ ] Dashboard de métricas (tempo médio em QA, taxa de reprovação, bugs por membro)
- [ ] Notificações quando tarefa entra em QA
- [ ] Histórico por analista
- [ ] Relatório exportável em PDF
- [ ] Integração com Slack para notificar resultado
- [ ] Trilha de aprendizado integrada

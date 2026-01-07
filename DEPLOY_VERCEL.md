# 🚀 Guia de Deploy - Frontend (Vercel)

Este guia explica como colocar seu frontend online gratuitamente usando a Vercel.

## 📋 Pré-requisitos

1.  O código já está no GitHub: [NexusDevsystem/capi-frontend](https://github.com/NexusDevsystem/capi-frontend)
2.  Você precisa de uma conta na [Vercel](https://vercel.com) (pode usar o GitHub para logar)

---

## 🛠️ Passo a Passo

### 1. Novo Projeto na Vercel

1.  Acesse o [Dashboard da Vercel](https://vercel.com/dashboard)
2.  Clique em **"Add New..."** e selecione **"Project"**
3.  Importe o repositório `capi-frontend`
    *   Se não aparecer, certifique-se de que deu permissão para a Vercel acessar seus repositórios no GitHub.

### 2. Configurar o Projeto

A Vercel geralmente detecta que é um projeto **Vite** automaticamente.

*   **Framework Preset:** `Vite`
*   **Root Directory:** `.` (padrão)

### 3. Configurar Variáveis de Ambiente

Abra a seção **"Environment Variables"** e adicione:

| Key | Value (Produção) |
| :--- | :--- |
| `VITE_API_URL` | `https://capi-backend.onrender.com/api` |
| `VITE_CAKTO_CHECKOUT_URL` | `https://pay.cakto.com.br/383aw9t_713518` |

### 4. Deploy

1.  Clique em **"Deploy"**
2.  Aguarde o build e o deploy finalizarem.

---

## 🌐 URL do Frontend

A Vercel vai gerar uma URL automática (ex: `capi-frontend.vercel.app`).
Você pode configurar um domínio personalizado nas configurações do projeto depois.

---

## ⚙️ Checklist Pós-Deploy

1.  **Testar Login:** Verifique se consegue logar (conecta no backend).
2.  **Testar Pagamento:** Tente gerar um pagamento e veja se abre o checkout do Cakto.
3.  **Verificar Logs:** Se algo der errado, verifique os logs no dashboard da Vercel (seção Deployments > Logs).

---

## 🐛 Troubleshooting

### Erro 404 nas Rotas (Refresh)
Se você recarregar a página em `/app` e der erro 404, precisamos configurar um arquivo `vercel.json`.

**Crie `vercel.json` na raiz do frontend:**

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

Isso garante que o React Router controle as rotas. (Já vou criar este arquivo para você, por precaução).

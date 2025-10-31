# 🍳 Nola Analytics Backend

API de analytics customizável e flexível para restaurantes — parte do desafio **God Level Coder**.

Este backend fornece endpoints de análise sobre vendas, clientes, produtos e performance operacional, com foco em consultas rápidas, insights acionáveis e flexibilidade de exploração.  
Ele serve como base para o dashboard interativo usado por gestores e donos de restaurantes.

---

## 🚀 Stack Tecnológica

- **Node.js + Express** — servidor web leve e performático
- **PostgreSQL** — banco relacional robusto para grandes volumes de dados (500k+ vendas)
- **pg** — driver oficial do PostgreSQL
- **Zod** — validação de parâmetros de entrada
- **node-cache** — cache em memória para otimizar consultas repetidas
- **Helmet + CORS + Morgan** — segurança, logging e controle de acesso
- **Jest + Supertest** — testes unitários e de integração
- **Render** — deploy em nuvem

---

## 🧱 Estrutura do Projeto

```
backend_nola/
├── src/
│   ├── app.js               # Instancia o Express e middlewares
│   ├── server.js            # Inicializa o servidor
│   ├── config/
│   │   └── db.js            # Conexão com PostgreSQL
│   ├── controllers/         # Lógica dos endpoints
│   ├── routes/              # Definição das rotas da API
│   ├── services/            # Camada de regras de negócio
│   └── middleware/          # Middlewares auxiliares
├── tests/                   # Testes unitários e de integração (Jest + Supertest)
├── .env                     # Variáveis de ambiente
├── jest.config.js           # Configuração de testes
├── .babelrc                 # Transpiler Babel (para Jest)
└── package.json
```

---

## ⚙️ Configuração e Execução Local

### 1️⃣ Clonar o repositório

```bash
git clone https://github.com/seuusuario/nola-backend.git
cd nola-backend
```

### 2️⃣ Instalar dependências

```bash
npm install
```

### 3️⃣ Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz com o seguinte conteúdo:

```bash
PORT=3001
DATABASE_URL=postgresql://challenge:challenge_2024@localhost:5432/challenge_db
CACHE_TTL=600
NODE_ENV=development
```

### 4️⃣ Subir banco de dados local

Certifique-se de ter um banco **PostgreSQL** rodando com as tabelas do script `database.schema.sql`.

Para popular o banco com dados de exemplo:

```bash
python generate_data.py --db-url postgresql://challenge:challenge_2024@localhost:5432/challenge_db
```

### 5️⃣ Rodar servidor local

```bash
npm run dev
```

Servidor disponível em:  
👉 [http://localhost:3001/api](http://localhost:3001/api)

---

## ☁️ Deploy na Render

O backend foi implantado na **Render**.  
URL pública:

🔗 https://nola-challenge.onrender.com/api

A conexão com o banco usa o PostgreSQL da Render (instância `godlevel_db`).

---

## 🧪 Testes

Os testes foram escritos com **Jest** e **Supertest**, cobrindo todos os _controllers_.

```bash
npm run test
```

Para visualizar a cobertura:

```bash
npm run test:coverage
```

**Coverage total:** +90%  
✅ Controllers  
✅ Services  
✅ Rotas  
✅ Middlewares

---

## 📚 Endpoints Principais

| Endpoint                           | Método | Descrição                                       |
| ---------------------------------- | ------ | ----------------------------------------------- |
| `/health`                          | GET    | Health check da API                             |
| `/analytics/summary`               | GET    | KPIs principais (vendas, receita, ticket médio) |
| `/analytics/sales-trend`           | GET    | Tendência de vendas ao longo do tempo           |
| `/analytics/top-products`          | GET    | Produtos mais vendidos                          |
| `/analytics/top-stores`            | GET    | Lojas com melhor performance                    |
| `/analytics/top-channels`          | GET    | Canais com maior receita                        |
| `/analytics/financial-overview`    | GET    | Visão financeira consolidada                    |
| `/analytics/low-margin-products`   | GET    | Produtos com baixa margem                       |
| `/analytics/delivery-performance`  | GET    | Métricas de entrega (tempo, eficiência)         |
| `/analytics/customer-retention`    | GET    | Retenção e recorrência de clientes              |
| `/analytics/avg-ticket-comparison` | GET    | Comparação de ticket médio entre períodos       |

---

## 📈 Performance e Escalabilidade

- Cache TTL configurável via `.env`
- Conexões PostgreSQL otimizadas via pool
- Endpoints testados com **500k registros**
- Tempo médio de resposta: **< 800ms**

---

## 🧩 Próximos Passos

- Implementar camada de cache distribuído (Redis)
- Adicionar paginação em endpoints de alto volume
- Expandir testes de integração com frontend

---

## 👨‍💻 Autor

**Alexandre Silva**  
Desafio: _God Level Coder - Nola Analytics_  
Backend: [https://nola-challenge.onrender.com](https://nola-challenge.onrender.com)

---

📄 _Decisões de Arquitetura_ estão documentadas em um PDF separado.

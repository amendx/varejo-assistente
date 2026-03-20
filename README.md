# 🛒 Varejo Assistente Compras - Microfrontend

Um microfrontend Vue 3 desenvolvido para integração com o sistema VFX (Varejo Fácil) através de **Module Federation**.

## 📋 Visão Geral

Este microfrontend fornece funcionalidades de assistente de compras que podem ser integradas dinamicamente ao VFX host, mantendo total independência de desenvolvimento e deploy.

## 🏗️ Arquitetura

- **Framework**: Vue 3 (Composition API)
- **Build**: Webpack 5 + Module Federation
- **Porta**: 8090 (desenvolvimento)
- **Comunicação**: Event Bus para troca bidirecional de dados

## � Controle de Acesso

Este microfrontend implementa **controle de acesso** para garantir que só seja utilizado através do VFX host:

### Verificações de Segurança
- ✅ **Event Bus**: Presença do objeto `eventBus` passado pelo VFX
- ✅ **Dados VFX**: Presença de `userData` ou `themeData` 
- ✅ **Flag Global**: Verificação de `window.__POWERED_BY_VFX__`
- ✅ **Referer**: Origem da requisição vinda do VFX
- ✅ **Desenvolvimento**: Acesso liberado em `NODE_ENV=development`

### Página de Bloqueio
Acessos não autorizados são redirecionados para uma página de **403 Forbidden** com:
- 🔒 Mensagem de acesso restrito
- 📋 Informações para desenvolvedores
- 🐛 Painel de debug (opcional)
- 📚 Links para documentação

## 🚀 Deploy

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+ 
- npm 8+

### Instalação e Execução

```bash
# Clonar repositório
git clone https://github.com/[seu-org]/varejo-assistente-compras.git
cd varejo-assistente-compras

# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
npm run dev
```

O microfrontend estará disponível em: `http://localhost:8090`

## 🚢 Deploy

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy automático
./deploy.sh

# Ou manual
npm run build
vercel --prod
```

### Outras Plataformas

```bash
# Build para qualquer hosting estático
npm run build

# Os arquivos estarão em dist/
# Fazer upload do conteúdo de dist/ para seu hosting
```

### Configuração Pós-Deploy

1. **Atualizar publicPath**: Edite `webpack.config.js` com a URL real:
```javascript
const publicPath = 'https://varejo-assistente-local.vercel.app/'
```

2. **Configurar VFX Host**: Atualize o remote URL no VFX:
```javascript
remotes: {
  assistenteCompras: 'assistente_compras@https://varejo-assistente-local.vercel.app/remoteEntry.js'
}
```

3. **Testar Integração**: Acesse via VFX e verifique se carregou corretamente.

## 🔌 Integração com VFX Host

### Module Federation

O microfrontend expõe o seguinte módulo:

```javascript
// webpack.config.js
exposes: {
  './AssistenteCompras': './src/AssistenteCompras.vue'
}
```

### Consumo no VFX Host

```javascript
// No VFX (Host)
const { AssistenteCompras } = await import('assistenteCompras/AssistenteCompras')
```

### Props Esperadas

```javascript
{
  userData: Object,     // Dados do usuário logado no VFX
  themeData: String,    // Tema atual do VFX ('blue', 'green', etc.)
  eventBus: Object      // Sistema de eventos para comunicação
}
```

## 📡 Comunicação com VFX

### Eventos Enviados (MFE → VFX)

```javascript
// Quando o MFE carrega
eventBus.emit('assistente:ready', {
  mfe: 'assistente-compras',
  timestamp: new Date().toISOString()
})

// Quando gera sugestão de compra
eventBus.emit('assistente:sugestao-gerada', {
  produto: 'Nome do Produto',
  preco: 2500.00,
  desconto: 10,
  timestamp: '2026-03-20T10:30:00Z'
})

// Quando cria pedido
eventBus.emit('assistente:pedido-criado', {
  id: 'PED123456',
  produto: 'Nome do Produto',
  quantidade: 1,
  valor: 2250.00,
  usuario: 'João Silva',
  timestamp: '2026-03-20T10:30:00Z'
})
```

### Eventos Recebidos (VFX → MFE)

```javascript
// Atualização de dados solicitada pelo VFX
eventBus.on('vfx:refresh-data', () => {
  // Atualizar dados locais
})

// Mudança de usuário no VFX
eventBus.on('vfx:user-changed', (userData) => {
  // Reagir à mudança de usuário
})

// Mudança de tema no VFX
eventBus.on('vfx:theme-changed', (theme) => {
  // Adaptar interface ao novo tema
})
```

## 🛠️ Estrutura do Projeto

```
varejo-assistente-compras/
├── public/
│   └── index.html                 # Template HTML
├── src/
│   ├── index.js                   # Entry point (dynamic import) 🆕
│   ├── bootstrap.js               # Lógica principal 🆕
│   ├── AssistenteCompras.vue      # Componente principal
│   └── ForbiddenPage.vue          # Página de bloqueio
├── webpack.config.js              # Configuração Module Federation
├── vercel.json                    # Configuração Vercel
├── deploy.sh                      # Script de deploy
├── package.json                   # Dependências e scripts
└── README.md                      # Este arquivo
```

## 🎨 Personalização

### Temas

O microfrontend adapta-se automaticamente aos temas do VFX:

- `blue` - Azul (padrão)
- `green` - Verde
- `green_two` - Verde alternativo
- `red` - Vermelho
- `orange` - Laranja
- `black` - Preto

### Funcionalidades

#### 🔍 Gerar Sugestão de Compra
- Analisa histórico de compras
- Sugere produtos relevantes
- Calcula descontos aplicáveis

#### 📦 Criar Pedido
- Interface simplificada
- Integração direta com VFX
- Rastreamento em tempo real

## 🔧 Configuração de Desenvolvimento

### Variáveis de Ambiente

```bash
# .env.development
VUE_APP_VFX_HOST=http://localhost:3000
VUE_APP_API_BASE=http://localhost:8090
```

### Modo Standalone

Para desenvolvimento isolado (sem VFX host):

```javascript
// Automaticamente detectado quando window.__POWERED_BY_VFX__ não existe
// Renderiza com dados mock para testes
```

## 🚢 Deploy

### Desenvolvimento
```bash
npm run dev
# Expõe remoteEntry.js em http://localhost:8090/remoteEntry.js
```

### Produção
```bash
npm run build
# Gera arquivos otimizados na pasta dist/
# Deploy o conteúdo de dist/ no seu CDN/servidor
```

### URL de Produção
O VFX host deve apontar para:
```
https://cdn.seudominio.com/assistente-compras/remoteEntry.js
```

## 🤝 Integração com VFX

Para integrar este microfrontend no VFX, siga o guia:
[MICROFRONTENDS_ARCHITECTURE.md](../MICROFRONTENDS_ARCHITECTURE.md)

### Resumo das alterações no VFX:

1. **Instalar dependência**: `npm install webpack@^5.89.0 --save-dev`
2. **Configurar Module Federation** no `vue.config.js`
3. **Criar EventBus global** para comunicação
4. **Adicionar componente container** para carregar o MFE
5. **Configurar rota** `/assistente-compras`

## 🐛 Solução de Problemas

### MFE não carrega no VFX
- Verificar se está rodando na porta 8090 (dev) ou URL correta (prod)
- Confirmar CORS habilitado nos headers
- Verificar console para erros de Module Federation
- Verificar se publicPath está correto no webpack.config.js

### Página de "Acesso Restrito" aparece
- ✅ **Desenvolvimento**: Verifique se `NODE_ENV=development`
- ✅ **Produção**: Confirme que está acessando via VFX host
- ✅ **Props**: Verifique se `eventBus`, `userData` ou `themeData` estão sendo passados
- ✅ **Referer**: Confirme que a requisição vem do VFX

### Deploy na Vercel falha
- Verificar se `vercel.json` está configurado corretamente
- Confirmar que `npm run build` funciona localmente
- Verificar se todas as dependências estão em `package.json`
- Revisar logs de build na dashboard da Vercel

## 📊 Monitoramento

### Métricas Coletadas
- Tempo de carregamento
- Eventos enviados/recebidos
- Erros de integração
- Performance de renderização

### Logs
```javascript
// Todos os eventos são logados no console para debug
console.log(`[MFE Event] ${event}:`, data)
```

## 🚀 Roadmap

- [ ] **v1.1**: Suporte a React como alternativa
- [ ] **v1.2**: Testes automatizados (Jest + Vue Test Utils)
- [ ] **v1.3**: Storybook para documentação visual
- [ ] **v1.4**: TypeScript para melhor DX
- [ ] **v2.0**: Suporte a múltiplos hosts
- [ ] **v2.1**: Lazy loading de componentes
- [ ] **v2.2**: Caching inteligente

## 🤝 Contribuição

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -am 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Ver [LICENSE](LICENSE) para mais detalhes.

---

**🏢 Desenvolvido para:** Sistema VFX (Varejo Fácil)  
**🏗️ Arquitetura:** Module Federation + Vue 3  
**📧 Suporte:** equipe-frontend@varejofacil.com  
**📅 Última atualização:** Março 2026
# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.1.0] - 2026-03-20

### 🔒 Adicionado - Segurança e Deploy
- **Controle de Acesso**: Sistema de bloqueio para acessos não autorizados
- **Página Forbidden**: Interface elegante para acessos restritos (ForbiddenPage.vue)
- **Verificações de Segurança**: Event Bus, dados VFX, flags globais, referer
- **Deploy Vercel**: Configuração completa para deploy gratuito
- **Scripts de Deploy**: Automação com ./deploy.sh
- **Configuração Produção**: Webpack otimizado para diferentes ambientes

### 🛠️ Alterado
- **Webpack Config**: Suporte a desenvolvimento e produção
- **AssistenteCompras.vue**: Verificação de acesso integrada
- **Package.json**: Scripts para build e deploy
- **README.md**: Documentação completa de deploy e segurança

### 📁 Arquivos Adicionados
- `src/ForbiddenPage.vue` - Página de bloqueio
- `vercel.json` - Configuração Vercel
- `deploy.sh` - Script de deploy automatizado
- `.env.example` - Exemplo de variáveis de ambiente

## [1.0.0] - 2026-03-20

### Adicionado
- ✨ Implementação inicial do microfrontend Assistente de Compras
- 🏗️ Configuração Module Federation com Webpack 5
- 📡 Sistema de comunicação bidirecional via Event Bus
- 🎨 Interface responsiva com suporte a temas do VFX
- 🔍 Funcionalidade de geração de sugestões de compra
- 📦 Funcionalidade de criação de pedidos
- 🚀 Modo standalone para desenvolvimento isolado
- 📚 Documentação completa no README.md

### Configurações Técnicas
- **Framework**: Vue 3 com Composition API
- **Build**: Webpack 5 + Module Federation
- **Porta**: 8090 (desenvolvimento)
- **Integração**: VFX Host via remoteEntry.js

### Comunicação
- `assistente:ready` - Notifica quando MFE carregou
- `assistente:sugestao-gerada` - Envia sugestão de compra
- `assistente:pedido-criado` - Envia pedido criado
- `vfx:refresh-data` - Recebe comando de atualização
- `vfx:user-changed` - Recebe mudança de usuário
- `vfx:theme-changed` - Recebe mudança de tema

## [Unreleased]

### Planejado
- [ ] Suporte a React como alternativa
- [ ] Testes automatizados (Jest + Vue Test Utils)
- [ ] TypeScript para melhor DX
- [ ] Storybook para documentação visual
- [ ] Lazy loading de componentes
- [ ] Cache inteligente
- [ ] Metrics e analytics
- [ ] A/B testing framework
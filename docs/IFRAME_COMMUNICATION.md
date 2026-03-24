# 📡 Comunicação Iframe - Assistente de Compras

Este documento explica como testar e implementar a comunicação bidirecional entre o VFX (host) e o Assistente de Compras (MFE) via iframe.

## 🎯 Visão Geral

A página de acesso restrito (`ForbiddenPage.vue`) agora funciona como um **centro de testes e debug** para a integração via iframe, oferecendo:

- ✅ **Visualização dos dados VFX** em tempo real
- 🧪 **Botões de teste** para emitir diferentes tipos de eventos
- 📊 **Debug detalhado** da comunicação PostMessage
- 📋 **Documentação interativa** com exemplos de código

## 🔧 Como Usar

### 1. Carregar o MFE via Iframe

```html
<!-- No VFX (host Vue 2) -->
<iframe 
  src="https://varejo-assistente.vercel.app/iframe.html"
  width="100%" 
  height="600px"
  frameborder="0">
</iframe>
```

### 2. Enviar Dados do VFX para o MFE

O MFE automaticamente solicita dados quando carrega. O host deve responder:

```javascript
// No VFX - Listener para eventos do MFE
window.addEventListener('message', (event) => {
  if (event.data.type === 'VFX_MFE_EVENT') {
    const { event: eventName, data } = event.data
    
    if (eventName === 'mfe:request-data') {
      // Enviar dados do VFX para o MFE
      event.source.postMessage({
        type: 'VFX_HOST_EVENT',
        event: 'host:data-response',
        data: {
          userData: this.$store.state.auth.currentUserData,
          userPermissions: this.$store.state.auth.currentUserData?.permissoes || [],
          userStores: this.$store.getters['auth/lojasDoUsuarioAtivas'],
          isLoggedIn: this.$store.getters['auth/loggedIn'],
          themeData: this.$store.getters['themes/temaAtual']
        }
      }, event.origin)
    }
  }
})
```

## 🧪 Eventos de Teste Disponíveis

A página oferece 6 tipos de eventos de teste que você pode usar no host:

### 1. 👤 Ação do Usuário
```javascript
// Evento enviado pelo MFE
{
  type: 'VFX_MFE_EVENT',
  event: 'mfe:user-action',
  data: {
    action: 'button-click',
    element: 'test-user-action',
    userId: 'user123',
    details: { buttonLabel: 'Simular Ação do Usuário' }
  }
}
```

### 2. 🧭 Navegação
```javascript
{
  type: 'VFX_MFE_EVENT',
  event: 'mfe:navigation',
  data: {
    from: '/forbidden',
    to: '/assistente-compras',
    navigationMethod: 'programmatic'
  }
}
```

### 3. 📋 Solicitação de Dados
```javascript
{
  type: 'VFX_MFE_EVENT',
  event: 'mfe:data-request',
  data: {
    requestedData: ['produtos', 'categorias', 'promocoes'],
    filters: { loja: '001', ativo: true },
    pagination: { page: 1, limit: 10 }
  }
}
```

### 4. 🔔 Notificação
```javascript
{
  type: 'VFX_MFE_EVENT',
  event: 'mfe:notification',
  data: {
    notification: {
      type: 'info',
      title: 'Teste de Notificação',
      message: 'Esta é uma notificação de teste',
      priority: 'medium',
      autoClose: true,
      duration: 5000
    }
  }
}
```

### 5. 📈 Analytics
```javascript
{
  type: 'VFX_MFE_EVENT',
  event: 'mfe:analytics',
  data: {
    event: 'page_view',
    properties: {
      page_title: 'Forbidden Page Test',
      user_id: 'user123',
      feature: 'assistente-compras'
    }
  }
}
```

### 6. ⚡ Evento Personalizado
```javascript
{
  type: 'VFX_MFE_EVENT',
  event: 'mfe:custom',
  data: {
    customEvent: {
      name: 'mfe_communication_test',
      payload: {
        testType: 'bidirectional-communication',
        mfeVersion: '1.0.0',
        supportedFeatures: ['postMessage', 'dataBinding']
      }
    }
  }
}
```

## 📊 Dados Exibidos

A página de acesso restrito mostra automaticamente:

### 👤 Dados do Usuário
- Nome, Email, ID, Função

### 🔑 Permissões
- Lista de todas as permissões do usuário

### 🏪 Lojas Ativas
- Nome e código de cada loja

### 🔐 Status de Autenticação
- Se o usuário está logado ou não

### 🎨 Tema Atual
- Informações do tema ativo no VFX

## 🔍 Debug e Monitoramento

### Status da Comunicação
- ✅ **PostMessage funcionando**: Comunicação estabelecida
- 📡 **Dados recebidos**: Host enviou dados com sucesso
- 🌍 **Origin do host**: Domínio do VFX detectado

### Debug Detalhado
Clique em "🔽 Debug Info" para ver:
- Modo de execução (iframe vs module federation)
- Referer da página
- User Agent
- Timestamp de carregamento
- Status do listener PostMessage

### Último Evento Enviado
Mostra o JSON completo do último evento de teste enviado, útil para debug.

## 🚀 Implementação no VFX

### Exemplo Completo de Componente Vue 2

```vue
<template>
  <div class="mfe-container">
    <iframe 
      ref="mfeIframe"
      :src="mfeUrl"
      @load="onIframeLoad"
      width="100%" 
      height="600px"
      frameborder="0">
    </iframe>
  </div>
</template>

<script>
export default {
  name: 'AssistenteComprasIframe',
  data() {
    return {
      mfeUrl: 'https://varejo-assistente.vercel.app/iframe.html'
    }
  },
  mounted() {
    this.setupPostMessageListener()
  },
  methods: {
    setupPostMessageListener() {
      window.addEventListener('message', this.handleMfeMessage)
    },
    
    handleMfeMessage(event) {
      // Verificar origem por segurança
      if (!event.origin.includes('varejo-assistente')) return
      
      if (event.data.type === 'VFX_MFE_EVENT') {
        const { event: eventName, data } = event.data
        
        console.log(`📥 Evento recebido do MFE: ${eventName}`, data)
        
        switch (eventName) {
          case 'mfe:request-data':
            this.sendDataToMfe(event.source, event.origin)
            break
            
          case 'mfe:user-action':
            this.handleUserAction(data)
            break
            
          case 'mfe:navigation':
            this.handleNavigation(data)
            break
            
          case 'mfe:notification':
            this.showNotification(data.notification)
            break
            
          // ... outros casos
        }
      }
    },
    
    sendDataToMfe(source, origin) {
      const vfxData = {
        userData: this.$store.state.auth.currentUserData,
        userPermissions: this.$store.state.auth.currentUserData?.permissoes || [],
        userStores: this.$store.getters['auth/lojasDoUsuarioAtivas'],
        isLoggedIn: this.$store.getters['auth/loggedIn'],
        themeData: this.$store.getters['themes/temaAtual']
      }
      
      source.postMessage({
        type: 'VFX_HOST_EVENT',
        event: 'host:data-response',
        data: vfxData
      }, origin)
    },
    
    handleUserAction(actionData) {
      console.log('👤 Ação do usuário:', actionData)
      // Implementar lógica específica
    },
    
    handleNavigation(navData) {
      console.log('🧭 Navegação solicitada:', navData)
      // Implementar mudança de rota se necessário
    },
    
    showNotification(notification) {
      console.log('🔔 Notificação:', notification)
      // Usar sistema de notificações do VFX
    }
  },
  
  beforeDestroy() {
    window.removeEventListener('message', this.handleMfeMessage)
  }
}
</script>
```

## 🔒 Segurança

### Validação de Origem
Sempre valide a origem dos eventos PostMessage:

```javascript
const allowedOrigins = [
  'https://varejo-assistente.vercel.app',
  'http://localhost:3000' // Para desenvolvimento
]

window.addEventListener('message', (event) => {
  if (!allowedOrigins.some(origin => event.origin.includes(origin))) {
    console.warn('❌ Origem não autorizada:', event.origin)
    return
  }
  
  // Processar evento...
})
```

### Sanitização de Dados
Sempre valide os dados recebidos antes de usar:

```javascript
const validateUserData = (userData) => {
  return userData && 
         typeof userData.id !== 'undefined' &&
         typeof userData.nome === 'string'
}
```

## 📝 Logs e Troubleshooting

### Console do Navegador
O MFE emite logs detalhados no console:
- `📥 PostMessage recebido`
- `✅ Dados recebidos do host`
- `🧪 Enviando evento de teste`
- `⚠️ Timeout: Host não respondeu`

### Problemas Comuns

1. **Dados não chegam**: Verificar se o host está enviando na estrutura correta
2. **Origin blocked**: Adicionar domínio nas origens permitidas
3. **Eventos não recebidos**: Verificar se listener está configurado corretamente

## 🎯 Próximos Passos

1. Testar todos os tipos de eventos na página de acesso restrito
2. Implementar handlers específicos no VFX para cada tipo de evento
3. Adicionar validação e tratamento de erros
4. Configurar logs e monitoramento em produção
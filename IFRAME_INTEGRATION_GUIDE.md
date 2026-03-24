# 🌉 GUIA: MFE via IFRAME - Vue 2 Host + Vue 3 MFE

## 📋 **VISÃO GERAL**

O MFE Assistente de Compras agora suporta **2 modos de execução**:
- ✅ **Module Federation** (para hosts com Webpack 5)
- ✅ **Iframe** (para hosts Vue 2 sem Webpack 5)

---

## 🌉 **MODO IFRAME - Para VFX Vue 2**

### **URLs Disponíveis:**
```
🌐 App Principal: https://varejo-assistente.vercel.app
📡 Module Federation: https://varejo-assistente.vercel.app/remoteEntry.js
🌉 Iframe Version: https://varejo-assistente.vercel.app/iframe.html
```

### **Como Integrar no VFX Host:**

#### **1. Criar Componente Iframe no VFX:**
```vue
<!-- src/components/IframeMFE.vue -->
<template>
  <div class="iframe-mfe-container">
    <!-- Loading State -->
    <div v-if="loading" class="iframe-loading">
      <div class="spinner"></div>
      <p>Carregando {{ mfeName }}...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="iframe-error">
      <h3>⚠️ Erro ao carregar módulo</h3>
      <p>{{ error }}</p>
      <button @click="reload" class="retry-btn">Tentar Novamente</button>
    </div>
    
    <!-- Iframe -->
    <iframe
      v-else
      ref="mfeIframe"
      :src="iframeUrl"
      :title="mfeName"
      class="mfe-iframe"
      frameborder="0"
      scrolling="no"
      @load="onIframeLoad"
      @error="onIframeError"
    ></iframe>
  </div>
</template>

<script>
export default {
  name: 'IframeMFE',
  props: {
    mfeUrl: {
      type: String,
      required: true
    },
    mfeName: {
      type: String,
      default: 'Microfrontend'
    },
    userData: Object,
    userPermissions: Array,
    userStores: Array,
    isLoggedIn: Boolean,
    themeData: String
  },
  data() {
    return {
      loading: true,
      error: null,
      iframeReady: false
    }
  },
  computed: {
    iframeUrl() {
      return this.mfeUrl
    }
  },
  mounted() {
    this.setupPostMessageListener()
  },
  beforeDestroy() {
    this.removePostMessageListener()
  },
  methods: {
    setupPostMessageListener() {
      window.addEventListener('message', this.handlePostMessage)
    },
    
    removePostMessageListener() {
      window.removeEventListener('message', this.handlePostMessage)
    },
    
    handlePostMessage(event) {
      // Validar origem (em produção ser mais específico)
      if (!event.origin.includes('varejo-assistente')) return
      
      const { type, event: eventName, data } = event.data
      
      if (type === 'VFX_MFE_EVENT') {
        console.log(`📥 [MFE→HOST] ${eventName}:`, data)
        
        switch (eventName) {
          case 'mfe:ready':
            this.onMfeReady(data)
            break
            
          case 'mfe:resize':
            this.resizeIframe(data)
            break
            
          case 'mfe:request-data':
            this.sendDataToMfe(data)
            break
            
          case 'assistente:sugestao-gerada':
            this.handleSugestaoGerada(data)
            break
            
          case 'assistente:navigation-request':
            this.handleNavigationRequest(data)
            break
            
          case 'assistente:error-occurred':
            this.handleMfeError(data)
            break
            
          default:
            console.log('Evento MFE não tratado:', eventName, data)
        }
      }
    },
    
    onIframeLoad() {
      console.log('🌉 Iframe carregado')
      // Aguardar um pouco para o MFE inicializar
      setTimeout(() => {
        this.sendInitialData()
      }, 1000)
    },
    
    onIframeError(error) {
      console.error('❌ Erro no iframe:', error)
      this.error = 'Falha ao carregar o microfrontend'
      this.loading = false
    },
    
    onMfeReady(data) {
      console.log('✅ MFE pronto:', data)
      this.loading = false
      this.iframeReady = true
      this.error = null
      
      // Enviar dados iniciais novamente por garantia
      this.sendInitialData()
    },
    
    sendInitialData() {
      const data = {
        userData: this.userData || this.$store.state.auth.currentUserData,
        userPermissions: this.userPermissions || this.$store.state.auth.currentUserData?.permissoes || [],
        userStores: this.userStores || this.$store.getters['auth/lojasDoUsuarioAtivas'],
        isLoggedIn: this.isLoggedIn !== undefined ? this.isLoggedIn : this.$store.getters['auth/loggedIn'],
        themeData: this.themeData || this.$store.getters['themes/temaAtual']
      }
      
      this.sendMessageToMfe('host:data-response', data)
      console.log('📤 [HOST→MFE] Dados iniciais enviados:', data)
    },
    
    sendDataToMfe(requestData) {
      // MFE solicitou dados específicos
      const data = {}
      
      if (requestData.types.includes('userData')) {
        data.userData = this.$store.state.auth.currentUserData
      }
      if (requestData.types.includes('userPermissions')) {
        data.userPermissions = this.$store.state.auth.currentUserData?.permissoes || []
      }
      if (requestData.types.includes('userStores')) {
        data.userStores = this.$store.getters['auth/lojasDoUsuarioAtivas']
      }
      if (requestData.types.includes('isLoggedIn')) {
        data.isLoggedIn = this.$store.getters['auth/loggedIn']
      }
      if (requestData.types.includes('themeData')) {
        data.themeData = this.$store.getters['themes/temaAtual']
      }
      
      this.sendMessageToMfe('host:data-response', data)
      console.log('📤 [HOST→MFE] Dados solicitados enviados:', data)
    },
    
    sendMessageToMfe(eventName, data) {
      if (this.$refs.mfeIframe && this.$refs.mfeIframe.contentWindow) {
        this.$refs.mfeIframe.contentWindow.postMessage({
          type: 'VFX_HOST_EVENT',
          event: eventName,
          data,
          timestamp: Date.now()
        }, '*')
      }
    },
    
    resizeIframe(dimensions) {
      if (this.$refs.mfeIframe) {
        if (dimensions.height) {
          this.$refs.mfeIframe.style.height = typeof dimensions.height === 'number' 
            ? `${dimensions.height}px` 
            : dimensions.height
        }
        if (dimensions.width) {
          this.$refs.mfeIframe.style.width = typeof dimensions.width === 'number'
            ? `${dimensions.width}px`
            : dimensions.width
        }
      }
    },
    
    // 📥 HANDLERS DOS EVENTOS DO MFE
    handleSugestaoGerada(sugestao) {
      console.log('💡 Sugestão recebida do assistente:', sugestao)
      
      // Integrar com lógica do VFX
      this.$store.dispatch('assistente/addSugestao', sugestao)
      
      // Mostrar notificação
      this.$toastr.success(`Nova sugestão: ${sugestao.produto}`, 'Assistente de Compras')
    },
    
    handleNavigationRequest(request) {
      console.log('🧭 Navegação solicitada:', request)
      
      // Navegar no VFX
      this.$router.push(request.target)
    },
    
    handleMfeError(errorData) {
      console.error('🚨 Erro no MFE:', errorData)
      
      // Mostrar erro no VFX
      this.$toastr.error(`Erro no assistente: ${errorData.error}`, 'Assistente de Compras')
    },
    
    reload() {
      this.loading = true
      this.error = null
      this.iframeReady = false
      
      if (this.$refs.mfeIframe) {
        this.$refs.mfeIframe.src = this.iframeUrl
      }
    },
    
    // 📤 MÉTODOS PÚBLICOS PARA COMUNICAÇÃO COM MFE
    updateTheme(newTheme) {
      this.sendMessageToMfe('host:theme-changed', newTheme)
    },
    
    updateUser(userData) {
      this.sendMessageToMfe('host:user-updated', userData)
    },
    
    updateLanguage(language) {
      this.sendMessageToMfe('host:language-changed', language)
    }
  }
}
</script>

<style scoped>
.iframe-mfe-container {
  width: 100%;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.mfe-iframe {
  width: 100%;
  min-height: 600px;
  border: none;
  background: white;
  transition: height 0.3s ease;
}

.iframe-loading,
.iframe-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px;
  text-align: center;
}

.iframe-loading {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.iframe-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255,255,255,0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-btn {
  margin-top: 15px;
  padding: 10px 20px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.retry-btn:hover {
  background: #c82333;
}
</style>
```

#### **2. Usar no VFX Host:**
```vue
<!-- src/views/AssistenteCompras.vue -->
<template>
  <div class="assistente-page">
    <h1>Assistente de Compras</h1>
    
    <IframeMFE
      ref="assistenteMfe"
      mfe-url="https://varejo-assistente.vercel.app/iframe.html"
      mfe-name="Assistente de Compras"
      :user-data="$store.state.auth.currentUserData"
      :user-permissions="$store.state.auth.currentUserData?.permissoes"
      :user-stores="$store.getters['auth/lojasDoUsuarioAtivas']"
      :is-logged-in="$store.getters['auth/loggedIn']"
      :theme-data="$store.getters['themes/temaAtual']"
    />
  </div>
</template>

<script>
import IframeMFE from '@/components/IframeMFE.vue'

export default {
  name: 'AssistenteCompras',
  components: {
    IframeMFE
  },
  watch: {
    // Reagir a mudanças no tema
    '$store.getters.themes.temaAtual'(newTheme) {
      if (this.$refs.assistenteMfe) {
        this.$refs.assistenteMfe.updateTheme(newTheme)
      }
    },
    
    // Reagir a mudanças no usuário
    '$store.state.auth.currentUserData': {
      handler(newUserData) {
        if (this.$refs.assistenteMfe) {
          this.$refs.assistenteMfe.updateUser(newUserData)
        }
      },
      deep: true
    }
  }
}
</script>
```

#### **3. Adicionar Rota no VFX:**
```javascript
// src/router/index.js
{
  path: '/assistente-compras',
  name: 'AssistenteCompras',
  component: () => import('@/views/AssistenteCompras.vue'),
  meta: {
    requiresAuth: true,
    title: 'Assistente de Compras'
  }
}
```

---

## ✅ **VANTAGENS DO MODO IFRAME**

### **✅ Para o VFX Vue 2:**
- **Sem Webpack 5** necessário
- **Sem Module Federation** config
- **Isolamento completo** entre host e MFE
- **Deploy independente** sem quebrar host
- **Comunicação via postMessage** (padrão web)

### **✅ Para Desenvolvimento:**
- **Debug fácil** - cada MFE em sua própria aba
- **Hot reload** independente
- **Error boundaries** naturais
- **Versionamento isolado**

---

## 🔬 **TESTING & DEBUG**

### **Console do VFX Host:**
```javascript
// Testar comunicação
document.querySelector('iframe').contentWindow.postMessage({
  type: 'VFX_HOST_EVENT',
  event: 'host:theme-changed',
  data: 'green'
}, '*')

// Escutar eventos do MFE
window.addEventListener('message', (event) => {
  if (event.data.type === 'VFX_MFE_EVENT') {
    console.log('Evento do MFE:', event.data)
  }
})
```

### **URLs de Teste:**
```
🌉 Iframe direto: https://varejo-assistente.vercel.app/iframe.html
🔌 Module Federation: https://varejo-assistente.vercel.app
```

---

## 🎯 **PRÓXIMOS PASSOS**

1. **Implementar** IframeMFE component no VFX
2. **Adicionar** rota /assistente-compras  
3. **Testar** comunicação postMessage
4. **Integrar** com store do VFX
5. **Validar** todos os eventos funcionando

**🎉 RESULTADO: MFE funcionando perfeitamente em VFX Vue 2 via iframe!**
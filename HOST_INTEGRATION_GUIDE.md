# 🎯 GUIA COMPLETO: Como Integrar o MFE Assistente de Compras no VFX Host

## 📋 **INFORMAÇÕES DO MICROFRONTEND**

### **URLs de Produção:**
```
🌐 App: https://varejo-assistente.vercel.app
📡 Remote Entry: https://varejo-assistente.vercel.app/remoteEntry.js
🔌 Container Name: assistente_compras
📦 Module Export: ./AssistenteCompras
```

### **Props Esperadas:**
```javascript
{
  userData: store.state.auth.currentUserData,      // Dados do usuário logado
  themeData: store.getters['themes/temaAtual'],    // Tema atual (blue, green, etc)
  eventBus: this.$eventBus                         // EventBus para comunicação
}
```

---

## 🛠️ **PASSO 1: Configurar Module Federation no VFX Host**

### **A. Atualizar `vue.config.js` do VFX:**
```javascript
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin')

module.exports = {
  // ... configurações existentes
  
  configureWebpack: {
    plugins: [
      // ... plugins existentes
      
      new ModuleFederationPlugin({
        name: 'vfx_host',
        remotes: {
          assistenteCompras: 'assistente_compras@https://varejo-assistente.vercel.app/remoteEntry.js'
        },
        shared: {
          vue: {
            singleton: true,
            requiredVersion: '^2.6.0'  // Versão do VFX
          }
        }
      })
    ]
  }
}
```

### **B. OU se usar webpack.config.js diretamente:**
```javascript
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin')

module.exports = {
  // ... configurações existentes
  
  plugins: [
    new ModuleFederationPlugin({
      name: 'vfx_host',
      remotes: {
        assistenteCompras: 'assistente_compras@https://varejo-assistente.vercel.app/remoteEntry.js'
      }
    })
  ]
}
```

---

## 🎯 **PASSO 2: Criar Container Component no VFX**

### **Criar: `src/components/MicrofrontendContainer.vue`**
```vue
<template>
  <div class="microfrontend-container">
    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="loader"></div>
      <p>Carregando Assistente de Compras...</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <h3>⚠️ Erro ao carregar módulo</h3>
      <p>{{ error }}</p>
      <button @click="retry" class="retry-btn">Tentar Novamente</button>
    </div>
    
    <!-- MFE mount point -->
    <div 
      v-else
      ref="mfeContainer" 
      class="mfe-mount-point"
    ></div>
  </div>
</template>

<script>
export default {
  name: 'MicrofrontendContainer',
  props: {
    userData: Object,
    themeData: String,
    eventBus: Object
  },
  data() {
    return {
      loading: true,
      error: null,
      mfeInstance: null
    }
  },
  async mounted() {
    await this.loadMicrofrontend()
  },
  beforeDestroy() {
    this.unmountMicrofrontend()
  },
  methods: {
    async loadMicrofrontend() {
      try {
        this.loading = true
        this.error = null
        
        console.log('🚀 Carregando MFE Assistente de Compras...')
        
        // Import dinâmico do microfrontend
        const container = await import('assistenteCompras/AssistenteCompras')
        
        console.log('✅ Container carregado:', container)
        
        // Montar MFE no elemento
        this.mfeInstance = await container.mount(this.$refs.mfeContainer, {
          userData: this.userData,
          themeData: this.themeData,
          eventBus: this.eventBus
        })
        
        console.log('✅ MFE montado com sucesso!')
        this.loading = false
        
      } catch (error) {
        console.error('❌ Erro ao carregar MFE:', error)
        this.error = error.message || 'Falha ao carregar o microfrontend'
        this.loading = false
      }
    },
    
    unmountMicrofrontend() {
      if (this.mfeInstance && this.mfeInstance.unmount) {
        console.log('🧹 Desmontando MFE...')
        this.mfeInstance.unmount()
        this.mfeInstance = null
      }
    },
    
    async retry() {
      this.unmountMicrofrontend()
      await this.loadMicrofrontend()
    }
  }
}
</script>

<style scoped>
.microfrontend-container {
  width: 100%;
  min-height: 400px;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px;
}

.loader {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  color: #dc3545;
  text-align: center;
}

.retry-btn {
  margin-top: 15px;
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.retry-btn:hover {
  background: #0056b3;
}

.mfe-mount-point {
  width: 100%;
  min-height: 400px;
}
</style>
```

---

## 🗺️ **PASSO 3: Adicionar Rota no VFX**

### **Atualizar `src/router/routes.js` (ou arquivo de rotas):**
```javascript
// Importar o container
import MicrofrontendContainer from '@/components/MicrofrontendContainer.vue'

export default [
  // ... rotas existentes
  
  {
    path: '/assistente-compras',
    name: 'AssistenteCompras',
    component: MicrofrontendContainer,
    meta: {
      requiresAuth: true,
      title: 'Assistente de Compras'
    },
    props: (route) => ({
      userData: store.state.auth.currentUserData,
      themeData: store.getters['themes/temaAtual'],
      eventBus: Vue.prototype.$eventBus || new Vue()
    })
  }
]
```

---

## 🔧 **PASSO 4: Configurar EventBus (se não existir)**

### **Criar/Atualizar `src/plugins/eventBus.js`:**
```javascript
import Vue from 'vue'

// EventBus global para comunicação com MFEs
const EventBus = new Vue({
  methods: {
    // Método para MFEs emitirem eventos para o host
    emitToHost(event, data) {
      console.log(`[MFE→HOST] ${event}:`, data)
      this.$emit(`host:${event}`, data)
    },
    
    // Método para host emitir eventos para MFEs
    emitToMFE(event, data) {
      console.log(`[HOST→MFE] ${event}:`, data)
      this.$emit(`mfe:${event}`, data)
    }
  }
})

// Disponibilizar globalmente
Vue.prototype.$eventBus = EventBus

export default EventBus
```

### **Registrar no `main.js` do VFX:**
```javascript
import './plugins/eventBus'
```

---

## 🧪 **PASSO 5: Testar a Integração**

### **A. Verificar no Console do Browser:**
```javascript
// 1. Testar se o remoteEntry foi carregado
console.log(window.assistente_compras)  // Deve retornar objeto

// 2. Testar import manual
import('assistenteCompras/AssistenteCompras').then(console.log)

// 3. Verificar mount function
const container = await import('assistenteCompras/AssistenteCompras')
console.log(typeof container.mount)  // Deve ser 'function'
```

### **B. Logs Esperados:**
```
🚀 Carregando MFE Assistente de Compras...
✅ Container carregado: {mount: ƒ, getAssistenteCompras: ƒ}
🔌 Mount chamado pelo Host VFX
   - Element: <div class="mfe-mount-point">...</div>
   - Props: {userData: {...}, themeData: "blue", eventBus: {...}}
✅ MFE montado com sucesso no host!
✅ Assistente de Compras carregado com sucesso!
```

---

## 🎯 **PASSO 6: Navegação e Menu**

### **Adicionar item no menu principal:**
```javascript
// src/components/Navigation.vue ou similar
{
  name: 'Assistente de Compras',
  path: '/assistente-compras',
  icon: 'shopping-cart',
  permissions: ['assistente.read']
}
```

---

## 🚨 **TROUBLESHOOTING**

### **Erro comum 1: "Module does not exist"**
```javascript
// ✅ Verificar se remoteEntry está acessível
curl -I https://varejo-assistente.vercel.app/remoteEntry.js

// ✅ Verificar nome do remote no webpack config
remotes: {
  assistenteCompras: 'assistente_compras@https://varejo-assistente.vercel.app/remoteEntry.js'
  //    ↑ nome usado      ↑ nome do container                ↑ URL correta
}
```

### **Erro comum 2: CORS**
```javascript
// Headers esperados no Response:
Access-Control-Allow-Origin: *
Content-Type: application/javascript
```

### **Erro comum 3: "mount is not a function"**
```javascript
// Verificar se o módulo exporta mount
const container = await import('assistenteCompras/AssistenteCompras')
console.log(container)  // Deve ter: {mount: function, ...}
```

---

## ✅ **CHECKLIST FINAL**

- [ ] Module Federation configurado no webpack
- [ ] Remote URL correto (`https://varejo-assistente.vercel.app/remoteEntry.js`)
- [ ] Container component criado
- [ ] Rota `/assistente-compras` adicionada
- [ ] EventBus configurado
- [ ] Props mapeadas corretamente
- [ ] Menu atualizado
- [ ] Testes de carregamento funcionando

## 🎉 **RESULTADO FINAL**

Após seguir estes passos:

1. **Usuário acessa** `/assistente-compras`
2. **VFX carrega** o remoteEntry.js 
3. **MFE monta** dinamicamente na página
4. **Estado compartilhado** funciona (user, theme)
5. **Comunicação bidirecional** via EventBus
6. **Performance otimizada** (lazy loading)
7. **Deploy independente** do MFE

**MICROFRONTEND TOTALMENTE INTEGRADO! 🚀**
# 🏗️ ARQUITETURA MFE HOST - Vue 2 + Module Federation

## 📋 **VISÃO GERAL**

Esta arquitetura permite que uma aplicação **Vue 2 Host** consuma **microfrontends Vue 3** sem instalar Vue 3 no projeto host, mantendo compatibilidade e simplicidade.

### **Princípios da Arquitetura:**
- ✅ **Zero Breaking Changes** no host existente
- ✅ **Lazy Loading** automático dos MFEs
- ✅ **Isolamento completo** entre host e MFEs
- ✅ **Comunicação padronizada** via EventBus
- ✅ **Deploy independente** de cada MFE
- ✅ **Fallbacks** para cenários de erro

---

## 🎯 **ESTRUTURA DO HOST VFX**

```
vfx-host/
├── src/
│   ├── mfe/                    # 🆕 Pasta para MFEs
│   │   ├── MfeContainer.vue    # Container base
│   │   ├── MfeRegistry.js      # Registro dos MFEs
│   │   └── EventBusManager.js  # Gerenciador de comunicação
│   ├── components/
│   ├── views/
│   ├── router/
│   └── store/
├── webpack.config.js           # 🔧 Configuração MF
└── package.json
```

---

## 🔧 **PASSO 1: Configurar Module Federation**

### **webpack.config.js (ou vue.config.js):**
```javascript
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin')

module.exports = {
  // ... configurações existentes do VFX
  
  configureWebpack: {
    plugins: [
      new ModuleFederationPlugin({
        name: 'vfx_host',
        remotes: {
          // MFEs registrados dinamicamente
        },
        shared: {
          // ⚠️ NÃO incluir Vue 3 aqui - deixar isolado nos MFEs
          'vue': {
            singleton: false,  // Permitir múltiplas versões
            requiredVersion: '^2.6.0'
          }
        }
      })
    ]
  }
}
```

---

## 📡 **PASSO 2: Registry de MFEs**

### **src/mfe/MfeRegistry.js:**
```javascript
/**
 * 🗂️ REGISTRO CENTRALIZADO DOS MFEs
 * Adicionar novos MFEs aqui sem tocar no código host
 */
export const MFE_REGISTRY = {
  assistente_compras: {
    url: 'https://varejo-assistente.vercel.app/remoteEntry.js',
    scope: 'assistente_compras',
    module: './AssistenteCompras',
    displayName: 'Assistente de Compras',
    permissions: ['assistente.read'],
    routes: ['/assistente-compras'],
    icon: 'shopping-cart',
    category: 'vendas'
  },
  
  // 🆕 Futuros MFEs - apenas adicionar aqui:
  relatorios_avancados: {
    url: 'https://relatorios-mfe.vercel.app/remoteEntry.js',
    scope: 'relatorios_mfe',
    module: './RelatoriosAvancados',
    displayName: 'Relatórios Avançados',
    permissions: ['relatorios.read'],
    routes: ['/relatorios-avancados'],
    icon: 'chart-bar',
    category: 'analytics'
  }
}

/**
 * 🔍 UTILITÁRIOS DO REGISTRY
 */
export class MfeRegistry {
  static get(mfeId) {
    return MFE_REGISTRY[mfeId]
  }
  
  static getByRoute(route) {
    return Object.values(MFE_REGISTRY)
      .find(mfe => mfe.routes.includes(route))
  }
  
  static getAllByCategory(category) {
    return Object.values(MFE_REGISTRY)
      .filter(mfe => mfe.category === category)
  }
  
  static hasPermission(mfeId, userPermissions) {
    const mfe = this.get(mfeId)
    return mfe?.permissions.some(perm => userPermissions.includes(perm))
  }
}
```

---

## 🎛️ **PASSO 3: EventBus Manager**

### **src/mfe/EventBusManager.js:**
```javascript
import Vue from 'vue'

/**
 * 🎯 GERENCIADOR DE COMUNICAÇÃO HOST ↔ MFE
 * Padrão Observer para comunicação bidirecional
 */
class EventBusManager {
  constructor() {
    this.bus = new Vue()
    this.mfeInstances = new Map()
    this.setupGlobalHandlers()
  }
  
  /**
   * 📝 REGISTRAR MFE
   */
  registerMfe(mfeId, instance) {
    this.mfeInstances.set(mfeId, instance)
    console.log(`🔌 MFE registrado: ${mfeId}`)
  }
  
  /**
   * 🔌 DESREGISTRAR MFE  
   */
  unregisterMfe(mfeId) {
    this.mfeInstances.delete(mfeId)
    console.log(`🔌 MFE removido: ${mfeId}`)
  }
  
  /**
   * 📤 HOST → MFE
   */
  emitToMfe(mfeId, event, data) {
    const eventName = `mfe:${mfeId}:${event}`
    this.bus.$emit(eventName, data)
    console.log(`[HOST→MFE] ${eventName}:`, data)
  }
  
  /**
   * 📤 HOST → TODOS MFEs
   */
  broadcast(event, data) {
    this.mfeInstances.forEach((instance, mfeId) => {
      this.emitToMfe(mfeId, event, data)
    })
  }
  
  /**
   * 📥 MFE → HOST
   */
  onMfeEvent(mfeId, event, handler) {
    const eventName = `host:${mfeId}:${event}`
    this.bus.$on(eventName, handler)
  }
  
  /**
   * ⚙️ HANDLERS GLOBAIS
   */
  setupGlobalHandlers() {
    // Tema alterado no host
    this.bus.$on('host:theme-changed', (theme) => {
      this.broadcast('theme-changed', theme)
    })
    
    // Usuário alterado no host  
    this.bus.$on('host:user-updated', (userData) => {
      this.broadcast('user-updated', userData)
    })
    
    // Idioma alterado no host
    this.bus.$on('host:language-changed', (language) => {
      this.broadcast('language-changed', language)
    })
  }
  
  /**
   * 🎯 INTERFACE PARA MFEs
   */
  createMfeEventBus(mfeId) {
    return {
      // MFE emite para host
      emit: (event, data) => {
        const eventName = `host:${mfeId}:${event}`
        this.bus.$emit(eventName, data)
        console.log(`[MFE→HOST] ${eventName}:`, data)
      },
      
      // MFE ouve eventos do host
      on: (event, handler) => {
        const eventName = `mfe:${mfeId}:${event}`
        this.bus.$on(eventName, handler)
      },
      
      // MFE remove listener
      off: (event, handler) => {
        const eventName = `mfe:${mfeId}:${event}`
        this.bus.$off(eventName, handler)
      }
    }
  }
}

// Instância global
export const eventBusManager = new EventBusManager()

// Plugin para Vue
export default {
  install(Vue) {
    Vue.prototype.$mfeBus = eventBusManager
  }
}
```

---

## 🎪 **PASSO 4: Container Universal**

### **src/mfe/MfeContainer.vue:**
```vue
<template>
  <div class="mfe-container">
    <!-- Loading State -->
    <div v-if="loading" class="mfe-loading">
      <div class="spinner"></div>
      <p>Carregando {{ mfeConfig.displayName }}...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="mfe-error">
      <div class="error-icon">⚠️</div>
      <h3>Falha ao carregar módulo</h3>
      <p>{{ error }}</p>
      <div class="error-actions">
        <button @click="retry" class="btn-retry">Tentar Novamente</button>
        <button @click="goBack" class="btn-back">Voltar</button>
      </div>
    </div>
    
    <!-- MFE Mount Point -->
    <div 
      v-else
      ref="mfeMount" 
      class="mfe-content"
      :data-mfe="mfeId"
    ></div>
  </div>
</template>

<script>
import { MfeRegistry } from './MfeRegistry'
import { eventBusManager } from './EventBusManager'

export default {
  name: 'MfeContainer',
  props: {
    mfeId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      loading: true,
      error: null,
      mfeInstance: null,
      mfeConfig: null
    }
  },
  
  async mounted() {
    this.mfeConfig = MfeRegistry.get(this.mfeId)
    
    if (!this.mfeConfig) {
      this.error = `MFE '${this.mfeId}' não encontrado no registry`
      this.loading = false
      return
    }
    
    await this.loadMfe()
  },
  
  beforeDestroy() {
    this.unmountMfe()
  },
  
  methods: {
    async loadMfe() {
      try {
        this.loading = true
        this.error = null
        
        console.log(`🚀 Carregando MFE: ${this.mfeId}`)
        
        // Carregamento dinâmico via webpack
        await this.loadRemoteContainer()
        
        // Import do módulo
        const moduleKey = `${this.mfeConfig.scope}${this.mfeConfig.module}`
        const container = await import(moduleKey)
        
        // Mount com props do VFX
        this.mfeInstance = await container.mount(this.$refs.mfeMount, {
          userData: this.$store.state.auth.currentUserData,
          themeData: this.$store.getters['themes/temaAtual'],
          eventBus: eventBusManager.createMfeEventBus(this.mfeId),
          mode: process.env.NODE_ENV,
          language: this.$store.state.app.language || 'pt-BR'
        })
        
        // Registrar no EventBus manager
        eventBusManager.registerMfe(this.mfeId, this.mfeInstance)
        
        console.log(`✅ MFE ${this.mfeId} carregado com sucesso!`)
        this.loading = false
        
      } catch (error) {
        console.error(`❌ Erro ao carregar MFE ${this.mfeId}:`, error)
        this.error = error.message || 'Falha ao carregar microfrontend'
        this.loading = false
      }
    },
    
    async loadRemoteContainer() {
      // Injetar script do remoteEntry se necessário
      return new Promise((resolve, reject) => {
        const existingScript = document.getElementById(`mfe-${this.mfeId}`)
        if (existingScript) {
          resolve()
          return
        }
        
        const script = document.createElement('script')
        script.id = `mfe-${this.mfeId}`
        script.src = this.mfeConfig.url
        script.onload = resolve
        script.onerror = () => reject(new Error(`Falha ao carregar ${this.mfeConfig.url}`))
        document.head.appendChild(script)
      })
    },
    
    unmountMfe() {
      if (this.mfeInstance?.unmount) {
        console.log(`🧹 Desmontando MFE: ${this.mfeId}`)
        this.mfeInstance.unmount()
        eventBusManager.unregisterMfe(this.mfeId)
        this.mfeInstance = null
      }
    },
    
    async retry() {
      this.unmountMfe()
      await this.loadMfe()
    },
    
    goBack() {
      this.$router.go(-1)
    }
  }
}
</script>

<style scoped>
.mfe-container {
  width: 100%;
  min-height: 400px;
}

.mfe-loading, .mfe-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color, #007bff);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.mfe-error {
  color: #dc3545;
  text-align: center;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}

.btn-retry, .btn-back {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-retry {
  background: var(--primary-color, #007bff);
  color: white;
}

.btn-back {
  background: #6c757d;
  color: white;
}

.mfe-content {
  width: 100%;
  min-height: 400px;
}
</style>
```

---

## 🗺️ **PASSO 5: Configurar Rotas**

### **src/router/mfeRoutes.js:**
```javascript
import { MfeRegistry } from '@/mfe/MfeRegistry'
import MfeContainer from '@/mfe/MfeContainer.vue'

/**
 * 🗺️ GERADOR AUTOMÁTICO DE ROTAS MFE
 */
export function generateMfeRoutes() {
  const routes = []
  
  Object.entries(MFE_REGISTRY).forEach(([mfeId, config]) => {
    config.routes.forEach(route => {
      routes.push({
        path: route,
        name: `mfe-${mfeId}`,
        component: MfeContainer,
        props: { mfeId },
        meta: {
          title: config.displayName,
          requiresAuth: true,
          permissions: config.permissions,
          isMfe: true
        }
      })
    })
  })
  
  return routes
}
```

### **Atualizar router principal:**
```javascript
// src/router/index.js
import { generateMfeRoutes } from './mfeRoutes'

const routes = [
  // ... rotas existentes do VFX
  
  // 🆕 Rotas automáticas dos MFEs
  ...generateMfeRoutes()
]
```

---

## 📦 **PASSO 6: Inicialização no main.js**

### **src/main.js:**
```javascript
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// 🆕 Importar gerenciadores MFE
import EventBusManagerPlugin from './mfe/EventBusManager'

// Registrar plugin
Vue.use(EventBusManagerPlugin)

// 🎯 GLOBAL ERROR HANDLER para MFEs
Vue.config.errorHandler = (err, vm, info) => {
  if (info.includes('mfe') || err.message.includes('remote')) {
    console.error('🚨 Erro em MFE:', err)
    // Opcional: enviar telemetria
  } else {
    console.error('🚨 Erro na aplicação:', err)
  }
}

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
```

---

## 🧪 **PASSO 7: Integração com Menu**

### **Atualizar componente de menu:**
```javascript
// src/components/Navigation.vue
import { MfeRegistry } from '@/mfe/MfeRegistry'

export default {
  computed: {
    menuItems() {
      const staticItems = [
        // ... itens estáticos existentes
      ]
      
      // 🆕 Itens dinâmicos dos MFEs
      const mfeItems = Object.values(MFE_REGISTRY)
        .filter(mfe => MfeRegistry.hasPermission(mfe.id, this.userPermissions))
        .map(mfe => ({
          name: mfe.displayName,
          path: mfe.routes[0],
          icon: mfe.icon,
          category: mfe.category
        }))
      
      return [...staticItems, ...mfeItems]
    }
  }
}
```

---

## ⚡ **BENEFÍCIOS DA ARQUITETURA**

### **✅ Para Desenvolvedores:**
- **Zero configuração** para novos MFEs - só adicionar no registry
- **Debugging fácil** com logs padronizados  
- **Hot reload** independente por MFE
- **Rollback rápido** via deploy independente

### **✅ Para Performance:**
- **Lazy loading** automático
- **Cache compartilhado** do webpack
- **Bundle splitting** otimizado
- **Error boundaries** por MFE

### **✅ Para Manutenção:**
- **Deploys independentes** sem afetar host
- **Versionamento isolado** por MFE
- **Rollback granular** por funcionalidade
- **A/B testing** por MFE

---

## 🔬 **TESTES E VALIDAÇÃO**

### **Console Debug:**
```javascript
// Verificar registry
console.log('MFEs disponíveis:', window.__MFE_REGISTRY__)

// Testar carregamento
import('assistenteCompras/AssistenteCompras').then(console.log)

// Verificar comunicação
window.__MFE_EVENT_BUS__.broadcast('test', {message: 'Hello MFEs!'})
```

### **Health Check:**
```javascript
// src/utils/mfeHealthCheck.js
export async function checkMfeHealth(mfeId) {
  const config = MfeRegistry.get(mfeId)
  
  try {
    const response = await fetch(config.url, { method: 'HEAD' })
    return {
      mfeId,
      status: response.ok ? 'healthy' : 'unhealthy',
      latency: performance.now()
    }
  } catch (error) {
    return { mfeId, status: 'error', error: error.message }
  }
}
```

---

## 🚀 **ESCALABILIDADE**

### **Adicionar Novo MFE:**
1. **Deploy** do MFE em sua URL
2. **Adicionar** entrada no `MfeRegistry.js`  
3. **Deploy** do host (apenas config)
4. **✅ Pronto!** - Rota e menu automáticos

### **Exemplo - Novo MFE:**
```javascript
// Só adicionar no MfeRegistry.js:
nova_funcionalidade: {
  url: 'https://nova-funcionalidade.vercel.app/remoteEntry.js',
  scope: 'nova_funcionalidade_mfe',
  module: './NovaFuncionalidade',
  displayName: 'Nova Funcionalidade',
  permissions: ['nova.read'],
  routes: ['/nova-funcionalidade'],
  icon: 'star',
  category: 'utilitarios'
}
```

---

## 📈 **PRÓXIMOS PASSOS**

1. **Implementar** EventBusManager no VFX host
2. **Criar** MfeRegistry com assistente_compras
3. **Adicionar** MfeContainer genérico  
4. **Configurar** Module Federation
5. **Testar** carregamento do primeiro MFE
6. **Documentar** para próximos devs

**🎯 RESULTADO: Arquitetura MFE simples, escalável e manutenível!**
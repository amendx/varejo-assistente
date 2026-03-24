/**
 * 🌉 ENTRADA ESPECÍFICA PARA IFRAME
 * 
 * Este arquivo serve como ponto de entrada quando o MFE é carregado via iframe
 * Configura automaticamente o bridge de comunicação e monta o componente
 */

import { createApp } from 'vue'
import AssistenteCompras from './AssistenteCompras.vue'
import { iframeBridge } from './iframe-bridge.js'

console.log('🌉 Inicializando MFE Assistente de Compras em modo iframe...')

// Criar instância Vue 3
const app = createApp(AssistenteCompras)

// Configurar propriedades globais do iframe
app.config.globalProperties.$iframeBridge = iframeBridge
app.config.globalProperties.$isIframe = true

// Montar no DOM
app.mount('#app')

// Notificar ao bridge que a aplicação está montada
iframeBridge.ready({
  name: 'assistente-compras',
  version: '1.0.0',
  framework: 'vue3',
  mounted: true,
  timestamp: new Date().toISOString()
})

console.log('✅ MFE Assistente de Compras carregado com sucesso em modo iframe!')

// Exportar para possível uso externo
window.__ASSISTENTE_COMPRAS_IFRAME__ = {
  app,
  bridge: iframeBridge,
  version: '1.0.0'
}
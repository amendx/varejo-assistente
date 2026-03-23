// main.js - Para desenvolvimento standalone apenas
// NÃO usar em produção - usa o bootstrap.js

import { createApp } from 'vue'
import AssistenteCompras from './AssistenteCompras.vue'

// Dados mock para desenvolvimento
const mockProps = {
  userData: {
    nome: 'Dev User',
    email: 'dev@varejofacil.com',
    permissoes: ['vendas', 'estoque']
  },
  themeData: 'blue',
  eventBus: {
    emit: (event, data) => console.log(`[Dev EventBus] Emit: ${event}`, data),
    on: (event, callback) => console.log(`[Dev EventBus] Listen: ${event}`)
  }
}

// Criar e montar aplicação
const app = createApp(AssistenteCompras, mockProps)
app.mount('#app')

console.log('🟢 Modo desenvolvimento standalone ativo')
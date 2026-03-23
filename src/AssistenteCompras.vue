<template>
  <!-- Verificar se está sendo acessado via VFX -->
  <ForbiddenPage v-if="!isAuthorizedAccess" />
  
  <!-- Conteúdo principal (só exibe se autorizado) -->
  <div v-else class="assistente-compras">
    <div class="header">
      <h2>🛒 Assistente de Compras</h2>
      <div class="badges">
        <span class="mfe-badge">Microfrontend</span>
        <span class="auth-badge">✅ Autorizado</span>
      </div>
    </div>

    <div class="user-info">
      <h3>👤 Dados do VFX</h3>
      <p><strong>Usuário:</strong> {{ userData?.nome || 'Carregando...' }}</p>
      <p><strong>Tema:</strong> {{ themeData || 'blue' }}</p>
      <p><strong>Status:</strong> {{ userData ? '✅ Conectado ao VFX' : '❌ Modo standalone' }}</p>
    </div>

    <div class="actions">
      <h3>🎯 Ações</h3>
      <div class="action-buttons">
        <button @click="gerarSugestao" class="btn-primary">
          🔍 Gerar Sugestão de Compra
        </button>
        <button @click="enviarPedido" class="btn-success">
          📦 Enviar Pedido ao VFX
        </button>
      </div>
    </div>

    <div v-if="ultimaAcao" class="resultado">
      <h3>📋 Última Ação</h3>
      <p>{{ ultimaAcao }}</p>
    </div>
    
    <!-- Debug info para desenvolvimento -->
    <div v-if="isDevelopment" class="debug-panel">
      <h4>🐛 Debug (Dev Mode)</h4>
      <p><strong>Event Bus:</strong> {{ !!eventBus ? '✅' : '❌' }}</p>
      <p><strong>Props:</strong> userData={{ !!userData }}, theme={{ !!themeData }}</p>
      <p><strong>Referer:</strong> {{ referrerUrl }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import ForbiddenPage from './ForbiddenPage.vue'

// Props que podem vir do VFX Host
const props = defineProps({
  userData: Object,
  themeData: String,
  eventBus: Object,
  mode: {
    type: String,
    default: 'production'
  },
  language: {
    type: String,
    default: 'pt-BR'
  }
})

// Estados locais
const ultimaAcao = ref('')
const isDevelopment = ref(process.env.NODE_ENV === 'development')

// Verificação de acesso autorizado
const isAuthorizedAccess = computed(() => {
  // Em desenvolvimento, sempre permitir acesso se tiver dados mock
  if (isDevelopment.value && props.userData) {
    return true
  }
  
  // Verificações para produção:
  // 1. Se tem eventBus (passado pelo VFX)
  // 2. Se tem userData ou themeData (dados do VFX)  
  // 3. Se tem flag global do VFX
  // 4. Se o referer vem do VFX
  const hasEventBus = !!props.eventBus && props.eventBus.emit
  const hasVFXData = !!(props.userData?.nome || props.themeData)
  const hasVFXFlag = !!(window.__POWERED_BY_VFX__ || window.vfxMFEEventBus)
  
  // Verificação segura do document.referrer
  let hasValidReferer = false
  try {
    const referrer = typeof document !== 'undefined' ? document.referrer || '' : ''
    hasValidReferer = referrer && (
      referrer.includes('localhost:3000') || 
      referrer.includes('varejofacil.com') ||
      referrer.includes('vfx') ||
      referrer.includes('127.0.0.1:3000')
    )
  } catch (error) {
    console.warn('Erro ao acessar document.referrer:', error)
    hasValidReferer = false
  }
  
  const isAuthorized = hasEventBus || hasVFXData || hasVFXFlag || hasValidReferer
  
  console.log('🔍 Verificação de Acesso:', {
    isDevelopment: isDevelopment.value,
    hasEventBus,
    hasVFXData,
    hasVFXFlag, 
    hasValidReferer,
    referer: typeof document !== 'undefined' ? document.referrer : 'N/A',
    isAuthorized
  })
  
  return isAuthorized
})

// Computed para acessar referrer de forma segura
const referrerUrl = computed(() => {
  try {
    return typeof document !== 'undefined' ? (document.referrer || 'Direct Access') : 'N/A'
  } catch (error) {
    console.warn('Erro ao acessar document.referrer:', error)
    return 'Error accessing referrer'
  }
})

// Funções de ação
const gerarSugestao = () => {
  const sugestao = {
    produto: 'Notebook Dell',
    preco: 2500.00,
    desconto: 10,
    timestamp: new Date().toLocaleString()
  }
  
  ultimaAcao.value = `Sugestão gerada: ${sugestao.produto} - R$ ${sugestao.preco}`
  
  // 🔄 Comunicar com host VFX se EventBus disponível
  if (props.eventBus && props.eventBus.emit) {
    props.eventBus.emit('purchase-completed', {
      orderId: Date.now(),
      amount: sugestao.preco,
      products: [sugestao.produto],
      discount: sugestao.desconto,
      timestamp: sugestao.timestamp
    })
    console.log('📡 [MFE→HOST] purchase-completed enviado')
  }
}

const atualizarDados = () => {
  ultimaAcao.value = `Dados atualizados em ${new Date().toLocaleString()}`
  
  // 🔄 Solicitar navegação ao host se necessário
  if (props.eventBus && props.eventBus.emit) {
    props.eventBus.emit('navigation-request', {
      target: '/vendas',
      reason: 'Dados atualizados, redirecionar para vendas'
    })
    console.log('📡 [MFE→HOST] navigation-request enviado')
  }
}

const reportError = (errorMessage) => {
  console.error('❌ Erro no MFE:', errorMessage)
  
  // 🔄 Reportar erro para o host
  if (props.eventBus && props.eventBus.emit) {
    props.eventBus.emit('error-occurred', {
      source: 'assistente-compras',
      error: errorMessage,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    })
    console.log('📡 [MFE→HOST] error-occurred enviado')
  }
}

// 🎨 Handler para mudança de tema do host
const handleThemeChange = (newTheme) => {
  console.log('🎨 Host mudou tema para:', newTheme)
  // Aplicar novo tema no componente
  ultimaAcao.value = `Tema alterado para: ${newTheme}`
}

// 👤 Handler para atualização de usuário do host
const handleUserUpdated = (userData) => {
  console.log('👤 Host atualizou usuário:', userData)
  ultimaAcao.value = `Usuário atualizado: ${userData?.name || 'N/A'}`
}

// 🌐 Handler para mudança de idioma
const handleLanguageChanged = (language) => {
  console.log('🌐 Host mudou idioma para:', language)
  ultimaAcao.value = `Idioma alterado para: ${language}`
}

const enviarPedido = () => {
  const pedido = {
    id: Math.random().toString(36).substr(2, 9),
    produto: 'Notebook Dell',
    quantidade: 1,
    valor: 2250.00, // com desconto
    usuario: props.userData?.nome || 'Usuario Demo',
    timestamp: new Date().toLocaleString()
  }
  
  ultimaAcao.value = `Pedido enviado: ${pedido.id} - R$ ${pedido.valor}`
  
  // Enviar para VFX se disponível
  if (props.eventBus) {
    props.eventBus.emit('assistente:pedido-criado', pedido)
  }
}

// Escutar eventos do VFX quando montado
onMounted(() => {
  if (props.eventBus) {
    // 🎧 ESCUTAR EVENTOS DO HOST VFX
    
    // Atualização de dados gerais
    props.eventBus.on('vfx:refresh-data', () => {
      ultimaAcao.value = 'Dados atualizados pelo VFX'
    })
    
    // 🎨 Host → MFE: Mudança de tema
    props.eventBus.on('theme-changed', handleThemeChange)
    
    // 👤 Host → MFE: Atualização de usuário
    props.eventBus.on('user-updated', handleUserUpdated)
    
    // 🌐 Host → MFE: Mudança de idioma
    props.eventBus.on('language-changed', handleLanguageChanged)
    
    // 📡 Notificar VFX que MFE carregou
    props.eventBus.emit('assistente:ready', {
      mfe: 'assistente-compras',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      capabilities: ['purchase-suggestion', 'order-processing', 'theme-sync']
    })
    
    console.log('🎧 EventBus listeners registrados:', {
      'theme-changed': '🎨 Mudança de tema',
      'user-updated': '👤 Atualização de usuário', 
      'language-changed': '🌐 Mudança de idioma',
      'vfx:refresh-data': '🔄 Refresh de dados'
    })
  }
  
  // 🔍 Log de debug para desenvolvimento
  console.log('🚀 AssistenteCompras montado com props:', {
    userData: props.userData,
    themeData: props.themeData,
    hasEventBus: !!props.eventBus,
    isAuthorized: isAuthorizedAccess.value
  })
})

onUnmounted(() => {
  if (props.eventBus) {
    // 🧹 Limpar todos os listeners do EventBus
    props.eventBus.off('vfx:refresh-data')
    props.eventBus.off('theme-changed', handleThemeChange)
    props.eventBus.off('user-updated', handleUserUpdated)
    props.eventBus.off('language-changed', handleLanguageChanged)
    
    // 📡 Notificar host que MFE está sendo desmontado
    props.eventBus.emit('assistente:unmounting', {
      mfe: 'assistente-compras',
      timestamp: new Date().toISOString()
    })
    
    console.log('🧹 EventBus listeners removidos')
  }
})
</script>

<style scoped>
.assistente-compras {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e9ecef;
}

.header h2 {
  margin: 0;
  color: #495057;
}

.badges {
  display: flex;
  gap: 8px;
}

.mfe-badge, .auth-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: bold;
}

.mfe-badge {
  background: #28a745;
  color: white;
}

.auth-badge {
  background: #007bff;
  color: white;
}

.user-info, .actions, .resultado {
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.user-info h3, .actions h3, .resultado h3 {
  margin-top: 0;
  color: #495057;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-primary, .btn-success {
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover {
  background: #1e7e34;
}

.resultado {
  border-left-color: #28a745;
  background: #f8fff9;
}

.debug-panel {
  margin-top: 20px;
  padding: 15px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  font-size: 0.9rem;
}

.debug-panel h4 {
  margin-top: 0;
  color: #856404;
}

.debug-panel p {
  margin: 5px 0;
  color: #856404;
}

@media (max-width: 768px) {
  .assistente-compras {
    margin: 10px;
    padding: 15px;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style>
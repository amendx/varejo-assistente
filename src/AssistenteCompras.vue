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
      <div class="debug-section">
        <h5>👤 Dados do Usuário</h5>
        <p><strong>Logado:</strong> {{ unifiedIsLoggedIn ? '✅' : '❌' }}</p>
        <p><strong>Nome:</strong> {{ unifiedUserData?.nome || 'N/A' }}</p>
        <p><strong>Email:</strong> {{ unifiedUserData?.email || 'N/A' }}</p>
        <p><strong>Permissões:</strong> {{ unifiedUserPermissions?.length || 0 }}</p>
        <p><strong>Lojas Ativas:</strong> {{ unifiedUserStores?.length || 0 }}</p>
        <p><strong>Tem Permissão Assistente:</strong> {{ hasAssistentPermissions ? '✅' : '❌' }}</p>
      </div>
      
      <div class="debug-section">
        <h5>🔌 Integração VFX</h5>
        <p><strong>Modo:</strong> {{ executionMode }}</p>
        <p><strong>É iframe:</strong> {{ isInIframe ? '✅' : '❌' }}</p>
        <p><strong>Event Bus:</strong> {{ !!unifiedEventBus ? '✅' : '❌' }}</p>
        <p><strong>Tema:</strong> {{ unifiedThemeData || 'N/A' }}</p>
        <p><strong>Idioma:</strong> {{ language }}</p>
        <p><strong>Referer:</strong> {{ referrerUrl }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import ForbiddenPage from './ForbiddenPage.vue'
import { iframeBridge, createIframeEventBus } from './iframe-bridge.js'

// Props que podem vir do VFX Host
const props = defineProps({
  // Dados do usuário logado (store.state.auth.currentUserData)
  userData: {
    type: Object,
    default: () => ({})
  },
  
  // Permissões do usuário (store.state.auth.currentUserData.permissoes)
  userPermissions: {
    type: Array,
    default: () => []
  },
  
  // Lojas ativas do usuário (store.getters.auth.lojasDoUsuarioAtivas)
  userStores: {
    type: Array,
    default: () => []
  },
  
  // Status de login (store.getters.auth.loggedIn)
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  
  // Tema atual (store.getters.themes.temaAtual)
  themeData: {
    type: String,
    default: 'blue'
  },
  
  // EventBus para comunicação
  eventBus: {
    type: Object,
    default: null
  },
  
  // Modo de execução
  mode: {
    type: String,
    default: 'production'
  },
  
  // Idioma
  language: {
    type: String,
    default: 'pt-BR'
  }
})

// Estados locais
const ultimaAcao = ref('')
const isDevelopment = ref(process.env.NODE_ENV === 'development')

// 🌉 DETECÇÃO DE MODO DE EXECUÇÃO
const isInIframe = ref(window.parent !== window)
const executionMode = computed(() => isInIframe.value ? 'iframe' : 'module-federation')

// 📡 DADOS REATIVOS PARA IFRAME (recebidos via postMessage)
const iframeData = ref({
  userData: {},
  userPermissions: [],
  userStores: [],
  isLoggedIn: false,
  themeData: 'blue'
})

// 🎯 DADOS COMPUTADOS UNIFICADOS (iframe ou props diretas)
const unifiedUserData = computed(() => {
  return isInIframe.value ? iframeData.value.userData : props.userData
})

const unifiedUserPermissions = computed(() => {
  return isInIframe.value ? iframeData.value.userPermissions : props.userPermissions
})

const unifiedUserStores = computed(() => {
  return isInIframe.value ? iframeData.value.userStores : props.userStores
})

const unifiedIsLoggedIn = computed(() => {
  return isInIframe.value ? iframeData.value.isLoggedIn : props.isLoggedIn
})

const unifiedThemeData = computed(() => {
  return isInIframe.value ? iframeData.value.themeData : props.themeData
})

const unifiedEventBus = computed(() => {
  return isInIframe.value ? createIframeEventBus() : props.eventBus
})

// Computed para validação de permissões específicas do assistente
const hasAssistentPermissions = computed(() => {
  const permissions = unifiedUserPermissions.value || unifiedUserData.value?.permissoes || []
  
  // Verificar permissões específicas do assistente de compras
  const requiredPermissions = [
    'assistente.read',
    'assistente.compras',
    'vendas.read',
    'produtos.read'
  ]
  
  // Usuário precisa ter pelo menos uma das permissões necessárias
  return requiredPermissions.some(perm => 
    permissions.some(userPerm => 
      userPerm === perm || 
      userPerm.startsWith(perm.split('.')[0]) || 
      userPerm === 'admin' || 
      userPerm === 'super_admin'
    )
  )
})

// Computed para validar lojas ativas
const hasActiveStores = computed(() => {
  const stores = unifiedUserStores.value || []
  return stores.length > 0
})

// Verificação de acesso autorizado
const isAuthorizedAccess = computed(() => {
  // Em desenvolvimento, sempre permitir acesso se tiver dados mock
  if (isDevelopment.value && unifiedUserData.value?.nome) {
    return true
  }
  
  // Verificações para produção:
  // 1. Usuário deve estar logado
  if (!unifiedIsLoggedIn.value && !unifiedUserData.value?.nome) {
    console.warn('❌ Usuário não está logado')
    return false
  }
  
  // 2. Usuário deve ter permissões do assistente  
  if (!hasAssistentPermissions.value) {
    console.warn('❌ Usuário não tem permissões para o assistente de compras')
    return false
  }
  
  // 3. Usuário deve ter lojas ativas
  if (!hasActiveStores.value) {
    console.warn('❌ Usuário não tem lojas ativas')
    return false
  }
  
  // 4. Verificar integração (Module Federation ou iframe)
  const hasEventBus = !!unifiedEventBus.value && unifiedEventBus.value.emit
  const hasVFXData = !!(unifiedUserData.value?.nome || unifiedThemeData.value)
  const hasVFXFlag = !!(window.__POWERED_BY_VFX__ || window.vfxMFEEventBus)
  const isIframeMode = isInIframe.value
  
  // 5. Verificação segura do document.referrer
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
  
  // Pelo menos uma das validações técnicas deve passar (host integration)
  const isAuthorized = hasEventBus || hasVFXData || hasVFXFlag || hasValidReferer || isIframeMode
  
  console.log('🔍 Verificação de Acesso Completa:', {
    executionMode: executionMode.value,
    isIframe: isIframeMode,
    isDevelopment: isDevelopment.value,
    isLoggedIn: unifiedIsLoggedIn.value,
    hasUserData: !!unifiedUserData.value?.nome,
    hasPermissions: hasAssistentPermissions.value,
    hasActiveStores: hasActiveStores.value,
    hasEventBus,
    hasVFXData,
    hasVFXFlag, 
    hasValidReferer,
    userPermissions: unifiedUserPermissions.value || [],
    userStores: unifiedUserStores.value?.length || 0,
    referer: typeof document !== 'undefined' ? document.referrer : 'N/A',
    finalAuthorization: isAuthorized
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
  // Usar dados unificados (iframe ou module federation)
  const lojaSelecionada = unifiedUserStores.value?.[0] || { nome: 'Loja Padrão', id: 1 }
  const nomeUsuario = unifiedUserData.value?.nome || 'Usuário'
  
  const sugestao = {
    produto: 'Notebook Dell Inspiron 15',
    preco: 2500.00,
    desconto: 10,
    loja: lojaSelecionada.nome,
    lojaId: lojaSelecionada.id,
    usuario: nomeUsuario,
    timestamp: new Date().toLocaleString(),
    analise: {
      categoria: 'Informática',
      margem: 15,
      demanda: 'Alta',
      estoque: 8
    }
  }
  
  ultimaAcao.value = `Sugestão gerada por ${nomeUsuario} para ${lojaSelecionada.nome}: ${sugestao.produto} - R$ ${sugestao.preco.toLocaleString('pt-BR')}`
  
  // 🔄 Comunicar com host VFX (Module Federation ou iframe)
  const eventBus = unifiedEventBus.value
  if (eventBus && eventBus.emit) {
    eventBus.emit('assistente:sugestao-gerada', {
      ...sugestao,
      userId: unifiedUserData.value?.id,
      userPermissions: unifiedUserPermissions.value || [],
      executionMode: executionMode.value
    })
    console.log(`📡 [MFE→HOST] ${executionMode.value} - assistente:sugestao-gerada enviado:`, sugestao)
  }
}

const atualizarDados = () => {
  const nomeUsuario = unifiedUserData.value?.nome || 'Usuário'
  const totalLojas = unifiedUserStores.value?.length || 0
  
  ultimaAcao.value = `Dados atualizados por ${nomeUsuario} (${totalLojas} lojas) em ${new Date().toLocaleString()}`
  
  // 🔄 Solicitar atualização de dados no host
  const eventBus = unifiedEventBus.value
  if (eventBus && eventBus.emit) {
    eventBus.emit('assistente:dados-atualizados', {
      usuario: nomeUsuario,
      totalLojas,
      timestamp: new Date().toISOString(),
      origem: 'assistente-compras',
      executionMode: executionMode.value
    })
    console.log(`📡 [MFE→HOST] ${executionMode.value} - assistente:dados-atualizados enviado`)
  }
}

const analisarProdutos = () => {
  const nomeUsuario = unifiedUserData.value?.nome || 'Usuário'
  const lojasAtivas = unifiedUserStores.value || []
  
  ultimaAcao.value = `Análise de produtos iniciada por ${nomeUsuario} para ${lojasAtivas.length} loja(s)`
  
  // 🔄 Solicitar navegação ao host
  const eventBus = unifiedEventBus.value  
  if (eventBus && eventBus.emit) {
    eventBus.emit('assistente:navigation-request', {
      target: '/produtos',
      params: {
        lojas: lojasAtivas.map(l => l.id || l.codigo),
        analise: 'compras',
        usuario: unifiedUserData.value?.id
      },
      reason: 'Análise de produtos para assistente de compras',
      executionMode: executionMode.value
    })
    console.log(`📡 [MFE→HOST] ${executionMode.value} - assistente:navigation-request enviado para análise de produtos`)
  }
}

const reportError = (errorMessage) => {
  console.error('❌ Erro no MFE:', errorMessage)
  const nomeUsuario = unifiedUserData.value?.nome || 'Usuário não identificado'
  
  // 🔄 Reportar erro para o host
  const eventBus = unifiedEventBus.value
  if (eventBus && eventBus.emit) {
    eventBus.emit('assistente:error-occurred', {
      source: 'assistente-compras',
      error: errorMessage,
      usuario: nomeUsuario,
      userId: unifiedUserData.value?.id,
      lojas: unifiedUserStores.value?.length || 0,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      executionMode: executionMode.value
    })
    console.log(`📡 [MFE→HOST] ${executionMode.value} - assistente:error-occurred enviado`)
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

// 🌉 SETUP DOS HANDLERS IFRAME
const setupIframeHandlers = () => {
  if (!isInIframe.value) return
  
  console.log('🌉 Configurando handlers do iframe...')
  
  // Handler para receber dados do host VFX
  iframeBridge.on('host:data-response', (data) => {
    console.log('📥 Dados recebidos do host VFX via iframe:', data)
    
    // Atualizar dados reativos
    if (data.userData) iframeData.value.userData = data.userData
    if (data.userPermissions) iframeData.value.userPermissions = data.userPermissions
    if (data.userStores) iframeData.value.userStores = data.userStores
    if (typeof data.isLoggedIn === 'boolean') iframeData.value.isLoggedIn = data.isLoggedIn
    if (data.themeData) iframeData.value.themeData = data.themeData
    
    ultimaAcao.value = `Dados atualizados via iframe - Usuário: ${data.userData?.nome || 'N/A'}`
    
    // Notificar que MFE está pronto
    iframeBridge.updateStatus('ready')
  })
  
  // Handler específicos do iframe para eventos do host
  iframeBridge.on('host:theme-changed', (theme) => {
    console.log('🎨 [IFRAME] Host VFX mudou tema para:', theme)
    iframeData.value.themeData = theme
    ultimaAcao.value = `Tema alterado via iframe: ${theme}`
  })
  
  iframeBridge.on('host:user-updated', (userData) => {
    console.log('👤 [IFRAME] Host VFX atualizou usuário:', userData)
    iframeData.value.userData = userData
    if (userData.permissoes) iframeData.value.userPermissions = userData.permissoes
    ultimaAcao.value = `Usuário atualizado via iframe: ${userData?.nome || 'N/A'}`
  })
  
  iframeBridge.on('host:language-changed', (language) => {
    console.log('🌐 [IFRAME] Host VFX mudou idioma para:', language)
    ultimaAcao.value = `Idioma alterado via iframe: ${language}`
  })
}

const enviarPedido = () => {
  const pedido = {
    id: Math.random().toString(36).substr(2, 9),
    produto: 'Notebook Dell',
    quantidade: 1,
    valor: 2250.00, // com desconto
    usuario: unifiedUserData.value?.nome || 'Usuario Demo',
    loja: unifiedUserStores.value?.[0]?.nome || 'Loja Demo',
    timestamp: new Date().toLocaleString(),
    executionMode: executionMode.value
  }
  
  ultimaAcao.value = `Pedido enviado: ${pedido.id} - R$ ${pedido.valor.toLocaleString('pt-BR')}`
  
  // Enviar para VFX (Module Federation ou iframe)
  const eventBus = unifiedEventBus.value
  if (eventBus) {
    eventBus.emit('assistente:pedido-criado', pedido)
    console.log(`📡 [MFE→HOST] ${executionMode.value} - assistente:pedido-criado enviado:`, pedido)
  }
}

// Escutar eventos do VFX quando montado
onMounted(() => {
  console.log(`🚀 MFE montado em modo: ${executionMode.value}`)
  
  // 🌉 INICIALIZAR IFRAME SE NECESSÁRIO
  if (isInIframe.value) {
    console.log('🌉 Modo iframe detectado - configurando comunicação...')
    setupIframeHandlers()
    
    // Atualizar status para loading
    iframeBridge.updateStatus('loading')
    
    // Aguardar um pouco antes de solicitar dados
    setTimeout(() => {
      iframeBridge.requestHostData([
        'userData', 
        'userPermissions', 
        'userStores', 
        'isLoggedIn', 
        'themeData'
      ])
    }, 500)
    
  } else {
    // 🔌 MODO MODULE FEDERATION
    console.log('🔌 Modo Module Federation - configurando listeners...')
    
    const eventBus = unifiedEventBus.value
    if (eventBus) {
      // 🎧 ESCUTAR EVENTOS DO HOST VFX
      
      // Atualização de dados gerais
      eventBus.on('vfx:refresh-data', () => {
        ultimaAcao.value = 'Dados atualizados pelo VFX'
      })
      
      // 🎨 Host → MFE: Mudança de tema
      eventBus.on('theme-changed', handleThemeChange)
      
      // 👤 Host → MFE: Atualização de usuário
      eventBus.on('user-updated', handleUserUpdated)
      
      // 🌐 Host → MFE: Mudança de idioma
      eventBus.on('language-changed', handleLanguageChanged)
      
      // 📡 Notificar VFX que MFE carregou
      eventBus.emit('assistente:ready', {
        mfe: 'assistente-compras',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        capabilities: ['purchase-suggestion', 'order-processing', 'theme-sync'],
        executionMode: 'module-federation'
      })
      
      console.log('🎧 EventBus listeners registrados para Module Federation')
    }
  }
  
  // 🔍 Log de debug para desenvolvimento
  console.log(`🚀 AssistenteCompras montado em modo ${executionMode.value}:`, {
    hasUserData: !!unifiedUserData.value?.nome,
    hasEventBus: !!unifiedEventBus.value,
    isAuthorized: isAuthorizedAccess.value,
    userStores: unifiedUserStores.value?.length || 0,
    permissions: unifiedUserPermissions.value?.length || 0
  })
})

onUnmounted(() => {
  console.log(`🧹 Desmontando MFE em modo: ${executionMode.value}`)
  
  if (isInIframe.value) {
    // 🌉 LIMPEZA DO IFRAME
    iframeBridge.updateStatus('unmounting')
    // Os listeners do iframe são limpos automaticamente
  } else {
    // 🔌 LIMPEZA DO MODULE FEDERATION
    const eventBus = unifiedEventBus.value
    if (eventBus) {
      // 🧹 Limpar todos os listeners do EventBus
      eventBus.off('vfx:refresh-data')
      eventBus.off('theme-changed', handleThemeChange)
      eventBus.off('user-updated', handleUserUpdated)
      eventBus.off('language-changed', handleLanguageChanged)
      
      // 📡 Notificar host que MFE está sendo desmontado
      eventBus.emit('assistente:unmounting', {
        mfe: 'assistente-compras',
        timestamp: new Date().toISOString(),
        executionMode: 'module-federation'
      })
      
      console.log('🧹 EventBus listeners removidos')
    }
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
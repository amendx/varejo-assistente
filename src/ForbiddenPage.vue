<template>
  <div class="forbidden-container">
    <div class="forbidden-content">
      <div class="lock-icon">🔒</div>
      <h1>Acesso Restrito</h1>
      <p class="message">
        Este microfrontend só pode ser acessado através do sistema <strong>VFX (Varejo Fácil)</strong>.
      </p>
      
      <!-- Informações específicas do modo de execução -->
      <div class="info-box">
        <h3>📋 Modo de Execução: {{ executionMode }}</h3>
        
        <div v-if="isIframe" class="iframe-info">
          <p>🌉 <strong>Modo Iframe</strong> - Para VFX Vue 2:</p>
          <ul>
            <li>🏠 <strong>Host:</strong> VFX deve carregar via iframe</li>
            <li>📡 <strong>Comunicação:</strong> PostMessage</li>
            <li>🔗 <strong>URL:</strong> <code>/iframe.html</code></li>
          </ul>
          
          <div class="iframe-requirements">
            <h4>📋 Dados Necessários do Host:</h4>
            <ul>
              <li>👤 <code>userData</code> - Dados do usuário logado</li>
              <li>🔑 <code>userPermissions</code> - Permissões do usuário</li>
              <li>🏪 <code>userStores</code> - Lojas ativas</li>
              <li>🔐 <code>isLoggedIn</code> - Status de login</li>
              <li>🎨 <code>themeData</code> - Tema atual</li>
            </ul>
          </div>
          
          <div class="iframe-code-example">
            <h4>💻 Exemplo de Uso no Host:</h4>
            <pre><code>&lt;IframeMFE
  mfe-url="https://varejo-assistente.vercel.app/iframe.html"
  :user-data="$store.state.auth.currentUserData"
  :user-permissions="$store.state.auth.currentUserData?.permissoes"
  :user-stores="$store.getters['auth/lojasDoUsuarioAtivas']"
  :is-logged-in="$store.getters['auth/loggedIn']"
  :theme-data="$store.getters['themes/temaAtual']"
/&gt;</code></pre>
          </div>
        </div>
        
        <div v-else class="module-federation-info">
          <p>🔌 <strong>Module Federation</strong> - Para hosts modernos:</p>
          <ul>
            <li>🏠 <strong>Host:</strong> Sistema com Webpack 5</li>
            <li>🧩 <strong>Remote:</strong> Assistente de Compras</li>
            <li>🔗 <strong>Entry:</strong> <code>/remoteEntry.js</code></li>
          </ul>
        </div>
      </div>

      <!-- Status da comunicação -->
      <div class="status-box" :class="{ 'waiting': waitingForData, 'error': hasDataError }">
        <h4 v-if="isIframe && waitingForData">⏳ Aguardando dados do host...</h4>
        <h4 v-else-if="isIframe && hasDataError">❌ Erro nos dados recebidos</h4>
        <h4 v-else-if="isIframe">✅ Iframe configurado corretamente</h4>
        <h4 v-else>🔌 Module Federation</h4>
        
        <div v-if="isIframe" class="iframe-status">
          <p><strong>Comunicação PostMessage:</strong> {{ postMessageWorking ? '✅ Funcionando' : '❌ Não detectada' }}</p>
          <p><strong>Dados recebidos:</strong> {{ dataReceived ? '✅ Sim' : '⏳ Aguardando' }}</p>
          <p><strong>Host origin:</strong> {{ hostOrigin || 'Não detectado' }}</p>
        </div>
      </div>

      <!-- Dados recebidos do VFX -->
      <div v-if="isIframe && vfxData && Object.keys(vfxData).length > 0" class="vfx-data-container">
        <h3>📊 Dados Recebidos do VFX</h3>
        
        <!-- Dados do Usuário -->
        <div v-if="vfxData.userData" class="data-section">
          <h4>👤 Dados do Usuário</h4>
          <div class="data-grid">
            <div class="data-item">
              <strong>Nome:</strong> {{ vfxData.userData.nome || 'N/A' }}
            </div>
            <div class="data-item">
              <strong>Email:</strong> {{ vfxData.userData.email || 'N/A' }}
            </div>
            <div class="data-item">
              <strong>ID:</strong> {{ vfxData.userData.id || 'N/A' }}
            </div>
            <div class="data-item">
              <strong>Função:</strong> {{ vfxData.userData.funcao || 'N/A' }}
            </div>
          </div>
        </div>

        <!-- Permissões -->
        <div v-if="vfxData.userPermissions && vfxData.userPermissions.length > 0" class="data-section">
          <h4>🔑 Permissões do Usuário</h4>
          <div class="permissions-list">
            <span 
              v-for="permission in vfxData.userPermissions" 
              :key="permission"
              class="permission-tag"
            >
              {{ permission }}
            </span>
          </div>
        </div>

        <!-- Lojas Ativas -->
        <div v-if="vfxData.userStores && vfxData.userStores.length > 0" class="data-section">
          <h4>🏪 Lojas Ativas</h4>
          <div class="stores-list">
            <div 
              v-for="store in vfxData.userStores" 
              :key="store.id || store.codigo"
              class="store-item"
            >
              <strong>{{ store.nome || store.razaoSocial }}</strong>
              <span class="store-code">({{ store.codigo || store.id }})</span>
            </div>
          </div>
        </div>

        <!-- Status de Login -->
        <div class="data-section">
          <h4>🔐 Status de Autenticação</h4>
          <div class="auth-status" :class="{ 'logged-in': vfxData.isLoggedIn }">
            {{ vfxData.isLoggedIn ? '✅ Logado' : '❌ Não logado' }}
          </div>
        </div>

        <!-- Dados do Tema (se disponível) -->
        <div v-if="vfxData.themeData" class="data-section">
          <h4>🎨 Tema Atual</h4>
          <div class="theme-info">
            <div class="data-item">
              <strong>Nome:</strong> {{ vfxData.themeData.name || 'N/A' }}
            </div>
            <div class="data-item">
              <strong>Modo:</strong> {{ vfxData.themeData.mode || 'N/A' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Botões para testar comunicação com o host -->
      <div v-if="isIframe" class="test-communication">
        <h3>🧪 Testar Comunicação com Host</h3>
        <p class="test-description">
          Use estes botões para testar a comunicação bidirecional com o VFX:
        </p>
        
        <div class="test-buttons">
          <button @click="sendTestEvent('user-action')" class="test-btn user-action">
            👤 Simular Ação do Usuário
          </button>
          <button @click="sendTestEvent('navigation')" class="test-btn navigation">
            🧭 Evento de Navegação
          </button>
          <button @click="sendTestEvent('data-request')" class="test-btn data-request">
            📋 Solicitar Dados Específicos
          </button>
          <button @click="sendTestEvent('notification')" class="test-btn notification">
            🔔 Enviar Notificação
          </button>
          <button @click="sendTestEvent('analytics')" class="test-btn analytics">
            📈 Evento de Analytics
          </button>
          <button @click="sendTestEvent('custom')" class="test-btn custom">
            ⚡ Evento Personalizado
          </button>
        </div>

        <div v-if="lastEventSent" class="last-event-info">
          <h4>📤 Último Evento Enviado</h4>
          <div class="event-details">
            <pre>{{ JSON.stringify(lastEventSent, null, 2) }}</pre>
          </div>
        </div>
      </div>

      <div class="debug-info" v-if="showDebug">
        <h4>🐛 Debug Info</h4>
        <div class="debug-item">
          <strong>Modo:</strong> {{ executionMode }}
        </div>
        <div class="debug-item">
          <strong>É Iframe:</strong> {{ isIframe ? '✅' : '❌' }}
        </div>
        <div class="debug-item">
          <strong>Referer:</strong> {{ debugInfo.referer || 'Nenhum' }}
        </div>
        <div class="debug-item">
          <strong>Host Origin:</strong> {{ hostOrigin || 'N/A' }}
        </div>
        <div class="debug-item">
          <strong>PostMessage Listener:</strong> {{ postMessageWorking ? '✅' : '❌' }}
        </div>
        <div class="debug-item">
          <strong>Dados Recebidos:</strong> {{ dataReceived ? '✅' : '❌' }}
        </div>
        <div class="debug-item">
          <strong>User Agent:</strong> {{ debugInfo.userAgent }}
        </div>
        <div class="debug-item">
          <strong>Timestamp:</strong> {{ debugInfo.timestamp }}
        </div>
      </div>

      <div class="actions">
        <button @click="toggleDebug" class="debug-btn">
          {{ showDebug ? '🔼' : '🔽' }} Debug Info
        </button>
        <button v-if="isIframe" @click="requestDataFromHost" class="request-btn">
          📡 Solicitar Dados do Host
        </button>
        <button @click="reload" class="reload-btn">
          🔄 Recarregar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const showDebug = ref(false)
const isIframe = ref(window.parent !== window)
const executionMode = computed(() => isIframe.value ? 'iframe' : 'module-federation')
const waitingForData = ref(isIframe.value)
const hasDataError = ref(false)
const postMessageWorking = ref(false)
const dataReceived = ref(false)
const hostOrigin = ref('')
const vfxData = ref({})
const lastEventSent = ref(null)

const debugInfo = ref({
  referer: '',
  vfxToken: false,
  userAgent: '',
  timestamp: ''
})

// Setup PostMessage listener se estiver em iframe
let postMessageListener = null

const setupPostMessageListener = () => {
  if (!isIframe.value) return
  
  postMessageListener = (event) => {
    console.log('📥 PostMessage recebido na página de acesso restrito:', event.data)
    
    // Detectar que comunicação PostMessage funciona
    postMessageWorking.value = true
    
    // Armazenar origem do host
    if (event.origin && event.origin !== 'null') {
      hostOrigin.value = event.origin
    }
    
    const { type, event: eventName, data } = event.data
    
    if (type === 'VFX_HOST_EVENT') {
      if (eventName === 'host:data-response') {
        console.log('✅ Dados recebidos do host:', data)
        dataReceived.value = true
        waitingForData.value = false
        
        // Armazenar dados VFX para exibição
        vfxData.value = { ...data }
        
        // Verificar se os dados estão completos
        const requiredFields = ['userData', 'isLoggedIn']
        const missingFields = requiredFields.filter(field => !data[field])
        
        if (missingFields.length > 0) {
          console.warn('❌ Campos obrigatórios ausentes:', missingFields)
          hasDataError.value = true
        } else {
          hasDataError.value = false
          // Dados completos recebidos - pode tentar recarregar
          setTimeout(() => {
            console.log('🔄 Dados completos recebidos, aguardando recarregamento...')
          }, 2000)
        }
      }
      
      // Capturar outros tipos de evento do host
      else if (eventName === 'host:event-received') {
        console.log('📨 Host confirmou recebimento do evento:', data)
      }
    }
  }
  
  window.addEventListener('message', postMessageListener)
  console.log('👂 PostMessage listener configurado para página de acesso restrito')
}

const requestDataFromHost = () => {
  if (!isIframe.value) return
  
  console.log('📡 Solicitando dados do host...')
  waitingForData.value = true
  hasDataError.value = false
  
  window.parent.postMessage({
    type: 'VFX_MFE_EVENT',
    event: 'mfe:request-data',
    data: {
      types: ['userData', 'userPermissions', 'userStores', 'isLoggedIn', 'themeData'],
      source: 'forbidden-page',
      timestamp: Date.now()
    }
  }, '*')
}

const reload = () => {
  window.location.reload()
}

const toggleDebug = () => {
  showDebug.value = !showDebug.value
}

const sendTestEvent = (eventType) => {
  if (!isIframe.value) return

  const eventData = generateTestEventData(eventType)
  
  console.log(`🧪 Enviando evento de teste: ${eventType}`, eventData)
  
  window.parent.postMessage({
    type: 'VFX_MFE_EVENT',
    event: `mfe:${eventType}`,
    data: eventData
  }, '*')
  
  // Armazenar último evento enviado para debug
  lastEventSent.value = {
    type: 'VFX_MFE_EVENT',
    event: `mfe:${eventType}`,
    data: eventData,
    timestamp: new Date().toISOString()
  }
}

const generateTestEventData = (eventType) => {
  const baseData = {
    source: 'forbidden-page-test',
    timestamp: Date.now(),
    sessionId: 'test-session-' + Math.random().toString(36).substr(2, 9)
  }

  switch (eventType) {
    case 'user-action':
      return {
        ...baseData,
        action: 'button-click',
        element: 'test-user-action',
        userId: vfxData.value.userData?.id || 'unknown',
        details: {
          buttonLabel: 'Simular Ação do Usuário',
          location: 'forbidden-page'
        }
      }
      
    case 'navigation':
      return {
        ...baseData,
        from: '/forbidden',
        to: '/assistente-compras',
        navigationMethod: 'programmatic',
        metadata: {
          reason: 'user-test',
          permissions: vfxData.value.userPermissions || []
        }
      }
      
    case 'data-request':
      return {
        ...baseData,
        requestedData: ['produtos', 'categorias', 'promocoes'],
        filters: {
          loja: vfxData.value.userStores?.[0]?.codigo || null,
          ativo: true
        },
        pagination: {
          page: 1,
          limit: 10
        }
      }
      
    case 'notification':
      return {
        ...baseData,
        notification: {
          type: 'info',
          title: 'Teste de Notificação',
          message: 'Esta é uma notificação de teste enviada do MFE',
          priority: 'medium',
          autoClose: true,
          duration: 5000
        }
      }
      
    case 'analytics':
      return {
        ...baseData,
        event: 'page_view',
        properties: {
          page_title: 'Forbidden Page Test',
          page_url: '/forbidden',
          user_id: vfxData.value.userData?.id,
          session_duration: Math.floor(Math.random() * 1000),
          feature: 'assistente-compras',
          action: 'test-communication'
        }
      }
      
    case 'custom':
      return {
        ...baseData,
        customEvent: {
          name: 'mfe_communication_test',
          payload: {
            testType: 'bidirectional-communication',
            mfeVersion: '1.0.0',
            supportedFeatures: [
              'postMessage',
              'dataBinding',
              'eventEmission',
              'storeIntegration'
            ],
            hostData: {
              hasUserData: !!vfxData.value.userData,
              hasPermissions: !!(vfxData.value.userPermissions?.length > 0),
              hasStores: !!(vfxData.value.userStores?.length > 0),
              isAuthenticated: vfxData.value.isLoggedIn
            }
          }
        }
      }
      
    default:
      return baseData
  }
}

onMounted(() => {
  // Coletar informações de debug
  try {
    debugInfo.value = {
      referer: typeof document !== 'undefined' ? document.referrer || '' : 'N/A',
      vfxToken: !!window.vfxMFEEventBus || !!window.__POWERED_BY_VFX__,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      timestamp: new Date().toLocaleString()
    }
  } catch (error) {
    console.warn('Erro ao coletar debug info:', error)
    debugInfo.value = {
      referer: 'Erro ao acessar',
      vfxToken: false,
      userAgent: 'Erro ao acessar',
      timestamp: new Date().toLocaleString()
    }
  }
  
  // Configurar listener PostMessage se estiver em iframe
  if (isIframe.value) {
    setupPostMessageListener()
    
    // Solicitar dados iniciais após um tempo
    setTimeout(() => {
      if (waitingForData.value) {
        requestDataFromHost()
      }
    }, 1000)
    
    // Timeout para detectar problemas de comunicação
    setTimeout(() => {
      if (waitingForData.value && !postMessageWorking.value) {
        console.warn('⚠️ Timeout: Host não respondeu em 10 segundos')
        hasDataError.value = true
        waitingForData.value = false
      }
    }, 10000)
  }
  
  console.log(`🔒 Página de acesso restrito carregada em modo: ${executionMode.value}`)
})

onUnmounted(() => {
  if (postMessageListener) {
    window.removeEventListener('message', postMessageListener)
    console.log('🧹 PostMessage listener removido')
  }
})
</script>

<style scoped>
.forbidden-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  padding: 20px;
}

.forbidden-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  padding: 40px;
  max-width: 600px;
  width: 100%;
  text-align: center;
}

.lock-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  display: block;
}

h1 {
  color: #495057;
  margin-bottom: 10px;
  font-size: 2.5rem;
}

.message {
  color: #6c757d;
  font-size: 1.1rem;
  margin-bottom: 30px;
  line-height: 1.6;
}

.info-box {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  text-align: left;
  border-left: 4px solid #007bff;
}

.info-box h3 {
  margin-top: 0;
  color: #495057;
}

.info-box ul {
  margin: 10px 0;
  padding-left: 20px;
}

.info-box li {
  margin: 8px 0;
  color: #6c757d;
}

.debug-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
  text-align: left;
  border: 2px solid #e9ecef;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.debug-info h4 {
  margin-top: 0;
  color: #495057;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.debug-item {
  margin: 8px 0;
  padding: 5px 0;
  border-bottom: 1px solid #e9ecef;
}

.debug-item:last-child {
  border-bottom: none;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 30px;
}

.debug-btn, .github-btn {
  padding: 10px 20px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
}

.debug-btn {
  background: #6c757d;
  color: white;
}

.debug-btn:hover {
  background: #5a6268;
}

/* Estilos específicos para o modo iframe */
.iframe-info,
.module-federation-info {
  margin-top: 15px;
}

.iframe-requirements {
  background: #e7f3ff;
  border-radius: 6px;
  padding: 15px;
  margin: 15px 0;
  border-left: 4px solid #0066cc;
}

.iframe-requirements h4 {
  margin-top: 0;
  color: #0066cc;
  font-size: 1rem;
}

.iframe-code-example {
  background: #f1f3f4;
  border-radius: 6px;
  padding: 15px;
  margin: 15px 0;
  border: 1px solid #dadce0;
}

.iframe-code-example h4 {
  margin-top: 0;
  color: #1a73e8;
  font-size: 1rem;
}

.iframe-code-example pre {
  background: #2d3748;
  color: #e2e8f0;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.85rem;
  margin: 10px 0 0 0;
}

.iframe-code-example code {
  font-family: 'Monaco', 'Menlo', monospace;
  white-space: pre-wrap;
}

/* Status box */
.status-box {
  background: #e8f5e8;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  border-left: 4px solid #28a745;
  text-align: left;
}

.status-box.waiting {
  background: #fff3cd;
  border-color: #ffc107;
}

.status-box.error {
  background: #f8d7da;
  border-color: #dc3545;
}

.status-box h4 {
  margin-top: 0;
  color: #495057;
}

.iframe-status {
  margin-top: 15px;
  font-size: 0.95rem;
}

.iframe-status p {
  margin: 8px 0;
  color: #6c757d;
}

/* Botões adicionais */
.request-btn,
.reload-btn {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  margin: 5px;
  transition: background 0.3s ease;
}

.request-btn:hover,
.reload-btn:hover {
  background: #138496;
}

.reload-btn {
  background: #6c757d;
}

.reload-btn:hover {
  background: #5a6268;
}

/* Estilos para dados VFX */
.vfx-data-container {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 25px;
  margin: 25px 0;
  border: 1px solid #dee2e6;
}

.vfx-data-container h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #495057;
  font-size: 1.2rem;
  border-bottom: 2px solid #007bff;
  padding-bottom: 8px;
}

.data-section {
  margin-bottom: 25px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.data-section h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #6c757d;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

.data-item {
  background: #f8f9fa;
  padding: 10px 12px;
  border-radius: 6px;
  border-left: 3px solid #007bff;
}

.data-item strong {
  color: #495057;
  margin-right: 8px;
}

.permissions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.permission-tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.stores-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.store-item {
  background: #e8f5e8;
  padding: 10px 15px;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.store-code {
  background: #d4edda;
  color: #155724;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.auth-status {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 500;
  background: #f8d7da;
  color: #721c24;
}

.auth-status.logged-in {
  background: #d4edda;
  color: #155724;
}

.theme-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

/* Estilos para teste de comunicação */
.test-communication {
  background: #fff3cd;
  border-radius: 12px;
  padding: 25px;
  margin: 25px 0;
  border: 1px solid #ffeaa7;
  border-left: 4px solid #f39c12;
}

.test-communication h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #856404;
  font-size: 1.2rem;
}

.test-description {
  color: #856404;
  margin-bottom: 20px;
  font-style: italic;
}

.test-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.test-btn {
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.test-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.test-btn.user-action {
  background: #3498db;
  color: white;
}

.test-btn.user-action:hover {
  background: #2980b9;
}

.test-btn.navigation {
  background: #9b59b6;
  color: white;
}

.test-btn.navigation:hover {
  background: #8e44ad;
}

.test-btn.data-request {
  background: #1abc9c;
  color: white;
}

.test-btn.data-request:hover {
  background: #16a085;
}

.test-btn.notification {
  background: #f39c12;
  color: white;
}

.test-btn.notification:hover {
  background: #e67e22;
}

.test-btn.analytics {
  background: #e74c3c;
  color: white;
}

.test-btn.analytics:hover {
  background: #c0392b;
}

.test-btn.custom {
  background: #34495e;
  color: white;
}

.test-btn.custom:hover {
  background: #2c3e50;
}

.last-event-info {
  background: white;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
  border: 1px solid #ddd;
}

.last-event-info h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #495057;
  font-size: 1rem;
}

.event-details pre {
  background: #2d3748;
  color: #e2e8f0;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 0.8rem;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.github-btn {
  background: #007bff;
  color: white;
  display: inline-block;
}

.github-btn:hover {
  background: #0056b3;
  color: white;
}

@media (max-width: 768px) {
  .forbidden-content {
    padding: 20px;
    margin: 10px;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .lock-icon {
    font-size: 3rem;
  }
  
  .actions {
    flex-direction: column;
  }
}
</style>
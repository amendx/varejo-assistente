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
      <p><strong>Referer:</strong> {{ document.referrer || 'Direct Access' }}</p>
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
  eventBus: Object
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

// Funções de ação
const gerarSugestao = () => {
  const sugestao = {
    produto: 'Notebook Dell',
    preco: 2500.00,
    desconto: 10,
    timestamp: new Date().toLocaleString()
  }
  
  ultimaAcao.value = `Sugestão gerada: ${sugestao.produto} - R$ ${sugestao.preco}`
  
  // Enviar para VFX se disponível
  if (props.eventBus) {
    props.eventBus.emit('assistente:sugestao-gerada', sugestao)
  }
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
    // Escutar comandos do VFX
    props.eventBus.on('vfx:refresh-data', () => {
      ultimaAcao.value = 'Dados atualizados pelo VFX'
    })
    
    // Notificar VFX que MFE carregou
    props.eventBus.emit('assistente:ready', {
      mfe: 'assistente-compras',
      timestamp: new Date().toISOString()
    })
  }
})

onUnmounted(() => {
  if (props.eventBus) {
    props.eventBus.off('vfx:refresh-data')
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
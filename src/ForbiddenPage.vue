<template>
  <div class="forbidden-container">
    <div class="forbidden-content">
      <div class="lock-icon">🔒</div>
      <h1>Acesso Restrito</h1>
      <p class="message">
        Este microfrontend só pode ser acessado através do sistema <strong>VFX (Varejo Fácil)</strong>.
      </p>
      
      <div class="info-box">
        <h3>📋 Para Desenvolvedores</h3>
        <p>Este é um microfrontend que utiliza <strong>Module Federation</strong>:</p>
        <ul>
          <li>🏠 <strong>Host:</strong> Sistema VFX</li>
          <li>🧩 <strong>Remote:</strong> Assistente de Compras</li>
          <li>🔗 <strong>Entry:</strong> <code>/remoteEntry.js</code></li>
        </ul>
      </div>

      <div class="debug-info" v-if="showDebug">
        <h4>🐛 Debug Info</h4>
        <div class="debug-item">
          <strong>Referer:</strong> {{ debugInfo.referer || 'Nenhum' }}
        </div>
        <div class="debug-item">
          <strong>VFX Token:</strong> {{ debugInfo.vfxToken ? '✅ Presente' : '❌ Ausente' }}
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const showDebug = ref(false)
const debugInfo = ref({
  referer: '',
  vfxToken: false,
  userAgent: '',
  timestamp: ''
})

const toggleDebug = () => {
  showDebug.value = !showDebug.value
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
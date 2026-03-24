/**
 * 🌉 IFRAME BRIDGE - Comunicação Host ↔ MFE via PostMessage
 * 
 * Permite que o MFE rode em iframe e se comunique com o host VFX
 * Simula a mesma interface do Module Federation para compatibilidade
 */

class IframeBridge {
  constructor() {
    this.isInIframe = window.parent !== window
    this.hostOrigin = null
    this.eventHandlers = new Map()
    this.setupMessageListener()
    
    console.log(`🌉 IframeBridge inicializado - isInIframe: ${this.isInIframe}`)
  }
  
  /**
   * 🎯 CONFIGURAR LISTENER DE MENSAGENS
   */
  setupMessageListener() {
    window.addEventListener('message', (event) => {
      // Validar origem (em produção, ser mais específico)
      if (!event.origin || event.origin === 'null') return
      
      // Armazenar origem do host na primeira mensagem
      if (!this.hostOrigin) {
        this.hostOrigin = event.origin
        console.log(`🏠 Host origin definido: ${this.hostOrigin}`)
      }
      
      const { type, event: eventName, data } = event.data
      
      if (type === 'VFX_HOST_EVENT') {
        console.log(`📥 [HOST→MFE] ${eventName}:`, data)
        
        // Disparar handlers locais
        const handlers = this.eventHandlers.get(eventName) || []
        handlers.forEach(handler => {
          try {
            handler(data)
          } catch (error) {
            console.error(`❌ Erro ao executar handler para ${eventName}:`, error)
          }
        })
      }
    })
  }
  
  /**
   * 📤 EMITIR EVENTO PARA O HOST
   */
  emit(eventName, data) {
    if (!this.isInIframe) {
      console.warn('⚠️ Não está em iframe, evento ignorado:', eventName)
      return
    }
    
    console.log(`📤 [MFE→HOST] ${eventName}:`, data)
    
    window.parent.postMessage({
      type: 'VFX_MFE_EVENT',
      event: eventName,
      data,
      timestamp: Date.now(),
      source: 'assistente-compras'
    }, '*') // Em produção, usar origem específica
  }
  
  /**
   * 👂 ESCUTAR EVENTOS DO HOST
   */
  on(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, [])
    }
    
    this.eventHandlers.get(eventName).push(handler)
    console.log(`👂 Listener registrado para: ${eventName}`)
  }
  
  /**
   * 🚫 REMOVER LISTENER
   */
  off(eventName, handler) {
    const handlers = this.eventHandlers.get(eventName) || []
    const index = handlers.indexOf(handler)
    
    if (index > -1) {
      handlers.splice(index, 1)
      console.log(`🚫 Listener removido para: ${eventName}`)
    }
  }
  
  /**
   * 🏠 NOTIFICAR HOST QUE MFE ESTÁ PRONTO
   */
  ready(mfeInfo = {}) {
    this.emit('mfe:ready', {
      name: 'assistente-compras',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...mfeInfo
    })
  }
  
  /**
   * 📏 REDIMENSIONAR IFRAME (solicitar ao host)
   */
  resize(dimensions) {
    this.emit('mfe:resize', {
      width: dimensions.width || 'auto',
      height: dimensions.height || 'auto',
      timestamp: Date.now()
    })
  }
  
  /**
   * 🔄 ATUALIZAR STATUS DO MFE
   */
  updateStatus(status) {
    this.emit('mfe:status-changed', {
      status, // 'loading', 'ready', 'error'
      timestamp: Date.now()
    })
  }
  
  /**
   * 🎯 SOLICITAR DADOS DO HOST
   */
  requestHostData(dataTypes = []) {
    this.emit('mfe:request-data', {
      types: dataTypes, // ['userData', 'themeData', 'userStores', etc]
      timestamp: Date.now()
    })
  }
  
  /**
   * 🚀 INICIALIZAR COMUNICAÇÃO COM HOST
   */
  initialize() {
    console.log('🚀 Inicializando comunicação com host VFX...')
    
    // Solicitar dados iniciais do host
    this.requestHostData([
      'userData',
      'userPermissions', 
      'userStores',
      'isLoggedIn',
      'themeData'
    ])
    
    // Notificar que MFE está pronto
    this.ready()
    
    // Configurar redimensionamento automático
    this.setupAutoResize()
  }
  
  /**
   * 📏 CONFIGURAR REDIMENSIONAMENTO AUTOMÁTICO
   */
  setupAutoResize() {
    if (!this.isInIframe) return
    
    const resizeObserver = new ResizeObserver(() => {
      const height = document.body.scrollHeight
      const width = document.body.scrollWidth
      
      this.resize({ height, width })
    })
    
    resizeObserver.observe(document.body)
    
    // Redimensionar inicialmente após carregamento
    setTimeout(() => {
      const height = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        600 // altura mínima
      )
      this.resize({ height })
    }, 1000)
  }
}

// Instância global
export const iframeBridge = new IframeBridge()

// Criar EventBus compatível para o componente
export const createIframeEventBus = () => ({
  emit: (event, data) => iframeBridge.emit(event, data),
  on: (event, handler) => iframeBridge.on(event, handler),
  off: (event, handler) => iframeBridge.off(event, handler),
  
  // Propriedades para identificação
  isIframe: true,
  bridge: iframeBridge
})

// Auto-inicializar se estiver em iframe
if (iframeBridge.isInIframe) {
  // Aguardar um pouco para o DOM carregar
  setTimeout(() => {
    iframeBridge.initialize()
  }, 100)
}

export default iframeBridge
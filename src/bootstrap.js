// Mock do Event Bus para desenvolvimento standalone
async function initApp() {
  try {
    // Importação dinâmica do Vue para evitar problemas de Module Federation
    const { createApp } = await import('vue')
    const AssistenteComprasModule = await import('./AssistenteCompras.vue')
    const AssistenteCompras = AssistenteComprasModule.default || AssistenteComprasModule
    
    // Verificar modo de operação
    const isStandalone = !window.__POWERED_BY_VFX__ && !window.vfxMFEEventBus
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    console.log('🚀 Inicializando Assistente de Compras...')
    console.log('   - Modo:', isDevelopment ? 'Desenvolvimento' : 'Produção')
    console.log('   - Standalone:', isStandalone)
    
    // Sempre criar e montar a aplicação
    // O componente interno decide se mostra o conteúdo ou a página de forbidden
    const app = createApp(AssistenteCompras, {
      // Props mock APENAS em desenvolvimento standalone
      // Em produção standalone: não passar dados para forçar bloqueio
      userData: (isStandalone && isDevelopment) ? {
        nome: 'Usuário Demo',
        email: 'demo@varejofacil.com',
        permissoes: ['vendas', 'estoque']
      } : null,
      themeData: (isStandalone && isDevelopment) ? 'blue' : null,
      eventBus: (isStandalone && isDevelopment) ? createMockEventBus() : null
    })
    
    // Verificar se elemento existe
    const mountElement = document.getElementById('app')
    if (!mountElement) {
      throw new Error('Elemento #app não encontrado no DOM')
    }
    
    // Montar no DOM
    app.mount('#app')
    
    console.log('✅ Assistente de Compras carregado com sucesso!')
    
    return { app, AssistenteCompras }
    
  } catch (error) {
    console.error('❌ Erro ao inicializar Assistente de Compras:', error)
    
    // Fallback: mostrar erro na tela
    const errorHTML = `
      <div style="
        padding: 40px 20px; 
        text-align: center; 
        font-family: 'Segoe UI', Arial, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        color: white;
      ">
        <div style="
          background: rgba(255,255,255,0.1);
          padding: 30px;
          border-radius: 10px;
          max-width: 500px;
          margin: 0 auto;
          backdrop-filter: blur(10px);
        ">
          <h2>⚠️ Erro de Carregamento</h2>
          <p>Falha na inicialização do Assistente de Compras.</p>
          <details style="margin: 20px 0; text-align: left;">
            <summary style="cursor: pointer; font-weight: bold;">Detalhes Técnicos</summary>
            <pre style="
              background: rgba(0,0,0,0.3); 
              padding: 15px; 
              border-radius: 6px; 
              margin-top: 10px;
              overflow: auto;
              font-size: 0.9em;
            ">${error.message}\n\n${error.stack || ''}</pre>
          </details>
          <button onclick="window.location.reload()" style="
            background: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1em;
          ">🔄 Tentar Novamente</button>
        </div>
      </div>
    `
    
    document.body.innerHTML = errorHTML
  }
}

// Mock do Event Bus para desenvolvimento standalone
function createMockEventBus() {
  return {
    emit: (event, data) => {
      console.log(`[Mock EventBus] Emit: ${event}`, data)
    },
    on: (event, callback) => {
      console.log(`[Mock EventBus] Listener: ${event}`)
    },
    off: (event, callback) => {
      console.log(`[Mock EventBus] Remove Listener: ${event}`)
    }
  }
}

// Inicializar aplicação
initApp()

// Export para Module Federation
export { initApp }

// Export assíncrono do componente
export async function getAssistenteCompras() {
  const module = await import('./AssistenteCompras.vue')
  return module.default || module
}
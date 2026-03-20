// Dynamic import para resolver problemas de Module Federation
import('./bootstrap.js').catch(err => {
  console.error('Erro ao carregar o microfrontend:', err)
})
# 🚀 Guia Rápido - Integração MFE Assistente de Compras

## 📋 O que o Host VFX precisa enviar

### 🎯 **Dados Obrigatórios**

```javascript
{
  // 👤 DADOS DO USUÁRIO (obrigatório)
  userData: {
    id: "123",
    nome: "João Silva",
    email: "joao@vfx.com",
    funcao: "Vendedor"
  },
  
  // 🔑 PERMISSÕES (obrigatório)
  userPermissions: [
    "PERM_ASSISTENTE_COMPRA_ACESSO", // ← ESTA PERMISSÃO É OBRIGATÓRIA
    "outras_permissoes..."
  ],
  
  // 🏪 LOJAS ATIVAS (obrigatório)
  userStores: [
    {
      id: "001", 
      codigo: "001", 
      nome: "Loja Centro"
    }
  ],
  
  // 🔐 STATUS LOGIN (obrigatório)
  isLoggedIn: true
}
```

### ⚡ **Dados Opcionais**

```javascript
{
  // 🎨 TEMA (opcional)
  themeData: {
    name: "default",
    mode: "light"
  }
}
```

---

## 💻 **Implementação no VFX**

### **Opção 1: Iframe (Vue 2 compatível)**

```javascript
// No componente Vue 2 do VFX
mounted() {
  window.addEventListener('message', (event) => {
    if (event.origin.includes('varejo-assistente') && 
        event.data.type === 'VFX_MFE_EVENT' &&
        event.data.event === 'mfe:request-data') {
      
      // Enviar dados VFX
      event.source.postMessage({
        type: 'VFX_HOST_EVENT',
        event: 'host:data-response',
        data: {
          userData: this.$store.state.auth.currentUserData,
          userPermissions: this.$store.state.auth.currentUserData?.permissoes || [],
          userStores: this.$store.getters['auth/lojasDoUsuarioAtivas'],
          isLoggedIn: this.$store.getters['auth/loggedIn']
        }
      }, event.origin)
    }
  })
}
```

```html
<!-- Template -->
<iframe 
  src="https://varejo-assistente.vercel.app/iframe.html"
  width="100%" 
  height="600px">
</iframe>
```

## ✅ **Checklist de Validação**

- [ ] **Usuário tem permissão `PERM_ASSISTENTE_COMPRA_ACESSO`**
- [ ] **Usuário está logado (`isLoggedIn: true`)**
- [ ] **Usuário tem dados válidos (`userData.nome` existe)**
- [ ] **Usuário tem pelo menos 1 loja ativa**
- [ ] **Host envia dados via PostMessage (iframe)**

---

## 🐛 **Debug Rápido**

### **Iframe não funciona?**

1. Abra o console do navegador
2. Procure por mensagens: `📥 PostMessage recebido`
3. Se não aparecer, o host não está enviando dados
4. Use o arquivo `examples/vfx-host-test.html` para testar

### **Permissão negada?**

```javascript
// No console do navegador, verificar:
console.log('Permissões do usuário:', userData.permissoes)
console.log('Tem acesso?', userData.permissoes.includes('PERM_ASSISTENTE_COMPRA_ACESSO'))
```

## 📱 **URLs de Teste**

- **Iframe**: `https://varejo-assistente.vercel.app/iframe.html`
- **Teste Local**: `examples/vfx-host-test.html`

---

## 🆘 **Suporte**

Se algo não funcionar:

1. **Console logs**: Sempre verifique o console para mensagens de debug
2. **Teste isolado**: Use `examples/vfx-host-test.html`
3. **Dados mínimos**: Teste primeiro com dados básicos
4. **Permissões**: Confirme que `PERM_ASSISTENTE_COMPRA_ACESSO` está no array
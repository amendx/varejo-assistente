#!/bin/bash

echo "🛒 Varejo Assistente Compras - Microfrontend"
echo "============================================"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+ primeiro."
    echo "   Download: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Node.js $NODE_VERSION detectado. Recomenda-se Node.js 18+."
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    echo ""
fi

# Verificar se VFX está rodando (opcional)
echo "🔍 Verificando integração com VFX..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ VFX Host detectado em http://localhost:3000"
else
    echo "⚠️  VFX Host não detectado. MFE rodará em modo standalone."
fi

echo ""
echo "🚀 Iniciando Assistente de Compras..."
echo "   URL: http://localhost:8090"
echo "   Remote Entry: http://localhost:8090/remoteEntry.js"
echo ""
echo "💡 Para integrar com VFX:"
echo "   1. Verifique se VFX está configurado para Module Federation"
echo "   2. Acesse /assistente-compras no VFX"
echo ""
echo "🛑 Para parar: Ctrl+C"
echo ""

# Iniciar desenvolvimento
npm run dev
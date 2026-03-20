#!/bin/bash

echo "🚀 Deploy Varejo Assistente Compras - Vercel"
echo "============================================="
echo ""

# Verificar se Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "📦 Instalando Vercel CLI..."
    npm install -g vercel
fi

# Build do projeto
echo "🔨 Fazendo build do projeto..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erro no build. Verifique os logs acima."
    exit 1
fi

echo "✅ Build concluído com sucesso!"
echo ""

# Deploy
echo "🚀 Fazendo deploy na Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deploy realizado com sucesso!"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Copie a URL do deploy"
    echo "2. Atualize o publicPath no webpack.config.js com a URL real"
    echo "3. Configure o VFX host para usar a nova URL do remoteEntry.js"
    echo ""
    echo "🔗 URL padrão esperada:"
    echo "   https://varejo-assistente-compras.vercel.app/remoteEntry.js"
else
    echo "❌ Erro no deploy. Verifique sua autenticação na Vercel."
fi
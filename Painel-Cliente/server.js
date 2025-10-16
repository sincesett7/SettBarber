/* ===================================== */
/* ARQUIVO FINAL CORRIGIDO: server.js    */
/* ===================================== */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const url = require('url'); // Módulo nativo do Node.js

const app = express();
const port = 8080; 

// A URL base da sua API do Google.
const googleScriptUrl = 'https://script.google.com/macros/s/AKfycbyO7GJblaYWp-vzKTToVcjVNp3RLQi9SUGyzVJk7rKFDGPUMhKMXPPV_DlSZHjZUPEj/exec';

// Configuração do Proxy CORRIGIDA
app.use('/api', createProxyMiddleware({
    target: googleScriptUrl,
    changeOrigin: true,
    // Remove o pathRewrite simples que estava causando o problema.
    // O middleware agora vai anexar o ?action=... automaticamente.
    pathRewrite: {
        '^/api': '', // Reescreve /api para nada, deixando apenas a query string.
    },
    onProxyReq: (proxyReq, req, res) => {
        // Log para depuração: mostra exatamente o que está sendo enviado ao Google.
        // O resultado esperado aqui é, por exemplo: "/macros/s/..../exec?action=getFarm"
        console.log(`[PROXY] Encaminhando requisição para: ${proxyReq.path}`);
    },
    onError: (err, req, res) => {
        console.error('[PROXY] Erro no proxy:', err);
        res.status(500).send('Proxy Error');
    }
}));

// Servir os arquivos estáticos (dashboard, css, js, etc.)
app.use(express.static(path.join(__dirname)));

// Rota "catch-all" para garantir que o dashboard.html seja servido em qualquer rota não encontrada.
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}. Acesse http://localhost:${port}`);
});
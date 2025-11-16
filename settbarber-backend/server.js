const express = require('express');
const { Pool } = require('pg'); // Importa o "tradutor" do Postgres

const app = express(); // Inicia o "bloco de notas" do garçom
const port = 7777;

// --- 1. CONFIGURAÇÃO DA CONEXÃO (O "Telefone" da Cozinha) ---
const pool = new Pool({
    user: 'postgres',           // Usuário padrão do Postgres
    host: 'localhost',          // Nosso computador
    database: 'SettBarber',     // O banco que criamos
    password: '31456983', // A senha que você anotou!
    port: 7777,                 // Porta padrão
});

// --- 2. O "CARDÁPIO" DA API (O que o Salão pode pedir) ---

// Exemplo: Criar um pedido para "buscar todos os clientes"
app.get('/api/clientes', async (req, res) => {
    try {
        console.log("Garçom: Recebi pedido de clientes!");
        // 1. Garçom vai à Cozinha
        const { rows } = await pool.query('SELECT * FROM Clientes');
        
        console.log("Garçom: Entregando clientes!");
        // 2. Garçom entrega o pedido ao Salão
        res.json(rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

// --- 3. LIGAR O GARÇOM ---
app.listen(port, () => {
    console.log(`Garçom (Backend) online na porta ${port}. Aguardando pedidos...`);
});
// Espera o DOM carregar antes de executar
document.addEventListener('DOMContentLoaded', () => {

    console.log("main.js V2 (com Backend) carregado.");

    // --- LÓGICA NOVA: Carregar dados ao iniciar a página ---
    
    // Verifica se estamos na página de clientes (procurando a tabela)
    if (document.querySelector('.client-table')) {
        carregarClientes(); // Chama a nova função para buscar dados
    }
    
    // (No futuro, você adicionará ifs aqui para carregar dados de outras páginas)
    // if (document.querySelector('.team-grid')) {
    //     carregarEquipe(); 
    // }
    // if (document.querySelector('.dashboard-filters')) {
    //     carregarDashboard();
    // }


    // --- LÓGICAS ANTIGAS (Botões de Clique) ---
    // (Elas ainda estão aqui. O próximo passo será fazer elas
    // chamarem o backend também, em vez de só dar 'alert')

    // --- LÓGICA 1: Botões de Filtro (dashboard.html) ---
    const filterButtons = document.querySelectorAll('.dashboard-filters .filter-btn');
    
    if (filterButtons.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(innerBtn => {
                    innerBtn.classList.remove('active');
                });
                btn.classList.add('active');
                console.log(`Filtro selecionado: ${btn.textContent.trim()}`);
                // TODO: Chamar a API para recarregar o dashboard com o filtro
                // ex: carregarDashboard(btn.textContent.trim());
            });
        });
    }

    // --- LÓGICA 2: Botões "Adicionar" (clientes.html, equipe.html) ---
    const addButtons = document.querySelectorAll('.page-header .btn-primary');
    
    if (addButtons.length > 0) {
        addButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const buttonText = btn.textContent.trim();
                console.log(`Botão clicado: ${buttonText}`);
                
                // TODO: Substituir este alert por um modal que chama a API
                // para ADICIONAR um novo cliente/membro
                alert(`Ação: "${buttonText}".\n(Aqui abriria um modal de cadastro.)`);
            });
        });
    }

    // --- LÓGICA 3: Botões "Ver Detalhes" (equipe.html) ---
    const detailButtons = document.querySelectorAll('.team-card .btn-secondary');

    if (detailButtons.length > 0) {
        detailButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.team-card');
                const memberName = card.querySelector('.team-name').textContent;
                
                console.log(`Ver detalhes de: ${memberName}`);
                alert(`(Aqui abriria os detalhes de ${memberName}.)`);
            });
        });
    }

    // --- LÓGICA 4: Botões de Ação na Tabela (clientes.html) ---
    // ATENÇÃO: Esta lógica provavelmente precisa ser movida para
    // dentro da função carregarClientes(), após a tabela ser criada.
    const actionButtons = document.querySelectorAll('.client-table .action-btn');
    
    if (actionButtons.length > 0) {
        actionButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const row = btn.closest('tr');
                const clientName = row.querySelector('.client-name').textContent;
                const actionIcon = btn.querySelector('i').className; 

                if (actionIcon.includes('ph-eye')) {
                    console.log(`Ação: Ver ${clientName}`);
                    alert(`(Aqui abriria um modal para VER os dados de ${clientName}.)`);
                } else if (actionIcon.includes('ph-pencil')) {
                    console.log(`Ação: Editar ${clientName}`);
                    alert(`(Aqui abriria um modal para EDITAR os dados de ${clientName}.)`);
                }
            });
        });
    }

}); // --- FIM do 'DOMContentLoaded' ---


// --- FUNÇÃO NOVA: Para "Chamar o Garçom" (Backend) ---

/**
 * Busca os clientes na API (Backend) e constrói a tabela no HTML.
 */
async function carregarClientes() {
    console.log("Salão (Frontend): Chamando o Garçom (Backend) para pegar os clientes...");

    try {
        // 1. FAZ O PEDIDO (fetch) para o Backend
        // Lembre-se: o seu backend (node server.js) DEVE estar rodando.
        // E a porta deve ser a correta (ex: 3000 ou a porta 7777 do seu Postgres).
        // (Vou usar a porta 3000 do server.js que criamos)
        const response = await fetch('http://localhost:3000/api/clientes');
        
        if (!response.ok) {
            throw new Error(`Erro na rede: ${response.statusText}`);
        }

        const clientes = await response.json(); // Pega a lista de clientes em JSON

        console.log("Salão (Frontend): O Garçom entregou:", clientes);

        // 2. Pega a tabela no HTML
        const tabelaBody = document.querySelector('.client-table tbody');
        tabelaBody.innerHTML = ''; // Limpa a tabela (essencial!)

        // 3. Constrói o HTML da tabela com os dados REAIS
        clientes.forEach(cliente => {
            const tr = document.createElement('tr');
            
            // Nota: Nossa tabela Clientes SÓ TEM nome e contato.
            // As outras colunas ficarão vazias por enquanto.
            tr.innerHTML = `
                <td class="client-info-cell">
                    <span class="client-name">${cliente.nome}</span>
                    <span class="client-contact">${cliente.contato}</span>
                </td>
                <td>(Vazio)</td>
                <td>(Vazio)</td>
                <td>(Vazio)</td>
                <td class="total-spent">(Vazio)</td>
                <td classs="actions-cell">
                    <button class="action-btn"><i class="ph ph-eye"></i></button>
                    <button class="action-btn"><i class="ph ph-pencil"></i></button>
                </td>
            `;
            tabelaBody.appendChild(tr);
        });

    } catch (error) {
        console.error("Salão (Frontend): Erro ao chamar o garçom!", error);
        const tabelaBody = document.querySelector('.client-table tbody');
        tabelaBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: red;">Falha ao carregar clientes. O backend (server.js) está rodando?</td></tr>`;
    }
}
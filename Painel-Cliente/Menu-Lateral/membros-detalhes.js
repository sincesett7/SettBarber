/* ===================================== */
/* ARQUIVO CORRIGIDO: membros-detalhes.js */
/* ===================================== */

const API_URL_MEMBROS = '/api'; // Caminho do proxy no seu server.js. Está CORRETO.

let allMembersData = []; // Armazena todos os membros para a busca funcionar.

function showMemberMessage(message, isError = false) {
    const tbody = document.getElementById('membros-table')?.querySelector('tbody');
    if (tbody) {
        const colCount = tbody.parentElement.querySelector('thead tr').childElementCount;
        tbody.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center; color: ${isError ? 'var(--status-red)' : 'inherit'};">${message}</td></tr>`;
    }
}

function renderMembersTable(members) {
    const tbody = document.getElementById('membros-table')?.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (members.length === 0) {
        showMemberMessage("Nenhum membro corresponde à sua busca.");
        return;
    }

    // A API já envia os dados ordenados por 'farm_entregue', então não precisamos ordenar aqui.
    members.forEach(member => {
        const status = 'Ativo';
        const statusClass = 'status-aprovado';
        const dataEntrada = member.data_entrada ? member.data_entrada.split(' ')[0] : 'N/A';

        tbody.innerHTML += `
            <tr>
                <td><b>${member.nome || 'N/A'}</b></td>
                <td>${member.cargo || 'N/A'}</td>
                <td>${dataEntrada}</td>
                <td><span class="status-tag ${statusClass}">${status}</span></td>
                <td class="text-right">
                    <button class="action-buttons" title="Editar Membro"><i class="fa-solid fa-pencil"></i></button>
                    <button class="action-buttons" title="Ver Perfil"><i class="fa-solid fa-user"></i></button>
                </td>
            </tr>
        `;
    });
}

async function fetchAndDisplayMembers() {
    try {
        showMemberMessage("Carregando lista de membros...");

        const response = await fetch(`${API_URL_MEMBROS}?action=getRanking`);

        if (!response.ok) {
            throw new Error(`Erro de rede: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.error) {
            throw new Error(`Erro da API: ${data.error}`);
        }

        allMembersData = data; 
        renderMembersTable(allMembersData);

    } catch (error) {
        console.error("FALHA AO BUSCAR DADOS DE MEMBROS:", error);
        showMemberMessage(`Falha ao carregar a lista de membros. Erro: ${error.message}`, true);
    }
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredMembers = allMembersData.filter(member =>
                (member.nome || '').toLowerCase().includes(searchTerm) ||
                (member.cargo || '').toLowerCase().includes(searchTerm)
            );
            renderMembersTable(filteredMembers);
        });
    }
}

function initMembersPage() {
    fetchAndDisplayMembers();
    setupSearch();
}

initMembersPage();
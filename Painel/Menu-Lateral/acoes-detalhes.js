(() => { // <--- INÍCIO DO ISOLAMENTO
    const API_URL_ACOES = '/api'; // URL corrigida

    let allActions = [];
    let currentPage = 1;
    const itemsPerPage = 10;

    function formatCurrency(value) {
        return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function populateKpiCardsAcoes(actions) {
        const totalAcoes = actions.length;
        const vitorias = actions.filter(a => a.status === 'Vitória').length;
        const taxaSucesso = totalAcoes > 0 ? (vitorias / totalAcoes) * 100 : 0;
        const lucroTotal = actions.reduce((sum, a) => sum + (a.status === 'Vitória' ? a.valor : 0), 0);
        document.getElementById('taxa-sucesso').textContent = `${taxaSucesso.toFixed(0)}%`;
        document.getElementById('lucro-total').textContent = formatCurrency(lucroTotal);
        document.getElementById('total-acoes').textContent = totalAcoes;
        const acoesPreview = document.querySelector('a[href="Menu-Lateral/acoes-detalhes.html"] .submenu-data-preview');
        if (acoesPreview) {
            acoesPreview.textContent = `${taxaSucesso.toFixed(0)}%`;
        }
    }

    function renderTableAcoes(actionsToRender) {
        const tbody = document.getElementById('acoes-table').querySelector('tbody');
        tbody.innerHTML = '';
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedItems = actionsToRender.slice(startIndex, endIndex);
        if (paginatedItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nenhuma ação encontrada.</td></tr>';
            return;
        }
        paginatedItems.forEach(acao => {
            const membersData = (acao.membros || '').replace(/"/g, '&quot;');
            const statusClass = acao.status === 'Vitória' ? 'status-vitoria' : 'status-derrota';
            tbody.innerHTML += `
                <tr>
                    <td>${acao.data || 'N/A'}</td>
                    <td>${acao.nome_da_ação || 'N/A'}</td>
                    <td>${acao.responsável || 'N/A'}</td>
                    <td><button class="btn-ver-membros" data-members="${membersData}" data-action-name="${acao.nome_da_ação || 'Ação'}">Ver Membros</button></td>
                    <td><span class="status-tag ${statusClass}">${acao.status}</span></td>
                    <td class="text-right">${formatCurrency(acao.valor)}</td>
                </tr>
            `;
        });
    }

    function renderPaginationControls(totalItems) {
        const paginationControls = document.getElementById('pagination-controls');
        if (!paginationControls) return;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) {
            paginationControls.innerHTML = '';
            return;
        }
        paginationControls.innerHTML = `
            <span id="page-info">Página ${currentPage} de ${totalPages}</span>
            <div class="pagination-buttons">
                <button id="prev-page" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>
                <button id="next-page" ${currentPage === totalPages ? 'disabled' : ''}>Próxima</button>
            </div>
        `;
        document.getElementById('prev-page')?.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderUI(getFilteredActions());
            }
        });
        document.getElementById('next-page')?.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderUI(getFilteredActions());
            }
        });
    }

    function renderTopMembers(actions) {
        const rankingList = document.getElementById('top-membros-list');
        if (!rankingList) return;
        const memberWins = {};
        const victoriousActions = actions.filter(a => a.status === 'Vitória');
        victoriousActions.forEach(acao => {
            const membros = String(acao.membros || '').split('\n');
            membros.forEach(membro => {
                const trimmedMember = membro.trim();
                if (trimmedMember) memberWins[trimmedMember] = (memberWins[trimmedMember] || 0) + 1;
            });
        });
        const sortedMembers = Object.entries(memberWins).sort(([, a], [, b]) => b - a).slice(0, 3);
        rankingList.innerHTML = '';
        if (sortedMembers.length === 0) {
            rankingList.innerHTML = '<div class="ranking-item"><span>Nenhuma vitória registrada.</span></div>';
            return;
        }
        sortedMembers.forEach(([name, wins], index) => {
            const position = index + 1;
            const rankClass = `rank-${position}`;
            rankingList.innerHTML += `
                <div class="ranking-item ${rankClass}">
                    <div class="item-info"><span class="ranking-position">${position}</span><span>${name}</span></div>
                    <span class="item-value positive">${wins} vitórias</span>
                </div>
            `;
        });
    }

    function showMembersModal(actionName, membersString) {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const membersHtml = (membersString || 'Nenhum membro listado.').replace(/\n/g, '<br>');
        modalContainer.innerHTML = `
            <div class="modal-backdrop">
                <div class="modal-content">
                    <div class="modal-header"><h3>Membros da Ação: ${actionName}</h3><button class="modal-close-btn">&times;</button></div>
                    <div class="modal-body"><p>${membersHtml}</p></div>
                </div>
            </div>
        `;
        document.querySelector('.modal-backdrop').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });
        document.querySelector('.modal-close-btn').addEventListener('click', closeModal);
    }

    function closeModal() {
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer) modalContainer.innerHTML = '';
    }

    function attachTableListeners() {
        const table = document.getElementById('acoes-table');
        if (table && !table.dataset.listenerAttached) {
            table.addEventListener('click', (e) => {
                const targetButton = e.target.closest('.btn-ver-membros');
                if (targetButton) {
                    const members = targetButton.dataset.members;
                    const actionName = targetButton.dataset.actionName;
                    showMembersModal(actionName, members);
                }
            });
            table.dataset.listenerAttached = 'true';
        }
    }

    function getFilteredActions() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        if (!searchTerm) return allActions;
        return allActions.filter(acao => 
            (acao.nome_da_ação && acao.nome_da_ação.toLowerCase().includes(searchTerm)) ||
            (acao.responsável && acao.responsável.toLowerCase().includes(searchTerm))
        );
    }

    function renderUI(data) {
        renderTableAcoes(data);
        renderPaginationControls(data.length);
    }

    async function fetchAcoesData() {
        try {
            const tbody = document.getElementById('acoes-table')?.querySelector('tbody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Carregando dados...</td></tr>';
            const response = await fetch(`${API_URL_ACOES}?action=getAcoes`, { method: 'GET' });
            if (!response.ok) throw new Error(`Erro na API: ${response.statusText}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            allActions = data.sort((a, b) => new Date(b.data.split(' ')[0].split('/').reverse().join('-')) - new Date(a.data.split(' ')[0].split('/').reverse().join('-')));
            currentPage = 1;
            populateKpiCardsAcoes(allActions);
            renderTopMembers(allActions);
            renderUI(allActions);
            attachTableListeners();
        } catch (error) {
            console.error('Erro ao buscar dados de ações:', error);
            const tbody = document.getElementById('acoes-table')?.querySelector('tbody');
            if(tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Falha ao carregar dados. Erro: ${error.message}</td></tr>`;
        }
    }

    document.getElementById('search-input')?.addEventListener('keyup', () => { currentPage = 1; renderUI(getFilteredActions()); });
    document.getElementById('refresh-button-acoes')?.addEventListener('click', fetchAcoesData);
    fetchAcoesData();
})(); // <--- FIM DO ISOLAMENTO
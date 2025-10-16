(() => { // <--- INÍCIO DO ISOLAMENTO
    const API_URL = '/api'; // URL corrigida

    let allRecruits = [];
    let currentPage = 1;
    const itemsPerPage = 10;

    function populateKpiCards(recruits) {
        const aprovados = recruits.filter(r => r.status.startsWith('Aprovado')).length;
        const recusados = recruits.filter(r => r.status.startsWith('Recusado')).length;
        const pendentes = recruits.filter(r => r.status === 'Pendente').length;
        document.getElementById('total-aprovados').textContent = aprovados;
        document.getElementById('total-recusados').textContent = recusados;
        document.getElementById('total-pendentes').textContent = pendentes;
        const pendentesPreview = document.getElementById('recrutas-pendentes-preview');
        if (pendentesPreview) {
            pendentesPreview.textContent = `${pendentes} pend.`;
        }
    }

    function renderTable(recruitsToRender) {
        const tbody = document.getElementById('recrutas-table').querySelector('tbody');
        tbody.innerHTML = '';
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedItems = recruitsToRender.slice(startIndex, endIndex);
        if (paginatedItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nenhum recruta encontrado.</td></tr>';
            return;
        }
        paginatedItems.forEach(recruta => {
            let statusClass = 'status-pendente';
            if (recruta.status.startsWith('Aprovado')) statusClass = 'status-aprovado';
            if (recruta.status.startsWith('Recusado')) statusClass = 'status-recusado';
            tbody.innerHTML += `
                <tr>
                    <td>${recruta.data || 'N/A'}</td>
                    <td>${recruta.nome || ''}</td>
                    <td>${recruta.id || 'N/A'}</td>
                    <td>${recruta.número || 'N/A'}</td>
                    <td>${recruta.recrutador || ''}</td>
                    <td><span class="status-tag ${statusClass}">${recruta.status}</span></td>
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
                renderUI(getFilteredData());
            }
        });
        document.getElementById('next-page')?.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderUI(getFilteredData());
            }
        });
    }

    function getFilteredData() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        if (!searchTerm) return allRecruits;
        return allRecruits.filter(recruta => 
            recruta.nome.toLowerCase().includes(searchTerm) ||
            (recruta.recrutador && recruta.recrutador.toLowerCase().includes(searchTerm))
        );
    }

    function renderUI(data) {
        renderTable(data);
        renderPaginationControls(data.length);
    }

    async function fetchData() {
        try {
            const tbody = document.getElementById('recrutas-table')?.querySelector('tbody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Carregando dados...</td></tr>';
            const response = await fetch(`${API_URL}?action=getRecrutas`, { method: 'GET' });
            if (!response.ok) throw new Error(`Erro na API: ${response.statusText}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            allRecruits = data.sort((a, b) => new Date(b.data.split(' ')[0].split('/').reverse().join('-')) - new Date(a.data.split(' ')[0].split('/').reverse().join('-')));
            currentPage = 1;
            populateKpiCards(allRecruits);
            renderUI(allRecruits);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            const tbody = document.getElementById('recrutas-table')?.querySelector('tbody');
            if(tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Falha ao carregar os dados. Erro: ${error.message}</td></tr>`;
        }
    }

    document.getElementById('search-input')?.addEventListener('keyup', () => { currentPage = 1; renderUI(getFilteredData()); });
    document.getElementById('refresh-button')?.addEventListener('click', fetchData);
    fetchData();
})(); // <--- FIM DO ISOLAMENTO
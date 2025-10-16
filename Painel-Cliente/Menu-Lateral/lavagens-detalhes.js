(() => { // <--- INÍCIO DO ISOLAMENTO
    const API_URL_LAVAGENS = '/api'; // URL corrigida

    let allLaundering = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let chartInstance = null;

    function formatCurrency(value) {
        return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function formatSubmenuValue(value) {
        if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
        return `R$ ${value}`;
    }

    function populateKpiCards(ops) {
        const valorBruto = ops.reduce((sum, op) => sum + op.valor_de_lavagem, 0);
        const lucroFacTotal = ops.reduce((sum, op) => sum + op.lucro_da_fac, 0);
        const percaMaquinaTotal = ops.reduce((sum, op) => sum + op.perca_da_maquina, 0);
        document.getElementById('valor-bruto').textContent = formatCurrency(valorBruto);
        document.getElementById('comissao-total').textContent = formatCurrency(lucroFacTotal);
        document.getElementById('perca-maquina').textContent = formatCurrency(percaMaquinaTotal);
        const lavagensPreview = document.querySelector('a[href="Menu-Lateral/lavagens-detalhes.html"] .submenu-data-preview');
        if (lavagensPreview) {
            lavagensPreview.textContent = formatSubmenuValue(lucroFacTotal);
        }
    }

    function renderTable(ops) {
        const tbody = document.getElementById('lavagens-table').querySelector('tbody');
        tbody.innerHTML = '';
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedItems = ops.slice(startIndex, endIndex);
        if (paginatedItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nenhuma lavagem encontrada.</td></tr>';
            return;
        }
        paginatedItems.forEach(op => {
            tbody.innerHTML += `
                <tr>
                    <td>${op.data || 'N/A'}</td>
                    <td>${op.quem_lavou || 'N/A'}</td>
                    <td>${op.fac_pista || 'N/A'}</td>
                    <td class="text-right">${formatCurrency(op.valor_de_lavagem)}</td>
                    <td class="text-right">${formatCurrency(op.lucro_do_cliente)}</td>
                    <td class="text-right"><b>${formatCurrency(op.lucro_da_fac)}</b></td>
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

    function renderChart(ops) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        const recentOps = ops.filter(op => {
            const opDateParts = op.data.split(' ')[0].split('/');
            const opDate = new Date(`${opDateParts[2]}-${opDateParts[1]}-${opDateParts[0]}`);
            return opDate >= thirtyDaysAgo;
        });
        const profitByDay = recentOps.reduce((acc, op) => {
            const date = op.data.split(' ')[0];
            acc[date] = (acc[date] || 0) + op.lucro_da_fac;
            return acc;
        }, {});
        const sortedDates = Object.keys(profitByDay).sort((a, b) => {
            const dateA = new Date(a.split('/').reverse().join('-'));
            const dateB = new Date(b.split('/').reverse().join('-'));
            return dateA - dateB;
        });
        const chartData = sortedDates.map(date => profitByDay[date]);
        const ctx = document.getElementById('lavagensChart').getContext('2d');
        if (chartInstance) chartInstance.destroy();
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedDates,
                datasets: [{
                    label: 'Lucro da FAC por Dia',
                    data: chartData,
                    borderColor: '#E83984',
                    backgroundColor: 'rgba(232, 57, 132, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { ticks: { color: '#A9A5B3' } }, x: { ticks: { color: '#A9A5B3' } } }, plugins: { legend: { labels: { color: '#F0F0F0' } } } }
        });
    }

    function getFilteredData() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        if (!searchTerm) return allLaundering;
        return allLaundering.filter(op => 
            (op.quem_lavou && op.quem_lavou.toLowerCase().includes(searchTerm)) ||
            (op.fac_pista && op.fac_pista.toLowerCase().includes(searchTerm))
        );
    }

    function renderUI(data) {
        renderTable(data);
        renderPaginationControls(data.length);
    }

    async function fetchLavagensData() {
        try {
            const tbody = document.getElementById('lavagens-table')?.querySelector('tbody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Carregando dados...</td></tr>';
            const response = await fetch(`${API_URL_LAVAGENS}?action=getLavagens`, { method: 'GET' });
            if (!response.ok) throw new Error(`Erro na API: ${response.statusText}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            allLaundering = data.sort((a, b) => {
                const dateA = new Date(a.data.split(' ')[0].split('/').reverse().join('-') + 'T' + a.data.split(' ')[1]);
                const dateB = new Date(b.data.split(' ')[0].split('/').reverse().join('-') + 'T' + b.data.split(' ')[1]);
                return dateB - dateA;
            });
            currentPage = 1;
            populateKpiCards(allLaundering);
            renderChart(allLaundering);
            renderUI(allLaundering);
        } catch (error) {
            console.error('Erro ao buscar dados de lavagens:', error);
            const tbody = document.getElementById('lavagens-table')?.querySelector('tbody');
            if(tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Falha ao carregar dados. Erro: ${error.message}</td></tr>`;
        }
    }

    document.getElementById('search-input')?.addEventListener('keyup', () => { currentPage = 1; renderUI(getFilteredData()); });
    document.getElementById('refresh-button-lavagens')?.addEventListener('click', fetchLavagensData);
    fetchLavagensData();
})(); // <--- FIM DO ISOLAMENTO
// vendas-detalhes.js
document.addEventListener('DOMContentLoaded', () => {
    let allSales = [];

    const mockSalesData = [
        { data: '2025-09-23', vendedor: 'Will', itens: '5x Colete', cliente: 'Cliente A', valor: 2500 },
        { data: '2025-09-23', vendedor: 'Membro B', itens: '10x Munição AP', cliente: 'Cliente B', valor: 3000 },
        { data: '2025-09-22', vendedor: 'Membro C', itens: '1x Fuzil MK2', cliente: 'Cliente C', valor: 5000 },
        { data: '2025-09-21', vendedor: 'Will', itens: '2x Kit Reparo', cliente: 'Cliente D', valor: 800 },
        { data: '2025-09-20', vendedor: 'Membro D', itens: '20x Lockpick', cliente: 'Facção Z', valor: 4000 },
        { data: '2025-09-19', vendedor: 'Membro B', itens: '3x Colete', cliente: 'Cliente E', valor: 1500 },
    ];

    function formatCurrency(value) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function populateKpiCards(sales) {
        const totalFaturamento = sales.reduce((sum, sale) => sum + sale.valor, 0);
        const totalVendas = sales.length;
        const ticketMedio = totalVendas > 0 ? totalFaturamento / totalVendas : 0;

        document.getElementById('faturamento-total').textContent = formatCurrency(totalFaturamento);
        document.getElementById('total-vendas').textContent = totalVendas;
        document.getElementById('ticket-medio').textContent = formatCurrency(ticketMedio);
    }

    function populateTopSellers(sales) {
        const sellerTotals = sales.reduce((acc, sale) => {
            acc[sale.vendedor] = (acc[sale.vendedor] || 0) + sale.valor;
            return acc;
        }, {});

        const sortedSellers = Object.entries(sellerTotals)
            .sort(([,a],[,b]) => b - a)
            .slice(0, 5); // Pega o top 5

        const listElement = document.getElementById('top-vendedores-list');
        listElement.innerHTML = '';
        sortedSellers.forEach(([name, total]) => {
            listElement.innerHTML += `
                <div class="ranking-item">
                    <span class="item-info">${name}</span>
                    <span class="item-value positive">${formatCurrency(total)}</span>
                </div>
            `;
        });
    }

    function renderTable(sales) {
        const tbody = document.getElementById('vendas-table').querySelector('tbody');
        tbody.innerHTML = '';
        if (sales.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum resultado.</td></tr>';
            return;
        }
        sales.forEach(sale => {
            tbody.innerHTML += `
                <tr>
                    <td>${new Date(sale.data).toLocaleDateString('pt-BR')}</td>
                    <td>${sale.vendedor}</td>
                    <td>${sale.itens}</td>
                    <td>${sale.cliente}</td>
                    <td class="text-right">${formatCurrency(sale.valor)}</td>
                </tr>
            `;
        });
    }

    function renderChart(sales) {
        const salesByDay = sales.reduce((acc, sale) => {
            const date = new Date(sale.data).toLocaleDateString('pt-BR');
            acc[date] = (acc[date] || 0) + sale.valor;
            return acc;
        }, {});

        const sortedDates = Object.keys(salesByDay).sort((a, b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));
        const chartData = sortedDates.map(date => salesByDay[date]);
        
        const ctx = document.getElementById('vendasChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedDates,
                datasets: [{
                    label: 'Faturamento Diário',
                    data: chartData,
                    borderColor: '#E83984',
                    backgroundColor: 'rgba(232, 57, 132, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { ticks: { color: '#A9A5B3' } },
                    x: { ticks: { color: '#A9A5B3' } }
                },
                plugins: { legend: { labels: { color: '#F0F0F0' } } }
            }
        });
    }
    
    document.getElementById('search-input')?.addEventListener('keyup', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredSales = allSales.filter(sale => 
            sale.vendedor.toLowerCase().includes(searchTerm) ||
            sale.itens.toLowerCase().includes(searchTerm) ||
            sale.cliente.toLowerCase().includes(searchTerm)
        );
        renderTable(filteredSales);
    });

    // Função de inicialização
    function init() {
        allSales = mockSalesData;
        populateKpiCards(allSales);
        populateTopSellers(allSales);
        renderTable(allSales);
        renderChart(allSales);
    }

    init();
});
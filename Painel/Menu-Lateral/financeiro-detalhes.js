// =============================================== //
// SCRIPT PARA O DASHBOARD FINANCEIRO AVANÇADO     //
// =============================================== //

document.addEventListener('DOMContentLoaded', () => {
    // URL da sua API
    const API_URL = '/api/';

    // Instâncias dos Gráficos para poderem ser destruídas e recriadas
    let fluxoChart, entradasChart, saidasChart;

    const formatCurrency = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Funções de Renderização de Gráficos
    const renderFluxoCaixaChart = (data) => {
        const ctx = document.getElementById('fluxoCaixaChart')?.getContext('2d');
        if (!ctx) return;
        if (fluxoChart) fluxoChart.destroy(); // Destrói o gráfico anterior
        fluxoChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro'],
                datasets: [
                    { label: 'Entradas', data: data.entradas, backgroundColor: 'rgba(40, 167, 69, 0.2)', borderColor: 'rgba(40, 167, 69, 1)', fill: true, tension: 0.4 },
                    { label: 'Saídas', data: data.saidas, backgroundColor: 'rgba(220, 53, 69, 0.2)', borderColor: 'rgba(220, 53, 69, 1)', fill: true, tension: 0.4 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { ticks: { color: '#A9A5B3', callback: (v) => formatCurrency(v).replace(/\s/g, '') } }, x: { ticks: { color: '#A9A5B3' } } }, plugins: { legend: { labels: { color: '#F0F0F0' } }, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${formatCurrency(c.raw)}` } } } }
        });
    };

    const renderComposicaoChart = (canvasId, chartInstance, labels, data) => {
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) return null;
        if (chartInstance) chartInstance.destroy();
        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{ data: data, backgroundColor: ['#E83984', '#9E54FF', '#4CC9F0'], borderColor: '#1C1A21', borderWidth: 4 }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: '#F0F0F0', padding: 15 } }, tooltip: { callbacks: { label: (c) => `${c.label}: ${formatCurrency(c.raw)}` } } } }
        });
    };

    // Funções de Renderização dos Cards de Análise
    const renderPerformanceAcoes = (data) => {
        const container = document.getElementById('acoes-metrics');
        if (!container) return;
        container.innerHTML = `
            <div class="metric-item"><span class="label">Vitórias vs Derrotas</span><span class="value">${data.vitorias} / ${data.derrotas}</span></div>
            <div class="metric-item"><span class="label">Taxa de Sucesso</span><span class="value status-green">${data.taxaSucesso.toFixed(1)}%</span></div>
            <div class="metric-item"><span class="label">Lucro Médio / Ação</span><span class="value">${formatCurrency(data.lucroMedio)}</span></div>
        `;
    };

    const renderRankingLavagens = (data) => {
        const container = document.getElementById('ranking-lavagens-list');
        if (!container) return;
        container.innerHTML = data.map((m, i) => `
            <div class="ranking-item">
                <div class="member-info"><span class="rank">#${i + 1}</span> <span>${m.membro}</span></div>
                <span class="value status-green">${formatCurrency(m.lucro)}</span>
            </div>
        `).join('');
    };

    const renderTransacoes = (data) => {
        const tbody = document.getElementById('transacoes-table')?.querySelector('tbody');
        if (!tbody) return;
        tbody.innerHTML = data.slice(0, 5).map(t => `
            <tr>
                <td><div class="transaction-desc">${t.descricao}</div><div class="text-secondary">${new Date(t.data).toLocaleDateString('pt-BR')}</div></td>
                <td class="text-right ${t.tipo === 'entrada' ? 'transaction-type-in' : 'transaction-type-out'}">${formatCurrency(t.valor)}</td>
            </tr>
        `).join('');
    };
    
    // Função Principal para carregar e processar os dados
    const loadData = async () => {
        // --- MOCK DATA (PARA VISUALIZAÇÃO) ---
        // Quando for para produção, substitua esta secção pelos seus `fetch`
        const mock = {
            lavagens: [{ quem_lavou: 'Will', lucro_da_fac: 280000, data: '01/10/2025' }, { quem_lavou: 'Membro B', lucro_da_fac: 195000, data: '29/09/2025' }, { quem_lavou: 'Membro A', lucro_da_fac: 210000, data: '25/09/2025' }],
            acoes: [{ nome_da_ação: 'Ação 1', status: 'Vitória', valor: 350000, data: '28/09/2025' }, { nome_da_ação: 'Ação 2', status: 'Vitória', valor: 420000, data: '26/09/2025' }, { nome_da_ação: 'Ação 3', status: 'Derrota', valor: 0, data: '22/09/2025' }],
            farm: { totals: [{totalSeringas: 50, totalPastaBase: 20, totalCloridrato: 15 }] },
            compras: 125000,
            historicoFluxo: { entradas: [89000, 120000, 150000, 135000, 180000], saidas: [25000, 45000, 50000, 40000, 65000] }
        };
        
        // --- CÁLCULOS ---
        const lucroLavagens = mock.lavagens.reduce((s, a) => s + a.lucro_da_fac, 0);
        const lucroAcoes = mock.acoes.filter(a => a.status === 'Vitória').reduce((s, a) => s + a.valor, 0);
        const totalEntradas = lucroLavagens + lucroAcoes;

        const custoFarm = mock.farm.totals.reduce((sum, member) => sum + (member.totalSeringas * 50) + (member.totalPastaBase * 100) + (member.totalCloridrato * 150), 0);
        const totalSaidas = custoFarm + mock.compras;
        
        const balancoGeral = totalEntradas - totalSaidas;
        const lucroLiquido = totalEntradas > 0 ? (balancoGeral / totalEntradas) * 100 : 0;
        
        // --- Atualizar KPIs ---
        document.getElementById('balanco-geral').textContent = formatCurrency(balancoGeral);
        document.getElementById('total-entradas').textContent = formatCurrency(totalEntradas);
        document.getElementById('total-saidas').textContent = formatCurrency(totalSaidas);
        document.getElementById('lucro-liquido').textContent = `${lucroLiquido.toFixed(2)}%`;
        document.getElementById('balanco-change').textContent = `+12.5% vs mês anterior`;
        document.getElementById('entradas-change').textContent = `+15.2% vs mês anterior`;
        document.getElementById('saidas-change').textContent = `-5.8% vs mês anterior`;
        document.getElementById('lucro-change').textContent = `+2.1% vs mês anterior`;

        // --- Atualizar Gráficos ---
        renderFluxoCaixaChart({ entradas: [...mock.historicoFluxo.entradas, totalEntradas], saidas: [...mock.historicoFluxo.saidas, totalSaidas] });
        entradasChart = renderComposicaoChart('composicaoEntradasChart', entradasChart, ['Lavagens', 'Ações'], [lucroLavagens, lucroAcoes]);
        saidasChart = renderComposicaoChart('composicaoSaidasChart', saidasChart, ['Pagto. Farm', 'Compras Diversas'], [custoFarm, mock.compras]);
        
        // --- Atualizar Cards de Análise ---
        const vitorias = mock.acoes.filter(a => a.status === 'Vitória').length;
        const lucroMedio = vitorias > 0 ? lucroAcoes / vitorias : 0;
        renderPerformanceAcoes({ vitorias: vitorias, derrotas: mock.acoes.length - vitorias, taxaSucesso: (vitorias / mock.acoes.length) * 100, lucroMedio: lucroMedio });
        
        const ranking = mock.lavagens.map(l => ({membro: l.quem_lavou, lucro: l.lucro_da_fac})).sort((a,b) => b.lucro - a.lucro);
        renderRankingLavagens(ranking);

        // --- Atualizar Tabela ---
        const transacoes = [
            ...mock.lavagens.map(l => ({data: l.data, descricao: `Lavagem de ${l.quem_lavou}`, tipo: 'entrada', valor: l.lucro_da_fac})),
            {data: '2025-09-30', descricao: 'Pagamento de Farm Semanal', tipo: 'saida', valor: custoFarm},
            ...mock.acoes.filter(a=>a.status === 'Vitória').map(a => ({data: a.data, descricao: `Lucro Ação: ${a.nome_da_ação}`, tipo: 'entrada', valor: a.valor})),
            {data: '2025-09-26', descricao: 'Compra de Armamento', tipo: 'saida', valor: mock.compras},
        ].sort((a,b) => new Date(b.data) - new Date(a.data));
        renderTransacoes(transacoes);
    };

    // Event Listeners
    document.getElementById('refresh-button-financeiro')?.addEventListener('click', loadData);
    
    loadData(); // Carga inicial dos dados
});
/* =================================== */
/* ARQUIVO CORRIGIDO: farm-detalhes.js */
/* =================================== */

const API_URL_FARM = '/api'; // Caminho do proxy no seu server.js. Está CORRETO.

const formatNumber = (value) => {
    const num = Number(value) || 0;
    return new Intl.NumberFormat('pt-BR').format(num);
};

function showFarmMessage(message, isError = false) {
    const tbody = document.getElementById('farm-table')?.querySelector('tbody');
    if (tbody) {
        const colCount = tbody.parentElement.querySelector('thead tr').childElementCount;
        tbody.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center; color: ${isError ? 'var(--status-red)' : 'inherit'};">${message}</td></tr>`;
    }
}

async function fetchAndDisplayFarmData() {
    try {
        showFarmMessage("Carregando dados da planilha...");
        const response = await fetch(`${API_URL_FARM}?action=getFarm`);
        
        if (!response.ok) throw new Error(`Erro de rede: ${response.statusText}`);
        
        const data = await response.json();
        if (data.error) throw new Error(`Erro da API: ${data.error}`);
        if (!data.grandTotals || !data.logs || !data.totals) throw new Error("Dados da API em formato inesperado.");
        
        updateFarmUI(data);

    } catch (error) {
        console.error("FALHA AO BUSCAR DADOS DE FARM:", error);
        showFarmMessage(`Falha ao carregar dados. Erro: ${error.message}`, true);
        document.getElementById('total-seringas').textContent = '0';
        document.getElementById('total-pasta-base').textContent = '0';
        document.getElementById('total-cloridrato').textContent = '0';
    }
}

function updateFarmUI(data) {
    // *** OTIMIZAÇÃO: Usa os totais gerais que a API já calculou ***
    populateKpiCardsFarm(data.grandTotals);
    renderFarmTable(data.logs);
    renderTopFarmers(data.totals);
}

function populateKpiCardsFarm(grandTotals) {
    document.getElementById('total-seringas').textContent = formatNumber(grandTotals['Seringa']);
    document.getElementById('total-pasta-base').textContent = formatNumber(grandTotals['Pasta Base']);
    document.getElementById('total-cloridrato').textContent = formatNumber(grandTotals['Cloridrato']);
}

function renderFarmTable(logs) {
    const tbody = document.getElementById('farm-table')?.querySelector('tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const recentLogs = logs.slice(0, 10); // Mostra as 10 mais recentes
    if (recentLogs.length === 0) {
         showFarmMessage("Nenhuma entrega registrada recentemente.");
         return;
    }
    recentLogs.forEach(log => {
        tbody.innerHTML += `
            <tr>
                <td>${log.data || 'N/A'}</td>
                <td>${log.membro || 'N/A'}</td>
                <td>${log.tipo || 'N/A'}</td>
                <td class="text-right"><b>${formatNumber(log.quantidade)}</b></td>
            </tr>
        `;
    });
}

function renderTopFarmers(memberTotals) {
    const rankingList = document.getElementById('ranking-list');
    if (!rankingList) return;
    memberTotals.forEach(member => {
        member.totalFarm = (member.totalSeringas || 0) + (member.totalPastaBase || 0) + (member.totalCloridrato || 0);
    });
    const sortedFarmers = memberTotals.sort((a, b) => b.totalFarm - a.totalFarm);
    rankingList.innerHTML = '';
    const topFarmers = sortedFarmers.slice(0, 3);
    if (topFarmers.length === 0) {
        rankingList.innerHTML = '<p style="text-align: center;">Não há dados para exibir o ranking.</p>';
        return;
    }
    topFarmers.forEach((member, index) => {
        if (member.totalFarm > 0) {
            const position = index + 1;
            const rankClass = `rank-${position}`;
            rankingList.innerHTML += `
                <div class="ranking-item ${rankClass}">
                    <div class="item-info">
                        <span class="ranking-position">${position}</span>
                        <span>${member.nome}</span>
                    </div>
                    <span class="item-value positive">${formatNumber(member.totalFarm)} un</span>
                </div>
            `;
        }
    });
}

document.getElementById('refresh-button-farm')?.addEventListener('click', fetchAndDisplayFarmData);
fetchAndDisplayFarmData();
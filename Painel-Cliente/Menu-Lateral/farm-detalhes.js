// farm-detalhes.js (VERSÃO FINAL COM POST E BOTÃO ATUALIZAR)

const API_URL_FARM = '/api/'; // Use sua URL mais recente aqui

function showFarmMessage(message, isError = false) {
    const tbody = document.getElementById('farm-table')?.querySelector('tbody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: ${isError ? 'var(--status-red)' : 'inherit'};">${message}</td></tr>`;
    }
}

async function fetchFarmData() {
    try {
        showFarmMessage("Carregando dados da planilha...");
        
        const response = await fetch(API_URL_FARM, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'getFarm' }) 
        });
        
        if (!response.ok) throw new Error(`Erro de rede: ${response.statusText}`);
        
        const data = await response.json();
        if (data.error) throw new Error(`Erro da API: ${data.error}`);
        if (!data.totals || !data.logs) throw new Error("Dados da API em formato inesperado.");
        
        updateFarmUI(data);

    } catch (error) {
        console.error("FALHA AO BUSCAR DADOS DE FARM:", error);
        showFarmMessage(`Falha ao carregar dados. Verifique o console (F12).`, true);
    }
}

function populateKpiCardsFarm(memberTotals) {
    const totalSeringas = memberTotals.reduce((sum, member) => sum + (member.totalSeringas || 0), 0);
    const totalPastaBase = memberTotals.reduce((sum, member) => sum + (member.totalPastaBase || 0), 0);
    const totalCloridrato = memberTotals.reduce((sum, member) => sum + (member.totalCloridrato || 0), 0);

    document.getElementById('total-seringas').textContent = totalSeringas.toLocaleString('pt-BR');
    document.getElementById('total-pasta-base').textContent = totalPastaBase.toLocaleString('pt-BR');
    document.getElementById('total-cloridrato').textContent = totalCloridrato.toLocaleString('pt-BR');

    const totalFarm = totalSeringas + totalPastaBase + totalCloridrato;
    const farmPreview = document.getElementById('farm-data-preview');
    if (farmPreview) {
        farmPreview.textContent = totalFarm > 1000 ? `${(totalFarm / 1000).toFixed(1)}k` : totalFarm;
    }
}

function renderFarmTable(logs) {
    const tbody = document.getElementById('farm-table')?.querySelector('tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const recentLogs = logs.slice(0, 3);
    if (recentLogs.length === 0) {
         showFarmMessage("Nenhuma entrega registrada recentemente.");
         return;
    }
    recentLogs.forEach(log => {
        tbody.innerHTML += `
            <tr>
                <td>${log.data}</td>
                <td>${log.membro}</td>
                <td>${log.tipo}</td>
                <td class="text-right"><b>${(log.quantidade || 0).toLocaleString('pt-BR')}</b></td>
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
    topFarmers.forEach((member, index) => {
        if(member.totalFarm > 0){
            const position = index + 1;
            const rankClass = `rank-${position}`;
            rankingList.innerHTML += `
                <div class="ranking-item ${rankClass}">
                    <div class="item-info">
                        <span class="ranking-position">${position}</span>
                        <span>${member.nome}</span>
                    </div>
                    <span class="item-value positive">${member.totalFarm.toLocaleString('pt-BR')} un</span>
                </div>
            `;
        }
    });
}

function updateFarmUI(data) {
    populateKpiCardsFarm(data.totals);
    renderFarmTable(data.logs);
    renderTopFarmers(data.totals);
}

// FUNCIONALIDADE DO BOTÃO ADICIONADA AQUI
document.getElementById('refresh-button-farm')?.addEventListener('click', fetchFarmData);

fetchFarmData();
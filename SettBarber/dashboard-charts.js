// Aguarda o DOM carregar para executar os scripts
document.addEventListener('DOMContentLoaded', () => {

    // Cores SettLabs
    const corPrimaria = '#e53e3e';
    const corSecundaria = '#2d2d2d';
    const corTerciaria = '#999';
    const corPrimariaTransparente = 'rgba(229, 62, 62, 0.1)';

    // --- GRÁFICO 1: EVOLUÇÃO DA RECEITA (GRÁFICO DE LINHA) ---
    const ctxReceita = document.getElementById('graficoReceita');
    if (ctxReceita) {
        new Chart(ctxReceita, {
            type: 'line',
            data: {
                labels: ['Dia 1', 'Dia 5', 'Dia 10', 'Dia 15', 'Dia 20', 'Dia 25', 'Dia 30'],
                datasets: [{
                    label: 'Receita',
                    data: [120, 300, 450, 400, 600, 750, 850], // Dados de exemplo
                    borderColor: corPrimaria, // Cor atualizada
                    backgroundColor: corPrimariaTransparente, // Cor atualizada
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // --- GRÁFICO 2: SERVIÇOS MAIS POPULARES (GRÁFICO DE ROSCA) ---
    const ctxServicos = document.getElementById('graficoServicos');
    if (ctxServicos) {
        new Chart(ctxServicos, {
            type: 'doughnut',
            data: {
                labels: ['Corte', 'Barba', 'Corte + Barba'],
                datasets: [{
                    label: 'Nº de Serviços',
                    data: [85, 42, 30], // Dados de exemplo
                    backgroundColor: [
                        corPrimaria,     // Cor atualizada
                        corSecundaria,   // Cor atualizada
                        corTerciaria     // Cor atualizada
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            }
        });
    }

    // --- GRÁFICO 3: HORÁRIOS DE PICO (GRÁFICO DE BARRAS) ---
    const ctxHorarios = document.getElementById('graficoHorarios');
    if (ctxHorarios) {
        new Chart(ctxHorarios, {
            type: 'bar',
            data: {
                labels: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'],
                datasets: [{
                    label: 'Nº de Agendamentos',
                    data: [5, 8, 10, 4, 6, 12, 15, 18, 22, 14], // Dados de exemplo
                    backgroundColor: corPrimaria, // Cor atualizada
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false // Oculta a legenda, pois só há 1 dataset
                    }
                }
            }
        });
    }
});
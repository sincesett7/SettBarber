document.addEventListener('DOMContentLoaded', () => {
    let allMembers = [];

    // Dados de exemplo dos membros
    const mockMembersData = [
        { nome: 'Will', cargo: 'Liderança', dataEntrada: '2024-01-15', status: 'Ativo' },
        { nome: 'Membro A', cargo: 'Gerente', dataEntrada: '2024-03-22', status: 'Ativo' },
        { nome: 'Membro B', cargo: 'Vendedor', dataEntrada: '2024-05-10', status: 'Ativo' },
        { nome: 'Membro C', cargo: 'Recruta', dataEntrada: '2025-09-01', status: 'Em Teste' },
        { nome: 'Membro D', cargo: 'Vendedor', dataEntrada: '2024-07-30', status: 'Ativo' },
        { nome: 'Ex-Membro E', cargo: 'Vendedor', dataEntrada: '2024-02-11', status: 'Inativo' },
    ];

    function renderTable(members) {
        const tbody = document.getElementById('membros-table')?.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (members.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum membro encontrado.</td></tr>';
            return;
        }

        members.forEach(member => {
            let statusClass = '';
            switch (member.status) {
                case 'Ativo':
                    statusClass = 'status-aprovado';
                    break;
                case 'Inativo':
                    statusClass = 'status-recusado';
                    break;
                case 'Em Teste':
                    statusClass = 'status-pendente';
                    break;
            }

            tbody.innerHTML += `
                <tr>
                    <td><b>${member.nome}</b></td>
                    <td>${member.cargo}</td>
                    <td>${new Date(member.dataEntrada).toLocaleDateString('pt-BR')}</td>
                    <td><span class="status-tag ${statusClass}">${member.status}</span></td>
                    <td class="text-right">
                        <button class="action-buttons" title="Editar Membro"><i class="fa-solid fa-pencil"></i></button>
                        <button class="action-buttons" title="Ver Perfil"><i class="fa-solid fa-user"></i></button>
                    </td>
                </tr>
            `;
        });
    }

    // Função de busca
    document.getElementById('search-input')?.addEventListener('keyup', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredMembers = allMembers.filter(member =>
            member.nome.toLowerCase().includes(searchTerm) ||
            member.cargo.toLowerCase().includes(searchTerm)
        );
        renderTable(filteredMembers);
    });

    // Função de inicialização
    function init() {
        allMembers = mockMembersData;
        renderTable(allMembers);
    }

    init();
});
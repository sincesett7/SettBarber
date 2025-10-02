/* ==================== */
/* ARQUIVO: dashboard.js */
/* ==================== */

document.addEventListener('DOMContentLoaded', () => {
    const contentLoader = document.getElementById('content-loader');
    const homeLink = document.getElementById('home-link');
    const allLinks = document.querySelectorAll('.sidebar-nav a');
    
    // Links que carregam páginas (tanto do submenu quanto os normais)
    const pageLinks = document.querySelectorAll('.submenu-item, .page-link');

    // Conteúdo HTML da página inicial, para ser carregado dinamicamente
    const initialContentHTML = `
        <header class="main-header">
            <div class="header-title">
                <h1>Painel do Cliente</h1>
            </div>
            <div class="header-actions">
                <div class="user-profile">
                    <i class="fa-solid fa-user-circle icon-placeholder"></i>
                    <div class="user-info">
                        <span>Will</span>
                        <small>Liderança</small>
                    </div>
                </div>
            </div>
        </header>

        <section class="top-cards-grid">
            <div class="card renewal-card">
                <h3>Valor Total da Renovação</h3>
                <div class="renewal-value">R$ 40,00</div>
                <div class="renewal-date">
                    <i class="fa-solid fa-calendar-check"></i> Vence em: 25/10/2025
                </div>
                <button class="btn btn-outline">Ver Faturas</button>
            </div>
            <div class="card products-card">
                <h3>Produtos da Empresa</h3>
                <p>Explore nossos outros softwares</p>
                <button class="btn btn-primary">Ver Todos os Produtos</button>
            </div>
        </section>

        <section class="card software-table-card">
            <div class="card-header">
                <h3>Softwares Contratados</h3>
            </div>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Software</th>
                            <th>Tipo de Plano</th>
                            <th>Próxima Renovação</th>
                            <th class="text-right">Valor da Renovação</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Lavagem</td>
                            <td><span class="plan-tag plan-basic">Básico</span></td>
                            <td>25/10/2025</td>
                            <td class="text-right">R$ 10,00</td>
                        </tr>
                        <tr>
                            <td>Set</td>
                            <td><span class="plan-tag plan-basic">Básico</span></td>
                            <td>25/10/2025</td>
                            <td class="text-right">R$ 10,00</td>
                        </tr>
                        <tr>
                            <td>Ações</td>
                            <td><span class="plan-tag plan-basic">Básico</span></td>
                            <td>25/10/2025</td>
                            <td class="text-right">R$ 10,00</td>
                        </tr>
                        <tr>
                            <td>Farm</td>
                            <td><span class="plan-tag plan-basic">Básico</span></td>
                            <td>25/10/2025</td>
                            <td class="text-right">R$ 10,00</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    `;

    const loadContent = async (url) => {
        try {
            contentLoader.innerHTML = '<p style="text-align:center; padding: 4rem 0;">Carregando...</p>';
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTML not found: ${response.statusText}`);
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newContent = doc.querySelector('.main-content')?.innerHTML || '<p>Erro: Conteúdo não encontrado na página.</p>';
            contentLoader.innerHTML = newContent;

            const scriptUrl = url.replace('.html', '.js');
            const scriptResponse = await fetch(scriptUrl);
            
            if (scriptResponse.ok) {
                const scriptText = await scriptResponse.text();
                const script = document.createElement('script');
                script.textContent = scriptText;
                document.body.appendChild(script).remove();
            } else {
                 console.warn(`Script not found for: ${url}`);
            }

        } catch (error) {
            console.error('Failed to load content:', error);
            contentLoader.innerHTML = `<p style="text-align:center; color: var(--status-red);">Ocorreu um erro ao carregar a página.</p>`;
        }
    };
    
    const showHome = () => {
        contentLoader.innerHTML = initialContentHTML;
        allLinks.forEach(l => l.classList.remove('active'));
        homeLink.classList.add('active');
    }

    // Event listener para TODOS os links que carregam páginas
    pageLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); 
            allLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Se for um item de submenu, ativa o pai também
            link.closest('.nav-item.has-submenu')?.querySelector('.nav-link').classList.add('active');
            
            const url = link.getAttribute('href');
            loadContent(url);
        });
    });

    homeLink?.addEventListener('click', (e) => {
        e.preventDefault();
        showHome();
    });
    
    showHome();
});
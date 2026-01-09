// script-sectionEdicao.js - Versão completa para dataBaseProfessores

// ==============================
// CONFIGURAÇÃO FIREBASE
// ==============================
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDPPbSA8SB-L_giAhWIqGbPGSMRBDTPi40",
    authDomain: "master-ecossistemaprofessor.firebaseapp.com",
    projectId: "master-ecossistemaprofessor",
    storageBucket: "master-ecossistemaprofessor.firebasestorage.app",
    messagingSenderId: "532224860209",
    appId: "1:532224860209:web:686657b6fae13b937cf510",
    measurementId: "G-B0KMX4E67D"
};

// ==============================
// VARIÁVEIS GLOBAIS
// ==============================
let db = null;
let registros = [];
let selecionado = null;
let selecionadoId = null;

// Constantes do DOM
const SECTION_PASTAS = 'section-pastas';
const SECTION_DETALHES = 'section-detalhes';
const GRID_PERFIS = 'grid-perfis';
const PERFIL_CAMPOS = 'perfil-campos';
const PERFIL_TITULO = 'perfil-nome-titulo';
const BTN_VOLTAR = 'perfil-voltar';
const BTN_SALVAR = 'perfil-salvar';
const DETALHES_DADOS = 'section-detalhesDados';
const DETALHES_BOTOES = 'section-detalhesBotoes';

// ==============================
// UTILITÁRIOS
// ==============================
const el = (id) => document.getElementById(id);
const safe = (v) => (v == null ? '' : String(v));

function mostrarToast(mensagem, tipo = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${
        tipo === 'success' ? 'bg-green-500 text-white' : 
        tipo === 'error' ? 'bg-red-500 text-white' : 
        'bg-blue-500 text-white'
    }`;
    toast.textContent = mensagem;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==============================
// INICIALIZAÇÃO FIREBASE
// ==============================
function initializeFirebase() {
    try {
        console.log('🔥 Inicializando Firebase...');
        
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase não encontrado. Verifique se o script foi carregado.');
        }

        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }
        
        db = firebase.firestore();
        console.log('✅ Firebase inicializado com sucesso');
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
        mostrarToast('Erro ao conectar com o banco de dados', 'error');
        return false;
    }
}

// ==============================
// NAVEGAÇÃO ENTRE SECTIONS
// ==============================
function mostrarSectionPastas() {
    console.log('📁 Mostrando section pastas');
    el(SECTION_PASTAS).classList.remove('hidden');
    el(SECTION_DETALHES).classList.add('hidden');
    selecionado = null;
    selecionadoId = null;
}

function mostrarSectionDetalhes() {
    console.log('📄 Mostrando section detalhes');
    el(SECTION_PASTAS).classList.add('hidden');
    el(SECTION_DETALHES).classList.remove('hidden');
}

// ==============================
// CARREGAR DADOS - dataBaseProfessores
// ==============================
async function carregarRegistros() {
    try {
        if (!db) {
            console.error('❌ Firebase não inicializado');
            mostrarErro('Firebase não inicializado');
            return;
        }

        console.log('📥 Carregando professores do dataBaseProfessores...');
        const snapshot = await db.collection('dataBaseProfessores').get();
        
        registros = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
        }));

        console.log(`✅ ${registros.length} professores carregados`);
        renderGrid();
        
    } catch (err) {
        console.error('❌ Erro ao carregar professores:', err);
        mostrarErro('Erro ao carregar dados: ' + err.message);
    }
}

function mostrarErro(mensagem) {
    const grid = el(GRID_PERFIS);
    if (grid) {
        grid.innerHTML = `
            <div class="col-span-5 flex flex-col items-center justify-center py-12 text-red-500">
                <div class="text-4xl mb-4">❌</div>
                <p class="text-lg font-medium">Erro ao carregar dados</p>
                <p class="text-sm">${mensagem}</p>
            </div>
        `;
    }
}

// ==============================
// RENDERIZAÇÃO DO GRID
// ==============================
function criarCard(item) {
    const card = document.createElement('div');
    card.className = 'relative flex flex-col items-center justify-center bg-white p-3 lg:p-4 rounded-xl shadow hover:shadow-lg cursor-pointer transition-all border border-gray-200 hover:border-orange-300';
    card.style.minHeight = '280px';

    const idValor = item.id;
    card.dataset.id = idValor;

    // Ícone de lixeira no canto superior direito
    const btnExcluir = document.createElement('button');
    btnExcluir.className = 'absolute top-1.5 right-1.5 lg:top-2 lg:right-2 w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center rounded-md hover:bg-red-100 transition-all z-10';
    btnExcluir.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 lg:h-5 lg:w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    `;
    btnExcluir.title = 'Excluir professor';
    btnExcluir.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita abrir os detalhes do professor
        mostrarPopupExclusao(item);
    });
    card.appendChild(btnExcluir);

    // Imagem/Ícone do professor
    const imgContainer = document.createElement('div');
    imgContainer.className = 'flex items-center justify-center mb-2';
    
    // Verificar se tem foto de perfil definida
    const fotoPerfil = item.fotoPerfil;
    if (fotoPerfil && fotoPerfil !== 'icone-padrao') {
        // Exibir imagem
        const img = document.createElement('img');
        img.src = getCaminhoFotoPerfil(fotoPerfil);
        img.alt = item.nome || 'Professor';
        img.className = 'w-32 h-32 lg:w-40 lg:h-40 xl:w-48 xl:h-48 rounded-lg object-cover border-2 border-orange-200';
        img.onerror = function() {
            // Se a imagem falhar ao carregar, mostrar ícone padrão
            this.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.className = 'w-32 h-32 lg:w-40 lg:h-40 xl:w-48 xl:h-48 flex items-center justify-center bg-orange-100 rounded-lg';
            fallback.innerHTML = '<span class="text-4xl lg:text-5xl xl:text-6xl">👨‍🏫</span>';
            this.parentNode.appendChild(fallback);
        };
        imgContainer.appendChild(img);
    } else {
        // Exibir ícone padrão
        const fallback = document.createElement('div');
        fallback.className = 'w-32 h-32 lg:w-40 lg:h-40 xl:w-48 xl:h-48 flex items-center justify-center bg-orange-100 rounded-lg';
        fallback.innerHTML = '<span class="text-4xl lg:text-5xl xl:text-6xl">👨‍🏫</span>';
        imgContainer.appendChild(fallback);
    }

    // Nome do professor
    const nome = document.createElement('p');
    nome.className = 'text-center text-xs font-normal text-gray-800 w-full px-2 mb-1';
    nome.style.lineHeight = '1.3';
    nome.title = item.nome || 'Professor sem nome'; // Tooltip com nome completo
    const nomeCompleto = item.nome || 'Professor sem nome';
    nome.textContent = nomeCompleto.length > 25 ? nomeCompleto.substring(0, 25) + '...' : nomeCompleto;

    // Status do professor
    const status = document.createElement('p');
    status.className = `text-center text-[0.65rem] lg:text-xs font-medium px-2 lg:px-3 py-0.5 lg:py-1 rounded-full ${
        item.status === 'Ativo' ? 'bg-green-100 text-green-700' : 
        item.status === 'Inativo' ? 'bg-red-100 text-red-700' : 
        item.status === 'Férias' ? 'bg-yellow-100 text-yellow-700' :
        item.status === 'Afastado' ? 'bg-gray-100 text-gray-700' :
        'bg-blue-100 text-blue-700'
    }`;
    status.textContent = item.status || 'Ativo';

    card.appendChild(imgContainer);
    card.appendChild(nome);
    card.appendChild(status);

    card.addEventListener('click', () => {
        console.log('🎯 Clicou no professor:', nomeCompleto);
        selecionado = item;
        selecionadoId = idValor;
        abrirDetalhes(item);
    });

    return card;
}

function renderGrid() {
    const grid = el(GRID_PERFIS);
    if (!grid) {
        console.error('❌ Elemento grid-perfis não encontrado');
        return;
    }
    
    console.log('🎨 Renderizando grid com', registros.length, 'professores');
    grid.innerHTML = '';

    if (registros.length === 0) {
        grid.innerHTML = `
            <div class="col-span-5 flex flex-col items-center justify-center py-12 text-gray-500">
                <div class="text-6xl mb-4">👨‍🏫</div>
                <p class="text-lg font-medium">Nenhum professor encontrado</p>
                <p class="text-sm">Todos os professores aparecerão aqui</p>
            </div>
        `;
        return;
    }

    // Ordenar professores por nome
    registros.sort((a, b) => {
        const nomeA = (a.nome || '').toLowerCase();
        const nomeB = (b.nome || '').toLowerCase();
        return nomeA.localeCompare(nomeB);
    });

    registros.forEach((professor) => {
        const card = criarCard(professor);
        grid.appendChild(card);
    });
}

// ==============================
// FORMATAÇÃO DE LABELS E CAMPOS
// ==============================
function formatarLabel(chave) {
    const labels = {
        nome: 'Nome Completo',
        cpf: 'CPF',
        email: 'E-mail',
        contato: 'Telefone/WhatsApp',
        nivel: 'Nível Acadêmico',
        curso: 'Curso',
        pix: 'Chave PIX',
        bairros: 'Bairros de Atuação',
        disciplinas: 'Disciplinas (separadas por vírgula)',
        expAulas: 'Experiência com Aulas Particulares',
        descricaoExpAulas: 'Descrição da Experiência com Aulas',
        expNeuro: 'Experiência com Alunos Atípicos',
        descricaoExpNeuro: 'Descrição da Experiência com Alunos Atípicos',
        expTdics: 'Experiência com TDICs',
        descricaoTdics: 'Descrição da Experiência com TDICs',
        endereco: 'Endereço Completo',
        cep: 'CEP',
        status: 'Status',
        dataAtivacao: 'Data de Ativação',
        fotoPerfil: 'Foto de Perfil',
        segManha: 'Segunda - Manhã',
        segTarde: 'Segunda - Tarde',
        terManha: 'Terça - Manhã',
        terTarde: 'Terça - Tarde',
        quaManha: 'Quarta - Manhã',
        quaTarde: 'Quarta - Tarde',
        quiManha: 'Quinta - Manhã',
        quiTarde: 'Quinta - Tarde',
        sexManha: 'Sexta - Manhã',
        sexTarde: 'Sexta - Tarde',
        sabManha: 'Sábado - Manhã',
        sabTarde: 'Sábado - Tarde'
    };
    
    return labels[chave] || chave.charAt(0).toUpperCase() + chave.slice(1);
}

function criarCampoEditavel(chave, valor) {
    const div = document.createElement('div');
    div.className = 'flex flex-col gap-2';
    
    const label = document.createElement('label');
    label.textContent = formatarLabel(chave);
    label.className = 'text-sm font-medium text-gray-700';
    label.htmlFor = `campo-${chave}`;

    let input;
    const valorStr = safe(valor);
    
    // Campos especiais
    if (chave === 'status') {
        input = document.createElement('select');
        input.className = 'w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500';
        
        const opcoes = ['Ativo', 'Inativo', 'Férias', 'Afastado'];
        opcoes.forEach(opcao => {
            const option = document.createElement('option');
            option.value = opcao;
            option.textContent = opcao;
            option.selected = valorStr === opcao;
            input.appendChild(option);
        });
    }
    // Campo de Foto de Perfil
    else if (chave === 'fotoPerfil') {
        input = document.createElement('select');
        input.className = 'w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500';
        
        const opcoes = getOpcoesFotoPerfil();
        opcoes.forEach(opcao => {
            const option = document.createElement('option');
            option.value = opcao;
            option.textContent = opcao === 'icone-padrao' ? 'Ícone Padrão' : opcao.replace('.png', '');
            option.selected = valorStr === opcao || (!valorStr && opcao === 'icone-padrao');
            input.appendChild(option);
        });
    }
    // Campos booleanos (disponibilidade)
    else if (chave.includes('Manha') || chave.includes('Tarde')) {
        input = document.createElement('select');
        input.className = 'w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500';
        
        const opcoes = [
            { value: 'true', label: '✅ Disponível' },
            { value: 'false', label: '❌ Indisponível' }
        ];
        
        opcoes.forEach(opcao => {
            const option = document.createElement('option');
            option.value = opcao.value;
            option.textContent = opcao.label;
            option.selected = String(valorStr) === opcao.value;
            input.appendChild(option);
        });
    }
    // Campos longos
    else if (valorStr.length > 100 || chave.includes('descricao')) {
        input = document.createElement('textarea');
        input.rows = 4;
        input.className = 'w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-vertical';
    } 
    // Campos normais
    else {
        input = document.createElement('input');
        input.type = 'text';
        input.className = 'w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500';
    }

    input.id = `campo-${chave}`;
    input.name = chave;
    
    if (input.type !== 'select-one') {
        input.value = valorStr;
    }
    
    input.dataset.field = chave;

    div.appendChild(label);
    div.appendChild(input);

    // Se for campo de foto de perfil, adicionar preview
    if (chave === 'fotoPerfil') {
        const previewContainer = document.createElement('div');
        previewContainer.className = 'mt-3 flex justify-center';
        previewContainer.id = 'preview-foto-perfil';
        
        const atualizarPreview = (valor) => {
            previewContainer.innerHTML = '';
            if (valor && valor !== 'icone-padrao') {
                const imgPreview = document.createElement('img');
                imgPreview.src = getCaminhoFotoPerfil(valor);
                imgPreview.alt = 'Preview';
                imgPreview.className = 'w-64 h-64 rounded-lg object-cover border-2 border-orange-300 shadow-md';
                imgPreview.onerror = function() {
                    previewContainer.innerHTML = '<p class="text-sm text-red-500">Erro ao carregar imagem</p>';
                };
                previewContainer.appendChild(imgPreview);
            } else {
                const iconPreview = document.createElement('div');
                iconPreview.className = 'w-64 h-64 flex items-center justify-center bg-orange-100 rounded-lg border-2 border-orange-300';
                iconPreview.innerHTML = '<span class="text-8xl">👨‍🏫</span>';
                previewContainer.appendChild(iconPreview);
            }
        };
        
        // Preview inicial
        atualizarPreview(valorStr || 'icone-padrao');
        
        // Atualizar preview quando selecionar nova foto
        input.addEventListener('change', (e) => {
            atualizarPreview(e.target.value);
        });
        
        div.appendChild(previewContainer);
    }

    return div;
}

// ==============================
// DETALHES DO PERFIL
// ==============================
function abrirDetalhes(item) {
    console.log('📖 Abrindo detalhes do professor:', item.id);
    
    // Atualizar título
    const titulo = el(PERFIL_TITULO);
    if (titulo) {
        titulo.textContent = safe(item.nome) || 'Detalhes do Professor';
    }

    // Limpar e preencher campos
    const container = el(PERFIL_CAMPOS);
    container.innerHTML = '';

    // Ordenar campos para melhor organização
    const camposPrioritarios = [
        'nome', 'cpf', 'email', 'contato', 'nivel', 'curso', 
        'pix', 'bairros', 'disciplinas', 'status', 'fotoPerfil'
    ];
    
    const camposDisponibilidade = [
        'segManha', 'segTarde', 'terManha', 'terTarde', 
        'quaManha', 'quaTarde', 'quiManha', 'quiTarde',
        'sexManha', 'sexTarde', 'sabManha', 'sabTarde'
    ];
    
    const outrosCampos = Object.keys(item)
        .filter(k => k !== 'id' && !camposPrioritarios.includes(k) && !camposDisponibilidade.includes(k));

    // Adicionar seção de informações básicas
    const secaoInfo = document.createElement('div');
    secaoInfo.className = 'col-span-2 mb-6';
    secaoInfo.innerHTML = '<h3 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Informações Básicas</h3>';
    const gridInfo = document.createElement('div');
    gridInfo.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
    secaoInfo.appendChild(gridInfo);
    container.appendChild(secaoInfo);

    camposPrioritarios.forEach((chave) => {
        if (item.hasOwnProperty(chave) || chave === 'status' || chave === 'fotoPerfil') {
            const valor = item[chave] || (chave === 'fotoPerfil' ? 'icone-padrao' : '');
            const campoElement = criarCampoEditavel(chave, valor);
            gridInfo.appendChild(campoElement);
        }
    });

    // Adicionar seção de disponibilidade
    const secaoDisp = document.createElement('div');
    secaoDisp.className = 'col-span-2 mb-6';
    secaoDisp.innerHTML = '<h3 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Disponibilidade</h3>';
    const gridDisp = document.createElement('div');
    gridDisp.className = 'grid grid-cols-2 md:grid-cols-3 gap-4';
    secaoDisp.appendChild(gridDisp);
    container.appendChild(secaoDisp);

    camposDisponibilidade.forEach((chave) => {
        const valor = item[chave] || false;
        const campoElement = criarCampoEditavel(chave, valor);
        gridDisp.appendChild(campoElement);
    });

    // Adicionar seção de experiências
    if (outrosCampos.length > 0) {
        const secaoExp = document.createElement('div');
        secaoExp.className = 'col-span-2 mb-6';
        secaoExp.innerHTML = '<h3 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Experiências e Observações</h3>';
        const gridExp = document.createElement('div');
        gridExp.className = 'grid grid-cols-1 gap-4';
        secaoExp.appendChild(gridExp);
        container.appendChild(secaoExp);

        outrosCampos.forEach((chave) => {
            const valor = item[chave] || '';
            const campoElement = criarCampoEditavel(chave, valor);
            gridExp.appendChild(campoElement);
        });
    }

    mostrarSectionDetalhes();
    
    // Scroll para o topo
    const detalhesDados = el(DETALHES_DADOS);
    if (detalhesDados) {
        detalhesDados.scrollTop = 0;
    }
}

// ==============================
// EXCLUSÃO DE PROFESSOR
// ==============================
function mostrarPopupExclusao(professor) {
    const nomeProfessor = professor.nome || 'este professor';
    
    // Criar overlay
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    overlay.id = 'popup-exclusao';
    
    // Criar popup
    const popup = document.createElement('div');
    popup.className = 'bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all';
    popup.innerHTML = `
        <div class="flex items-center justify-center mb-4">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </div>
        </div>
        <h3 class="text-xl font-bold text-gray-800 text-center mb-2">Deseja excluir este professor?</h3>
        <p class="text-gray-600 text-center mb-6">O professor <strong>${nomeProfessor}</strong> será removido permanentemente do banco de dados.</p>
        <div class="flex gap-3">
            <button id="btn-cancelar-exclusao" class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-all">
                Cancelar
            </button>
            <button id="btn-confirmar-exclusao" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-all">
                Excluir
            </button>
        </div>
    `;
    
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    // Eventos dos botões
    document.getElementById('btn-cancelar-exclusao').addEventListener('click', () => {
        fecharPopupExclusao();
    });
    
    document.getElementById('btn-confirmar-exclusao').addEventListener('click', () => {
        excluirProfessor(professor.id);
    });
    
    // Fechar ao clicar no overlay
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            fecharPopupExclusao();
        }
    });
}

function fecharPopupExclusao() {
    const popup = document.getElementById('popup-exclusao');
    if (popup) {
        popup.remove();
    }
}

async function excluirProfessor(professorId) {
    try {
        console.log('🗑️ Excluindo professor:', professorId);
        
        // Mostrar loading no botão
        const btnConfirmar = document.getElementById('btn-confirmar-exclusao');
        if (btnConfirmar) {
            btnConfirmar.textContent = 'Excluindo...';
            btnConfirmar.disabled = true;
        }
        
        // Excluir do Firebase
        await db.collection('dataBaseProfessores').doc(professorId).delete();
        
        console.log('✅ Professor excluído com sucesso');
        
        // Remover dos registros locais
        registros = registros.filter(r => r.id !== professorId);
        
        // Fechar popup
        fecharPopupExclusao();
        
        // Mostrar mensagem de sucesso
        mostrarToast('Professor excluído com sucesso!', 'success');
        
        // Atualizar grid
        renderGrid();
        
        // Se estava visualizando o professor excluído, voltar para a lista
        if (selecionadoId === professorId) {
            mostrarSectionPastas();
        }
        
    } catch (err) {
        console.error('❌ Erro ao excluir professor:', err);
        mostrarToast('Erro ao excluir professor: ' + (err.message || 'Tente novamente.'), 'error');
        
        // Restaurar botão em caso de erro
        const btnConfirmar = document.getElementById('btn-confirmar-exclusao');
        if (btnConfirmar) {
            btnConfirmar.textContent = 'Excluir';
            btnConfirmar.disabled = false;
        }
    }
}

// ==============================
// SALVAR ALTERAÇÕES
// ==============================
async function salvarAlteracoes() {
    if (!selecionado || !selecionadoId) {
        mostrarToast('Nenhum professor selecionado para salvar.', 'error');
        return;
    }

    const container = el(PERFIL_CAMPOS);
    const inputs = Array.from(container.querySelectorAll('input, textarea, select'));
    const dadosAtualizados = {};

    inputs.forEach((input) => {
        if (input.dataset.field) {
            let valor = input.value.trim();
            
            // Converter valores booleanos
            if (input.tagName === 'SELECT' && (input.dataset.field.includes('Manha') || input.dataset.field.includes('Tarde'))) {
                valor = valor === 'true';
            }
            
            dadosAtualizados[input.dataset.field] = valor;
        }
    });

    // Validação básica
    if (!dadosAtualizados.nome || dadosAtualizados.nome.trim() === '') {
        mostrarToast('O campo "Nome Completo" é obrigatório.', 'error');
        return;
    }

    console.log('💾 Salvando alterações do professor:', {
        id: selecionadoId,
        dados: dadosAtualizados
    });

    try {
        // Mostrar loading no botão
        const btnSalvar = el(BTN_SALVAR);
        const textoOriginal = btnSalvar.textContent;
        btnSalvar.textContent = 'Salvando...';
        btnSalvar.disabled = true;

        // Salvar na coleção dataBaseProfessores
        await db.collection('dataBaseProfessores').doc(selecionadoId).update(dadosAtualizados);

        // Restaurar botão
        btnSalvar.textContent = textoOriginal;
        btnSalvar.disabled = false;

        console.log('✅ Alterações salvas com sucesso');
        
        // Atualizar dados locais
        const index = registros.findIndex(r => r.id === selecionadoId);
        if (index !== -1) {
            registros[index] = { ...registros[index], ...dadosAtualizados };
        }

        mostrarToast('Alterações salvas com sucesso!', 'success');
        mostrarSectionPastas();
        
    } catch (err) {
        console.error('❌ Erro ao salvar:', err);
        mostrarToast('Erro ao salvar alterações: ' + (err.message || 'Tente novamente.'), 'error');
        
        // Restaurar botão em caso de erro
        const btnSalvar = el(BTN_SALVAR);
        btnSalvar.textContent = 'Salvar Alterações';
        btnSalvar.disabled = false;
    }
}

// ==============================
// INICIALIZAÇÃO DA APLICAÇÃO
// ==============================
function inicializarApp() {
    console.log('🚀 Inicializando aplicação de edição de professores...');
    
    // Verificar se elementos existem
    const elementosNecessarios = [SECTION_PASTAS, SECTION_DETALHES, GRID_PERFIS, PERFIL_CAMPOS, BTN_VOLTAR, BTN_SALVAR];
    const elementosFaltantes = elementosNecessarios.filter(id => !el(id));
    
    if (elementosFaltantes.length > 0) {
        console.error('❌ Elementos não encontrados:', elementosFaltantes);
        mostrarToast('Erro na inicialização da página', 'error');
        return;
    }

    console.log('✅ Todos os elementos encontrados');

    // Configurar botões
    el(BTN_VOLTAR).addEventListener('click', mostrarSectionPastas);
    el(BTN_SALVAR).addEventListener('click', salvarAlteracoes);

    // Carregar dados
    carregarRegistros();

    // Mostrar section de pastas inicialmente
    mostrarSectionPastas();
    
    console.log('🎉 Aplicação de edição inicializada com sucesso');
}

// ==============================
// INICIALIZAÇÃO DO FIREBASE E APP
// ==============================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM carregado, iniciando aplicação...');
    
    // Inicializar Firebase primeiro
    if (initializeFirebase()) {
        inicializarApp();
    } else {
        console.error('❌ Falha na inicialização do Firebase');
        mostrarErro('Falha ao conectar com o banco de dados');
    }
});
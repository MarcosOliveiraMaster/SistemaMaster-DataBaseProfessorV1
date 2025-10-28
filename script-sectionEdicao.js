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
    card.className = 'flex flex-col items-center justify-center bg-white p-4 rounded-xl shadow hover:shadow-lg cursor-pointer transition-all border border-gray-200 hover:border-orange-300';
    card.style.minHeight = '140px';

    const idValor = item.id;
    card.dataset.id = idValor;

    // Imagem/Ícone do professor
    const imgContainer = document.createElement('div');
    imgContainer.className = 'flex items-center justify-center mb-3';
    
    const fallback = document.createElement('div');
    fallback.className = 'w-16 h-16 flex items-center justify-center bg-orange-100 rounded-lg';
    fallback.innerHTML = '<span class="text-2xl">👨‍🏫</span>';
    imgContainer.appendChild(fallback);

    // Nome do professor
    const nome = document.createElement('p');
    nome.className = 'text-center text-sm font-medium text-gray-700 truncate w-full px-2';
    const nomeCompleto = item.nome || 'Professor sem nome';
    nome.textContent = nomeCompleto.length > 20 ? nomeCompleto.substring(0, 20) + '...' : nomeCompleto;

    // Status do professor
    const status = document.createElement('p');
    status.className = `text-center text-xs mt-1 px-2 py-1 rounded-full ${
        item.status === 'Ativo' ? 'bg-green-100 text-green-800' : 
        item.status === 'Inativo' ? 'bg-red-100 text-red-800' : 
        'bg-gray-100 text-gray-800'
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
        'pix', 'bairros', 'disciplinas', 'status'
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
        if (item.hasOwnProperty(chave) || chave === 'status') {
            const valor = item[chave] || '';
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
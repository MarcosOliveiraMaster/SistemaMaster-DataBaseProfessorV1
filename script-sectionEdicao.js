// script-sectionEdicao.js - Versão corrigida

// INICIALIZAÇÃO DO FIREBASE
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDPPbSA8SB-L_giAhWIqGbPGSMRBDTPi40",
    authDomain: "master-ecossistemaprofessor.firebaseapp.com",
    databaseURL: "https://master-ecossistemaprofessor-default-rtdb.firebaseio.com",
    projectId: "master-ecossistemaprofessor",
    storageBucket: "master-ecossistemaprofessor.firebasestorage.app",
    messagingSenderId: "532224860209",
    appId: "1:532224860209:web:686657b6fae13b937cf510",
    measurementId: "G-B0KMX4E67D"
};

// Variáveis globais
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

// Utilitários
const el = (id) => document.getElementById(id);
const safe = (v) => (v == null ? '' : String(v));

// ------------------- INICIALIZAÇÃO DO FIREBASE -------------------
function initializeFirebase() {
    try {
        console.log('🔥 Inicializando Firebase...');
        
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase não encontrado. Verifique se o script foi carregado.');
        }

        // Verificar se já existe um app inicializado
        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }
        
        db = firebase.firestore();
        console.log('✅ Firebase inicializado com sucesso');
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
        return false;
    }
}

// ------------------- NAVEGAÇÃO ENTRE SECTIONS -------------------
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

// ------------------- GRID DE PASTAS -------------------
function criarCard(item) {
    const card = document.createElement('div');
    card.className = 'flex flex-col items-center justify-center bg-white p-4 rounded-xl shadow hover:shadow-lg cursor-pointer transition-all border border-gray-200 hover:border-orange-300';
    card.style.minHeight = '140px';

    const idValor = item.id;
    card.dataset.id = idValor;

    // Imagem da pasta
    const imgContainer = document.createElement('div');
    imgContainer.className = 'flex items-center justify-center mb-3';
    
    const img = document.createElement('img');
    img.src = 'img/pasta.png';
    img.alt = 'Pasta do Professor';
    img.className = 'w-16 h-16 object-contain';
    img.onerror = () => {
        img.remove();
        const fallback = document.createElement('div');
        fallback.className = 'w-16 h-16 flex items-center justify-center bg-orange-100 rounded-lg';
        fallback.innerHTML = '<span class="text-2xl">📁</span>';
        imgContainer.appendChild(fallback);
    };
    imgContainer.appendChild(img);

    // Nome do professor
    const nome = document.createElement('p');
    nome.className = 'text-center text-sm font-medium text-gray-700 truncate w-full px-2';
    const nomeCompleto = item.nome || item.Nome || 'Sem nome';
    nome.textContent = nomeCompleto.length > 20 ? nomeCompleto.substring(0, 20) + '...' : nomeCompleto;

    card.appendChild(imgContainer);
    card.appendChild(nome);

    card.addEventListener('click', () => {
        console.log('🎯 Clicou no card:', nomeCompleto);
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
    
    console.log('🎨 Renderizando grid com', registros.length, 'itens');
    grid.innerHTML = '';

    if (registros.length === 0) {
        grid.innerHTML = `
            <div class="col-span-5 flex flex-col items-center justify-center py-12 text-gray-500">
                <div class="text-6xl mb-4">📁</div>
                <p class="text-lg font-medium">Nenhum professor encontrado</p>
                <p class="text-sm">Verifique se há dados no banco</p>
            </div>
        `;
        return;
    }

    registros.forEach((r) => {
        const card = criarCard(r);
        grid.appendChild(card);
    });
}

// ------------------- SECTION DETALHES -------------------
function criarCampoEditavel(chave, valor) {
    const div = document.createElement('div');
    div.className = 'flex flex-col gap-2';
    
    const label = document.createElement('label');
    label.textContent = formatarLabel(chave);
    label.className = 'text-sm font-medium text-gray-700';
    label.htmlFor = `campo-${chave}`;

    let input;
    const valorStr = safe(valor);
    
    // Decide entre input e textarea baseado no conteúdo
    if (valorStr.length > 100 || valorStr.includes('\n')) {
        input = document.createElement('textarea');
        input.rows = 4;
        input.className = 'w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-vertical';
    } else {
        input = document.createElement('input');
        input.type = 'text';
        input.className = 'w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500';
    }

    input.id = `campo-${chave}`;
    input.name = chave;
    input.value = valorStr;
    input.dataset.field = chave;

    div.appendChild(label);
    div.appendChild(input);

    return div;
}

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
        disciplinas: 'Disciplinas',
        expAulas: 'Experiência com Aulas',
        descricaoExpAulas: 'Descrição da Experiência com Aulas',
        expNeuro: 'Experiência com Neurociência',
        descricaoExpNeuro: 'Descrição da Experiência com Neurociência',
        expTdics: 'Experiência com TDICs',
        descricaoTdics: 'Descrição da Experiência com TDICs',
        endereco: 'Endereço Completo',
        cep: 'CEP',
        enderecoOficial: 'Endereço Oficial',
        timestamp: 'Data de Cadastro',
        dataEnvio: 'Data de Envio'
    };
    
    return labels[chave] || chave.charAt(0).toUpperCase() + chave.slice(1);
}

function abrirDetalhes(item) {
    console.log('📖 Abrindo detalhes do item:', item.id);
    
    // Atualizar título
    const titulo = el(PERFIL_TITULO);
    if (titulo) {
        titulo.textContent = safe(item.nome) || safe(item.Nome) || 'Detalhes do Perfil';
    }

    // Limpar e preencher campos
    const container = el(PERFIL_CAMPOS);
    container.innerHTML = '';

    // Ordenar campos para melhor organização
    const camposPrioritarios = ['nome', 'cpf', 'email', 'contato', 'nivel', 'curso', 'pix'];
    const outrosCampos = Object.keys(item).filter(k => k !== 'id' && !camposPrioritarios.includes(k));
    
    const camposOrdenados = [...camposPrioritarios, ...outrosCampos];

    camposOrdenados.forEach((chave) => {
        if (chave !== 'id') {
            const valor = item[chave];
            const campoElement = criarCampoEditavel(chave, valor);
            container.appendChild(campoElement);
        }
    });

    mostrarSectionDetalhes();
    
    // Scroll para o topo
    const detalhesDados = el(DETALHES_DADOS);
    if (detalhesDados) {
        detalhesDados.scrollTop = 0;
    }
}

// ------------------- SALVAR ALTERAÇÕES -------------------
async function salvarAlteracoes() {
    if (!selecionado || !selecionadoId) {
        alert('❌ Nenhum perfil selecionado para salvar.');
        return;
    }

    const container = el(PERFIL_CAMPOS);
    const inputs = Array.from(container.querySelectorAll('input, textarea'));
    const dadosAtualizados = {};

    inputs.forEach((input) => {
        if (input.dataset.field) {
            dadosAtualizados[input.dataset.field] = input.value.trim();
        }
    });

    // Validação básica
    if (!dadosAtualizados.nome || dadosAtualizados.nome.trim() === '') {
        alert('⚠️ O campo "Nome Completo" é obrigatório.');
        return;
    }

    console.log('💾 Salvando alterações:', {
        id: selecionadoId,
        dados: dadosAtualizados
    });

    try {
        // Mostrar loading no botão
        const btnSalvar = el(BTN_SALVAR);
        const textoOriginal = btnSalvar.textContent;
        btnSalvar.textContent = 'Salvando...';
        btnSalvar.disabled = true;

        await db.collection('candidatos').doc(selecionadoId).update(dadosAtualizados);

        // Restaurar botão
        btnSalvar.textContent = textoOriginal;
        btnSalvar.disabled = false;

        console.log('✅ Alterações salvas com sucesso');
        
        // Atualizar dados locais
        const index = registros.findIndex(r => r.id === selecionadoId);
        if (index !== -1) {
            registros[index] = { ...registros[index], ...dadosAtualizados };
        }

        alert('✅ Alterações salvas com sucesso!');
        mostrarSectionPastas();
        
    } catch (err) {
        console.error('❌ Erro ao salvar:', err);
        alert('❌ Erro ao salvar alterações: ' + (err.message || 'Tente novamente.'));
        
        // Restaurar botão em caso de erro
        const btnSalvar = el(BTN_SALVAR);
        btnSalvar.textContent = 'Salvar Alterações';
        btnSalvar.disabled = false;
    }
}

// ------------------- CARREGAR DADOS -------------------
async function carregarRegistros() {
    try {
        if (!db) {
            console.error('❌ Firebase não inicializado');
            mostrarErro('Firebase não inicializado');
            return;
        }

        console.log('📥 Carregando registros do Firebase...');
        const snapshot = await db.collection('candidatos').get();
        
        registros = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
        }));

        console.log(`✅ ${registros.length} registros carregados`, registros);
        renderGrid();
        
    } catch (err) {
        console.error('❌ Erro ao carregar registros:', err);
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

// ------------------- INICIALIZAÇÃO -------------------
function inicializarApp() {
    console.log('🚀 Inicializando aplicação...');
    
    // Verificar se elementos existem
    const elementosNecessarios = [SECTION_PASTAS, SECTION_DETALHES, GRID_PERFIS, PERFIL_CAMPOS, BTN_VOLTAR, BTN_SALVAR];
    const elementosFaltantes = elementosNecessarios.filter(id => !el(id));
    
    if (elementosFaltantes.length > 0) {
        console.error('❌ Elementos não encontrados:', elementosFaltantes);
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
    
    console.log('🎉 Aplicação inicializada com sucesso');
}

// ------------------- INICIALIZAÇÃO DO FIREBASE E APP -------------------
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
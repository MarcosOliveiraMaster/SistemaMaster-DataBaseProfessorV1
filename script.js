// script.js — versão corrigida para dataBaseProfessores

// ---------------- FIREBASE CONFIG ----------------
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

// Inicialização do Firebase
let firebaseApp = null;
let db = null;

function initializeFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase não encontrado');
        }
        firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
        db = firebase.firestore();
        console.log('✅ Firebase inicializado com sucesso');
        return true;
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
        if (error.code === 'app/duplicate-app') {
            firebaseApp = firebase.app();
            db = firebase.firestore();
            return true;
        }
        return false;
    }
}

// ---------------- GLOBAIS ----------------
const MASKS_STORAGE_KEY = 'tableColumnMasks';
const COLUMN_ORDER_KEY = 'tableColumnOrder';

const defaultMasks = {
    nome: 'Nome Professor',
    cpf: 'CPF',
    email: 'E-mail',
    contato: 'Contato',
    nivel: 'Nível Acadêmico',
    expAulas: 'Experiência em Aulas',
    descricaoExpAulas: 'Descrição da Experiência',
    bairros: 'Bairros de acesso',
    curso: 'Curso de Formação e Instituição',
    expNeuro: 'Experiência com alunos atípicos',
    descricaoExpNeuro: 'Experiência com alunos atípicos',
    expTdics: 'Experiência com Tecnologias Educacionais',
    descricaoTdics: 'Descrição da Experiência com Tecnologias Educacionais',
    pix: 'Chave Pix',
    status: 'Status',
    dataAtivacao: 'Data de Ativação'
};

function loadMasks() {
    try {
        const raw = localStorage.getItem(MASKS_STORAGE_KEY);
        if (raw) {
            return Object.assign({}, defaultMasks, JSON.parse(raw));
        }
    } catch (e) { console.warn('Erro ao carregar máscaras:', e); }
    return Object.assign({}, defaultMasks);
}

function saveMasks(masks) {
    try {
        localStorage.setItem(MASKS_STORAGE_KEY, JSON.stringify(masks));
    } catch (e) { console.warn('Erro ao salvar máscaras:', e); }
}

function loadColumnOrder() {
    try {
        const raw = localStorage.getItem(COLUMN_ORDER_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) { 
        console.warn('Erro ao carregar ordem das colunas:', e);
        return [];
    }
}

function saveColumnOrder(order) {
    try {
        localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(order));
    } catch (e) { console.warn('Erro ao salvar ordem das colunas:', e); }
}

let masks = loadMasks();
let dadosTabela = null;
let colunasDisponiveis = [];
let colunasSelecionadas = [];
let colunasOrdemPersonalizada = loadColumnOrder();
let dadosAlterados = new Map();
let colWidths = {};
let sortState = { column: null, dir: null };

const colunasOcultas = ['id'];
const colunasDiasTurnos = [
    'segManha', 'segTarde', 'terManha', 'terTarde', 
    'quaManha', 'quaTarde', 'quiManha', 'quiTarde', 
    'sexManha', 'sexTarde', 'sabManha', 'sabTarde'
];
const tituloPrincipal = "Dashboard de Professores";
const subtitulo = "Ester Calazans: Administradora geral";

// ---------------- UTIL ----------------
function debounce(fn, wait = 160) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

function carregarColWidths() {
    try {
        const s = localStorage.getItem('colWidths_v1');
        if (s) colWidths = JSON.parse(s);
    } catch (e) { colWidths = {}; }
}

function salvarColWidths() {
    try { localStorage.setItem('colWidths_v1', JSON.stringify(colWidths)); } catch (e) {}
}

function salvarPreferencias() { 
    localStorage.setItem('colunasSelecionadas', JSON.stringify(colunasSelecionadas)); 
}

function carregarPreferencias() { 
    const s = localStorage.getItem('colunasSelecionadas'); 
    if (s) colunasSelecionadas = JSON.parse(s); 
}

// ---------------- FUNÇÃO SIMPLIFICADA DE ORDENAÇÃO ----------------
function aplicarOrdemColunas(colunas) {
    if (colunasOrdemPersonalizada.length === 0) {
        return colunas;
    }
    
    // Filtrar apenas as colunas que estão tanto na ordem personalizada quanto nas selecionadas
    const colunasOrdenadas = colunasOrdemPersonalizada.filter(col => 
        colunas.includes(col)
    );
    
    // Adicionar quaisquer colunas que não estão na ordem personalizada
    colunas.forEach(col => {
        if (!colunasOrdenadas.includes(col)) {
            colunasOrdenadas.push(col);
        }
    });
    
    return colunasOrdenadas;
}

// ---------------- INICIALIZAÇÃO ----------------
document.addEventListener('DOMContentLoaded', () => {
    const t = document.getElementById('tituloPrincipal');
    if (t) t.innerText = tituloPrincipal;
    const s = document.getElementById('subtitulo');
    if (s) s.innerText = subtitulo;
    
    if (initializeFirebase()) {
        carregarPreferencias();
        carregarColWidths();
        inicializarApp();
    } else {
        console.error('❌ Não foi possível inicializar o Firebase');
    }
});

function inicializarApp() {
    // Configuração de eventos
    document.getElementById('btnSec1')?.addEventListener('click', () => trocarSecao(1));
    
    document.querySelectorAll('input[name="filtroDisciplinas"]').forEach(cb => {
        cb.addEventListener('change', () => aplicarFiltros());
    });

    document.querySelectorAll('input[name="filtroCategorias"]').forEach(cb => {
        cb.addEventListener('change', () => aplicarFiltros());
    });

    // Dropdowns
    document.getElementById('dropdownToggle')?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('dropdownMenu')?.classList.toggle('hidden');
    });
    document.getElementById('disciplinasToggle')?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('disciplinasMenu')?.classList.toggle('hidden');
    });
    document.getElementById('categoriasToggle')?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('categoriasMenu')?.classList.toggle('hidden');
    });
    document.getElementById('diasTurnosToggle')?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('diasTurnosMenu')?.classList.toggle('hidden');
    });

    // Fechar menus ao clicar fora
    document.addEventListener('click', (e) => {
        const menus = [
            { btn: 'dropdownToggle', menu: 'dropdownMenu' },
            { btn: 'disciplinasToggle', menu: 'disciplinasMenu' },
            { btn: 'categoriasToggle', menu: 'categoriasMenu' },
            { btn: 'diasTurnosToggle', menu: 'diasTurnosMenu' }
        ];
        menus.forEach(({btn, menu}) => {
            const b = document.getElementById(btn);
            const m = document.getElementById(menu);
            if (!m || !b) return;
            if (!m.classList.contains('hidden') && !m.contains(e.target) && !b.contains(e.target)) {
                m.classList.add('hidden');
            }
        });
    });

    montarDiasTurnos();

    // Botões
    document.getElementById('btn1')?.addEventListener('click', salvarAlteracoes);
    document.getElementById('limparBusca')?.addEventListener('click', limparFiltros);

    // Filtros de texto
    const inputNome = document.getElementById('filtroNome');
    const inputBairro = document.getElementById('filtroBairro');
    const aplicarDebounced = debounce(() => aplicarFiltros(), 160);
    inputNome?.addEventListener('input', aplicarDebounced);
    inputBairro?.addEventListener('input', aplicarDebounced);

    // Redimensionamento
    document.addEventListener('mousemove', redimensionarColuna);
    document.addEventListener('mouseup', pararRedimensionamento);

    carregarDadosFirebase();
}

function trocarSecao(id) {
    ['secao1','secao2','secao3'].forEach(s => document.getElementById(s)?.classList.add('hidden'));
    document.getElementById(`secao${id}`)?.classList.remove('hidden');
}

// ---------------- CARREGAR DADOS FIREBASE ----------------
async function carregarDadosFirebase() {
    try {
        showLoadingState();
        
        if (!db) {
            throw new Error('Firebase não inicializado');
        }

        const snapshot = await db.collection('dataBaseProfessores').get();
        const data = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
        }));

        if (data && data.length > 0) {
            dadosTabela = data;
            
            const todasColunas = Object.keys(data[0]);
            colunasDisponiveis = todasColunas.filter(c => 
                !colunasOcultas.includes(c) && !colunasDiasTurnos.includes(c)
            );
            
            colunasDisponiveis.push('Disponibilidade');
            
            if (colunasSelecionadas.length === 0) {
                colunasSelecionadas = [...colunasDisponiveis];
            }

            // Aplicar ordem personalizada
            colunasSelecionadas = aplicarOrdemColunas(colunasSelecionadas);
            
            criarDropdownColunas();
            aplicarFiltros();
        } else {
            dadosTabela = [];
            const tbody = document.querySelector('#tabela-dados tbody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="100%" class="px-6 py-4 text-center text-gray-500">Nenhum professor encontrado</td></tr>';
        }
    } catch (err) {
        console.error('Erro carregar dados Firebase:', err);
        const tbody = document.querySelector('#tabela-dados tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="100%" class="px-6 py-4 text-center text-red-500">Erro ao carregar dados</td></tr>';
    }
}

function showLoadingState() {
    const tbody = document.querySelector('#tabela-dados tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="100%" class="px-6 py-4 text-center text-gray-500">Carregando professores...</td></tr>';
}

// ---------------- DROPDOWN COLUNAS SIMPLIFICADO ----------------
function criarDropdownColunas() {
    const columnsList = document.getElementById('columnsList');
    if (!columnsList) return;
    columnsList.innerHTML = '';

    // Ordenar colunas pela ordem personalizada
    const colunasOrdenadas = aplicarOrdemColunas([...colunasDisponiveis]);

    colunasOrdenadas.forEach(coluna => {
        const div = document.createElement('div');
        div.className = 'px-4 py-2 text-sm text-gray-700 hover:bg-gray-100';

        const label = document.createElement('label');
        label.className = 'inline-flex items-center w-full cursor-pointer';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'coluna-checkbox rounded border-gray-300 text-orange-600 shadow-sm mr-2';
        input.value = coluna;
        input.checked = colunasSelecionadas.includes(coluna);

        input.addEventListener('change', () => {
            if (input.checked) {
                // Adicionar à seleção e à ordem personalizada
                if (!colunasSelecionadas.includes(coluna)) {
                    colunasSelecionadas.push(coluna);
                }
                if (!colunasOrdemPersonalizada.includes(coluna)) {
                    colunasOrdemPersonalizada.push(coluna);
                    saveColumnOrder(colunasOrdemPersonalizada);
                }
            } else {
                // Remover da seleção mas manter na ordem
                colunasSelecionadas = colunasSelecionadas.filter(c => c !== coluna);
            }

            // Reaplicar ordem
            colunasSelecionadas = aplicarOrdemColunas(colunasSelecionadas);
            
            const selectAll = document.getElementById('selectAllColumns');
            if (selectAll) {
                selectAll.checked = colunasSelecionadas.length === colunasDisponiveis.length;
                selectAll.indeterminate = colunasSelecionadas.length > 0 && colunasSelecionadas.length < colunasDisponiveis.length;
            }
            salvarPreferencias();
            aplicarFiltros();
        });

        const span = document.createElement('span');
        span.className = 'truncate';
        span.textContent = (masks && masks[coluna]) ? masks[coluna] : coluna;

        label.appendChild(input);
        label.appendChild(span);
        div.appendChild(label);
        columnsList.appendChild(div);
    });

    const selectAll = document.getElementById('selectAllColumns');
    if (selectAll) {
        selectAll.checked = colunasSelecionadas.length === colunasDisponiveis.length;
        selectAll.indeterminate = colunasSelecionadas.length > 0 && colunasSelecionadas.length < colunasDisponiveis.length;
        
        selectAll.onchange = () => {
            if (selectAll.checked) {
                colunasSelecionadas = [...colunasDisponiveis];
                // Atualizar ordem personalizada com todas as colunas
                colunasOrdemPersonalizada = [...colunasSelecionadas];
                saveColumnOrder(colunasOrdemPersonalizada);
            } else {
                colunasSelecionadas = [];
            }
            
            document.querySelectorAll('.coluna-checkbox').forEach(cb => {
                cb.checked = selectAll.checked;
            });
            
            salvarPreferencias();
            aplicarFiltros();
        };
    }
}

// ---------------- TABELA ----------------
function criarTabela(dados) {
    const tabela = document.getElementById('tabela-dados');
    if (!tabela) return;
    const thead = tabela.querySelector('thead tr');
    const tbody = tabela.querySelector('tbody');

    thead.innerHTML = '';
    tbody.innerHTML = '';

    const colunasParaExibir = colunasSelecionadas.filter(col => 
        !colunasOcultas.includes(col) && !colunasDiasTurnos.includes(col)
    );

    // Cabeçalho
    colunasParaExibir.forEach(coluna => {
        const th = document.createElement('th');
        th.className = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative';
        th.dataset.col = coluna;

        if (isDateColumnName(coluna)) {
            const btn = document.createElement('button');
            btn.className = 'text-left w-full flex items-center justify-between gap-2';
            const span = document.createElement('span');
            span.textContent = (masks && masks[coluna]) ? masks[coluna] : coluna;
            const icon = document.createElement('span');
            icon.className = 'sort-icon';
            icon.innerHTML = getSortIconMarkup(sortState.column === coluna ? sortState.dir : null);
            btn.appendChild(span);
            btn.appendChild(icon);
            btn.addEventListener('click', (e) => { e.stopPropagation(); toggleSort(coluna); });
            th.appendChild(btn);
        } else {
            th.textContent = (masks && masks[coluna]) ? masks[coluna] : coluna;
            th.addEventListener('click', () => toggleSort(coluna));
        }

        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        resizeHandle.style.position = 'absolute';
        resizeHandle.style.right = '0';
        resizeHandle.style.top = '0';
        resizeHandle.style.bottom = '0';
        resizeHandle.style.width = '6px';
        resizeHandle.style.cursor = 'col-resize';
        resizeHandle.addEventListener('mousedown', (e) => iniciarRedimensionamento(e, th));
        th.appendChild(resizeHandle);

        if (colWidths && colWidths[coluna]) {
            th.style.width = colWidths[coluna] + 'px';
            th.style.minWidth = '40px';
        }

        thead.appendChild(th);
    });

    // Linhas
    if (dados && dados.length > 0) {
        dados.forEach((item, idx) => {
            const tr = document.createElement('tr');
            if (item.id !== undefined && item.id !== null) tr.dataset.rowId = item.id;
            else tr.dataset.index = idx;

            colunasParaExibir.forEach(coluna => {
                const td = document.createElement('td');
                td.className = 'px-6 py-4 text-sm text-gray-900';
                td.dataset.field = coluna;

                if (coluna === 'Disponibilidade') {
                    td.textContent = formatarDisponibilidade(item);
                } 
                else if (isCPFColumn(coluna)) {
                    const valor = getFieldValue(item, coluna) || '';
                    td.textContent = formatarCPF(valor);
                }
                else if (isContatoColumn(coluna)) {
                    const valor = getFieldValue(item, coluna) || '';
                    const numeroFormatado = formatarTelefone(valor);
                    
                    const container = document.createElement('div');
                    container.className = 'relative inline-block';
                    
                    const span = document.createElement('span');
                    span.textContent = numeroFormatado;
                    span.className = 'contato-whatsapp cursor-pointer hover:text-blue-600';
                    
                    const tooltip = document.createElement('div');
                    tooltip.className = 'whatsapp-tooltip hidden absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-50';
                    tooltip.textContent = 'Abrir WhatsApp';
                    
                    container.appendChild(span);
                    container.appendChild(tooltip);
                    
                    container.addEventListener('mouseenter', () => {
                        tooltip.classList.remove('hidden');
                    });
                    
                    container.addEventListener('mouseleave', () => {
                        tooltip.classList.add('hidden');
                    });
                    
                    container.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const valor = getFieldValue(item, coluna) || '';
                        const numeroLimpo = limparNumeroTelefone(valor);
                        if (numeroLimpo) {
                            window.open(`https://wa.me/${numeroLimpo}`, '_blank');
                        }
                    });
                    
                    td.textContent = '';
                    td.appendChild(container);
                }
                else if (isEmailColumn(coluna)) {
                    const valor = getFieldValue(item, coluna) || '';
                    const span = document.createElement('span');
                    span.textContent = valor;
                    span.className = 'cursor-pointer email-copiar hover:text-blue-600';
                    span.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        try {
                            await navigator.clipboard.writeText(valor);
                            mostrarPopup('E-mail copiado');
                        } catch (err) {
                            console.error('Erro ao copiar e-mail:', err);
                            mostrarPopup('Erro ao copiar');
                        }
                    });
                    td.textContent = '';
                    td.appendChild(span);
                }
                else if (isDateColumnName(coluna)) {
                    const valor = getFieldValue(item, coluna);
                    td.textContent = formatDateForDisplay(valor);
                } else {
                    const valor = getFieldValue(item, coluna);
                    td.textContent = (valor !== undefined && valor !== null) ? String(valor) : '';
                }

                if (!isContatoColumn(coluna) && !isEmailColumn(coluna)) {
                    td.addEventListener('click', async (e) => {
                        if (e.target !== td && e.target.closest && e.target.closest('a')) return;
                        const valor = td.textContent.trim();
                        try {
                            await navigator.clipboard.writeText(valor);
                            const label = (masks && masks[coluna]) ? masks[coluna] : coluna;
                            mostrarPopup(label + ' copiado');
                        } catch (err) {
                            console.error('Erro ao copiar conteúdo:', err);
                            mostrarPopup('Erro ao copiar');
                        }
                    });
                }

                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        const ths = Array.from(tabela.querySelectorAll('thead th'));
        ths.forEach((th, i) => {
            const w = th.offsetWidth;
            document.querySelectorAll(`#tabela-dados td:nth-child(${i+1})`).forEach(td => {
                if (th.style.width) {
                    td.style.width = th.style.width;
                }
                td.style.wordBreak = 'break-word';
                td.style.whiteSpace = 'normal';
            });
        });
    } else {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = colunasParaExibir.length || 1;
        td.className = 'px-6 py-4 text-center text-gray-500';
        td.textContent = 'Nenhum professor disponível';
        tr.appendChild(td);
        tbody.appendChild(tr);
    }
}

// ---------------- SALVAR ALTERAÇÕES ----------------
async function salvarAlteracoes() {
    if (dadosAlterados.size === 0) {
        alert('Nenhuma alteração para salvar.');
        return;
    }
    try {
        const btnSalvar = document.getElementById('btn1');
        const textoOrig = btnSalvar ? btnSalvar.textContent : 'Salvar';
        if (btnSalvar) { btnSalvar.textContent = 'Salvando...'; btnSalvar.disabled = true; }

        const alteracoes = Array.from(dadosAlterados.values());
        const promessas = alteracoes.map(al => {
            const { id, ...campos } = al;
            return db.collection('dataBaseProfessores').doc(id).update(campos);
        });

        await Promise.all(promessas);

        dadosAlterados.clear();
        if (btnSalvar) { 
            btnSalvar.textContent = textoOrig; 
            btnSalvar.disabled = false; 
        }
        alert('Alterações salvas com sucesso!');
        carregarDadosFirebase();
    } catch (err) {
        console.error('Erro salvar Firebase:', err);
        alert('Erro ao salvar alterações: ' + err.message);
        const btnSalvar = document.getElementById('btn1');
        if (btnSalvar) { btnSalvar.textContent = 'Salvar'; btnSalvar.disabled = false; }
    }
}

// ---------------- FUNÇÕES DE FORMATAÇÃO ----------------
function isCPFColumn(coluna) {
    return coluna.toLowerCase() === 'cpf';
}

function formatarCPF(cpf) {
    if (!cpf) return '';
    const numeros = cpf.toString().replace(/\D/g, "");
    if (numeros.length === 11) {
        return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return cpf;
}

function isContatoColumn(coluna) {
    const col = coluna.toLowerCase();
    return col.includes('telefone') || col.includes('celular') || col.includes('contato') || col.includes('whatsapp');
}

function formatarTelefone(telefone) {
    if (!telefone) return '';
    const numeros = telefone.toString().replace(/\D/g, "");
    if (numeros.length === 11) {
        return numeros.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, "($1) $2.$3-$4");
    }
    if (numeros.length === 10) {
        return numeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return telefone;
}

function limparNumeroTelefone(numero) {
    return numero.replace(/\D/g, "");
}

function isEmailColumn(coluna) {
    const col = coluna.toLowerCase();
    return col.includes('email') || col.includes('e-mail');
}

function mostrarPopup(mensagem) {
    const popup = document.createElement('div');
    popup.textContent = mensagem;
    popup.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white px-6 py-3 rounded-lg z-50 transition-opacity duration-300';
    document.body.appendChild(popup);
    
    setTimeout(() => {
        popup.style.opacity = '0';
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 300);
    }, 1500);
}

// ---------------- REDIMENSIONAMENTO ----------------
let isResizing = false;
let currentColumn = null;
let startX = 0;
let startWidth = 0;

function iniciarRedimensionamento(e, coluna) {
    isResizing = true;
    currentColumn = coluna;
    startX = e.pageX;
    startWidth = coluna.offsetWidth;
    document.body.classList.add('resizing');
    coluna.style.userSelect = 'none';
    e.preventDefault(); 
    e.stopPropagation();
}

function redimensionarColuna(e) {
    if (!isResizing || !currentColumn) return;
    const largura = startWidth + (e.pageX - startX);
    if (largura > 40) {
        currentColumn.style.width = `${largura}px`;
        const colName = currentColumn.dataset.col;
        if (colName) {
            colWidths[colName] = Math.round(largura);
            salvarColWidths();
        }
        const indiceCol = Array.from(currentColumn.parentNode.children).indexOf(currentColumn);
        const todasCelulas = document.querySelectorAll(`#tabela-dados td:nth-child(${indiceCol + 1})`);
        todasCelulas.forEach(celula => {
            celula.style.width = `${largura}px`;
        });
    }
}

function pararRedimensionamento() {
    if (!isResizing) return;
    isResizing = false;
    if (currentColumn) {
        currentColumn.style.userSelect = '';
    }
    currentColumn = null;
    document.body.classList.remove('resizing');
}

// ---------------- FILTROS ----------------
function aplicarFiltros() {
    if (!dadosTabela) return;
    let resultado = [...dadosTabela];

    const nomeValor = (document.getElementById('filtroNome')?.value || '').trim().toLowerCase();
    const bairroValor = (document.getElementById('filtroBairro')?.value || '').trim().toLowerCase();

    if (nomeValor) {
        resultado = resultado.filter(item => {
            const campo = String(getFieldValue(item, 'nome') || '').toLowerCase();
            return campo.includes(nomeValor);
        });
    }

    if (bairroValor) {
        resultado = resultado.filter(item => {
            const campo = String(getFieldValue(item, 'bairros') || '').toLowerCase();
            return campo.includes(bairroValor);
        });
    }

    const turnosSelecionados = Array.from(document.querySelectorAll('input[name="turnos"]:checked')).map(i => i.value);
    if (turnosSelecionados.length > 0) {
        resultado = resultado.filter(item => {
            return turnosSelecionados.some(chave => {
                const v = getFieldValue(item, chave);
                return isTruthyValue(v);
            });
        });
    }

    const disciplinasSelecionadas = Array.from(document.querySelectorAll('input[name="filtroDisciplinas"]:checked'))
        .map(i => normalizeStr(i.value));

    if (disciplinasSelecionadas.length > 0) {
        resultado = resultado.filter(item => {
            const raw = getFieldValue(item, 'disciplinas') || '';
            let lista = [];

            if (Array.isArray(raw)) {
                lista = raw.map(x => normalizeStr(String(x))).filter(Boolean);
            } else {
                lista = String(raw).split(/[,;|\/]/).map(s => normalizeStr(s)).filter(Boolean);
            }

            return disciplinasSelecionadas.every(d => lista.includes(d));
        });
    }

    const categoriasSelecionadas = Array.from(document.querySelectorAll('input[name="filtroCategorias"]:checked')).map(i => i.value);

    if (categoriasSelecionadas.length > 0) {
        resultado = resultado.filter(item => {
            return categoriasSelecionadas.every(coluna => {
                const v = getFieldValue(item, coluna);
                return valueIsSim(v);
            });
        });
    }

    if (sortState.column) {
        resultado.sort((a, b) => {
            const av = getFieldValue(a, sortState.column);
            const bv = getFieldValue(b, sortState.column);
            if (isDateColumnName(sortState.column)) {
                const da = parseDateToMs(av);
                const db = parseDateToMs(bv);
                return sortState.dir === 'asc' ? (da - db) : (db - da);
            }
            const sa = (av === undefined || av === null) ? '' : String(av).toLowerCase();
            const sb = (bv === undefined || bv === null) ? '' : String(bv).toLowerCase();
            if (sa < sb) return sortState.dir === 'asc' ? -1 : 1;
            if (sa > sb) return sortState.dir === 'asc' ? 1 : -1;
            return 0;
        });
    }

    criarTabela(resultado);
}

function getFieldValue(item, chave) {
    if (!item || !chave) return undefined;
    if (Object.prototype.hasOwnProperty.call(item, chave)) return item[chave];
    
    // Tentar variações do nome do campo
    const attempts = [
        chave,
        chave.charAt(0).toLowerCase() + chave.slice(1),
        chave.charAt(0).toUpperCase() + chave.slice(1),
        chave.toLowerCase()
    ];
    
    for (const k of attempts) {
        if (Object.prototype.hasOwnProperty.call(item, k)) return item[k];
    }
    
    return undefined;
}

function isTruthyValue(v) {
    if (v === undefined || v === null) return false;
    if (typeof v === 'boolean') return v === true;
    if (typeof v === 'number') return v === 1;
    if (Array.isArray(v)) return v.some(x => isTruthyValue(x));
    const s = String(v).toLowerCase().trim();
    return ['true','1','on','yes','sim','s'].includes(s);
}

function valueIsSim(v) {
    return isTruthyValue(v);
}

function limparFiltros() {
    ['filtroNome','filtroBairro'].forEach(id => { 
        const el = document.getElementById(id); 
        if (el) el.value = ''; 
    });
    document.querySelectorAll('input[name="filtroDisciplinas"]').forEach(i => i.checked = false);
    document.querySelectorAll('input[name="filtroCategorias"]').forEach(i => i.checked = false);
    document.querySelectorAll('#diasTurnosContainer input[type="checkbox"]').forEach(i => i.checked = false);
    document.querySelectorAll('.subturnos').forEach(el => el.classList.add('hidden'));
    aplicarFiltros();
}

function normalizeStr(s) {
    return (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

function isDateColumnName(name) {
    if (!name) return false;
    const k = name.toLowerCase();
    return k.includes('data') || k.includes('cadastro');
}

function formatDateForDisplay(raw) {
    if (!raw) return '';
    const ms = parseDateToMs(raw);
    if (!ms) return String(raw);
    const d = new Date(ms);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const weekday = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d.getDay()];
    return `${dd}/${mm}/${yyyy} - ${weekday}`;
}

function parseDateToMs(raw) {
    if (!raw) return null;
    if (typeof raw === 'number') return raw;
    if (!isNaN(Number(raw))) return Number(raw);
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d.getTime();
}

function toggleSort(coluna) {
    if (sortState.column !== coluna) {
        sortState.column = coluna;
        sortState.dir = 'asc';
    } else {
        if (sortState.dir === 'asc') sortState.dir = 'desc';
        else if (sortState.dir === 'desc') { sortState.column = null; sortState.dir = null; }
        else sortState.dir = 'asc';
    }
    aplicarFiltros();
}

function getSortIconMarkup(dir) {
    if (!dir) {
        return `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5 5 5M7 13l5 5 5-5" /></svg>`;
    }
    if (dir === 'asc') {
        return `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>`;
}

// ---------------- DISPONIBILIDADE ----------------
function formatarDisponibilidade(item) {
    const diasMap = {
        segManha: { dia: 'Segunda', turno: 'Manhã' },
        segTarde: { dia: 'Segunda', turno: 'Tarde' },
        terManha: { dia: 'Terça', turno: 'Manhã' },
        terTarde: { dia: 'Terça', turno: 'Tarde' },
        quaManha: { dia: 'Quarta', turno: 'Manhã' },
        quaTarde: { dia: 'Quarta', turno: 'Tarde' },
        quiManha: { dia: 'Quinta', turno: 'Manhã' },
        quiTarde: { dia: 'Quinta', turno: 'Tarde' },
        sexManha: { dia: 'Sexta', turno: 'Manhã' },
        sexTarde: { dia: 'Sexta', turno: 'Tarde' },
        sabManha: { dia: 'Sábado', turno: 'Manhã' },
        sabTarde: { dia: 'Sábado', turno: 'Tarde' }
    };

    const disponibilidadePorDia = {};

    Object.entries(diasMap).forEach(([chave, info]) => {
        const valor = getFieldValue(item, chave);
        if (isTruthyValue(valor)) {
            if (!disponibilidadePorDia[info.dia]) {
                disponibilidadePorDia[info.dia] = [];
            }
            disponibilidadePorDia[info.dia].push(info.turno);
        }
    });

    const partes = [];
    Object.entries(disponibilidadePorDia).forEach(([dia, turnos]) => {
        if (turnos.length === 2) {
            partes.push(`${dia}: Manhã e Tarde`);
        } else if (turnos.length === 1) {
            partes.push(`${dia}: ${turnos[0]}`);
        }
    });

    return partes.join(', ');
}

// ---------------- DIAS E TURNOS UI ----------------
function montarDiasTurnos() {
    const diasTurnosContainer = document.getElementById('diasTurnosContainer');
    if (!diasTurnosContainer) return;
    diasTurnosContainer.innerHTML = '';
    
    const dias = [
        { name: 'Segunda', key: 'seg' },
        { name: 'Terça', key: 'ter' },
        { name: 'Quarta', key: 'qua' },
        { name: 'Quinta', key: 'qui' },
        { name: 'Sexta', key: 'sex' },
        { name: 'Sábado', key: 'sab' },
    ];

    dias.forEach(d => {
        const diaItem = document.createElement('div');
        diaItem.className = 'dia-item';

        const diaCheckboxContainer = document.createElement('div');
        diaCheckboxContainer.className = 'dia-checkbox-container';
        
        const inputDia = document.createElement('input');
        inputDia.type = 'checkbox';
        inputDia.id = `chk_${d.key}`;
        inputDia.value = d.key;
        inputDia.className = 'dia-checkbox';

        const labelDia = document.createElement('label');
        labelDia.htmlFor = `chk_${d.key}`;
        labelDia.className = 'dia-label';
        labelDia.textContent = d.name;

        diaCheckboxContainer.appendChild(inputDia);
        diaCheckboxContainer.appendChild(labelDia);

        const subturnosContainer = document.createElement('div');
        subturnosContainer.className = 'subturnos-container hidden';
        subturnosContainer.id = `sub_${d.key}`;

        const manhaId = `turno_${d.key}Manha`;
        const tardeId = `turno_${d.key}Tarde`;

        const manhaOption = document.createElement('div');
        manhaOption.className = 'turno-option';
        manhaOption.innerHTML = `
            <input type="checkbox" name="turnos" id="${manhaId}" value="${d.key}Manha">
            <label for="${manhaId}">Manhã</label>
        `;

        const tardeOption = document.createElement('div');
        tardeOption.className = 'turno-option';
        tardeOption.innerHTML = `
            <input type="checkbox" name="turnos" id="${tardeId}" value="${d.key}Tarde">
            <label for="${tardeId}">Tarde</label>
        `;

        subturnosContainer.appendChild(manhaOption);
        subturnosContainer.appendChild(tardeOption);

        diaItem.appendChild(diaCheckboxContainer);
        diaItem.appendChild(subturnosContainer);
        diasTurnosContainer.appendChild(diaItem);

        inputDia.addEventListener('change', () => {
            if (inputDia.checked) {
                subturnosContainer.classList.remove('hidden');
            } else {
                subturnosContainer.classList.add('hidden');
                subturnosContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    cb.checked = false;
                });
            }
            aplicarFiltros();
        });

        subturnosContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                aplicarFiltros();
            });
        });

        labelDia.addEventListener('click', (e) => {
            inputDia.checked = !inputDia.checked;
            const event = new Event('change');
            inputDia.dispatchEvent(event);
        });
    });
}
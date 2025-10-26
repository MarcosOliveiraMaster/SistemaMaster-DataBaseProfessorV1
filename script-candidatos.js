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

let db = null;
let candidatos = [];
let candidatoSelecionado = null;

// Valor configurável para altura da textarea de avaliação (padrão em px ou string CSS)
const AVALIACAO_TEXTAREA_HEIGHT = "180px"; // altere aqui quando quiser ajustar sem editar HTML

// ==============================
// INICIALIZAÇÃO FIREBASE
// ==============================
function initializeFirebase() {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    db = firebase.firestore();
    return true;
  } catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
    return false;
  }
}

// ==============================
// UTILITÁRIOS: Toast, Popup
// ==============================
function mostrarToast(mensagem) {
  const toast = document.createElement("div");
  toast.className = "toast-message";
  toast.textContent = mensagem;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2000);
}

function abrirPopup(titulo, mensagem, acaoConfirmar, confirmLabel = "Confirmo", cancelLabel = "Cancelar") {
  const overlay = document.getElementById("popupOverlay");
  const popupTitle = document.getElementById("popupTitle");
  const popupMessage = document.getElementById("popupMessage");
  const btnConfirm = document.getElementById("popupConfirm");
  const btnCancel = document.getElementById("popupCancel");

  popupTitle.textContent = titulo;
  popupMessage.textContent = mensagem;
  btnConfirm.textContent = confirmLabel;
  btnCancel.textContent = cancelLabel;

  overlay.classList.add("show");

  btnConfirm.onclick = () => {
    overlay.classList.remove("show");
    if (typeof acaoConfirmar === "function") acaoConfirmar();
  };

  btnCancel.onclick = () => {
    overlay.classList.remove("show");
  };
}

// ==============================
// CARREGAR CANDIDATOS
// (preserva lógica anterior)
// ==============================
async function carregarCandidatos() {
  try {
    const snapshot = await db.collection("candidatos").get();
    candidatos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    candidatos.forEach(c => {
      if (!c.status) c.status = "Candidato";
      if (typeof c.disciplinas === "string")
        c.disciplinas = c.disciplinas.split(",").map(d => d.trim());
    });

    renderizarListaCandidatos();
    preencherFiltroDisciplinas();
  } catch (error) {
    console.error("Erro ao carregar candidatos:", error);
  }
}

function preencherFiltroDisciplinas() {
  const select = document.getElementById("filtroDisciplina");
  const disciplinas = new Set();

  candidatos.forEach(c => {
    if (Array.isArray(c.disciplinas))
      c.disciplinas.forEach(d => disciplinas.add(d));
  });

  Array.from(disciplinas).sort().forEach(d => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    select.appendChild(opt);
  });
}

function renderizarListaCandidatos(lista = candidatos) {
  const container = document.getElementById("listaCandidatos");
  container.innerHTML = "";

  if (lista.length === 0) {
    container.innerHTML =
      '<div class="p-3 text-center text-gray-500">Nenhum candidato encontrado</div>';
    return;
  }

  lista.forEach(c => {
    const item = document.createElement("div");
    item.className =
      "p-2 border-b cursor-pointer hover:bg-orange-50 transition";
    item.innerHTML = `
      <div class="font-medium text-gray-800 text-sm">${c.nome}</div>
      <div class="text-xs text-gray-500">${c.status || "Candidato"}</div>
    `;
    item.onclick = () => selecionarCandidato(c);
    container.appendChild(item);
  });
}

function aplicarFiltros() {
  const status = document.getElementById("filtroStatus").value;
  const disc = document.getElementById("filtroDisciplina").value;
  let filtrados = candidatos;

  if (status) filtrados = filtrados.filter(c => c.status === status);
  if (disc) filtrados = filtrados.filter(c => c.disciplinas?.includes(disc));

  renderizarListaCandidatos(filtrados);
}

// ==============================
// EXIBIÇÃO DO CANDIDATO
// ==============================
function selecionarCandidato(c) {
  candidatoSelecionado = c;
  exibirDisponibilidade();
  exibirDisciplinas();
  exibirInformacoes();
  exibirExperiencias();
  preencherAreaAvaliacao();
}

function exibirDisponibilidade() {
  if (!candidatoSelecionado) return;
  const dias = ["seg", "ter", "qua", "qui", "sex", "sab"];
  const turnos = ["Manha", "Tarde"];

  turnos.forEach(t => {
    dias.forEach(d => {
      const id = d + t;
      const el = document.getElementById(id);
      if (!el) return;
      const val = candidatoSelecionado[id];
      el.textContent = val ? "✅" : "❌";
      el.className = `p-1 text-center ${val ? "text-green-600" : "text-red-500"}`;
    });
  });
}

const imagensDisciplinas = {
  "Matemática": "/img-disciplinas/mat.png",
  "Português": "/img-disciplinas/port.png",
  "Física": "/img-disciplinas/fis.png",
  "Química": "/img-disciplinas/qui.png",
  "Biologia": "/img-disciplinas/bio.png",
  "Ciências": "/img-disciplinas/cienc.png",
  "Geografia": "/img-disciplinas/geo.png",
  "História": "/img-disciplinas/hist.png",
  "Inglês": "/img-disciplinas/engl.png",
  "Literatura": "/img-disciplinas/humanas.png",
  "Pedagogia": "/img-disciplinas/humanas.png",
  "Redação": "/img-disciplinas/humanas.png",
  "Sociologia": "/img-disciplinas/humanas.png",
  "Filosofia": "/img-disciplinas/humanas.png"
};

function exibirDisciplinas() {
  const container = document.getElementById("gridDisciplinas");
  container.innerHTML = "";

  if (!candidatoSelecionado?.disciplinas?.length) {
    container.innerHTML =
      '<div class="text-gray-400 text-xs col-span-2 text-center">Sem disciplinas</div>';
    return;
  }

  candidatoSelecionado.disciplinas.forEach(d => {
    const item = document.createElement("div");
    item.className = "disciplina-item";
    const img = document.createElement("img");
    img.src = imagensDisciplinas[d] || "../img/default.png";
    img.alt = d;
    const title = document.createElement("div");
    title.className = "disc-title";
    title.textContent = d;
    item.appendChild(img);
    item.appendChild(title);
    container.appendChild(item);
  });
}

function exibirInformacoes() {
  const container = document.getElementById("informacoesCandidato");
  container.innerHTML = "";
  if (!candidatoSelecionado) return;

  const campos = [
    { label: "Contato", valor: candidatoSelecionado.contato },
    { label: "Bairros", valor: candidatoSelecionado.bairros },
    { label: "CPF", valor: formatarCPF(candidatoSelecionado.cpf) },
    { label: "Curso", valor: candidatoSelecionado.curso },
    { label: "Nível", valor: candidatoSelecionado.nivel }
  ];

  campos.forEach(c => {
    if (!c.valor) return;
    const div = document.createElement("div");
    div.className = "mb-1";
    div.innerHTML = `<div class="text-xs font-semibold text-gray-700 ">${c.label}</div>
                     <div class="text-xs text-gray-600 mb-4">${c.valor}</div>`;
    container.appendChild(div);
  });
}

function exibirExperiencias() {
  if (!candidatoSelecionado) return;

  const sectionAulas = document.getElementById("sectionAulas");
  const sectionNeuro = document.getElementById("sectionNeuro");
  const sectionTdics = document.getElementById("sectionTdics");

  const descAulas = document.getElementById("descricaoAulas");
  const descNeuro = document.getElementById("descricaoNeuro");
  const descTdics = document.getElementById("descricaoTdics");

  if (candidatoSelecionado.expAulas === "sim") {
    sectionAulas.style.display = "block";
    descAulas.textContent =
      candidatoSelecionado.descricaoExpAulas || "Não informado";
  } else {
    sectionAulas.style.display = "none";
  }

  if (candidatoSelecionado.expNeuro === "sim") {
    sectionNeuro.style.display = "block";
    descNeuro.textContent =
      candidatoSelecionado.descricaoExpNeuro || "Não informado";
  } else {
    sectionNeuro.style.display = "none";
  }

  if (candidatoSelecionado.expTdics === "sim") {
    sectionTdics.style.display = "block";
    descTdics.textContent =
      candidatoSelecionado.descricaoTdics || "Não informado";
  } else {
    sectionTdics.style.display = "none";
  }
}

// ==============================
// AVALIAÇÃO: preencher área e salvar impressões
// ==============================
function preencherAreaAvaliacao() {
  const txt = document.getElementById("impressoesCandidato");
  const status = document.getElementById("statusCandidato");

  if (!candidatoSelecionado) {
    txt.value = "";
    status.value = "Candidato";
    atualizarVisualStatus("Candidato");
    return;
  }

  txt.value = candidatoSelecionado.ImpressoesCandidatos || "";
  status.value = candidatoSelecionado.status || "Candidato";
  atualizarVisualStatus(status.value);
}

// Salvar impressões no Firestore
async function salvarImpressoes() {
  if (!candidatoSelecionado) return mostrarToast("Nenhum candidato selecionado.");
  const texto = document.getElementById("impressoesCandidato").value;
  const novoStatus = document.getElementById("statusCandidato").value;

  try {
    await db.collection("candidatos").doc(candidatoSelecionado.id).update({
      ImpressoesCandidatos: texto,
      status: novoStatus
    });
    candidatoSelecionado.ImpressoesCandidatos = texto;
    candidatoSelecionado.status = novoStatus;
    mostrarToast("Impressões salvas!");
    // atualizar lista visual
    renderizarListaCandidatos();
  } catch (error) {
    console.error("Erro ao salvar impressões:", error);
    mostrarToast("Erro ao salvar!");
  }
}

// ==============================
// FUNÇÕES AUXILIARES (formatação CPF etc.)
// ==============================
function formatarCPF(cpf) {
  if (!cpf) return "";
  const n = cpf.replace(/\D/g, "");
  return n.length === 11
    ? n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    : cpf;
}

// ==============================
// CONTROLES DA UI: botões de avaliação, copiar relatório, status
// ==============================
function atualizarVisualStatus(statusValue) {
  const select = document.getElementById("statusCandidato");
  // ajustar borda/texto para indicar status
  select.classList.remove("border-red-500", "text-red-500", "border-green-500", "text-green-500", "text-gray-700");
  if (statusValue === "Reprovado") {
    select.classList.add("border-red-500", "text-red-500");
  } else if (statusValue === "Aprovado") {
    select.classList.add("border-green-500", "text-green-500");
  } else {
    select.classList.add("text-gray-700");
  }
}

// copiar relatório para clipboard (aqui gera texto simplificado)
async function copiarRelatorioParaClipboard() {
  if (!candidatoSelecionado) return mostrarToast("Nenhum candidato selecionado.");
  const texto = `
Relatório - Candidato: ${candidatoSelecionado.nome || ""}
Status: ${document.getElementById("statusCandidato").value || ""}
Impressões: ${document.getElementById("impressoesCandidato").value || ""}
  `.trim();
  try {
    await navigator.clipboard.writeText(texto);
    mostrarToast("Mensagem copiada!");
  } catch (e) {
    console.error("Erro ao copiar:", e);
    mostrarToast("Não foi possível copiar.");
  }
}

// Botões aprov/reprov toggles
function setBotaoAprovado() {
  const btnA = document.getElementById("btnAprovado");
  const btnR = document.getElementById("btnReprovado");
  btnA.classList.add("btn-active-success");
  btnR.classList.remove("btn-active-danger");
  document.getElementById("statusCandidato").value = "Aprovado";
  atualizarVisualStatus("Aprovado");
  mostrarToast("Candidato marcado como APROVADO");
}

function setBotaoReprovado() {
  const btnA = document.getElementById("btnAprovado");
  const btnR = document.getElementById("btnReprovado");
  btnR.classList.add("btn-active-danger");
  btnA.classList.remove("btn-active-success");
  document.getElementById("statusCandidato").value = "Reprovado";
  atualizarVisualStatus("Reprovado");
  mostrarToast("Candidato marcado como REPROVADO");
}

// Excluir / Salvar candidato — gatilhos para popups e callbacks externos
function functionExcluirCandidato() {
  // placeholder: ação real deve ser implementada posteriormente
  mostrarToast("Função excluir chamada (a implementar).");
  // exemplo: db.collection('candidatos').doc(candidatoSelecionado.id).delete()
}

function functionSalvarCandidato() {
  // placeholder
  mostrarToast("Função salvar chamada (a implementar).");
  // exemplo: mover para outra coleção ou marcar como oficial
}

// ==============================
// EVENTOS INICIAIS E BINDINGS
// ==============================
function inicializarApp() {
  // Bind filtros
  document.getElementById("filtroStatus").addEventListener("change", aplicarFiltros);
  document.getElementById("filtroDisciplina").addEventListener("change", aplicarFiltros);

  // Ajuste dinâmico da altura da textarea via constante JS
  const txt = document.getElementById("impressoesCandidato");
  if (txt) txt.style.minHeight = AVALIACAO_TEXTAREA_HEIGHT;

  // Botões avaliação
  document.getElementById("btnSalvarImpressoes")?.addEventListener("click", salvarImpressoes); // se existir (compatibilidade)
  // Nosso botão local de salvar candidato (section avaliação) mantém confirmação via popup
  document.getElementById("btnExcluirCandidato").addEventListener("click", () => {
    abrirPopup(
      "Confirmação de exclusão",
      "Ao confirmar a exclusão, todos os dados deste candidato serão apagados permanentemente do banco de dados e não poderão ser recuperados. Tem certeza que deseja continuar?",
      () => { functionExcluirCandidato(); },
      "Confirmo",
      "Cancelar"
    );
  });
  document.getElementById("btnSalvarCandidato").addEventListener("click", () => {
    abrirPopup(
      "Salvar candidato",
      "Ao clicar em salvar, este candidato será adicionado ao banco oficial de professores da Master. Tem certeza disso?",
      () => { functionSalvarCandidato(); },
      "Salvar",
      "Cancelar"
    );
  });

  // Copiar relatório
  document.getElementById("btnCopiarRelatorio").addEventListener("click", copiarRelatorioParaClipboard);

  // Botões aprov/reprov
  document.getElementById("btnAprovado").addEventListener("click", setBotaoAprovado);
  document.getElementById("btnReprovado").addEventListener("click", setBotaoReprovado);

  // status select change -> atualiza visual
  document.getElementById("statusCandidato").addEventListener("change", (e) => {
    atualizarVisualStatus(e.target.value);
    // sincroniza botões visuais
    if (e.target.value === "Aprovado") {
      document.getElementById("btnAprovado").classList.add("btn-active-success");
      document.getElementById("btnReprovado").classList.remove("btn-active-danger");
    } else if (e.target.value === "Reprovado") {
      document.getElementById("btnReprovado").classList.add("btn-active-danger");
      document.getElementById("btnAprovado").classList.remove("btn-active-success");
    } else {
      document.getElementById("btnAprovado").classList.remove("btn-active-success");
      document.getElementById("btnReprovado").classList.remove("btn-active-danger");
    }
  });

  // Carregar candidatos
  carregarCandidatos();
}

document.addEventListener("DOMContentLoaded", () => {
  if (initializeFirebase()) inicializarApp();
  else {
    // mesmo sem Firebase, inicializa ajustes UI
    inicializarApp();
  }
});

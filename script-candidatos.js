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
// CARREGAR CANDIDATOS
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

// ==============================
// LISTAGEM E FILTROS
// ==============================
function preencherFiltroDisciplinas() {
  const select = document.getElementById("filtroDisciplina");
  const disciplinas = new Set();

  candidatos.forEach(c => {
    if (Array.isArray(c.disciplinas))
      c.disciplinas.forEach(d => disciplinas.add(d));
  });

  Array.from(disciplinas)
    .sort()
    .forEach(d => {
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
      <div class="text-xs text-gray-500">${c.status}</div>
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
      el.className = `p-1 text-center ${
        val ? "text-green-600" : "text-red-500"
      }`;
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
// AVALIAÇÃO
// ==============================
async function salvarImpressoes() {
  if (!candidatoSelecionado) return;
  const texto = document.getElementById("impressoesCandidato").value;

  try {
    await db
      .collection("candidatos")
      .doc(candidatoSelecionado.id)
      .update({ ImpressoesCandidatos: texto });
    candidatoSelecionado.ImpressoesCandidatos = texto;
    mostrarMensagem("Impressões salvas!");
  } catch (error) {
    console.error("Erro ao salvar impressões:", error);
    mostrarMensagem("Erro ao salvar!", true);
  }
}

// ==============================
// UTILITÁRIOS
// ==============================
function formatarCPF(cpf) {
  if (!cpf) return "";
  const n = cpf.replace(/\D/g, "");
  return n.length === 11
    ? n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    : cpf;
}

function mostrarMensagem(msg, erro = false) {
  const box = document.createElement("div");
  box.className = `fixed top-4 right-4 px-4 py-2 rounded shadow-lg z-50 ${
    erro ? "bg-red-500" : "bg-green-500"
  } text-white text-sm`;
  box.textContent = msg;
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 2500);
}

// ==============================
// EVENTOS INICIAIS
// ==============================
function inicializarApp() {
  document
    .getElementById("filtroStatus")
    .addEventListener("change", aplicarFiltros);
  document
    .getElementById("filtroDisciplina")
    .addEventListener("change", aplicarFiltros);
  document
    .getElementById("btnSalvarImpressoes")
    .addEventListener("click", salvarImpressoes);

  carregarCandidatos();
}

document.addEventListener("DOMContentLoaded", () => {
  if (initializeFirebase()) inicializarApp();
});

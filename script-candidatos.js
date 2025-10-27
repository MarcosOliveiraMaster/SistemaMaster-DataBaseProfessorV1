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
let mesSelecionado = null;

// Mensagens para cópia
const MENSAGEM_APROVACAO = `É com muita alegria que informamos sua aprovação no processo seletivo da Master Educação! 🌟

Ficamos impressionados com sua didática e paixão pelo ensino. Estamos ansiosos para iniciar essa parceria de sucesso e transformar a educação juntos. 🧑‍🏫✨

Entre no Link abaixo para  participar no nosso grupo de professores. Enviamos solicitações de aulas no privado, porém quando surge solicitação emergencial nós enviamos no grupo:

https://chat.whatsapp.com/COtoCfpTIuoDs7f8UgQHIz


Vamos encaminhar o manual de Tutores Master, com todas as informações sobre a Empresa e boas práticas. Entraremos em contato para alinhar os detalhes e próximos passos. 🚀

Seja bem-vindo(a) à equipe Master Educação! 💼💙`;

const MENSAGEM_REPROVACAO = `Olá Professor

Agradecemos muito por participar do processo seletivo da Master Educação e por compartilhar suas habilidades e experiências conosco. 🙏

Após uma análise cuidadosa, informamos que, no momento, você não foi selecionado para a vaga.

No entanto, ficaremos felizes em manter seu perfil em nosso banco de talentos para futuras oportunidades.

Desejamos muito sucesso em sua trajetória e esperamos ter a chance de trabalharmos juntos em breve! 💼

Atenciosamente,Equipe Master Educação`;

const MENSAGEM_DESISTENTE = `Olá Professor, o avaliador esperou mais de 10min por você na sala e infelizmente não conseguimos esperar mais. Infelizmente vamos precisar cancelar nossa entrevista por enquanto e logo mais, entramos em contato assim que iniciarmos um novo ciclo de entrevistas. 

Agradecemos por ter se inscrito no processo seletivo e nos vemos em breve.`;

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
// MÁSCARAS DE ENTRADA
// ==============================
// Aplicar máscara de data
function aplicarMascaraData(input) {
  input.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2);
    }
    if (value.length > 5) {
      value = value.substring(0, 5) + '/' + value.substring(5, 9);
    }
    
    e.target.value = value;
  });
}

// Aplicar máscara de horário
function aplicarMascaraHora(input) {
  input.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 2) {
      value = value.substring(0, 2) + ':' + value.substring(2, 4);
    }
    
    e.target.value = value;
  });
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
    preencherListaMeses();
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

function preencherListaMeses() {
  const container = document.getElementById("listaMeses");
  container.innerHTML = "";
  
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  
  meses.forEach((mes, index) => {
    const item = document.createElement("div");
    item.className = "p-1 text-xs cursor-pointer hover:bg-gray-100 rounded";
    item.textContent = mes;
    item.onclick = () => {
      mesSelecionado = index + 1;
      aplicarFiltros();
    };
    container.appendChild(item);
  });
}

function formatarDataHoraParaExibicao(dataHoraStr) {
  if (!dataHoraStr) return '';
  
  try {
    // Dividir a string "dd/mm/yyyy HH:MM" em data e hora
    const [data, hora] = dataHoraStr.split(' ');
    if (!data) return '';

    const partes = data.split('/');
    if (partes.length !== 3) return dataHoraStr;
    
    const dia = partes[0];
    const mes = partes[1];
    const ano = partes[2];
    
    const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dataObj = new Date(ano, mes - 1, dia);
    const diaSemana = diasDaSemana[dataObj.getDay()];
    
    // Retornar no formato: "ddd - dd/mm - HH:MM"
    return hora ? `${diaSemana} - ${dia}/${mes} - ${hora}` : `${diaSemana} - ${dia}/${mes}/${ano}`;
  } catch (e) {
    return dataHoraStr;
  }
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
      <div class="text-xs text-gray-500">${c.status || "Candidato"} • ${formatarDataHoraParaExibicao(c.dataEntrevista) || "Sem data"}</div>
    `;
    item.onclick = () => selecionarCandidato(c);
    container.appendChild(item);
  });
}

function aplicarFiltros() {
  const status = document.getElementById("filtroStatus").value;
  const disc = document.getElementById("filtroDisciplina").value;
  const dataFiltro = document.getElementById("filtroDataEntrevista").value;
  let filtrados = candidatos;

  // Filtro por status
  if (status) {
    filtrados = filtrados.filter(c => c.status === status);
  }

  // Filtro por disciplina
  if (disc) {
    filtrados = filtrados.filter(c => c.disciplinas?.includes(disc));
  }

  // Filtro por data de entrevista
  if (dataFiltro === "semData") {
    filtrados = filtrados.filter(c => !c.dataEntrevista);
  } else if (dataFiltro === "selecionarMes" && mesSelecionado) {
    filtrados = filtrados.filter(c => {
      if (!c.dataEntrevista) return false;
      const [data] = c.dataEntrevista.split(' ');
      const partes = data.split('/');
      if (partes.length !== 3) return false;
      return parseInt(partes[1]) === mesSelecionado;
    });
  }

  // Ordenar: sem data primeiro, depois por data
  filtrados.sort((a, b) => {
    if (!a.dataEntrevista && !b.dataEntrevista) return 0;
    if (!a.dataEntrevista) return -1;
    if (!b.dataEntrevista) return 1;
    
    const [dataA] = a.dataEntrevista.split(' ');
    const [dataB] = b.dataEntrevista.split(' ');
    
    const [diaA, mesA, anoA] = dataA.split('/').map(Number);
    const [diaB, mesB, anoB] = dataB.split('/').map(Number);
    
    const dataObjA = new Date(anoA, mesA - 1, diaA);
    const dataObjB = new Date(anoB, mesB - 1, diaB);
    
    return dataObjA - dataObjB;
  });

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
  "Matemática": "img-disciplinas/mat.png",
  "Português": "img-disciplinas/port.png",
  "Física": "img-disciplinas/fis.png",
  "Química": "img-disciplinas/qui.png",
  "Biologia": "img-disciplinas/bio.png",
  "Ciências": "img-disciplinas/cienc.png",
  "Geografia": "img-disciplinas/geo.png",
  "História": "img-disciplinas/hist.png",
  "Inglês": "img-disciplinas/engl.png",
  "Literatura": "img-disciplinas/humanas.png",
  "Pedagogia": "img-disciplinas/humanas.png",
  "Redação": "img-disciplinas/humanas.png",
  "Sociologia": "img-disciplinas/humanas.png",
  "Filosofia": "img-disciplinas/humanas.png"
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
    div.innerHTML = `<div class="text-xs font-semibold text-gray-700">${c.label}</div>
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
  const dataEntrevistaInput = document.getElementById("dataEntrevista");
  const horaEntrevistaInput = document.getElementById("horaEntrevista");
  const linkEntrevista = document.getElementById("linkEntrevista");
  const txt = document.getElementById("impressoesCandidato");
  const status = document.getElementById("statusCandidato");

  if (!candidatoSelecionado) {
    dataEntrevistaInput.value = "";
    horaEntrevistaInput.value = "";
    linkEntrevista.value = "";
    txt.value = "";
    status.value = "Candidato";
    atualizarVisualStatus("Candidato");
    return;
  }

  // Separar a string dataEntrevista (formato "dd/mm/yyyy HH:MM") nos campos de data e hora
  const dataHora = candidatoSelecionado.dataEntrevista || "";
  const [data, hora] = dataHora.split(' ');

  dataEntrevistaInput.value = data || "";
  horaEntrevistaInput.value = hora || "";
  linkEntrevista.value = candidatoSelecionado.linkEntrevista || "";
  txt.value = candidatoSelecionado.ImpressoesCandidatos || "";
  status.value = candidatoSelecionado.status || "Candidato";
  atualizarVisualStatus(status.value);
}

// Salvar todas as alterações
async function salvarAlteracoes() {
  if (!candidatoSelecionado) {
    mostrarToast("Nenhum candidato selecionado.");
    return;
  }

  const dataEntrevista = document.getElementById("dataEntrevista").value;
  const horaEntrevista = document.getElementById("horaEntrevista").value;
  const linkEntrevista = document.getElementById("linkEntrevista").value;
  const impressoes = document.getElementById("impressoesCandidato").value;
  const status = document.getElementById("statusCandidato").value;

  // Concatenar data e hora no formato "dd/mm/yyyy HH:MM"
  const dataHoraEntrevista = dataEntrevista && horaEntrevista 
    ? `${dataEntrevista} ${horaEntrevista}`
    : '';

  try {
    await db.collection("candidatos").doc(candidatoSelecionado.id).update({
      dataEntrevista: dataHoraEntrevista,
      linkEntrevista: linkEntrevista,
      ImpressoesCandidatos: impressoes,
      status: status
    });

    // Atualizar localmente
    candidatoSelecionado.dataEntrevista = dataHoraEntrevista;
    candidatoSelecionado.linkEntrevista = linkEntrevista;
    candidatoSelecionado.ImpressoesCandidatos = impressoes;
    candidatoSelecionado.status = status;

    mostrarToast("Atualizações enviadas com sucesso ✅");
    renderizarListaCandidatos();
  } catch (error) {
    console.error("Erro ao salvar alterações:", error);
    mostrarToast("Erro ao salvar alterações!");
  }
}

// Copiar link da entrevista
async function copiarLinkEntrevista() {
  const link = document.getElementById("linkEntrevista").value;
  if (!link) {
    mostrarToast("Nenhum link para copiar");
    return;
  }

  try {
    await navigator.clipboard.writeText(link);
    mostrarToast("Link da entrevista copiado");
  } catch (e) {
    console.error("Erro ao copiar link:", e);
    mostrarToast("Não foi possível copiar o link");
  }
}

// Copiar relatório completo
async function copiarRelatorioParaClipboard() {
  if (!candidatoSelecionado) {
    mostrarToast("Nenhum candidato selecionado.");
    return;
  }

  const disciplinas = Array.isArray(candidatoSelecionado.disciplinas) 
    ? candidatoSelecionado.disciplinas.join(", ") 
    : (candidatoSelecionado.disciplinas || "");

  const texto = `Nome candidato: ${candidatoSelecionado.nome || ""}
Disciplinas de domínio: ${disciplinas}
Comentários do avaliador: ${document.getElementById("impressoesCandidato").value || ""}
Resultado da entrevista: ${document.getElementById("statusCandidato").value || ""}`;

  try {
    await navigator.clipboard.writeText(texto);
    mostrarToast("Relatório Copiado");
  } catch (e) {
    console.error("Erro ao copiar relatório:", e);
    mostrarToast("Não foi possível copiar o relatório.");
  }
}

// ==============================
// FUNÇÕES AUXILIARES
// ==============================
function formatarCPF(cpf) {
  if (!cpf) return "";
  const n = cpf.replace(/\D/g, "");
  return n.length === 11
    ? n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    : cpf;
}

// ==============================
// CONTROLES DA UI
// ==============================
function atualizarVisualStatus(statusValue) {
  const select = document.getElementById("statusCandidato");
  select.classList.remove("border-red-500", "text-red-500", "border-green-500", "text-green-500", "text-gray-700");
  if (statusValue === "Reprovado") {
    select.classList.add("border-red-500", "text-red-500");
  } else if (statusValue === "Aprovado") {
    select.classList.add("border-green-500", "text-green-500");
  } else {
    select.classList.add("text-gray-700");
  }
}

// Botões de status
function setBotaoAprovado() {
  const btnA = document.getElementById("btnAprovado");
  const btnR = document.getElementById("btnReprovado");
  const btnD = document.getElementById("btnDesistente");
  
  btnA.classList.add("btn-active-success");
  btnR.classList.remove("btn-active-danger");
  btnD.classList.remove("btn-active-danger");
  
  document.getElementById("statusCandidato").value = "Aprovado";
  atualizarVisualStatus("Aprovado");
  
  // Copiar mensagem de aprovação
  navigator.clipboard.writeText(MENSAGEM_APROVACAO).then(() => {
    mostrarToast("Mensagem de aprovação copiada");
  });
}

function setBotaoReprovado() {
  const btnA = document.getElementById("btnAprovado");
  const btnR = document.getElementById("btnReprovado");
  const btnD = document.getElementById("btnDesistente");
  
  btnR.classList.add("btn-active-danger");
  btnA.classList.remove("btn-active-success");
  btnD.classList.remove("btn-active-danger");
  
  document.getElementById("statusCandidato").value = "Reprovado";
  atualizarVisualStatus("Reprovado");
  
  // Copiar mensagem de reprovação
  navigator.clipboard.writeText(MENSAGEM_REPROVACAO).then(() => {
    mostrarToast("Mensagem de reprovação copiada");
  });
}

function setBotaoDesistente() {
  const btnA = document.getElementById("btnAprovado");
  const btnR = document.getElementById("btnReprovado");
  const btnD = document.getElementById("btnDesistente");
  
  btnD.classList.add("btn-active-danger");
  btnA.classList.remove("btn-active-success");
  btnR.classList.remove("btn-active-danger");
  
  document.getElementById("statusCandidato").value = "Reprovado";
  atualizarVisualStatus("Reprovado");
  
  // Copiar mensagem de desistência
  navigator.clipboard.writeText(MENSAGEM_DESISTENTE).then(() => {
    mostrarToast("Mensagem de Candidato Desistente copiada");
  });
}

// Excluir candidato
async function excluirCandidato() {
  if (!candidatoSelecionado) return;

  try {
    await db.collection("candidatos").doc(candidatoSelecionado.id).update({
      status: "Reprovado"
    });

    candidatoSelecionado.status = "Reprovado";
    mostrarToast("Candidato marcado como Reprovado");
    renderizarListaCandidatos();
    preencherAreaAvaliacao();
  } catch (error) {
    console.error("Erro ao excluir candidato:", error);
    mostrarToast("Erro ao excluir candidato!");
  }
}

function functionSalvarCandidato() {
  // placeholder para função existente
  mostrarToast("Função salvar candidato chamada");
}

// ==============================
// EVENTOS INICIAIS E BINDINGS
// ==============================
function inicializarApp() {
  // Bind filtros
  document.getElementById("filtroStatus").addEventListener("change", aplicarFiltros);
  document.getElementById("filtroDisciplina").addEventListener("change", aplicarFiltros);
  document.getElementById("filtroDataEntrevista").addEventListener("change", function() {
    const valor = this.value;
    const listaMeses = document.getElementById("listaMeses");
    
    if (valor === "selecionarMes") {
      listaMeses.classList.remove("hidden");
    } else {
      listaMeses.classList.add("hidden");
      mesSelecionado = null;
      aplicarFiltros();
    }
  });

  // Máscaras de data e hora
  aplicarMascaraData(document.getElementById("dataEntrevista"));
  aplicarMascaraHora(document.getElementById("horaEntrevista"));

  // Botões de avaliação
  document.getElementById("btnSalvarAlteracoes").addEventListener("click", salvarAlteracoes);
  document.getElementById("btnCopiarLink").addEventListener("click", copiarLinkEntrevista);
  document.getElementById("btnCopiarRelatorio").addEventListener("click", copiarRelatorioParaClipboard);

  // Botões de status
  document.getElementById("btnAprovado").addEventListener("click", setBotaoAprovado);
  document.getElementById("btnReprovado").addEventListener("click", setBotaoReprovado);
  document.getElementById("btnDesistente").addEventListener("click", setBotaoDesistente);

  // Botão excluir
  document.getElementById("btnExcluirCandidato").addEventListener("click", () => {
    abrirPopup(
      "Excluir Candidato",
      "Ao confirmar, o candidato será marcado como Reprovado. Deseja continuar?",
      () => { excluirCandidato(); },
      "Confirmar",
      "Cancelar"
    );
  });

  // Botão salvar candidato
  document.getElementById("btnSalvarCandidato").addEventListener("click", () => {
    abrirPopup(
      "Salvar candidato",
      "Ao clicar em salvar, este candidato será adicionado ao banco oficial de professores da Master. Tem certeza disso?",
      () => { functionSalvarCandidato(); },
      "Salvar",
      "Cancelar"
    );
  });

  // status select change -> atualiza visual
  document.getElementById("statusCandidato").addEventListener("change", (e) => {
    atualizarVisualStatus(e.target.value);
    // sincroniza botões visuais
    if (e.target.value === "Aprovado") {
      document.getElementById("btnAprovado").classList.add("btn-active-success");
      document.getElementById("btnReprovado").classList.remove("btn-active-danger");
      document.getElementById("btnDesistente").classList.remove("btn-active-danger");
    } else if (e.target.value === "Reprovado") {
      document.getElementById("btnReprovado").classList.add("btn-active-danger");
      document.getElementById("btnAprovado").classList.remove("btn-active-success");
      document.getElementById("btnDesistente").classList.remove("btn-active-danger");
    } else {
      document.getElementById("btnAprovado").classList.remove("btn-active-success");
      document.getElementById("btnReprovado").classList.remove("btn-active-danger");
      document.getElementById("btnDesistente").classList.remove("btn-active-danger");
    }
  });

  // Carregar candidatos
  carregarCandidatos();
}

document.addEventListener("DOMContentLoaded", () => {
  if (initializeFirebase()) {
    inicializarApp();
  } else {
    inicializarApp();
  }
});
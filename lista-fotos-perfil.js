// lista-fotos-perfil.js
// Lista de fotos de perfil disponíveis na pasta img-professor
// Este arquivo foi gerado automaticamente
// Para atualizar: Execute .\atualizar-lista-fotos.ps1 OU copie os comandos do README.md

const FOTOS_PERFIL_DISPONIVEIS = [
  "Amanda Prexedes.png",
  "Anna Cabral.png",
  "Eduarda Melo.png",
  "Emily Oliveira.png",
  "Erica Oliveira.png",
  "Erika Vieira.png",
  "Evelyn Alves.png",
  "Gabriel Londres.png",
  "Isabela Ferreira.png",
  "Jaciara Pereira.png",
  "João Silva.png",
  "Joaquim Omena.png",
  "Kamila Melo.png",
  "Kariny Melo.png",
  "Leide Ferraz.png",
  "Louis Mota.png",
  "Lucas Lima.png",
  "Marcos Oliveira.png",
  "Noemi Castro.png",
  "Pablo Silva.png",
  "Pâmela Melo.png",
  "Pedro Uchoa.png",
  "Rubens Oliveira.png",
  "Thuane Barbosa.png",
  "Victória Moreira.png",
  "Wellington Correia.png",
  "Willian Pereira.png"
];

// Função para obter o caminho completo da foto
function getCaminhoFotoPerfil(nomeFoto) {
  if (!nomeFoto || nomeFoto === 'icone-padrao') {
    return null; // Retorna null para usar o ícone padrão
  }
  return `img-professor/${nomeFoto}`;
}

// Função para obter todas as opções de foto (incluindo ícone padrão)
function getOpcoesFotoPerfil() {
  return ['icone-padrao', ...FOTOS_PERFIL_DISPONIVEIS];
}

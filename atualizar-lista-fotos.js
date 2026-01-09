// atualizar-lista-fotos.js
// Script para atualizar automaticamente a lista de fotos de perfil
// Execute este script sempre que adicionar, remover ou renomear imagens na pasta img-professor

const fs = require('fs');
const path = require('path');

// Configurações
const PASTA_IMAGENS = './img-professor';
const ARQUIVO_SAIDA = './lista-fotos-perfil.js';

// Ler arquivos da pasta
try {
    console.log('🔍 Lendo pasta:', PASTA_IMAGENS);
    
    const arquivos = fs.readdirSync(PASTA_IMAGENS);
    const imagensPng = arquivos.filter(arquivo => arquivo.toLowerCase().endsWith('.png'));
    
    console.log(`✅ Encontradas ${imagensPng.length} imagens PNG`);
    
    // Ordenar alfabeticamente
    imagensPng.sort();
    
    // Gerar conteúdo do arquivo JavaScript
    const conteudo = `// lista-fotos-perfil.js
// Lista de fotos de perfil disponíveis na pasta img-professor
// Este arquivo foi gerado automaticamente em ${new Date().toLocaleString('pt-BR')}
// Para atualizar, execute: node atualizar-lista-fotos.js

const FOTOS_PERFIL_DISPONIVEIS = [
${imagensPng.map(img => `  "${img}"`).join(',\n')}
];

// Função para obter o caminho completo da foto
function getCaminhoFotoPerfil(nomeFoto) {
  if (!nomeFoto || nomeFoto === 'icone-padrao') {
    return null; // Retorna null para usar o ícone padrão
  }
  return \`img-professor/\${nomeFoto}\`;
}

// Função para obter todas as opções de foto (incluindo ícone padrão)
function getOpcoesFotoPerfil() {
  return ['icone-padrao', ...FOTOS_PERFIL_DISPONIVEIS];
}
`;

    // Escrever arquivo
    fs.writeFileSync(ARQUIVO_SAIDA, conteudo, 'utf8');
    
    console.log('✅ Arquivo gerado com sucesso:', ARQUIVO_SAIDA);
    console.log('\n📋 Lista de imagens:');
    imagensPng.forEach((img, index) => {
        console.log(`   ${index + 1}. ${img}`);
    });
    
} catch (error) {
    console.error('❌ Erro ao processar imagens:', error.message);
    process.exit(1);
}

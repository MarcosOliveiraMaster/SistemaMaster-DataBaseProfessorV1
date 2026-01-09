# atualizar-lista-fotos.ps1
# Script PowerShell para atualizar automaticamente a lista de fotos de perfil
# Execute este script sempre que adicionar, remover ou renomear imagens na pasta img-professor
# Como executar: .\atualizar-lista-fotos.ps1

$PASTA_IMAGENS = ".\img-professor"
$ARQUIVO_SAIDA = ".\lista-fotos-perfil.js"

Write-Host "🔍 Lendo pasta: $PASTA_IMAGENS" -ForegroundColor Cyan

# Ler arquivos PNG da pasta
$imagensPng = Get-ChildItem -Path $PASTA_IMAGENS -Filter "*.png" | Sort-Object Name

if ($imagensPng.Count -eq 0) {
    Write-Host "❌ Nenhuma imagem PNG encontrada na pasta!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Encontradas $($imagensPng.Count) imagens PNG" -ForegroundColor Green

# Criar lista de nomes formatados
$listaFormatada = $imagensPng | ForEach-Object { "  `"$($_.Name)`"" }
$listaString = $listaFormatada -join ",`n"

# Data atual
$dataAtual = Get-Date -Format "dd/MM/yyyy HH:mm:ss"

# Gerar conteúdo do arquivo JavaScript
$conteudo = @"
// lista-fotos-perfil.js
// Lista de fotos de perfil disponíveis na pasta img-professor
// Este arquivo foi gerado automaticamente em $dataAtual
// Para atualizar, execute: .\atualizar-lista-fotos.ps1

const FOTOS_PERFIL_DISPONIVEIS = [
$listaString
];

// Função para obter o caminho completo da foto
function getCaminhoFotoPerfil(nomeFoto) {
  if (!nomeFoto || nomeFoto === 'icone-padrao') {
    return null; // Retorna null para usar o ícone padrão
  }
  return ``img-professor/`${nomeFoto}``;
}

// Função para obter todas as opções de foto (incluindo ícone padrão)
function getOpcoesFotoPerfil() {
  return ['icone-padrao', ...FOTOS_PERFIL_DISPONIVEIS];
}
"@

# Escrever arquivo
Set-Content -Path $ARQUIVO_SAIDA -Value $conteudo -Encoding UTF8

Write-Host "✅ Arquivo gerado com sucesso: $ARQUIVO_SAIDA" -ForegroundColor Green
Write-Host "`n📋 Lista de imagens:" -ForegroundColor Yellow

$index = 1
foreach ($img in $imagensPng) {
    Write-Host "   $index. $($img.Name)" -ForegroundColor White
    $index++
}

Write-Host "`n✨ Pronto! Atualize a página no navegador para ver as mudanças." -ForegroundColor Green

# 📸 Sistema de Fotos de Perfil - Instruções

## Como Atualizar a Lista de Fotos

Sempre que você **adicionar**, **remover** ou **renomear** imagens na pasta `img-professor`, siga um destes métodos:

---

### ✅ **Método 1: Script PowerShell Automático (Recomendado)**

1. Abra o PowerShell na pasta do projeto
2. Execute o comando:
   ```powershell
   .\atualizar-lista-fotos.ps1
   ```

**Se der erro de permissão**, execute este comando UMA VEZ:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Depois execute novamente:
```powershell
.\atualizar-lista-fotos.ps1
```

---

### ✅ **Método 2: Comandos Manuais no PowerShell**

Cole estes comandos no PowerShell (um de cada vez):

```powershell
$imagensPng = Get-ChildItem -Path ".\img-professor" -Filter "*.png" | Sort-Object Name
$listaFormatada = $imagensPng | ForEach-Object { "  `"$($_.Name)`"" }
$listaString = $listaFormatada -join ",`n"
$conteudo = "const FOTOS_PERFIL_DISPONIVEIS = [`n$listaString`n];"
Write-Host $conteudo
```

Depois copie o resultado e cole no arquivo `lista-fotos-perfil.js` (substituindo o array existente).

---

### ✅ **Método 3: Node.js (Se tiver instalado)**

```bash
node atualizar-lista-fotos.js
```

---

## 📋 Imagens Atuais (27 fotos)

1. Amanda Prexedes.png
2. Anna Cabral.png
3. Eduarda Melo.png
4. Emily Oliveira.png
5. Erica Oliveira.png
6. Erika Vieira.png
7. Evelyn Alves.png
8. Gabriel Londres.png
9. Isabela Ferreira.png
10. Jaciara Pereira.png
11. João Silva.png
12. Joaquim Omena.png
13. Kamila Melo.png
14. Kariny Melo.png
15. Leide Ferraz.png
16. Louis Mota.png
17. Lucas Lima.png
18. Marcos Oliveira.png
19. Noemi Castro.png
20. Pablo Silva.png
21. Pâmela Melo.png
22. Pedro Uchoa.png
23. Rubens Oliveira.png
24. Thuane Barbosa.png
25. Victória Moreira.png
26. Wellington Correia.png
27. Willian Pereira.png

---

## 💡 Dicas

- **Formato aceito**: Apenas arquivos `.png`
- **Organização**: Os nomes são ordenados alfabeticamente automaticamente
- **Atualização**: Após gerar a lista, atualize a página no navegador (F5)
- **Teste**: Verifique se as imagens aparecem corretamente na lista de seleção

---

## 🔧 Solução de Problemas

**Imagem não aparece?**
- Verifique se o nome do arquivo está correto (com extensão .png)
- Confirme que o arquivo está na pasta `img-professor`
- Execute o script de atualização novamente
- Limpe o cache do navegador (Ctrl + Shift + Delete)

**Script não executa?**
- Use o Método 2 (comandos manuais)
- Ou edite manualmente o arquivo `lista-fotos-perfil.js`

@echo off
echo ==========================================
echo       ENVIANDO PROJETO PARA O GITHUB
echo ==========================================

echo 1. Inicializando Git...
git init

echo.
echo 2. Configurando usuario (Padrao)...
git config user.name "Jefferson Dantas"
git config user.email "jeffersondantas@users.noreply.github.com"

echo.
echo 3. Adicionando arquivos...
git add .

echo.
echo 4. Criando commit...
git commit -m "V1.0 - Monitor de Toner Finalizado"

echo.
echo 5. Configurando branch main...
git branch -M main

echo.
echo 6. Conectando ao repositorio remoto...
git remote remove origin
git remote add origin https://github.com/jeffersondantas1982/monitor-toner

echo.
echo 7. Enviando arquivos...
git push -u origin main

echo.
echo ==========================================
echo                 CONCLUIDO!
echo ==========================================
pause

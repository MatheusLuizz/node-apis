# Passo a passo da API para localizar delegacias da mulher próximas a partir do CEP

Para utilizar a API, você deverá ter uma API KEY com o Places API habilitado na Google Cloud

Em posse da chave API, crie um arquivo .env na raiz do projeto e digite desta forma:

# GOOGLE_KEY=SUA_CHAVE

Substitua SUA_CHAVE pela chave gerada no Google Cloud

Utilize o comando npm install para instalar as dependências do package.json e criar o arquivo node_modules

# npm start

Utilize o comando npm start para subir o servidor. Para evitar conflitos com aplicações React, a porta foi alterada de 3000 para 7070, mude para esta porta nas requisições

Exemplo de requisição GET no postman com o CEP do Marco Zero de Recife:

http://localhost:7070/locais?cep=50030-310

Esta requisição retornará as delegacias mais próximas ao CEP informado

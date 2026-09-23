# Especificação - Document Management System

> Especificação funcional e técnica da primeira versão do DMS. O documento orienta a implementação futura sem substituir os critérios de aceitação.

## 1. Objetivo

Entregar um sistema web para que usuários enviem, consultem e baixem seus documentos com metadados mantidos em memória e arquivos armazenados exclusivamente no filesystem local da aplicação.

## 2. Escopo

### 2.1 Dentro do escopo

- Upload de um documento por requisição.
- Associação do documento a um usuário identificado pelo header `X-User-Id`.
- Validação de arquivo, tamanho e tipo MIME.
- Listagem dos documentos pertencentes ao usuário autenticado pela requisição.
- Download de documentos pelo identificador.
- Interface React para upload, listagem, estados de carregamento e download.
- API HTTP em Express com respostas JSON padronizadas para operações e erros.
- Armazenamento dos binários em `backend/storage` usando `multer.diskStorage`.
- Armazenamento dos metadados em memória nesta fase inicial.

### 2.2 Fora do escopo

- Armazenamento externo, banco de dados ou serviços de nuvem.
- Login, emissão de tokens, JWT, sessões ou autenticação completa.
- Versionamento, edição ou exclusão de documentos.
- Upload de múltiplos arquivos na mesma requisição.
- Compartilhamento entre usuários ou permissões além do proprietário.
- Paginação, busca textual e filtros avançados.
- Recuperação dos metadados após reinício do processo.
- Execução de servidores, implantação ou provisionamento de infraestrutura como parte desta especificação.

### 2.3 Premissas

- O `X-User-Id` representa uma identidade fornecida por uma camada externa ou pelo cliente de demonstração. Ele não prova a identidade do usuário e não constitui autenticação de produção.
- O armazenamento local é acessível pelo processo do backend e possui permissão de leitura e escrita.
- O frontend usa o prefixo `/api` para chamar o backend através do proxy de desenvolvimento configurado no Vite.
- O nome original é informação de apresentação; nunca deve ser usado diretamente como caminho físico.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceitação |
| --- | --- | --- |
| RF-01 | O usuário pode enviar um documento. | Uma requisição válida cria exatamente um registro de metadados e um arquivo físico associado. |
| RF-02 | O upload exige um usuário identificado. | Sem `X-User-Id`, ou com valor vazio/inválido, a API rejeita a requisição com erro de entrada. |
| RF-03 | O upload recebe um arquivo multipart. | O campo multipart obrigatório é `file`; requisições sem arquivo são rejeitadas. |
| RF-04 | O sistema valida tamanho e tipo MIME. | O arquivo é rejeitado quando excede `MAX_FILE_SIZE_BYTES` ou não pertence aos tipos configurados em `ALLOWED_MIME_TYPES`. |
| RF-05 | O sistema gera um identificador único. | Cada documento recebe um `id` que não colide com outro documento durante a vida do processo. |
| RF-06 | O sistema preserva os metadados do documento. | O registro contém `id`, `originalName`, `size`, `uploadedAt` e `owner`. |
| RF-07 | O arquivo físico não usa diretamente o nome original. | O nome armazenado deriva do identificador do documento, com extensão validada e sem segmentos de caminho fornecidos pelo cliente. |
| RF-08 | O usuário pode listar seus documentos. | `GET /documents` retorna somente registros cujo `owner` corresponde ao `X-User-Id` da requisição. |
| RF-09 | A listagem é simples na primeira versão. | A resposta não oferece paginação e retorna a coleção filtrada do usuário em ordem decrescente de `uploadedAt`. |
| RF-10 | O usuário pode baixar um documento próprio. | Um documento existente pertencente ao usuário é retornado como conteúdo binário com nome de download apropriado. |
| RF-11 | O sistema impede acesso indevido. | Um documento inexistente ou pertencente a outro usuário não é disponibilizado e resulta em `404`. |
| RF-12 | A API comunica falhas de forma previsível. | Erros de validação, ausência, conflito e falha interna usam o formato JSON padronizado desta especificação. |
| RF-13 | O sistema expõe saúde operacional básica. | `GET /health` retorna o estado da aplicação sem exigir identidade de usuário. |
| RF-14 | O frontend apresenta o fluxo principal. | A interface permite selecionar/enviar arquivo, visualizar a listagem, indicar estados de carregamento/erro e iniciar download. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados no filesystem local em `backend/storage`, usando `multer` com `diskStorage`. |
| RNF-02 | Os metadados devem ser mantidos em memória nesta fase. Um reinício do processo perde o índice, mesmo que arquivos físicos permaneçam no diretório. |
| RNF-03 | O limite máximo de arquivo deve ser configurável por `MAX_FILE_SIZE_BYTES`. |
| RNF-04 | Os tipos MIME permitidos devem ser configuráveis por `ALLOWED_MIME_TYPES`, sem depender apenas da extensão informada pelo cliente. |
| RNF-05 | A porta, o diretório de armazenamento e os limites operacionais devem ser configuráveis por variáveis de ambiente, seguindo o princípio 12-Factor. |
| RNF-06 | O caminho físico deve ser construído pelo backend a partir de dados confiáveis. Entradas do cliente não podem introduzir `..`, separadores de diretório ou caminhos absolutos. |
| RNF-07 | O sistema deve evitar colisão entre nomes físicos e não deve sobrescrever um arquivo existente como consequência de um upload válido. |
| RNF-08 | Datas expostas pela API devem usar strings ISO 8601 em UTC. Tamanhos devem ser números inteiros em bytes. |
| RNF-09 | A aplicação deve separar transporte HTTP, regras de negócio e persistência conforme a Clean Architecture simples definida nesta especificação. |
| RNF-10 | Erros de entrada devem ser tratados na borda HTTP; falhas de filesystem e inconsistências internas devem ser convertidas em respostas controladas sem expor stack trace ao cliente. |
| RNF-11 | O backend deve usar CommonJS, o frontend deve usar React/Vite com módulos ESM e a comunicação do frontend deve usar `fetch`. |
| RNF-12 | A solução deve ser testável com o runner nativo `node:test`, sem exigir banco de dados ou serviços externos. |

## 5. Modelo de dados

### 5.1 Metadados do documento

| Campo | Tipo | Obrigatório | Descrição e regra |
| --- | --- | --- | --- |
| `id` | `string` | Sim | Identificador único, gerado pelo backend. Não é controlado pelo cliente. |
| `originalName` | `string` | Sim | Nome original recebido no upload, normalizado para apresentação e sem ser usado para montar caminhos. |
| `size` | `number` | Sim | Tamanho final do arquivo em bytes; deve ser inteiro maior ou igual a zero. |
| `uploadedAt` | `string` | Sim | Data/hora da criação do registro em ISO 8601 UTC. |
| `owner` | `string` | Sim | Valor validado do header `X-User-Id` que criou o documento. |

### 5.2 Estado físico

O repositório de metadados deve manter uma referência interna ao caminho físico do arquivo para executar o download, mas esse caminho não deve ser exposto como campo público da API. O arquivo deve seguir uma convenção equivalente a `<id>.<extensão-segura>` dentro de `backend/storage`.

A extensão deve ser derivada de uma regra controlada pelo servidor e não deve permitir alteração do diretório de destino. `originalName` permanece separado do nome físico para evitar colisões e path traversal.

### 5.3 Ciclo de vida e consistência

1. Validar usuário e arquivo.
2. Gerar o identificador e definir o destino físico.
3. Gravar o arquivo.
4. Criar o registro de metadados em memória.
5. Retornar os metadados públicos.

Se a gravação do arquivo for concluída mas o registro não puder ser criado, o service deve tentar remover o arquivo órfão e retornar erro interno. Se o registro existir mas o arquivo não estiver disponível no download, a API deve retornar erro controlado e registrar a falha para diagnóstico.

Como os metadados são voláteis, arquivos sem registro após reinício não são considerados documentos acessíveis pela API nesta fase.

## 6. Contratos de API

### 6.1 Convenções gerais

- Base path do backend: `/`.
- O frontend chama os endpoints pelo prefixo `/api`, usando o proxy do Vite; o proxy remove ou encaminha o prefixo conforme a configuração existente.
- Quando exigido, `X-User-Id` deve ser um identificador não vazio, sem controle de caminho e limitado ao tamanho definido pela validação de entrada.
- Respostas JSON usam `Content-Type: application/json; charset=utf-8`.
- Erros seguem o formato:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

Os códigos são estáveis para consumo do frontend; as mensagens são destinadas à apresentação e podem evoluir sem alterar o significado do erro.

### 6.2 GET /health

Verifica se o processo HTTP está disponível.

**Entrada:** nenhuma.

**Resposta `200 OK`:**

```json
{
  "status": "ok"
}
```

Não exige `X-User-Id` e não expõe detalhes do filesystem ou da memória.

### 6.3 POST /upload

Cria um documento para o usuário informado.

**Headers obrigatórios:**

- `X-User-Id: <identificador-do-usuario>`
- `Content-Type: multipart/form-data; boundary=...` (gerado pelo cliente multipart)

**Corpo:** campo multipart obrigatório `file`, contendo exatamente um arquivo.

O cliente não deve definir manualmente o header `Content-Type` ao usar `FormData` no navegador, para que o boundary seja gerado corretamente.

**Resposta `201 Created`:**

```json
{
  "id": "8e3c2c4a-0c0a-4f9b-8a45-2f8f2d5d2f12",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-09-23T12:00:00.000Z",
  "owner": "user-123"
}
```

**Erros esperados:**

| Status | Código | Situação |
| --- | --- | --- |
| `400` | `MISSING_USER` | Header `X-User-Id` ausente ou inválido. |
| `400` | `MISSING_FILE` | Campo `file` ausente. |
| `400` | `INVALID_FILE_TYPE` | MIME não permitido. |
| `413` | `FILE_TOO_LARGE` | Arquivo acima de `MAX_FILE_SIZE_BYTES`. |
| `500` | `UPLOAD_FAILED` | Falha ao gravar o arquivo ou seus metadados. |

### 6.4 GET /documents

Lista os documentos do usuário informado. A primeira versão não possui query parameters de paginação.

**Headers obrigatórios:**

- `X-User-Id: <identificador-do-usuario>`

**Resposta `200 OK`:**

```json
{
  "documents": [
    {
      "id": "8e3c2c4a-0c0a-4f9b-8a45-2f8f2d5d2f12",
      "originalName": "relatorio.pdf",
      "size": 24576,
      "uploadedAt": "2026-09-23T12:00:00.000Z",
      "owner": "user-123"
    }
  ]
}
```

A coleção deve ser filtrada por `owner` e ordenada do upload mais recente para o mais antigo. Uma lista vazia é sucesso e retorna `{"documents": []}`.

**Erros esperados:**

| Status | Código | Situação |
| --- | --- | --- |
| `400` | `MISSING_USER` | Header ausente ou inválido. |
| `500` | `LIST_FAILED` | Falha inesperada ao consultar o repositório em memória. |

### 6.5 GET /documents/:id/download

Baixa o conteúdo binário de um documento pertencente ao usuário informado.

**Headers obrigatórios:**

- `X-User-Id: <identificador-do-usuario>`

**Parâmetro de rota:** `id`, identificador do documento.

**Resposta `200 OK`:**

- Corpo binário do arquivo.
- `Content-Type` correspondente ao MIME armazenado ou `application/octet-stream` quando não houver valor seguro.
- `Content-Disposition: attachment; filename="<nome-original-seguro>"`.
- O nome usado no header deve ser codificado/normalizado para não permitir injeção de headers.

**Erros esperados:**

| Status | Código | Situação |
| --- | --- | --- |
| `400` | `MISSING_USER` | Header ausente ou inválido. |
| `404` | `DOCUMENT_NOT_FOUND` | ID inexistente ou documento pertencente a outro usuário. |
| `404` | `FILE_NOT_FOUND` | Metadado existe, mas arquivo físico não está disponível. |
| `500` | `DOWNLOAD_FAILED` | Falha inesperada ao ler o arquivo. |

A API deve responder `404` tanto para documento inexistente quanto para documento de outro usuário, evitando revelar a existência de recursos de terceiros.

## 7. Decisões arquiteturais

### 7.1 Backend

O backend seguirá o fluxo de dependências:

`routes -> controllers -> services -> repositories`

- **`routes/`**: registra métodos, caminhos e middlewares HTTP; não contém regra de negócio.
- **`controllers/`**: lê headers, parâmetros, multipart e resultado do service; escolhe status HTTP e serializa respostas.
- **`services/`**: aplica validações de negócio, autorização por proprietário, geração de ID, coordenação entre arquivo e metadados e tratamento de inconsistências.
- **`repositories/`**: encapsula o índice de metadados em memória e as operações de leitura/escrita necessárias ao armazenamento local. A camada não deve conhecer detalhes de roteamento HTTP.
- **`app.js`**: compõe Express, middlewares, rotas e tratamento de erros sem concentrar regras de negócio.

O service deve receber dependências por composição para permitir testes sem filesystem real quando apropriado. A implementação não deve introduzir banco de dados ou provedor externo.

### 7.2 Armazenamento

`multer.diskStorage` será responsável pelo recebimento inicial do arquivo e pela escrita em `backend/storage`. O destino, o nome físico e os limites devem ser definidos no backend. O nome original é preservado somente nos metadados públicos.

A criação do metadado e a escrita do arquivo não formam uma transação de banco. O service deve implementar compensação simples, removendo arquivo quando o registro falhar.

### 7.3 Frontend

O frontend usará componentes funcionais React e organização por `components/`, `pages/` e `services/`.

- `services/` encapsula chamadas `fetch` para upload, listagem e download.
- A página principal controla o carregamento inicial, envio, atualização da lista e mensagens de erro.
- Componentes de apresentação não devem duplicar a lógica de comunicação.
- O cliente envia `X-User-Id` de acordo com a identidade de demonstração definida pela aplicação.
- O download deve tratar a resposta como `Blob` e usar o nome fornecido pelo servidor ou um fallback seguro.

### 7.4 Configuração

A configuração deve ser lida de variáveis de ambiente, com defaults documentados para desenvolvimento. Valores mínimos esperados:

| Variável | Finalidade |
| --- | --- |
| `PORT` | Porta HTTP do backend. |
| `STORAGE_DIR` | Diretório local dos arquivos, default equivalente a `backend/storage`. |
| `MAX_FILE_SIZE_BYTES` | Limite máximo de bytes por arquivo. |
| `ALLOWED_MIME_TYPES` | Lista delimitada de MIME types permitidos. |
|
Segredos não são necessários para a primeira versão e não devem ser adicionados ao repositório.

## 8. Plano de execução

O plano abaixo é um roadmap de implementação posterior. Ele não implica executar código durante a criação desta especificação.

1. **Configuração e limites**
   - Definir leitura e validação das variáveis de ambiente.
   - Critério de saída: limites, diretório e defaults são conhecidos pelo processo sem hardcode espalhado.

2. **Modelo e repositório em memória**
   - Criar a estrutura de metadados, geração de IDs e operações de inserir/listar/buscar.
   - Critério de saída: documentos são isolados por `owner` e ordenados por data.

3. **Configuração do armazenamento local**
   - Configurar `multer.diskStorage`, limites, filtro de MIME e nome físico derivado do ID.
   - Critério de saída: nenhum nome de cliente controla o caminho final e arquivos acima do limite são rejeitados.

4. **Serviço de documentos**
   - Implementar upload, listagem e download, incluindo autorização, compensação de arquivos órfãos e normalização de dados.
   - Critério de saída: regras de negócio funcionam sem dependência direta de objetos HTTP.

5. **Controllers e tratamento de erros**
   - Mapear entrada HTTP para serviços e resultados para os status/códigos definidos.
   - Critério de saída: respostas de sucesso e erro seguem os contratos desta especificação.

6. **Rotas e composição da aplicação**
   - Registrar `/health`, `/upload`, `/documents` e `/documents/:id/download` e compor as dependências no app.
   - Critério de saída: endpoints acessíveis e sem regra duplicada nas rotas.

7. **Frontend**
   - Criar serviços `fetch`, página principal, formulário de upload, listagem e ação de download.
   - Critério de saída: usuário consegue completar o fluxo principal e visualizar estados de carregamento, vazio e erro.

8. **Testes backend**
   - Expandir `node:test` com casos de sucesso, validação, isolamento, download e falhas de persistência.
   - Critério de saída: requisitos RF-01 a RF-13 possuem cobertura automatizada adequada.

9. **Testes e integração frontend**
   - Verificar chamadas ao proxy, interpretação de respostas e comportamento de erro da interface.
   - Critério de saída: o frontend não depende de caminhos físicos nem expõe detalhes internos do backend.

10. **Validação manual e documentação operacional**
    - Conferir configuração limpa, diretório de storage, reinício do processo e mensagens de erro.
    - Critério de saída: limitações da memória e do storage local estão documentadas e reproduzíveis.

## 9. Critérios de aceitação

- [ ] Um usuário com `X-User-Id` válido consegue enviar um arquivo permitido.
- [ ] O upload retorna `201` e os cinco metadados públicos definidos.
- [ ] Arquivos sem campo `file`, sem usuário, com MIME não permitido ou acima do limite são rejeitados com o código correspondente.
- [ ] Dois usuários não visualizam os documentos um do outro na listagem.
- [ ] Um usuário não consegue baixar documento de outro usuário; a resposta é `404`.
- [ ] Um documento existente pode ser baixado como binário com nome de arquivo seguro.
- [ ] IDs não colidem e o nome original não consegue alterar o diretório de armazenamento.
- [ ] Falhas após a gravação do arquivo não deixam, quando a compensação for possível, arquivo órfão sem metadado.
- [ ] `GET /documents` retorna lista vazia para usuário sem documentos e não usa paginação nesta versão.
- [ ] `GET /health` retorna `{ "status": "ok" }` sem header de usuário.
- [ ] O frontend apresenta estados de carregamento, sucesso, lista vazia e erro.
- [ ] Após reinício, a perda dos metadados em memória é conhecida e não é mascarada como persistência durável.

## 10. Validação da especificação

Antes de iniciar a implementação, revisar:

- Todas as oito seções do modelo original estão preenchidas ou ampliadas.
- `X-User-Id`, `MAX_FILE_SIZE_BYTES`, `ALLOWED_MIME_TYPES`, filtro por usuário sem paginação e nome físico derivado do ID aparecem de forma consistente.
- Os nomes `file`, `id`, `originalName`, `size`, `uploadedAt` e `owner` são iguais em requisitos, modelo e contratos.
- Cada status de erro possui uma situação verificável.
- O documento não pressupõe banco de dados, storage externo ou autenticação que não estejam no escopo.
- A implementação futura continua respeitando a separação `routes -> controllers -> services -> repositories`.
- Este documento é o único artefato da etapa de especificação; nenhuma execução de back-end ou front-end é necessária para sua aprovação.

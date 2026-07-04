# Consultoria Estratégica Individual — Landing Page

Landing page premium para o produto de topo de esteira da **Elis Nhaia**
(Consultoria e Treinamento). Construída seguindo o Manual de Marca v1.0
(2026) e o briefing de posicionamento fornecido.

## Estrutura de arquivos

```
consultoria-premium/
├── index.html              # Estrutura/conteúdo da página (única página)
├── css/
│   ├── variables.css        # Design tokens em CSS custom properties (fallback estático)
│   └── styles.css           # Estilos de layout e componentes
├── js/
│   └── main.js               # Lógica: carrega config, popula conteúdo dinâmico, UI
├── config/
│   ├── variables.json        # Fonte única de verdade dos tokens de marca (cor/tipografia/raio)
│   └── config.json           # Conteúdo editável: textos, CTAs, WhatsApp, depoimentos, cases
├── assets/
│   └── img/                  # Imagens (retrato, logos de clientes)
└── README.md
```

Cada responsabilidade fica isolada: **estrutura** (HTML), **apresentação**
(CSS), **comportamento** (JS) e **conteúdo/configuração** (JSON). Isso
permite que alguém sem conhecimento técnico atualize textos, número de
WhatsApp ou vídeos de depoimento editando apenas os arquivos `.json`.

## Como os dois arquivos de configuração se relacionam

- **`config/variables.json`** — tokens visuais da marca (as 6 cores do
  manual, fontes, raios de borda, espaçamento). `js/main.js` lê este
  arquivo e injeta cada valor como variável CSS em `:root` no carregamento
  da página. `css/variables.css` contém os mesmos valores **hardcoded**
  como fallback, para o site não quebrar caso o `fetch` falhe (ex.: abrir
  o `index.html` direto do disco, sem servidor).
- **`config/config.json`** — todo o conteúdo textual e operacional:
  textos das seções, CTAs, número de WhatsApp, mensagem padrão, logos de
  clientes, estudos de caso e — o que mais importa no dia a dia — a lista
  de **depoimentos em vídeo**.

Para trocar uma cor da marca, edite apenas `config/variables.json` (e,
por segurança, replique o valor em `css/variables.css`). Para trocar
qualquer texto, CTA ou vídeo, edite apenas `config/config.json` — não é
necessário mexer em HTML, CSS ou JS.

## Como adicionar os vídeos de depoimento (YouTube não listado)

1. Publique o vídeo no YouTube como **não listado**.
2. Copie o ID do vídeo — o trecho depois de `v=` na URL
   (`https://www.youtube.com/watch?v=SEU_ID_AQUI`).
3. Abra `config/config.json` e preencha o bloco `depoimentos.videos`:

```json
{ "titulo": "Depoimento — Empresa X", "youtubeId": "SEU_ID_AQUI", "empresa": "Empresa X" }
```

4. Salve. Nenhuma alteração de código é necessária.

### Por que a página não incorpora o iframe direto

Um vídeo "não listado" ainda carrega a interface padrão do YouTube
(marca, botão de compartilhar, sugestões de vídeos relacionados), o que
destoa do padrão de sofisticação/poucos elementos definido no Manual de
Marca. Para reduzir esse atrito, a seção de depoimentos usa um
**lite-embed**:

- Mostra apenas a miniatura (`hqdefault.jpg`) e um botão de play.
- Só carrega o player — via `youtube-nocookie.com`, com
  `rel=0` e `modestbranding=1` — depois que a pessoa clica.
- Resultado: a página carrega mais rápido e não expõe a marca do YouTube
  antes que o visitante peça para assistir.

Isso reduz, mas não elimina, a presença visual do YouTube (o player em si
ainda é do YouTube). Se a marca quiser remover 100% dessa referência no
médio prazo, as alternativas são hospedar os vídeos no **Vimeo**
(permite remover toda a marca do player, plano pago) ou em um serviço de
streaming próprio (ex.: Cloudflare Stream, Mux).

## Como rodar localmente

Os arquivos `config/*.json` são carregados via `fetch()`, que **não
funciona** abrindo o `index.html` direto no navegador (protocolo
`file://` bloqueia por CORS). É necessário um servidor local simples:

```bash
# Opção 1 — Python (já vem instalado na maioria dos sistemas)
cd consultoria-premium
python3 -m http.server 8000
# depois abra http://localhost:8000

# Opção 2 — Node.js
npx serve .
```

Se a página for aberta sem servidor, ela ainda funciona (usa o conteúdo
estático do HTML e as cores fixas em `variables.css`), mas os blocos
dinâmicos (WhatsApp, depoimentos, logos, cases) não serão atualizados
pelo `config.json` — o `console` do navegador mostrará um aviso.

## Publicação

Por não depender de backend, o projeto pode ser hospedado em qualquer
serviço de arquivos estáticos: Netlify, Vercel, Cloudflare Pages, GitHub
Pages, ou um servidor Apache/Nginx comum. Basta enviar a pasta
`consultoria-premium/` inteira (mantendo a estrutura de subpastas).

## Checklist de conteúdo pendente

Itens marcados como "a preencher" no `config.json` e que precisam de
input antes do lançamento:

- [ ] `assets/img/elis-nhaia-retrato.jpg` — foto editorial da Elis (hero)
- [ ] `assets/img/logo-midia-clean.svg` e `logo-revista-duo.svg`
- [ ] Número de WhatsApp real em `contact.whatsappNumber`
- [ ] 3 IDs de vídeo do YouTube em `depoimentos.videos`
- [ ] Textos reais dos estudos de caso em `resultados.cases`

## Decisões de design (resumo)

- **Paleta e tipografia**: seguem exatamente o Manual de Marca v1.0
  (Azul Petróleo `#17394A`, Azul Escuro `#0E2332`, Terracota `#D9783D`,
  Bege Claro `#F8EEE4`, Branco, Cinza Azulado; Montserrat + Lato).
- **Timeline numerada** na seção "Como acontece a consultoria": único
  lugar da página com numeração, porque ali a ordem das etapas é real e
  importa para quem lê — não é decoração.
- **Sem prova social inflada**: seções de logos e cases usam
  placeholders explícitos até que material real seja fornecido, em vez
  de conteúdo genérico de preenchimento.
- **Mobile first**: CTA fixo na parte inferior da tela em telas menores
  que 1024px; botão flutuante de WhatsApp em todas as resoluções.
- **Acessibilidade**: contraste mínimo 4.5:1 respeitado nas combinações
  aprovadas do manual, foco visível em todos os elementos interativos,
  `prefers-reduced-motion` respeitado.

/**
 * main.js
 * -----------------------------------------------------------------------
 * Responsabilidades:
 *  1. Carregar config/variables.json e injetar como CSS custom properties
 *     (permite trocar cor/tipografia sem tocar em CSS ou HTML).
 *  2. Carregar config/config.json e popular os blocos dinâmicos da página
 *     (links de WhatsApp, depoimentos em vídeo, logos, cases).
 *  3. Comportamentos de UI: reveal on scroll, CTA sticky no mobile,
 *     lite-embed dos vídeos do YouTube (não carrega iframe até o clique).
 *
 * Este arquivo assume que a página é servida por um servidor HTTP local
 * (fetch de arquivo local via file:// é bloqueado pelo navegador).
 * Veja README.md → "Como rodar localmente".
 * -----------------------------------------------------------------------
 */

const CONFIG_PATHS = {
  variables: "config/variables.json",
  content: "config/config.json",
};

async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Falha ao carregar ${path}: ${res.status}`);
  return res.json();
}

/** Aplica config/variables.json como CSS custom properties em :root. */
function applyDesignTokens(vars) {
  const root = document.documentElement.style;
  const c = vars.colors || {};
  root.setProperty("--color-azul-petroleo", c.azulPetroleo);
  root.setProperty("--color-azul-escuro", c.azulEscuro);
  root.setProperty("--color-terracota", c.laranjaTerracota);
  root.setProperty("--color-bege-claro", c.begeClaro);
  root.setProperty("--color-branco", c.branco);
  root.setProperty("--color-cinza-azulado", c.cinzaAzulado);

  const t = vars.typography || {};
  if (t.display) root.setProperty("--font-display", t.display);
  if (t.body) root.setProperty("--font-body", t.body);

  const r = vars.radii || {};
  if (r.pill) root.setProperty("--radius-pill", r.pill);
  if (r.card) root.setProperty("--radius-card", r.card);
}

/** Monta a URL de WhatsApp a partir do config e aplica em todo elemento [data-whatsapp-link]. */
function wireWhatsappLinks(contact) {
  const message = encodeURIComponent(contact.whatsappDefaultMessage || "");
  const url = `https://wa.me/${contact.whatsappNumber}?text=${message}`;
  document.querySelectorAll("[data-whatsapp-link]").forEach((el) => {
    el.setAttribute("href", url);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });
}

/** Renderiza os cards de logos de confiança. */
function renderLogos(confianca) {
  const el = document.querySelector("[data-logos]");
  if (!el || !confianca?.logos?.length) return;
  el.innerHTML = confianca.logos
    .map((l) => `<img src="${l.arquivo}" alt="${l.nome}" loading="lazy">`)
    .join("");
}

/** Renderiza os cases de resultado. */
function renderCases(resultados) {
  const el = document.querySelector("[data-cases]");
  if (!el || !resultados?.cases?.length) return;
  el.innerHTML = resultados.cases
    .map(
      (c) => `
      <article class="case-card reveal">
        <span class="categoria">${c.categoria}</span>
        <p>${c.resumo}</p>
      </article>`
    )
    .join("");
  observeReveals(el.querySelectorAll(".reveal"));
}

/**
 * Renderiza os cards de depoimento em vídeo.
 * Usa "lite embed": mostra uma thumbnail e só carrega o iframe do
 * youtube-nocookie.com após o clique — evita carregar scripts/branding
 * do YouTube antes do usuário pedir, o que preserva a estética premium
 * da página e melhora a performance de carregamento.
 */
function renderTestimonials(depoimentos) {
  const el = document.querySelector("[data-videos]");
  if (!el || !depoimentos?.videos?.length) return;

  el.innerHTML = depoimentos.videos
    .map((v, i) => {
      if (!v.youtubeId) {
        return `
          <div class="video-card reveal">
            <div class="video-placeholder">Vídeo ${i + 1} — adicione o ID do YouTube em config/config.json</div>
          </div>`;
      }
      const thumb = `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`;
      return `
        <div class="video-card reveal" data-video-id="${v.youtubeId}">
          <button class="video-facade" type="button" aria-label="Reproduzir depoimento de ${v.empresa || v.titulo}">
            <img src="${thumb}" alt="" loading="lazy">
            <span class="play-icon"><span><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span></span>
          </button>
          <div class="video-meta">
            <strong>${v.titulo}</strong>
            ${v.empresa ? `<span>${v.empresa}</span>` : ""}
          </div>
        </div>`;
    })
    .join("");

  el.querySelectorAll(".video-facade").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".video-card");
      const id = card.getAttribute("data-video-id");
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
      iframe.title = "Depoimento em vídeo";
      iframe.allow = "accelerometer; autoplay; encrypted-media; picture-in-picture";
      iframe.allowFullscreen = true;
      btn.replaceWith(iframe);
    });
  });

  observeReveals(el.querySelectorAll(".reveal"));
}

/** IntersectionObserver genérico para a classe .reveal. */
function observeReveals(nodeList) {
  const items = nodeList || document.querySelectorAll(".reveal:not(.is-visible)");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  items.forEach((el) => io.observe(el));
}

/** Mostra o CTA sticky no mobile depois que o usuário rola além do hero. */
function wireStickyCta() {
  const sticky = document.querySelector("[data-sticky-cta]");
  const hero = document.querySelector(".hero");
  if (!sticky || !hero) return;
  const io = new IntersectionObserver(
    ([entry]) => sticky.classList.toggle("is-visible", !entry.isIntersecting),
    { threshold: 0 }
  );
  io.observe(hero);
}

/** Preenche textos e listas simples a partir do config.json usando data-bind. */
function bindSimpleText(config) {
  document.querySelectorAll("[data-bind]").forEach((el) => {
    const path = el.getAttribute("data-bind").split(".");
    let value = config;
    for (const key of path) value = value?.[key];
    if (value != null) el.textContent = value;
  });
}

async function init() {
  try {
    const [vars, config] = await Promise.all([
      loadJSON(CONFIG_PATHS.variables),
      loadJSON(CONFIG_PATHS.content),
    ]);

    applyDesignTokens(vars);
    document.title = config.site?.title || document.title;

    wireWhatsappLinks(config.contact);
    renderLogos(config.confianca);
    renderCases(config.resultados);
    renderTestimonials(config.depoimentos);
    bindSimpleText(config);
  } catch (err) {
    // Falha ao buscar JSON (ex.: aberto via file:// sem servidor local).
    // A página continua funcional com o conteúdo estático do HTML.
    console.warn("[config] Não foi possível carregar config dinâmico:", err.message);
  } finally {
    wireStickyCta();
    observeReveals();
  }
}

document.addEventListener("DOMContentLoaded", init);

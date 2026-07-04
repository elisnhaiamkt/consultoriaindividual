const CONFIG_PATHS = {
  variables: "config/variables.json",
  content: "config/config.json",
};

async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Falha ao carregar ${path}: ${res.status}`);
  return res.json();
}

function applyDesignTokens(vars) {
  const root = document.documentElement.style;
  const colors = vars.colors || {};
  const typography = vars.typography || {};
  const radii = vars.radii || {};

  if (colors.azulPetroleo) root.setProperty("--color-azul-petroleo", colors.azulPetroleo);
  if (colors.azulEscuro) root.setProperty("--color-azul-escuro", colors.azulEscuro);
  if (colors.laranjaTerracota) root.setProperty("--color-terracota", colors.laranjaTerracota);
  if (colors.begeClaro) root.setProperty("--color-bege-claro", colors.begeClaro);
  if (colors.branco) root.setProperty("--color-branco", colors.branco);
  if (colors.cinzaAzulado) root.setProperty("--color-cinza-azulado", colors.cinzaAzulado);
  if (typography.display) root.setProperty("--font-display", typography.display);
  if (typography.body) root.setProperty("--font-body", typography.body);
  if (radii.pill) root.setProperty("--radius-pill", radii.pill);
  if (radii.card) root.setProperty("--radius-card", radii.card);
}

function wireLinks(config) {
  const contact = config.contact || {};
  const checkout = config.checkout || {};
  const message = encodeURIComponent(contact.whatsappDefaultMessage || "");
  const whatsappUrl = `https://wa.me/${contact.whatsappNumber || ""}?text=${message}`;
  const hotmartUrl = checkout.hotmartUrl || "#investimento";

  document.querySelectorAll("[data-whatsapp-link]").forEach((el) => {
    el.href = whatsappUrl;
    el.target = "_blank";
    el.rel = "noopener";
  });

  document.querySelectorAll("[data-hotmart-link]").forEach((el) => {
    el.href = hotmartUrl;
    if (hotmartUrl !== "#investimento") {
      el.target = "_blank";
      el.rel = "noopener";
    }
  });
}

function renderCases(resultados) {
  const target = document.querySelector("[data-cases]");
  if (!target || !resultados?.cases?.length) return;

  target.innerHTML = resultados.cases.map((item, index) => `
    <article class="case-card reveal">
      <span class="case-label">Estudo de caso ${String(index + 1).padStart(2, "0")}</span>
      <h3>${item.titulo}</h3>
      <dl>
        <div><dt>Desafio</dt><dd>${item.desafio}</dd></div>
        <div><dt>Solução construída</dt><dd>${item.solucao}</dd></div>
        <div><dt>Resultado obtido</dt><dd>${item.resultado}</dd></div>
      </dl>
    </article>
  `).join("");

  observeReveals(target.querySelectorAll(".reveal"));
}

function renderTestimonials(depoimentos) {
  const target = document.querySelector("[data-videos]");
  if (!target || !depoimentos?.videos?.length) return;

  target.innerHTML = depoimentos.videos.map((video, index) => {
    if (!video.vimeoId) {
      return `
        <article class="video-card reveal">
          <div class="video-placeholder">Vimeo ${String(index + 1).padStart(2, "0")}</div>
          <strong>${video.titulo || "Depoimento a preencher"}</strong>
        </article>
      `;
    }

    return `
      <article class="video-card reveal" data-vimeo-id="${video.vimeoId}">
        <button class="video-facade" type="button" aria-label="Reproduzir depoimento: ${video.titulo}">
          Reproduzir depoimento
        </button>
        <strong>${video.titulo}</strong>
      </article>
    `;
  }).join("");

  target.querySelectorAll(".video-facade").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest("[data-vimeo-id]");
      const id = card.getAttribute("data-vimeo-id");
      const iframe = document.createElement("iframe");
      iframe.src = `https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0&portrait=0`;
      iframe.title = "Depoimento em vídeo";
      iframe.allow = "autoplay; fullscreen; picture-in-picture";
      iframe.allowFullscreen = true;
      button.replaceWith(iframe);
    });
  });

  observeReveals(target.querySelectorAll(".reveal"));
}

function observeReveals(nodeList) {
  const items = nodeList || document.querySelectorAll(".reveal:not(.is-visible)");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  items.forEach((el) => io.observe(el));
}

function wireStickyCta() {
  const sticky = document.querySelector("[data-sticky-cta]");
  const hero = document.querySelector(".hero");
  if (!sticky || !hero || !("IntersectionObserver" in window)) return;

  const io = new IntersectionObserver(([entry]) => {
    sticky.classList.toggle("is-visible", !entry.isIntersecting);
  }, { threshold: 0 });

  io.observe(hero);
}

async function init() {
  try {
    const [vars, config] = await Promise.all([
      loadJSON(CONFIG_PATHS.variables),
      loadJSON(CONFIG_PATHS.content),
    ]);

    applyDesignTokens(vars);
    document.title = config.site?.title || document.title;
    wireLinks(config);
    renderCases(config.resultados);
    renderTestimonials(config.depoimentos);
  } catch (err) {
    console.warn("[config] A página seguirá com o conteúdo estático:", err.message);
  } finally {
    wireStickyCta();
    observeReveals();
  }
}

document.addEventListener("DOMContentLoaded", init);

/**
 * Codex Command presenter
 * 仅维护指挥舱响应式展示状态，不访问业务数据、表单值或持久化存储。
 */
(() => {
    "use strict";

    const body = document.body;
    const mobileQuery = window.matchMedia("(max-width: 800px)");
    const viewButtons = Array.from(document.querySelectorAll(".command-view-btn"));
    const modalElements = Array.from(document.querySelectorAll(".modal"));
    const allowedViews = new Set(["equipment", "build"]);

    const setView = (view) => {
        if (!allowedViews.has(view)) return;

        body.dataset.commandView = view;
        viewButtons.forEach((button) => {
            const active = button.dataset.commandTarget === view;
            button.classList.toggle("active", active);
            button.setAttribute("aria-pressed", String(active));
        });

        if (mobileQuery.matches) {
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => {
                    window.scrollTo({ top: 0, behavior: "auto" });
                });
            });
        }
    };

    const markViewport = () => {
        const width = window.innerWidth;
        let viewport = "wide";
        if (width <= 400) viewport = "compact";
        else if (width <= 600) viewport = "phone";
        else if (width <= 800) viewport = "tablet";
        else if (width <= 950) viewport = "narrow";
        else if (width <= 1180) viewport = "desktop";
        else if (width <= 1450) viewport = "standard";

        body.dataset.commandViewport = viewport;
        body.classList.toggle("command-is-mobile", mobileQuery.matches);
    };

    const syncModalPresentation = () => {
        const open = modalElements.some((modal) => !modal.classList.contains("hidden"));
        body.classList.toggle("command-modal-open", open);
    };

    viewButtons.forEach((button) => {
        button.addEventListener("click", () => setView(button.dataset.commandTarget));
    });

    const modalObserver = new MutationObserver(syncModalPresentation);
    modalElements.forEach((modal) => {
        modalObserver.observe(modal, {
            attributes: true,
            attributeFilter: ["class"]
        });
    });

    let resizeFrame = 0;
    window.addEventListener("resize", () => {
        window.cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(markViewport);
    }, { passive: true });

    mobileQuery.addEventListener?.("change", markViewport);
    markViewport();
    syncModalPresentation();
    setView(body.dataset.commandView || "equipment");
})();

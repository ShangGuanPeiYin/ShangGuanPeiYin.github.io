/**
 * Codex UI presenter
 * 仅维护响应式展示状态；不读取或写入任何业务数据、表单值或持久化存储。
 */
(() => {
    "use strict";

    const body = document.body;
    const mobileQuery = window.matchMedia("(max-width: 800px)");
    const viewButtons = Array.from(document.querySelectorAll(".ui-codex-view-btn"));
    const modalElements = Array.from(document.querySelectorAll(".modal"));
    const allowedViews = new Set(["equipment", "build"]);

    const setView = (view) => {
        if (!allowedViews.has(view)) return;

        body.dataset.uiView = view;
        viewButtons.forEach((button) => {
            const isActive = button.dataset.uiTarget === view;
            button.classList.toggle("active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });

        if (mobileQuery.matches) {
            window.scrollTo({ top: 0, behavior: "auto" });
        }
    };

    const markViewport = () => {
        const width = window.innerWidth;
        let viewport = "wide";

        if (width <= 400) viewport = "compact";
        else if (width <= 600) viewport = "phone";
        else if (width <= 800) viewport = "tablet";
        else if (width <= 1100) viewport = "narrow";
        else if (width <= 1439) viewport = "desktop";

        body.dataset.uiViewport = viewport;
        body.classList.toggle("ui-codex-is-mobile", mobileQuery.matches);
    };

    const syncModalPresentation = () => {
        const hasOpenModal = modalElements.some((modal) => !modal.classList.contains("hidden"));
        body.classList.toggle("ui-codex-modal-open", hasOpenModal);
    };

    viewButtons.forEach((button) => {
        button.addEventListener("click", () => setView(button.dataset.uiTarget));
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
    setView(body.dataset.uiView || "equipment");
})();

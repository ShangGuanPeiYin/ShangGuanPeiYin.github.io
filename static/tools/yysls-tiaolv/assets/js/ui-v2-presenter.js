(function () {
    "use strict";

    const body = document.body;
    if (!body || !body.classList.contains("ui-v2")) return;

    const mainContent = document.getElementById("main-content");
    const simulatorPanel = document.getElementById("simulator-panel");
    const welcomeMessage = document.getElementById("welcome-message");
    const mobileButtons = Array.from(document.querySelectorAll("[data-v2-view]"));

    function isWorkspaceReady() {
        return !!mainContent && !mainContent.classList.contains("hidden");
    }

    function syncWorkspaceState() {
        body.classList.toggle("v2-ready", isWorkspaceReady());
        if (!isWorkspaceReady()) {
            body.dataset.mobileView = "library";
            syncMobileButtons("library");
        }
    }

    function syncMobileButtons(view) {
        mobileButtons.forEach(function (button) {
            button.setAttribute("aria-selected", String(button.dataset.v2View === view));
        });
    }

    function selectMobileView(view, shouldScroll) {
        if (!["library", "loadout", "metrics"].includes(view)) return;
        body.dataset.mobileView = view;
        syncMobileButtons(view);

        if (view !== "library" && simulatorPanel) {
            simulatorPanel.classList.add("expanded");
        }

        if (shouldScroll) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }

    mobileButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            selectMobileView(button.dataset.v2View, true);
        });
    });

    const observer = new MutationObserver(syncWorkspaceState);
    [mainContent, welcomeMessage, simulatorPanel].forEach(function (element) {
        if (element) observer.observe(element, { attributes: true, attributeFilter: ["class"] });
    });

    const graduationRate = document.getElementById("graduation-rate-display");
    if (graduationRate) {
        graduationRate.setAttribute("aria-live", "polite");
        graduationRate.setAttribute("aria-atomic", "true");
    }

    const equipmentGrid = document.getElementById("equipment-grid");
    if (equipmentGrid) {
        equipmentGrid.setAttribute("aria-label", "装备库");
    }

    syncWorkspaceState();
    selectMobileView(body.dataset.mobileView || "library", false);
})();

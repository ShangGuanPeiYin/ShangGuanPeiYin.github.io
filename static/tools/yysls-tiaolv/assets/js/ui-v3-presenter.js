(function () {
    "use strict";

    const body = document.body;
    if (!body || !body.classList.contains("ui-v3")) return;

    const mainContent = document.getElementById("main-content");
    const simulatorPanel = document.getElementById("simulator-panel");
    const welcomeMessage = document.getElementById("welcome-message");
    const equipmentGrid = document.getElementById("equipment-grid");
    const mobileButtons = Array.from(document.querySelectorAll("[data-v3-view]"));
    const allowedViews = ["library", "filter", "loadout", "metrics"];

    function isWorkspaceReady() {
        return Boolean(mainContent && !mainContent.classList.contains("hidden"));
    }

    function syncMobileButtons(view) {
        mobileButtons.forEach(function (button) {
            const isSelected = button.dataset.v3View === view;
            button.setAttribute("aria-selected", String(isSelected));
            button.tabIndex = isSelected ? 0 : -1;
        });
    }

    function selectView(view, shouldScroll) {
        if (!allowedViews.includes(view)) return;

        body.dataset.v3View = view;
        syncMobileButtons(view);

        if (view === "loadout" || view === "metrics") {
            simulatorPanel?.classList.add("expanded");
        }

        if (shouldScroll) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }

    function syncWorkspaceState() {
        const isReady = isWorkspaceReady();
        body.classList.toggle("v3-ready", isReady);

        if (!isReady) {
            selectView("library", false);
        }
    }

    function indexEquipmentCards() {
        if (!equipmentGrid) return;

        Array.from(equipmentGrid.children).forEach(function (card, index) {
            if (!card.classList.contains("equip-card")) return;
            card.dataset.v3Index = String(index + 1).padStart(2, "0");
        });
    }

    mobileButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            selectView(button.dataset.v3View, true);
        });
    });

    const workspaceObserver = new MutationObserver(syncWorkspaceState);
    [mainContent, welcomeMessage, simulatorPanel].forEach(function (element) {
        if (element) {
            workspaceObserver.observe(element, {
                attributes: true,
                attributeFilter: ["class"]
            });
        }
    });

    if (equipmentGrid) {
        equipmentGrid.setAttribute("aria-label", "装备仓");
        const equipmentObserver = new MutationObserver(indexEquipmentCards);
        equipmentObserver.observe(equipmentGrid, { childList: true });
        indexEquipmentCards();
    }

    const graduationRate = document.getElementById("graduation-rate-display");
    if (graduationRate) {
        graduationRate.setAttribute("aria-live", "polite");
        graduationRate.setAttribute("aria-atomic", "true");
    }

    syncWorkspaceState();
    selectView(body.dataset.v3View || "library", false);
})();

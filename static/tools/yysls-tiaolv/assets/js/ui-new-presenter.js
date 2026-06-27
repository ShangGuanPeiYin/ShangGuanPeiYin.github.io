/* ═══════════════════════════════════════════════════════════════════ */
/* ui-new-presenter.js — Responsive View & Display Management         */
/* ═══════════════════════════════════════════════════════════════════ */
/*                                                                    */
/* CONSTRAINTS:                                                       */
/*   - NO localStorage access                                         */
/*   - NO business data read/write (equipment, accounts, stats)       */
/*   - NO modification of form values or business state                */
/*   - Read-only DOM observation for responsive adaptation             */
/*                                                                    */
/* RESPONSIBILITIES:                                                  */
/*   1. Breakpoint detection (matchMedia)                              */
/*   2. Layout mode management (data-layout-mode on body)             */
/*   3. Panel collapse/expand view state                               */
/*   4. Mobile sidebar toggle injection                                */
/*   5. Session-only state (JS variable, no persistence)               */
/* ═══════════════════════════════════════════════════════════════════ */

(function () {
    "use strict";

    /* ── Session-only state (no localStorage, no business data) ──── */
    var state = {
        breakpoint: null,       // 'xs'|'sm'|'md'|'lg'|'xl'|'xxl'
        sidePanelExpanded: true,
        filterBarExpanded: true,
        mobileSidebarOpen: false,
    };

    /* ── Breakpoint Map ──────────────────────────────────────────── */
    var BREAKPOINTS = [
        { key: 'xxl', query: '(min-width: 1920px)' },
        { key: 'xl',  query: '(min-width: 1440px) and (max-width: 1919px)' },
        { key: 'lg',  query: '(min-width: 1280px) and (max-width: 1439px)' },
        { key: 'md',  query: '(min-width: 768px) and (max-width: 1279px)' },
        { key: 'sm',  query: '(min-width: 560px) and (max-width: 767px)' },
        { key: 'xs',  query: '(max-width: 559px)' },
    ];

    var BP_ORDER = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs'];

    /* ── Detect current breakpoint ────────────────────────────────── */
    function detectBreakpoint() {
        for (var i = 0; i < BREAKPOINTS.length; i++) {
            if (window.matchMedia(BREAKPOINTS[i].query).matches) {
                return BREAKPOINTS[i].key;
            }
        }
        return 'md'; // default fallback
    }

    /* ── Apply breakpoint to body ─────────────────────────────────── */
    function applyBreakpoint(bp) {
        if (state.breakpoint === bp) return;
        state.breakpoint = bp;

        // Remove old breakpoint classes
        for (var i = 0; i < BP_ORDER.length; i++) {
            document.body.classList.remove('bp-' + BP_ORDER[i]);
        }
        document.body.classList.add('bp-' + bp);
        document.body.setAttribute('data-layout-mode', bp);

        // Auto-adapt panels for mobile
        adaptPanelsForBreakpoint(bp);
    }

    /* ── Panel adaptation per breakpoint ──────────────────────────── */
    function adaptPanelsForBreakpoint(bp) {
        var simPanel = document.getElementById('simulator-panel');
        var isMobile = bp === 'xs' || bp === 'sm';

        if (isMobile && simPanel && state.sidePanelExpanded) {
            // On mobile, collapse panels by default if not already
            // Don't force-close — let user toggle
        }
    }

    /* ── Mobile sidebar controls ──────────────────────────────────── */
    function injectMobileToggle() {
        if (document.getElementById('ui-mobile-panel-toggle')) return;

        var simPanel = document.getElementById('simulator-panel');
        if (!simPanel) return;

        var toggle = document.createElement('button');
        toggle.id = 'ui-mobile-panel-toggle';
        toggle.className = 'ui-mobile-panel-toggle hidden';
        toggle.setAttribute('aria-label', '切换面板');
        toggle.innerHTML = '☰';
        toggle.addEventListener('click', function () {
            state.mobileSidebarOpen = !state.mobileSidebarOpen;
            toggleMobileSidebar();
        });

        // Insert before simulator panel
        simPanel.parentNode.insertBefore(toggle, simPanel);
    }

    function toggleMobileSidebar() {
        var simPanel = document.getElementById('simulator-panel');
        var toggle = document.getElementById('ui-mobile-panel-toggle');
        if (!simPanel || !toggle) return;

        if (state.mobileSidebarOpen) {
            simPanel.classList.remove('ui-panel-hidden');
            toggle.innerHTML = '✕';
            toggle.classList.add('ui-toggle-active');
        } else {
            simPanel.classList.add('ui-panel-hidden');
            toggle.innerHTML = '☰';
            toggle.classList.remove('ui-toggle-active');
        }
    }

    function updateMobileToggleVisibility() {
        var toggle = document.getElementById('ui-mobile-panel-toggle');
        if (!toggle) return;

        var isMobile = state.breakpoint === 'xs' || state.breakpoint === 'sm';
        if (isMobile) {
            toggle.classList.remove('hidden');
        } else {
            toggle.classList.add('hidden');
            // Reset mobile state on desktop
            if (state.mobileSidebarOpen) {
                state.mobileSidebarOpen = false;
                toggleMobileSidebar();
            }
        }
    }

    /* ── Ensure modals scroll properly ────────────────────────────── */
    function fixModalScrolling() {
        // Re-enable body scroll when all modals are hidden
        var modalObserver = new MutationObserver(function () {
            var visibleModals = document.querySelectorAll('.modal:not(.hidden)');
            if (visibleModals.length === 0) {
                document.body.style.overflow = '';
            }
        });

        var modals = document.querySelectorAll('.modal');
        for (var i = 0; i < modals.length; i++) {
            modalObserver.observe(modals[i], { attributes: true, attributeFilter: ['class'] });
        }
    }

    /* ── Keyboard shortcut: Escape closes top modal ───────────────── */
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;

            // Find topmost visible modal
            var visibleModals = document.querySelectorAll('.modal:not(.hidden)');
            if (visibleModals.length === 0) return;

            // Find the one with highest z-index
            var topModal = visibleModals[visibleModals.length - 1];
            var closeBtn = topModal.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.click();
            }
        });
    }

    /* ── Prevent body scroll when modal is open ───────────────────── */
    function setupBodyScrollLock() {
        var observer = new MutationObserver(function () {
            var visibleModals = document.querySelectorAll('.modal:not(.hidden)');
            if (visibleModals.length > 0) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        var modals = document.querySelectorAll('.modal');
        for (var i = 0; i < modals.length; i++) {
            observer.observe(modals[i], { attributes: true, attributeFilter: ['class'] });
        }
    }

    /* ── Smooth panel transitions ─────────────────────────────────── */
    function enhancePanelTransitions() {
        var simPanel = document.getElementById('simulator-panel');
        if (!simPanel) return;

        // Ensure CSS transition for panel width changes
        simPanel.style.transition = 'width 0.3s ease, min-width 0.3s ease, max-width 0.3s ease, transform 0.3s ease';
    }

    /* ── Monitor dynamic content for responsive adjustments ───────── */
    function observeDynamicContent() {
        var grid = document.getElementById('equipment-grid');
        if (!grid) return;

        var gridObserver = new MutationObserver(function () {
            // When equipment cards are added/removed, adapt layout hints
            adaptEquipmentLayout();
        });

        gridObserver.observe(grid, { childList: true, subtree: false });
    }

    function adaptEquipmentLayout() {
        var grid = document.getElementById('equipment-grid');
        if (!grid) return;

        var cardCount = grid.querySelectorAll('.equip-card').length;

        // Add density hints based on card count
        if (cardCount > 20) {
            grid.setAttribute('data-density', 'high');
        } else if (cardCount > 8) {
            grid.setAttribute('data-density', 'medium');
        } else {
            grid.setAttribute('data-density', 'low');
        }
    }

    /* ── Window resize handler (debounced) ────────────────────────── */
    var resizeTimeout;
    function onResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function () {
            var bp = detectBreakpoint();
            applyBreakpoint(bp);
            updateMobileToggleVisibility();
        }, 100);
    }

    /* ── Initialize ───────────────────────────────────────────────── */
    function init() {
        // Detect and apply initial breakpoint
        var bp = detectBreakpoint();
        applyBreakpoint(bp);

        // Setup breakpoint listeners
        for (var i = 0; i < BREAKPOINTS.length; i++) {
            (function (bp) {
                var mql = window.matchMedia(bp.query);
                mql.addEventListener('change', function (e) {
                    if (e.matches) {
                        applyBreakpoint(bp.key);
                        updateMobileToggleVisibility();
                    }
                });
            })(BREAKPOINTS[i]);
        }

        // Window resize fallback
        window.addEventListener('resize', onResize);

        // Inject mobile panel toggle
        injectMobileToggle();
        updateMobileToggleVisibility();

        // Enhance panel transitions
        enhancePanelTransitions();

        // Setup body scroll lock for modals
        setupBodyScrollLock();

        // Fix modal scrolling
        fixModalScrolling();

        // Keyboard shortcuts
        setupKeyboardShortcuts();

        // Observe dynamic content
        observeDynamicContent();

        // Initial layout adaptation
        adaptEquipmentLayout();

        // Handle orientation changes on mobile
        window.addEventListener('orientationchange', function () {
            setTimeout(function () {
                var bp = detectBreakpoint();
                applyBreakpoint(bp);
                updateMobileToggleVisibility();
                adaptEquipmentLayout();
            }, 200);
        });

        // Expose limited API for debugging
        window.__uiPresenter = {
            getBreakpoint: function () { return state.breakpoint; },
            getState: function () { return state; },
            refresh: function () {
                var bp = detectBreakpoint();
                applyBreakpoint(bp);
                updateMobileToggleVisibility();
                adaptEquipmentLayout();
            },
        };
    }

    /* ── Run on DOM ready ─────────────────────────────────────────── */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

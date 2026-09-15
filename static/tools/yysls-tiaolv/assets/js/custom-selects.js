(function () {
    "use strict";

    const SELECT_IDS = [
        "engine-source-select",
        "account-select",
        "class-select",
        "flow-version-select",
        "armory-select",
        "scheme-select"
    ];
    const instances = [];

    function closeAll(except) {
        instances.forEach(function (instance) {
            if (instance !== except) instance.close();
        });
    }

    function createSelect(select) {
        const wrapper = document.createElement("div");
        const button = document.createElement("button");
        const list = document.createElement("div");
        const listId = "tiaolv-select-list-" + select.id;

        wrapper.className = "tiaolv-select";
        button.type = "button";
        button.className = "tiaolv-select-button";
        button.dataset.tiaolvSelectFor = select.id;
        button.setAttribute("aria-haspopup", "listbox");
        button.setAttribute("aria-controls", listId);
        button.setAttribute("aria-expanded", "false");
        list.className = "tiaolv-select-list";
        list.id = listId;
        list.setAttribute("role", "listbox");
        list.hidden = true;

        select.classList.add("tiaolv-native-select");
        select.after(wrapper);
        wrapper.append(button, list);

        function sync() {
            const option = select.selectedOptions[0];
            button.textContent = option ? option.textContent : "请选择";
            button.disabled = select.disabled;
            wrapper.hidden = select.hidden || select.classList.contains("hidden");
            list.querySelectorAll(".tiaolv-select-option").forEach(function (optionButton) {
                optionButton.setAttribute("aria-selected", String(optionButton.dataset.tiaolvOptionValue === select.value));
            });
        }

        function renderOptions() {
            list.replaceChildren();
            Array.from(select.options).forEach(function (option) {
                const optionButton = document.createElement("button");
                optionButton.type = "button";
                optionButton.className = "tiaolv-select-option";
                optionButton.dataset.tiaolvOptionValue = option.value;
                optionButton.textContent = option.textContent;
                optionButton.disabled = option.disabled;
                optionButton.setAttribute("role", "option");
                optionButton.setAttribute("aria-selected", String(option.selected));
                optionButton.addEventListener("click", function () {
                    if (option.disabled || option.value === select.value) {
                        close();
                        return;
                    }
                    select.value = option.value;
                    select.dispatchEvent(new Event("change", { bubbles: true }));
                    sync();
                    close();
                });
                optionButton.addEventListener("keydown", function (event) {
                    const enabledOptions = Array.from(list.querySelectorAll(".tiaolv-select-option:not(:disabled)"));
                    const index = enabledOptions.indexOf(optionButton);
                    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                        event.preventDefault();
                        const direction = event.key === "ArrowDown" ? 1 : -1;
                        enabledOptions[(index + direction + enabledOptions.length) % enabledOptions.length]?.focus();
                        return;
                    }
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        optionButton.click();
                        return;
                    }
                    if (event.key === "Escape") {
                        event.preventDefault();
                        close();
                        button.focus();
                    }
                });
                list.append(optionButton);
            });
        }

        function open() {
            if (button.disabled || wrapper.hidden) return;
            closeAll(instance);
            renderOptions();
            list.hidden = false;
            button.setAttribute("aria-expanded", "true");
        }

        function close() {
            list.hidden = true;
            button.setAttribute("aria-expanded", "false");
        }

        const instance = { close: close };
        button.addEventListener("click", function () {
            if (list.hidden) open();
            else close();
        });
        button.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                close();
                return;
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                open();
                const selected = list.querySelector('[aria-selected="true"]');
                (selected || list.querySelector(".tiaolv-select-option:not(:disabled)"))?.focus();
            }
        });
        select.addEventListener("change", sync);
        new MutationObserver(sync).observe(select, {
            attributes: true,
            attributeFilter: ["class", "disabled", "hidden"],
            childList: true,
            subtree: true
        });
        sync();
        return instance;
    }

    function init() {
        SELECT_IDS.forEach(function (id) {
            const select = document.getElementById(id);
            if (select && !select.classList.contains("tiaolv-native-select")) instances.push(createSelect(select));
        });
        document.addEventListener("pointerdown", function (event) {
            if (!event.target.closest(".tiaolv-select")) closeAll();
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
}());

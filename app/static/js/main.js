/* =========================================================
   OPERATOR SYSTEM — MAIN JAVASCRIPT
   Terminal + fixed-width binary decoding effect
   ========================================================= */

/* -------------------------
   Interactive terminal
   ------------------------- */

/* -------------------------
   Interactive terminal
   ------------------------- */

const initializeButton = document.querySelector("#initialize-btn");
const terminal = document.querySelector("#terminal");
const closeButton = document.querySelector("#close-terminal");
const terminalForm = document.querySelector("#terminal-form");
const terminalInput = document.querySelector("#terminal-input");
const terminalOutput = document.querySelector("#terminal-output");

let previousFocus = null;

function openTerminal() {
    if (!terminal || !terminalInput) return;

    previousFocus = document.activeElement;
    terminal.hidden = false;
    document.body.classList.add("modal-open");
    terminalInput.focus();
}

function closeTerminal() {
    if (!terminal) return;

    terminal.hidden = true;
    document.body.classList.remove("modal-open");

    if (previousFocus?.focus) {
        previousFocus.focus();
    }
}

function printLine(text, className = "") {
    if (!terminalOutput) return;

    const line = document.createElement("p");
    line.textContent = text;

    if (className) {
        line.className = className;
    }

    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}


const commands = {
    help() {
        printLine("AVAILABLE COMMANDS", "terminal-amber");
        printLine("help               - list available commands");
        printLine("about              - operator profile");
        printLine("experience         - professional experience");
        printLine("projects           - project archive");
        printLine("projects.ingest    - data ingestion projects");
        printLine("projects.pipelines - data pipelines");
        printLine("projects.azure     - Azure infrastructure");
        printLine("projects.ai        - AI / ML / RAG projects");
        printLine("skills             - technical capabilities");
        printLine("contact            - contact information");
        printLine("clear              - clear terminal output");
        printLine("exit               - close terminal");
    },

    about() {
        closeTerminal();
        window.location.href = "/#about";
    },

    experience() {
        window.location.href = "/experience/";
    },

    projects() {
        window.location.href = "/projects/";
    },

    "projects.ingest"() {
        window.location.href = "/projects/#ingest";
    },

    "projects.pipelines"() {
        window.location.href = "/projects/#pipelines";
    },

    "projects.azure"() {
        window.location.href = "/projects/#azure-infrastructure";
    },

    "projects.ai"() {
        window.location.href = "/projects/#ai-ml-rag";
    },

    skills() {
        window.location.href = "/background/";
    },

    clear() {
        if (terminalOutput) {
            terminalOutput.replaceChildren();
        }
    },

    exit() {
        closeTerminal();
    },
};


// Attach terminal event handlers only on pages containing the terminal.
if (
    initializeButton &&
    terminal &&
    closeButton &&
    terminalForm &&
    terminalInput &&
    terminalOutput
) {
    initializeButton.addEventListener("click", openTerminal);
    closeButton.addEventListener("click", closeTerminal);

    terminal.addEventListener("click", (event) => {
        if (event.target === terminal) {
            closeTerminal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !terminal.hidden) {
            closeTerminal();
        }
    });

    terminalForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const input = terminalInput.value.trim();
        if (!input) return;

        printLine(`guest@operator:~$ ${input}`);

        const command = input.toLowerCase();

        if (Object.hasOwn(commands, command)) {
            commands[command]();
        } else {
            printLine(
                `Command not found: ${command}. Type 'help' for available commands.`,
                "terminal-muted"
            );
        }

        terminalInput.value = "";
        terminalInput.focus();
    });
}


/* =========================================================
   BINARY HOVER EFFECT
   - One binary character per original Unicode character.
   - Preserves surrounding whitespace and nested icons.
   - Locks each character to its original measured width.
   - Calculation: 1 second.
   - Decoding: left to right, 45 ms per character.
   - Pointer leave never interrupts the animation.
   ========================================================= */

(() => {
    "use strict";

    const SELECTOR = [
        "a[href]",
        "button",
        '[role="button"]',
        "[onclick]",
        "[data-clickable]",
        "summary"
    ].join(",");

    const CALCULATION_MS = 250;
    const DECODE_MS = 13;
    const FLICKER_MS = 60;

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    const prepared = new WeakMap();
    const running = new WeakMap();

    const measureCanvas = document.createElement("canvas");
    const measureContext = measureCanvas.getContext("2d");

    function randomBit() {
        return Math.random() < 0.5 ? "0" : "1";
    }

    function randomBinary(length) {
        return Array.from(
            { length },
            randomBit
        );
    }

    function isExcludedTextNode(node, control) {
        const parent = node.parentElement;

        if (!parent || !node.nodeValue) {
            return true;
        }

        if (
            parent.closest(
                "script, style, noscript, textarea, input, select, " +
                "option, code, pre, .binary-hover-ignore, " +
                "[contenteditable='true'], [aria-hidden='true'], " +
                ".binary-hover-text, .binary-hover-decoration"
            )
        ) {
            return true;
        }

        // Do not animate text belonging to a nested interactive control.
        const nestedControl = parent.closest(SELECTOR);

        if (nestedControl && nestedControl !== control) {
            return true;
        }

        return false;
    }

    function getFont(element) {
        const style = window.getComputedStyle(element);

        return {
            style,
            font: style.font || [
                style.fontStyle,
                style.fontVariant,
                style.fontWeight,
                style.fontSize,
                style.fontFamily
            ].join(" "),
            letterSpacing:
                style.letterSpacing === "normal"
                    ? 0
                    : parseFloat(style.letterSpacing) || 0
        };
    }

    function measureCharacter(character, font, letterSpacing) {
        measureContext.font = font;

        // Preserve normal word spacing while measuring a space.
        const width = measureContext.measureText(character).width;

        return Math.max(0, width + letterSpacing);
    }

    function makeCharacterCell(character, element, fontData) {
        const cell = document.createElement("i");

        cell.className = "binary-hover-cell";
        cell.setAttribute("aria-hidden", "true");

        const width = measureCharacter(
            character,
            fontData.font,
            fontData.letterSpacing
        );

        cell.style.width = `${width}px`;
        cell.style.minWidth = `${width}px`;
        cell.style.maxWidth = `${width}px`;

        cell.dataset.original = character;
        cell.textContent = character;

        // Keep the binary digit inside the original character's width.
        if (character !== "\n" && character !== "\r") {
            cell.style.setProperty("--binary-cell-width", `${width}px`);
        }

        return cell;
    }

    function prepareElement(element) {
        if (prepared.has(element)) {
            return prepared.get(element);
        }

        if (
            !(element instanceof HTMLElement) ||
            element.classList.contains("binary-hover-ignore") ||
            element.matches(
                "input, textarea, select, option, .terminal-close"
            )
        ) {
            return null;
        }

        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {
                    if (isExcludedTextNode(node, element)) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    // Ignore indentation-only nodes between HTML elements.
                    if (!node.nodeValue.trim()) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const textNodes = [];
        let node;

        while ((node = walker.nextNode())) {
            textNodes.push(node);
        }

        if (!textNodes.length) {
            return null;
        }

        const segments = [];
        const allCharacters = [];

        for (const textNode of textNodes) {
            const original = textNode.nodeValue;
            const fontData = getFont(textNode.parentElement || element);
            /*
             * Keep indentation and formatting whitespace outside
             * the animated span. Animate only the visible text.
             */
            const leading = original.match(/^\s*/u)?.[0] || "";
            const trailing = original.match(/\s*$/u)?.[0] || "";
            const end = original.length - trailing.length;
            const visible = original.slice(leading.length, end);

            if (!visible) continue;

            const fragment = document.createDocumentFragment();

            if (leading) {
                fragment.appendChild(
                    document.createTextNode(leading)
                );
            }

            const wrapper = document.createElement("i");
            wrapper.className = "binary-hover-segment";
            wrapper.setAttribute("aria-hidden", "true");

            const cells = [];

            // Array.from counts Unicode code points, not UTF-16 units.
            for (const character of Array.from(visible)) {
                const cell = makeCharacterCell(
                    character,
                    element,
                    fontData
                );

                wrapper.appendChild(cell);
                cells.push(cell);

                allCharacters.push({
                    character,
                    cell
                });
            }

            fragment.appendChild(wrapper);

            if (trailing) {
                fragment.appendChild(
                    document.createTextNode(trailing)
                );
            }

            textNode.parentNode.replaceChild(fragment, textNode);

            segments.push({
                wrapper,
                cells,
                original: visible
            });
        }

        if (!allCharacters.length) return null;

        const originalLabel = allCharacters
            .map(item => item.character)
            .join("");

        // Retain the label for assistive technology.
        if (!element.hasAttribute("aria-label")) {
            element.setAttribute("aria-label", originalLabel);
        }

        const state = {
            segments,
            characters: allCharacters,
            originalLabel
        };

        prepared.set(element, state);
        return state;
    }

    function render(state, characters) {
        state.characters.forEach((item, index) => {
            item.cell.textContent = characters[index];
            item.cell.style.removeProperty("color");
            item.cell.style.removeProperty("text-shadow");
        });
    }

    function cancelTimers(element) {
        const timers = running.get(element);

        if (!timers) return;

        clearTimeout(timers.calculation);
        clearInterval(timers.flicker);
        clearInterval(timers.decoding);

        running.delete(element);
    }

    function animate(element) {
        if (
            !(element instanceof HTMLElement) ||
            element.classList.contains("binary-hover-ignore") ||
            running.has(element)
        ) {
            return;
        }

        const state = prepareElement(element);

        if (!state) return;

        const originals = state.characters.map(item => item.character);

        if (reducedMotion.matches) {
            render(state, originals);
            return;
        }

        const bits = randomBinary(state.characters.length);

        const timers = {
            calculation: null,
            flicker: null,
            decoding: null
        };

        running.set(element, timers);

        // Display one bit per original visible character.
        render(state, bits);

        timers.flicker = setInterval(() => {
            for (let index = 0; index < bits.length; index++) {
                if (Math.random() < 0.2) {
                    bits[index] = randomBit();
                }
            }

            render(state, bits);
        }, FLICKER_MS);

        timers.calculation = setTimeout(() => {
            clearInterval(timers.flicker);

            let position = 0;

            timers.decoding = setInterval(() => {
                if (position >= originals.length) {
                    clearInterval(timers.decoding);
                    render(state, originals);
                    running.delete(element);
                    return;
                }

                bits[position] = originals[position];
                render(state, bits);

                position++;
            }, DECODE_MS);
        }, CALCULATION_MS);
    }

    function findControl(target) {
        if (!(target instanceof Element)) return null;
        return target.closest(SELECTOR);
    }

    document.addEventListener("pointerover", event => {
        const control = findControl(event.target);

        if (!control) return;

        if (
            event.relatedTarget instanceof Node &&
            control.contains(event.relatedTarget)
        ) {
            return;
        }

        animate(control);
    });

    document.addEventListener("focusin", event => {
        const control = findControl(event.target);

        if (control) animate(control);
    });

    /*
     * Intentionally do not cancel on pointerout or focusout.
     * Once started, the decode always finishes.
     */

    /*
     * If a browser preference changes during use, future interactions
     * immediately use the accessible reduced-motion behavior.
     */
    reducedMotion.addEventListener?.("change", () => {
        // Existing animations finish normally; no new flicker is started
        // when reduced motion is enabled.
    });
})();
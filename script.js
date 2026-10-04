/* =========================================================
   QUEUEFLOW
   QUEUE & TOKEN MANAGEMENT SYSTEM
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const CONFIG = {

    storageKey: "queueFlowData",

    tokenPrefix: "T-",

    estimatedServiceTime: 5,

    maxHistory: 20

};


/* =========================================================
   APPLICATION STATE
========================================================= */

let state = loadState();


/* =========================================================
   DEFAULT STATE
========================================================= */

function createDefaultState() {

    return {

        tokenCounter: 0,

        waitingQueue: [],

        history: [],

        current: {

            token: null,

            customer: "",

            service: "",

            counter: null

        },

        servedCount: 0,

        theme: "light"

    };

}


/* =========================================================
   LOAD DATA
========================================================= */

function loadState() {

    try {

        const saved =
            localStorage.getItem(
                CONFIG.storageKey
            );


        if (!saved) {

            return createDefaultState();

        }


        return {

            ...createDefaultState(),

            ...JSON.parse(saved)

        };

    }

    catch (error) {

        console.error(
            "Unable to load saved data:",
            error
        );

        return createDefaultState();

    }

}


/* =========================================================
   SAVE DATA
========================================================= */

function saveState() {

    localStorage.setItem(

        CONFIG.storageKey,

        JSON.stringify(state)

    );

}


/* =========================================================
   DOM ELEMENTS
========================================================= */

const elements = {

    tokenForm:
        document.getElementById(
            "tokenForm"
        ),

    customerName:
        document.getElementById(
            "customerName"
        ),

    serviceType:
        document.getElementById(
            "serviceType"
        ),

    generatedToken:
        document.getElementById(
            "generatedToken"
        ),

    generatedTokenNumber:
        document.getElementById(
            "generatedTokenNumber"
        ),

    counterSelect:
        document.getElementById(
            "counterSelect"
        ),

    nextButton:
        document.getElementById(
            "nextButton"
        ),

    recallButton:
        document.getElementById(
            "recallButton"
        ),

    skipButton:
        document.getElementById(
            "skipButton"
        ),

    queueTable:
        document.getElementById(
            "queueTable"
        ),

    emptyQueue:
        document.getElementById(
            "emptyQueue"
        ),

    historyList:
        document.getElementById(
            "historyList"
        ),

    searchInput:
        document.getElementById(
            "searchInput"
        ),

    resetButton:
        document.getElementById(
            "resetButton"
        ),

    clearHistoryButton:
        document.getElementById(
            "clearHistoryButton"
        ),

    themeButton:
        document.getElementById(
            "themeButton"
        ),

    currentDate:
        document.getElementById(
            "currentDate"
        ),

    currentTime:
        document.getElementById(
            "currentTime"
        ),

    currentToken:
        document.getElementById(
            "currentToken"
        ),

    currentCustomer:
        document.getElementById(
            "currentCustomer"
        ),

    currentService:
        document.getElementById(
            "currentService"
        ),

    counterDisplay:
        document.getElementById(
            "counterDisplay"
        ),

    totalTokens:
        document.getElementById(
            "totalTokens"
        ),

    waitingTokens:
        document.getElementById(
            "waitingTokens"
        ),

    servedTokens:
        document.getElementById(
            "servedTokens"
        ),

    activeCounters:
        document.getElementById(
            "activeCounters"
        ),

    toast:
        document.getElementById(
            "toast"
        )

};


/* =========================================================
   INITIALIZE APPLICATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initialize
);


function initialize() {

    applyTheme();

    updateClock();

    setInterval(
        updateClock,
        1000
    );

    bindEvents();

    render();

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function bindEvents() {

    elements.tokenForm.addEventListener(
        "submit",
        handleTokenGeneration
    );


    elements.nextButton.addEventListener(
        "click",
        callNextToken
    );


    elements.recallButton.addEventListener(
        "click",
        recallCurrentToken
    );


    elements.skipButton.addEventListener(
        "click",
        skipNextToken
    );


    elements.searchInput.addEventListener(
        "input",
        renderQueue
    );


    elements.counterSelect.addEventListener(
        "change",
        updateCounterDisplay
    );


    elements.resetButton.addEventListener(
        "click",
        resetSystem
    );


    elements.clearHistoryButton.addEventListener(
        "click",
        clearHistory
    );


    elements.themeButton.addEventListener(
        "click",
        toggleTheme
    );


    elements.queueTable.addEventListener(
        "click",
        handleQueueAction
    );

}


/* =========================================================
   GENERATE TOKEN
========================================================= */

function handleTokenGeneration(event) {

    event.preventDefault();


    const name =
        elements.customerName
            .value
            .trim();


    const service =
        elements.serviceType
            .value;


    if (!name || !service) {

        showToast(
            "Please enter customer name and service."
        );

        return;

    }


    state.tokenCounter++;


    const token = {

        id:
            Date.now(),

        number:
            state.tokenCounter,

        customer:
            name,

        service:
            service,

        createdAt:
            new Date().toISOString(),

        status:
            "Waiting"

    };


    state.waitingQueue.push(token);


    saveState();


    showGeneratedToken(
        token.number
    );


    elements.tokenForm.reset();


    render();


    showToast(
        `${formatToken(token.number)} generated successfully.`
    );

}


/* =========================================================
   FORMAT TOKEN
========================================================= */

function formatToken(number) {

    return CONFIG.tokenPrefix +
        String(number).padStart(3, "0");

}


/* =========================================================
   SHOW GENERATED TOKEN
========================================================= */

function showGeneratedToken(number) {

    elements.generatedTokenNumber.textContent =
        formatToken(number);


    elements.generatedToken.classList.remove(
        "hidden"
    );

}


/* =========================================================
   CALL NEXT TOKEN
========================================================= */

function callNextToken() {

    if (
        state.waitingQueue.length === 0
    ) {

        showToast(
            "No customers are waiting."
        );

        return;

    }


    const customer =
        state.waitingQueue.shift();


    const counter =
        Number(
            elements.counterSelect.value
        );


    customer.status =
        "Served";


    customer.servedAt =
        new Date().toISOString();


    customer.counter =
        counter;


    state.current = {

        token:
            customer.number,

        customer:
            customer.customer,

        service:
            customer.service,

        counter:
            counter

    };


    state.servedCount++;


    state.history.unshift(
        customer
    );


    state.history =
        state.history.slice(
            0,
            CONFIG.maxHistory
        );


    saveState();


    render();


    announceToken(
        customer.number,
        counter
    );


    showToast(

        `${formatToken(customer.number)} called at Counter ${counter}.`

    );

}


/* =========================================================
   RECALL
========================================================= */

function recallCurrentToken() {

    if (
        !state.current.token
    ) {

        showToast(
            "No token is currently being served."
        );

        return;

    }


    announceToken(

        state.current.token,

        state.current.counter

    );


    showToast(
        `${formatToken(state.current.token)} recalled.`
    );

}


/* =========================================================
   SKIP
========================================================= */

function skipNextToken() {

    if (
        state.waitingQueue.length === 0
    ) {

        showToast(
            "No token available to skip."
        );

        return;

    }


    const customer =
        state.waitingQueue.shift();


    customer.status =
        "Skipped";


    customer.skippedAt =
        new Date().toISOString();


    state.history.unshift(
        customer
    );


    state.history =
        state.history.slice(
            0,
            CONFIG.maxHistory
        );


    saveState();


    render();


    showToast(

        `${formatToken(customer.number)} skipped.`

    );

}


/* =========================================================
   REMOVE TOKEN
========================================================= */

function removeToken(id) {

    const index =
        state.waitingQueue.findIndex(

            customer =>
                customer.id === id

        );


    if (index === -1) {

        return;

    }


    const customer =
        state.waitingQueue[index];


    const confirmed =
        confirm(

            `Remove ${formatToken(customer.number)} from queue?`

        );


    if (!confirmed) {

        return;

    }


    state.waitingQueue.splice(
        index,
        1
    );


    saveState();

    render();


    showToast(
        `${formatToken(customer.number)} removed.`
    );

}


/* =========================================================
   QUEUE ACTION HANDLER
========================================================= */

function handleQueueAction(event) {

    const button =
        event.target.closest(
            "[data-remove-id]"
        );


    if (!button) {

        return;

    }


    const id =
        Number(
            button.dataset.removeId
        );


    removeToken(id);

}


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function render() {

    renderStatistics();

    renderCurrentToken();

    renderQueue();

    renderHistory();

}


/* =========================================================
   STATISTICS
========================================================= */

function renderStatistics() {

    elements.totalTokens.textContent =
        state.tokenCounter;


    elements.waitingTokens.textContent =
        state.waitingQueue.length;


    elements.servedTokens.textContent =
        state.servedCount;


    elements.activeCounters.textContent =
        "3";

}


/* =========================================================
   CURRENT TOKEN
========================================================= */

function renderCurrentToken() {

    if (
        !state.current.token
    ) {

        elements.currentToken.textContent =
            "---";


        elements.currentCustomer.textContent =
            "No customer";


        elements.currentService.textContent =
            "Waiting for next customer";


        elements.counterDisplay.textContent =
            "Counter " +
            elements.counterSelect.value;


        return;

    }


    elements.currentToken.textContent =
        formatToken(
            state.current.token
        );


    elements.currentCustomer.textContent =
        state.current.customer;


    elements.currentService.textContent =
        state.current.service;


    elements.counterDisplay.textContent =
        "Counter " +
        state.current.counter;

}


/* =========================================================
   RENDER QUEUE
========================================================= */

function renderQueue() {

    const search =
        elements.searchInput
            .value
            .toLowerCase()
            .trim();


    const filtered =
        state.waitingQueue.filter(
            customer => {

                const token =
                    formatToken(
                        customer.number
                    )
                        .toLowerCase();


                return (

                    token.includes(search) ||

                    customer.customer
                        .toLowerCase()
                        .includes(search) ||

                    customer.service
                        .toLowerCase()
                        .includes(search)

                );

            }
        );


    elements.queueTable.innerHTML = "";


    if (
        filtered.length === 0
    ) {

        elements.emptyQueue.style.display =
            "block";

        return;

    }


    elements.emptyQueue.style.display =
        "none";


    filtered.forEach(
        customer => {

            const row =
                document.createElement(
                    "tr"
                );


            const waitTime =
                calculateWaitTime(
                    customer.createdAt
                );


            row.innerHTML = `

                <td>

                    <span class="token-badge">

                        ${formatToken(customer.number)}

                    </span>

                </td>


                <td>

                    <strong>

                        ${escapeHTML(customer.customer)}

                    </strong>

                </td>


                <td>

                    ${escapeHTML(customer.service)}

                </td>


                <td>

                    ${formatTime(customer.createdAt)}

                </td>


                <td>

                    ${waitTime}

                </td>


                <td>

                    <span class="status-badge">

                        Waiting

                    </span>

                </td>


                <td>

                    <button

                        class="remove-token"

                        data-remove-id="${customer.id}"

                    >

                        Remove

                    </button>

                </td>

            `;


            elements.queueTable.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   RENDER HISTORY
========================================================= */

function renderHistory() {

    elements.historyList.innerHTML = "";


    if (
        state.history.length === 0
    ) {

        elements.historyList.innerHTML = `

            <div class="empty-state">

                <div>📋</div>

                <h3>No service history</h3>

                <p>
                    Completed tokens will appear here.
                </p>

            </div>

        `;

        return;

    }


    state.history.forEach(
        customer => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "history-item";


            const status =
                customer.status ===
                    "Skipped"
                    ? "⏭ Skipped"
                    : "✅ Served";


            item.innerHTML = `

                <div class="history-token">

                    ${formatToken(customer.number)}

                </div>


                <div class="history-info">

                    <strong>

                        ${escapeHTML(customer.customer)}

                    </strong>

                    <span>

                        ${escapeHTML(customer.service)}

                    </span>

                </div>


                <div class="history-info">

                    <strong>

                        ${status}

                    </strong>

                    <span>

                        ${customer.counter
                    ? `Counter ${customer.counter}`
                    : "—"
                }

                    </span>

                </div>


                <div class="history-info">

                    <span>

                        ${formatTime(
                    customer.servedAt ||
                    customer.skippedAt
                )}

                    </span>

                </div>

            `;


            elements.historyList.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   WAIT TIME
========================================================= */

function calculateWaitTime(
    createdAt
) {

    const created =
        new Date(
            createdAt
        );


    const now =
        new Date();


    const difference =
        Math.max(
            0,
            Math.floor(
                (now - created) / 60000
            )
        );


    if (
        difference < 1
    ) {

        return "< 1 min";

    }


    return (
        difference +
        " min"
    );

}


/* =========================================================
   TIME FORMAT
========================================================= */

function formatTime(
    dateString
) {

    if (!dateString) {

        return "—";

    }


    return new Date(
        dateString
    ).toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* =========================================================
   CLOCK
========================================================= */

function updateClock() {

    const now =
        new Date();


    elements.currentDate.textContent =
        now.toLocaleDateString(
            "en-IN",
            {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );


    elements.currentTime.textContent =
        now.toLocaleTimeString(
            "en-IN"
        );

}


/* =========================================================
   COUNTER DISPLAY
========================================================= */

function updateCounterDisplay() {

    if (
        !state.current.token
    ) {

        elements.counterDisplay.textContent =
            "Counter " +
            elements.counterSelect.value;

    }

}


/* =========================================================
   TEXT TO SPEECH
========================================================= */

function announceToken(
    token,
    counter
) {

    if (
        !("speechSynthesis" in window)
    ) {

        return;

    }


    window.speechSynthesis.cancel();


    const text =

        `Token number ${token}.
         Please proceed to counter ${counter}.`;


    const speech =
        new SpeechSynthesisUtterance(
            text
        );


    speech.rate = 0.85;

    speech.pitch = 1;

    speech.volume = 1;


    window.speechSynthesis.speak(
        speech
    );

}


/* =========================================================
   CLEAR HISTORY
========================================================= */

function clearHistory() {

    if (
        state.history.length === 0
    ) {

        showToast(
            "History is already empty."
        );

        return;

    }


    if (
        !confirm(
            "Clear all service history?"
        )
    ) {

        return;

    }


    state.history = [];


    saveState();

    renderHistory();


    showToast(
        "Service history cleared."
    );

}


/* =========================================================
   RESET SYSTEM
========================================================= */

function resetSystem() {

    const confirmed =
        confirm(

            "This will delete all tokens, queue data and history. Continue?"

        );


    if (!confirmed) {

        return;

    }


    state =
        createDefaultState();


    saveState();


    elements.generatedToken.classList.add(
        "hidden"
    );


    render();


    showToast(
        "System successfully reset."
    );

}


/* =========================================================
   DARK MODE
========================================================= */

function toggleTheme() {

    state.theme =
        state.theme === "dark"
            ? "light"
            : "dark";


    saveState();

    applyTheme();

}


/* =========================================================
   APPLY THEME
========================================================= */

function applyTheme() {

    document.body.classList.toggle(

        "dark",

        state.theme === "dark"

    );


    elements.themeButton.textContent =
        state.theme === "dark"
            ? "☀️"
            : "🌙";

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer;


function showToast(message) {

    elements.toast.textContent =
        message;


    elements.toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                elements.toast.classList.remove(
                    "show"
                );

            },

            3000

        );

}


/* =========================================================
   SECURITY / HTML ESCAPING
========================================================= */

function escapeHTML(value) {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}
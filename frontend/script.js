const API_URL = "";

let lastCustomerData = null;
let lastPrediction = null;


// =========================================================
// DOM HELPER
// =========================================================

function getValue(id) {

    const element = document.getElementById(id);

    return element ? element.value : "";

}


// =========================================================
// PARTICLES
// =========================================================

function createParticles() {

    const container =
        document.getElementById("particles");

    if (!container) return;


    for (let i = 0; i < 45; i++) {

        const particle =
            document.createElement("div");

        particle.className = "particle";

        particle.style.left =
            `${Math.random() * 100}%`;

        particle.style.top =
            `${Math.random() * 100}%`;

        particle.style.animationDuration =
            `${7 + Math.random() * 12}s`;

        particle.style.animationDelay =
            `${Math.random() * 8}s`;

        const size =
            1 + Math.random() * 2;

        particle.style.width =
            `${size}px`;

        particle.style.height =
            `${size}px`;

        container.appendChild(particle);

    }

}


// =========================================================
// SCROLL REVEAL
// =========================================================

function setupScrollReveal() {

    const elements =
        document.querySelectorAll(".reveal");


    const observer =
        new IntersectionObserver(

            entries => {

                entries.forEach(entry => {

                    if (entry.isIntersecting) {

                        entry.target.classList.add(
                            "visible"
                        );

                        observer.unobserve(
                            entry.target
                        );

                    }

                });

            },

            {
                threshold: 0.12
            }

        );


    elements.forEach(element => {

        observer.observe(element);

    });

}


// =========================================================
// NUMBER COUNTER
// =========================================================

function animateCounter(
    element,
    target,
    suffix = "",
    duration = 1200
) {

    const startTime =
        performance.now();


    function update(currentTime) {

        const progress =
            Math.min(
                (currentTime - startTime) /
                duration,
                1
            );


        const eased =
            1 -
            Math.pow(
                1 - progress,
                3
            );


        const value =
            target * eased;


        element.textContent =
            `${value.toFixed(
                target % 1 === 0 ? 0 : 1
            )}${suffix}`;


        if (progress < 1) {

            requestAnimationFrame(
                update
            );

        }

    }


    requestAnimationFrame(update);

}


// =========================================================
// HERO COUNTERS
// =========================================================

function animateHeroCounters() {

    const counters =
        document.querySelectorAll(
            "[data-counter]"
        );


    counters.forEach(element => {

        const target =
            Number(
                element.dataset.counter
            );

        const suffix =
            element.dataset.suffix || "";


        animateCounter(
            element,
            target,
            suffix
        );

    });

}


// =========================================================
// MODEL INFO
// =========================================================

async function loadModelInfo() {

    try {

        const response =
            await fetch(
                `${API_URL}/model-info`
            );


        if (!response.ok) {

            throw new Error(
                "Model information unavailable"
            );

        }


        const data =
            await response.json();


        // ---------------------------------------------
        // HERO
        // ---------------------------------------------

        document.getElementById(
            "heroAccuracy"
        ).textContent =
            `${(
                data.accuracy * 100
            ).toFixed(1)}%`;


        document.getElementById(
            "heroRoc"
        ).textContent =
            `${(
                data.roc_auc * 100
            ).toFixed(1)}%`;


        // ---------------------------------------------
        // ANALYTICS
        // ---------------------------------------------

        setMetric(
            "accuracyCard",
            "accuracyBar",
            data.accuracy
        );


        setMetric(
            "precisionCard",
            "precisionBar",
            data.precision
        );


        setMetric(
            "recallCard",
            "recallBar",
            data.recall
        );


        setMetric(
            "f1Card",
            "f1Bar",
            data.f1_score
        );


        setMetric(
            "rocCard",
            "rocBar",
            data.roc_auc
        );


    } catch (error) {

        console.error(
            "Model info error:",
            error
        );

    }

}


// =========================================================
// METRIC
// =========================================================

function setMetric(
    textId,
    barId,
    value
) {

    const text =
        document.getElementById(textId);

    const bar =
        document.getElementById(barId);


    if (!text || !bar) return;


    const percentage =
        value * 100;


    text.textContent =
        `${percentage.toFixed(1)}%`;


    setTimeout(() => {

        bar.style.width =
            `${percentage}%`;

    }, 300);

}


// =========================================================
// CUSTOMER DATA
// =========================================================

function getCustomerData() {

    return {

        Gender:
            getValue("Gender"),

        SeniorCitizen:
            Number(
                getValue("SeniorCitizen")
            ),

        Partner:
            getValue("Partner"),

        Dependents:
            getValue("Dependents"),

        Tenure:
            Number(
                getValue("Tenure")
            ),

        PhoneService:
            getValue("PhoneService"),

        MultipleLines:
            getValue("MultipleLines"),

        InternetService:
            getValue("InternetService"),

        OnlineSecurity:
            getValue("OnlineSecurity"),

        OnlineBackup:
            getValue("OnlineBackup"),

        DeviceProtection:
            getValue("DeviceProtection"),

        TechSupport:
            getValue("TechSupport"),

        StreamingTV:
            getValue("StreamingTV"),

        StreamingMovies:
            getValue("StreamingMovies"),

        Contract:
            getValue("Contract"),

        PaperlessBilling:
            getValue("PaperlessBilling"),

        PaymentMethod:
            getValue("PaymentMethod"),

        MonthlyCharges:
            Number(
                getValue("MonthlyCharges")
            ),

        TotalCharges:
            Number(
                getValue("TotalCharges")
            )

    };

}


// =========================================================
// PREDICTION
// =========================================================

async function predictCustomer(
    customerData
) {

    const button =
        document.getElementById(
            "predictBtn"
        );


    const resultCard =
        document.getElementById(
            "resultCard"
        );


    button.disabled = true;

    button.querySelector(
        "span:nth-child(2)"
    ).textContent =
        "Analyzing customer...";


    resultCard.classList.add(
        "hidden"
    );


    try {

        const response =
            await fetch(
                `${API_URL}/predict`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            customerData
                        )

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Prediction failed"
            );

        }


        // Save latest result

        lastCustomerData =
            customerData;

        lastPrediction =
            data;


        // Display

        displayPrediction(
            data
        );


        resultCard.classList.remove(
            "hidden"
        );


        setTimeout(() => {

            resultCard.scrollIntoView({

                behavior: "smooth",

                block: "center"

            });

        }, 100);


    } catch (error) {

        console.error(
            "Prediction error:",
            error
        );


        showError(
            "Prediction failed: " +
            error.message
        );


    } finally {

        button.disabled = false;

        button.querySelector(
            "span:nth-child(2)"
        ).textContent =
            "Predict Customer Churn";

    }

}


// =========================================================
// DISPLAY PREDICTION
// =========================================================

function displayPrediction(
    data
) {

    const label =
        document.getElementById(
            "predictionLabel"
        );


    const probability =
        document.getElementById(
            "probability"
        );


    const risk =
        document.getElementById(
            "riskLevel"
        );


    const bar =
        document.getElementById(
            "progressBar"
        );


    const message =
        document.getElementById(
            "resultMessage"
        );


    const value =
        Number(
            data.churn_probability
        );


    label.textContent =
        data.prediction_label;


    probability.textContent =
        "0%";


    bar.style.width =
        "0%";


    risk.textContent =
        data.risk_level;


    // ---------------------------------------------
    // Risk Styling
    // ---------------------------------------------

    if (
        data.risk_level === "HIGH"
    ) {

        risk.style.color =
            "#ff7889";

        risk.style.background =
            "rgba(255,107,125,0.1)";

        risk.style.border =
            "1px solid rgba(255,107,125,0.2)";


        message.textContent =
            "⚠️ High churn risk detected. " +
            "Immediate retention action should be considered.";

    }

    else if (
        data.risk_level === "MEDIUM"
    ) {

        risk.style.color =
            "#ffc76b";

        risk.style.background =
            "rgba(255,199,107,0.1)";

        risk.style.border =
            "1px solid rgba(255,199,107,0.2)";


        message.textContent =
            "⚡ Moderate churn risk detected. " +
            "Proactive engagement could help retain this customer.";

    }

    else {

        risk.style.color =
            "#57df9a";

        risk.style.background =
            "rgba(87,223,154,0.1)";

        risk.style.border =
            "1px solid rgba(87,223,154,0.2)";


        message.textContent =
            "✓ Low churn risk detected. " +
            "Continue maintaining a positive customer experience.";

    }


    // ---------------------------------------------
    // Animate Probability
    // ---------------------------------------------

    animateCounter(
        probability,
        value,
        "%",
        1000
    );


    setTimeout(() => {

        bar.style.width =
            `${value}%`;

    }, 150);


    // Reset AI section

    document.getElementById(
        "aiResult"
    ).classList.add(
        "hidden"
    );

}


// =========================================================
// AI RETENTION
// =========================================================

async function generateAIStrategy() {

    if (
        !lastCustomerData ||
        !lastPrediction
    ) {

        showError(
            "Please make a churn prediction first."
        );

        return;

    }


    const button =
        document.getElementById(
            "aiBtn"
        );


    const loading =
        document.getElementById(
            "aiLoading"
        );


    const result =
        document.getElementById(
            "aiResult"
        );


    button.disabled = true;

    button.innerHTML =
        "⏳ Generating...";


    result.classList.add(
        "hidden"
    );


    loading.classList.remove(
        "hidden"
    );


    try {

        const response =
            await fetch(
                `${API_URL}/ai`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            customer:
                                lastCustomerData,

                            prediction:
                                lastPrediction

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                "AI request failed"
            );

        }


        displayAIResult(
            data
        );


        result.classList.remove(
            "hidden"
        );


    } catch (error) {

        console.error(
            "AI error:",
            error
        );


        showError(
            "AI analysis failed: " +
            error.message
        );


    } finally {

        loading.classList.add(
            "hidden"
        );

        button.disabled = false;

        button.innerHTML =
            "<span>✨</span> Generate AI Strategy";

    }

}


// =========================================================
// DISPLAY AI
// =========================================================

function displayAIResult(
    data
) {

    const source =
        document.getElementById(
            "aiSource"
        );


    const analysis =
        data.analysis;


    if (
        data.source === "openai"
    ) {

        source.textContent =
            "✨ OPENAI AI ANALYSIS";

    }

    else {

        source.textContent =
            "⚡ LOCAL RETENTION ENGINE";

    }


    if (
        typeof analysis ===
        "object"
    ) {

        document.getElementById(
            "aiRiskAnalysis"
        ).textContent =
            analysis.risk_analysis;


        fillList(
            "aiRiskFactors",
            analysis.key_risk_factors
        );


        fillList(
            "aiRetentionStrategy",
            analysis.retention_strategy
        );


        document.getElementById(
            "aiCustomerMessage"
        ).textContent =
            analysis.customer_message;

    }

    else {

        document.getElementById(
            "aiRiskAnalysis"
        ).textContent =
            analysis;


        fillList(
            "aiRiskFactors",
            [
                "AI-generated analysis"
            ]
        );


        fillList(
            "aiRetentionStrategy",
            [
                "Follow the recommendations provided above."
            ]
        );


        document.getElementById(
            "aiCustomerMessage"
        ).textContent =
            "See the AI analysis above for the personalized customer message.";

    }


    setTimeout(() => {

        document.getElementById(
            "aiResult"
        ).scrollIntoView({

            behavior: "smooth",

            block: "center"

        });

    }, 100);

}


// =========================================================
// LIST
// =========================================================

function fillList(
    elementId,
    items
) {

    const list =
        document.getElementById(
            elementId
        );


    list.innerHTML = "";


    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        const li =
            document.createElement(
                "li"
            );

        li.textContent =
            "No specific factors identified.";

        list.appendChild(
            li
        );

        return;

    }


    items.forEach(
        item => {

            const li =
                document.createElement(
                    "li"
                );

            li.textContent =
                item;

            list.appendChild(
                li
            );

        }
    );

}


// =========================================================
// ERROR
// =========================================================

function showError(
    message
) {

    alert(message);

}


// =========================================================
// FORM
// =========================================================

document
    .getElementById(
        "predictionForm"
    )
    .addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const customer =
                getCustomerData();


            predictCustomer(
                customer
            );

        }
    );


// =========================================================
// AI BUTTON
// =========================================================

document
    .getElementById(
        "aiBtn"
    )
    .addEventListener(
        "click",
        generateAIStrategy
    );


// =========================================================
// INITIALIZATION
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        createParticles();

        setupScrollReveal();

        animateHeroCounters();

        loadModelInfo();

    }
);
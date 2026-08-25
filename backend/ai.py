import os
from openai import OpenAI


def get_client():
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        return None

    return OpenAI(api_key=api_key)


def local_retention_strategy(customer, prediction):
    """
    Local fallback when OpenAI is unavailable.
    """

    probability = prediction.get("churn_probability", 0)
    risk = prediction.get("risk_level", "LOW")

    factors = []
    actions = []

    contract = customer.get("Contract")
    payment = customer.get("PaymentMethod")
    tenure = float(customer.get("Tenure", 0))
    monthly = float(customer.get("MonthlyCharges", 0))
    tech_support = customer.get("TechSupport")
    online_security = customer.get("OnlineSecurity")

    # Risk factors
    if contract == "Month-to-month":
        factors.append("Month-to-month contract")

    if tenure <= 12:
        factors.append("Short customer tenure")

    if monthly >= 70:
        factors.append("Relatively high monthly charges")

    if payment == "Electronic check":
        factors.append("Electronic check payment method")

    if tech_support == "No":
        factors.append("No technical support subscription")

    if online_security == "No":
        factors.append("No online security service")

    # Retention actions
    if contract == "Month-to-month":
        actions.append(
            "Offer an incentive for switching to a longer-term contract."
        )

    if monthly >= 70:
        actions.append(
            "Consider a personalized discount or value-based service bundle."
        )

    if tech_support == "No":
        actions.append(
            "Offer a technical support trial or discounted support plan."
        )

    if payment == "Electronic check":
        actions.append(
            "Encourage a more convenient automatic payment method."
        )

    actions.append(
        "Contact the customer proactively and understand their concerns."
    )

    if not factors:
        factors.append(
            "No major predefined churn risk factor identified."
        )

    return {
        "available": True,
        "source": "local_fallback",
        "analysis": {
            "risk_analysis": (
                f"The machine learning model estimates a "
                f"{probability}% churn probability, classified as "
                f"{risk} risk. This is a probabilistic estimate and "
                f"not a guaranteed outcome."
            ),

            "key_risk_factors": factors[:5],

            "retention_strategy": actions[:5],

            "customer_message": (
                "We value your experience with our service. "
                "We would like to understand how we can improve "
                "your experience and provide a plan that better "
                "matches your needs."
            )
        }
    }


def generate_retention_strategy(customer, prediction):

    client = get_client()

    # -----------------------------------------------------
    # OPENAI NOT CONFIGURED
    # -----------------------------------------------------

    if client is None:
        return local_retention_strategy(
            customer,
            prediction
        )


    churn_probability = prediction.get(
        "churn_probability",
        0
    )

    prediction_label = prediction.get(
        "prediction_label",
        "Unknown"
    )

    risk_level = prediction.get(
        "risk_level",
        "Unknown"
    )


    prompt = f"""
You are a customer retention analyst.

Analyze the following customer and machine-learning
churn prediction.

CUSTOMER DATA:
{customer}

ML PREDICTION:
Prediction: {prediction_label}
Churn Probability: {churn_probability}%
Risk Level: {risk_level}

Provide a practical business retention analysis.

Return exactly these sections:

RISK ANALYSIS

KEY RISK FACTORS

RETENTION STRATEGY

CUSTOMER MESSAGE

Do not claim certainty. The ML probability is an estimate,
not a guaranteed outcome.
"""


    try:

        response = client.responses.create(
            model="gpt-5.6",
            input=prompt
        )

        return {
            "available": True,
            "source": "openai",
            "analysis": response.output_text
        }


    except Exception as e:

        # -------------------------------------------------
        # OPENAI FAILED → LOCAL FALLBACK
        # -------------------------------------------------

        fallback = local_retention_strategy(
            customer,
            prediction
        )

        fallback["openai_error"] = str(e)

        return fallback
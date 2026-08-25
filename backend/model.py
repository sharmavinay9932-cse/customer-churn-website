import os
import joblib
import pandas as pd


# =========================================================
# PATHS
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")


# =========================================================
# LOAD SAVED ML OBJECTS
# =========================================================

model = joblib.load(
    os.path.join(MODEL_DIR, "churn_model.pkl")
)

preprocessor = joblib.load(
    os.path.join(MODEL_DIR, "preprocessor.pkl")
)

feature_selector = joblib.load(
    os.path.join(MODEL_DIR, "feature_selector.pkl")
)

selected_features = joblib.load(
    os.path.join(MODEL_DIR, "selected_features.pkl")
)

metadata = joblib.load(
    os.path.join(MODEL_DIR, "model_metadata.pkl")
)


# =========================================================
# FEATURE ENGINEERING
# =========================================================

def create_features(data):
    """
    Create the same engineered features used during training.
    """

    df = pd.DataFrame([data])

    # -----------------------------------------------------
    # Convert numeric columns
    # -----------------------------------------------------

    numeric_columns = [
        "SeniorCitizen",
        "Tenure",
        "MonthlyCharges",
        "TotalCharges"
    ]

    for column in numeric_columns:
        if column in df.columns:
            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            )

    # -----------------------------------------------------
    # Average Monthly Spend
    # -----------------------------------------------------

    df["AverageMonthlySpend"] = (
        df["TotalCharges"] /
        df["Tenure"].replace(0, 1)
    )

    df["AverageMonthlySpend"] = (
        df["AverageMonthlySpend"]
        .replace([float("inf"), -float("inf")], 0)
        .fillna(0)
    )

    # -----------------------------------------------------
    # Charge Difference
    # -----------------------------------------------------

    df["ChargeDifference"] = (
        df["MonthlyCharges"] -
        df["AverageMonthlySpend"]
    )

    # -----------------------------------------------------
    # Service Count
    # -----------------------------------------------------

    service_columns = [
        "PhoneService",
        "MultipleLines",
        "OnlineSecurity",
        "OnlineBackup",
        "DeviceProtection",
        "TechSupport",
        "StreamingTV",
        "StreamingMovies"
    ]

    df["ServiceCount"] = 0

    for column in service_columns:
        if column in df.columns:
            df["ServiceCount"] += (
                df[column]
                .astype(str)
                .str.lower()
                .isin(["yes", "yes "])
                .astype(int)
            )

    # -----------------------------------------------------
    # Contract Risk
    # -----------------------------------------------------

    contract_risk_map = {
        "Month-to-month": 3,
        "One year": 2,
        "Two year": 1
    }

    df["ContractRisk"] = (
        df["Contract"]
        .map(contract_risk_map)
        .fillna(3)
    )

    # -----------------------------------------------------
    # Electronic Payment
    # -----------------------------------------------------

    df["ElectronicPayment"] = (
        df["PaymentMethod"]
        .astype(str)
        .str.lower()
        .eq("electronic check")
        .astype(int)
    )

    # -----------------------------------------------------
    # Tech Support
    # -----------------------------------------------------

    df["HasTechSupport"] = (
        df["TechSupport"]
        .astype(str)
        .str.lower()
        .eq("yes")
        .astype(int)
    )

    # -----------------------------------------------------
    # Online Security
    # -----------------------------------------------------

    df["HasOnlineSecurity"] = (
        df["OnlineSecurity"]
        .astype(str)
        .str.lower()
        .eq("yes")
        .astype(int)
    )

    # -----------------------------------------------------
    # Tenure Group
    # -----------------------------------------------------

    def tenure_group(tenure):

        if tenure <= 12:
            return "New"

        elif tenure <= 24:
            return "Developing"

        elif tenure <= 48:
            return "Established"

        else:
            return "Loyal"

    df["TenureGroup"] = df["Tenure"].apply(
        tenure_group
    )

    # -----------------------------------------------------
    # Charge Group
    # -----------------------------------------------------

    def charge_group(charge):

        if charge < 35:
            return "Low"

        elif charge < 70:
            return "Medium"

        elif charge < 100:
            return "High"

        else:
            return "Very High"

    df["ChargeGroup"] = df["MonthlyCharges"].apply(
        charge_group
    )

    return df


# =========================================================
# PREDICTION
# =========================================================

def predict_customer(data):

    # Create engineered features
    df = create_features(data)

    # Preprocessing
    processed = preprocessor.transform(df)

    # Feature selection
    selected = feature_selector.transform(processed)

    # Prediction
    prediction = model.predict(selected)[0]

    # Probability
    probabilities = model.predict_proba(selected)[0]

    # Probability of positive class
    churn_probability = float(probabilities[1])

    # Risk
    if churn_probability >= 0.70:
        risk_level = "HIGH"

    elif churn_probability >= 0.40:
        risk_level = "MEDIUM"

    else:
        risk_level = "LOW"

    return {
        "prediction": int(prediction),

        "prediction_label": (
            "Churn"
            if int(prediction) == 1
            else "No Churn"
        ),

        "churn_probability": round(
            churn_probability * 100,
            2
        ),

        "risk_level": risk_level
    }


# =========================================================
# MODEL INFORMATION
# =========================================================

def get_model_info():

    return {
        "model_name": metadata.get(
            "model_name",
            "Logistic Regression"
        ),

        "accuracy": metadata.get(
            "accuracy",
            0
        ),

        "precision": metadata.get(
            "precision",
            0
        ),

        "recall": metadata.get(
            "recall",
            0
        ),

        "f1_score": metadata.get(
            "f1_score",
            0
        ),

        "roc_auc": metadata.get(
            "roc_auc",
            0
        ),

        "selected_features_count": 15
    }
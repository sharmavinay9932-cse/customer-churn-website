from flask import Flask, request, jsonify
from flask_cors import CORS

from model import predict_customer, get_model_info
from flask import Flask, request, jsonify
from flask_cors import CORS

from model import predict_customer, get_model_info
from ai import generate_retention_strategy


# =========================================================
# FLASK APP
# =========================================================

app = Flask(__name__)

CORS(app)


# =========================================================
# HOME
# =========================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "message": "Customer Churn Prediction API",
        "status": "running"
    })


# =========================================================
# HEALTH CHECK
# =========================================================

@app.route("/health", methods=["GET"])
def health():

    try:

        get_model_info()

        return jsonify({
            "status": "healthy",
            "model_loaded": True,
            "feature_columns_loaded": True
        })

    except Exception as e:

        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500


# =========================================================
# MODEL INFORMATION
# =========================================================

@app.route("/model-info", methods=["GET"])
def model_info():

    try:

        return jsonify(
            get_model_info()
        )

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# =========================================================
# PREDICTION
# =========================================================

@app.route("/predict", methods=["POST"])
def predict():

    try:

        data = request.get_json()

        if not data:

            return jsonify({
                "error": "No customer data provided"
            }), 400

        result = predict_customer(data)

        return jsonify(result)

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# =========================================================
# RUN SERVER
# =========================================================
# =========================================================
# AI RETENTION STRATEGY
# =========================================================

@app.route("/ai", methods=["POST"])
def ai_analysis():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "error": "No customer data provided"
            }), 400

        customer = data.get("customer")
        prediction = data.get("prediction")

        if not customer:
            return jsonify({
                "error": "Customer data is required"
            }), 400

        if not prediction:
            return jsonify({
                "error": "Prediction data is required"
            }), 400

        result = generate_retention_strategy(
            customer,
            prediction
        )

        return jsonify(result)

    except Exception as e:

        return jsonify({
            "available": False,
            "message": str(e)
        }), 500
if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
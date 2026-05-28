import numpy as np
from sklearn.linear_model import LinearRegression
from services.dashboard_service import get_monthly_income


# 🔥 DATOS EXTERNOS
EXTRA_DATA = [
    {"year": 2023, "month": 1, "total": 19754},
    {"year": 2023, "month": 2, "total": 17498},
    {"year": 2023, "month": 3, "total": 24132},
    {"year": 2023, "month": 4, "total": 25560},
    {"year": 2023, "month": 5, "total": 27550},
    {"year": 2023, "month": 6, "total": 29480},
    {"year": 2023, "month": 7, "total": 28760},
    {"year": 2023, "month": 8, "total": 18050},
    {"year": 2023, "month": 9, "total": 22330},
    {"year": 2023, "month": 10, "total": 23905},
    {"year": 2023, "month": 11, "total": 26167},
    {"year": 2023, "month": 12, "total": 16478},

    {"year": 2024, "month": 1, "total": 18940},
    {"year": 2024, "month": 2, "total": 19938},
    {"year": 2024, "month": 3, "total": 21876},
    {"year": 2024, "month": 4, "total": 23780},
    {"year": 2024, "month": 5, "total": 26736},
    {"year": 2024, "month": 6, "total": 29990},
    {"year": 2024, "month": 7, "total": 31854},
    {"year": 2024, "month": 8, "total": 27650},
    {"year": 2024, "month": 9, "total": 24185},
    {"year": 2024, "month": 10, "total": 24798},
    {"year": 2024, "month": 11, "total": 22365},
    {"year": 2024, "month": 12, "total": 17270},

    {"year": 2025, "month": 1, "total": 17850},
    {"year": 2025, "month": 2, "total": 19345},
    {"year": 2025, "month": 3, "total": 25620},
    {"year": 2025, "month": 4, "total": 26010},
    {"year": 2025, "month": 5, "total": 28155},
    {"year": 2025, "month": 6, "total": 31601},
    {"year": 2025, "month": 7, "total": 30100},
    {"year": 2025, "month": 8, "total": 26399},
    {"year": 2025, "month": 9, "total": 22680},
    {"year": 2025, "month": 10, "total": 21190},
    {"year": 2025, "month": 11, "total": 19800},
    {"year": 2025, "month": 12, "total": 16285},

    {"year": 2026, "month": 1, "total": 15890},
    {"year": 2026, "month": 2, "total": 16928},
    {"year": 2026, "month": 3, "total": 18749},
]


# 🔥 PREPARAR DATASET
def prepare_dataset(data, lag):
    values = [d["total"] for d in data]

    X, y = [], []

    for i in range(lag, len(values)):
        X.append(values[i-lag:i])
        y.append(values[i])

    return np.array(X), np.array(y)


# 🔥 ENTRENAR MODELO
def train_model(X, y):
    model = LinearRegression()
    model.fit(X, y)
    return model


# 🔥 PREDECIR
def predict_next(model, data, lag):
    last_values = [d["total"] for d in data][-lag:]
    prediction = model.predict([last_values])
    return float(prediction[0])


# 🔥 UNIR DATOS (sin duplicados)
def merge_data(db_data, extra_data):
    data_dict = {}

    for d in extra_data + db_data:
        key = (d["year"], d["month"])
        data_dict[key] = d

    merged = list(data_dict.values())

    merged.sort(key=lambda x: (x["year"], x["month"]))

    return merged


# 🔥 FUNCIÓN PRINCIPAL (LAG 12)
def predict_income(db):

    lag = 12  # 🔥 modelo anual

    db_data = get_monthly_income(db)

    data = merge_data(db_data, EXTRA_DATA)

    if len(data) <= lag:
        return None

    X, y = prepare_dataset(data, lag)

    model = train_model(X, y)

    prediction = predict_next(model, data, lag)

    return prediction
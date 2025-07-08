# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

from firebase_functions import https_fn, logger
from firebase_admin import initialize_app, storage, credentials
import pandas as pd
from datetime import datetime
import json

DATA_PATH = "private/data.json"

cred = credentials.Certificate("./serviceAccountKey.json")
app = initialize_app(cred)


def analyze(data: dict) -> dict:
    df = pd.DataFrame(data)
    analysis = dict()

    """
    Notes:
        Distance in meters
        Time in seconds
    """

    # total distance
    analysis["total_distance"] = df["distance"].sum()

    # distance by sport type
    analysis["distance_by_sport"] = df.groupby(by="sport_type")["distance"].sum().to_dict()

    # total moving time
    analysis["total_moving_time"] = df["moving_time"].sum()
    
    # total elapsed time
    analysis["total_elapsed_time"] = df["elapsed_time"].sum()

    return analysis


@https_fn.on_request()
def read_and_analyze(req):
    logger.info("Got request!")

    bucket = storage.bucket(app=app)
    data_blob = bucket.get_blob(DATA_PATH)

    if data_blob:
        logger.info(f"Found {DATA_PATH}")
        overall_data = None

        with data_blob.open() as data_file:
            overall_data = json.load(data_file)

        last_saved = overall_data["lastSaved"]              # in milliseconds
        data = overall_data["data"]

        print(f"Successfully loaded {DATA_PATH}, which was last saved {datetime.fromtimestamp(last_saved/1000)}")
        analysis: dict = analyze(data)

        return https_fn.Response(json.dumps({
            "message": "Success",
            "analysis": analysis,
        }), status=200, mimetype="application/json")
    else:
        logger.info(f"Unable to find {DATA_PATH}")

        return https_fn.Response(json.dumps({
            "message": "Storage data not found",
            "analysis": {},
        }), status=599, mimetype="application/json")

from firebase_functions import logger, scheduler_fn
from firebase_admin import initialize_app, get_app, storage, credentials
import pandas as pd
from numpy import float64 as np_float64, int64 as np_int64
from datetime import datetime
import time
import json

DATA_PATH = "private/data.json"
ANALYSIS_PATH = "public/analysis.json"

cred = credentials.Certificate("./serviceAccountKey.json")

try:
    app = get_app()
except ValueError as err:
    logger.info("Error:")
    logger.info(str(err))
    app = initialize_app(cred)

def convert_np_types_to_plain(dictionary):
    for key, value in dictionary.items():
        if isinstance(value, np_float64):
            dictionary[key] = float(value)
        elif isinstance(value, np_int64):
            dictionary[key] = int(value)
        elif isinstance(value, dict):
            dictionary[key] = convert_np_types_to_plain(value)
    return dictionary

def analyze(data):
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
    
    # np.int64 or np.float64 are not JSON serializable, so convert them to their plain counterparts
    return convert_np_types_to_plain({ "created": time.time(), "data": analysis })


@scheduler_fn.on_schedule(schedule="every day 02:00")
def read_and_analyze():
    logger.info("Running Python function `read_and_analyze`...")

    bucket = storage.bucket(app=app)
    data_blob = bucket.get_blob(DATA_PATH)

    if data_blob:
        logger.info(f"Found {DATA_PATH}")
        overall_data = None

        with data_blob.open() as data_file:
            overall_data = json.load(data_file)

        last_saved = overall_data["lastSaved"]              # in milliseconds
        data = overall_data["data"]

        logger.info(f"Successfully loaded {DATA_PATH}, which was last saved {datetime.fromtimestamp(last_saved/1000)}")
        analysis = analyze(data)

        analysis_blob = bucket.blob(ANALYSIS_PATH)
        analysis_blob.upload_from_string(
            data=json.dumps(analysis),
            content_type="application/json"
        )
            
        logger.info(f"Successfully uploaded to {ANALYSIS_PATH}")
    else:
        logger.info(f"Unable to find {DATA_PATH}")
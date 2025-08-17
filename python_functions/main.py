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

    # --- total ----------------------------------------------------------

    # total distance
    analysis["total_distance"] = df["distance"].sum()

    # total moving time
    analysis["total_moving_time"] = df["moving_time"].sum()

    # total elapsed time
    analysis["total_elapsed_time"] = df["elapsed_time"].sum()

    # total elevation gain
    analysis["total_elevation_gain"] = df["total_elevation_gain"].sum()

    # total kudos
    analysis["total_kudos"] = df["kudos_count"].sum()

    # --- average --------------------------------------------------------

    # mean kudos (per non-private activity)
    analysis["mean_kudos"] = analysis["total_kudos"] / df["visibility"].value_counts().drop(index="only_me").values.sum()

    # --- group by sport type --------------------------------------------
    sport_type_group = df.groupby(by="sport_type")

    # distance by sport type
    analysis["distance_by_sport"] = sport_type_group["distance"].sum().to_dict()

    # moving time by sport type
    analysis["moving_time_by_sport"] = sport_type_group["moving_time"].sum().to_dict()

    # elapsed time by sport type
    analysis["moving_time_by_sport"] = sport_type_group["elapsed_time"].sum().to_dict()

    # elevation gain by sport type
    analysis["elevation_gain_by_sport"] = sport_type_group["total_elevation_gain"].sum().to_dict()

    # kudos by sport type
    analysis["kudos_by_sport"] = sport_type_group["kudos_count"].sum().to_dict()

    # --- weekly ---------------------------------------------------------
    def get_weekly(column, target_df=df):
        if "start_date_dt" not in df.columns:
            df["start_date_dt"] = pd.to_datetime(df["start_date"])
        return (target_df
                .groupby(pd.Grouper(key="start_date_dt", freq="W-MON", label="left", closed="left"))[column]
                .sum()
                .rename(index=lambda ts: int(ts.timestamp()) * 1000)
                .to_dict())
    
    def get_weekly_by_sport(column):
        d = {}
        for sport in df["sport_type"].unique():
            d[sport] = get_weekly(column, df[df["sport_type"] == sport])
        return d

    # weekly stats
    analysis["weekly_distance"] = get_weekly("distance")
    analysis["weekly_kudos"] = get_weekly("kudos_count")
    
    # weekly stats by sport type
    analysis["weekly_distance_by_sport"] = get_weekly_by_sport("distance")
    analysis["weekly_kudos_by_sport"] = get_weekly_by_sport("kudos_count")

    # np.int64 or np.float64 are not JSON serializable, so convert them to their plain counterparts
    return convert_np_types_to_plain(analysis)


@scheduler_fn.on_schedule(schedule="every day 02:00")
def read_and_analyze(event):
    logger.info("Running Python function `read_and_analyze`...")

    bucket = storage.bucket(app=app)
    data_blob = bucket.get_blob(DATA_PATH)

    if data_blob:
        logger.info(f"Found {DATA_PATH}")
        overall_data = None

        with data_blob.open() as data_file:
            overall_data = json.load(data_file)

        fetched_at = overall_data["metadata"]["fetchedAt"]              # in milliseconds
        data = overall_data["data"]

        logger.info(f"Successfully loaded {DATA_PATH}, which was last saved {datetime.fromtimestamp(fetched_at/1000)}")
        analysis = analyze(data)

        analysis_blob = bucket.blob(ANALYSIS_PATH)
        analysis_blob.upload_from_string(
            data=json.dumps({
                "metadata": {
                    "analyzed_at": time.time() * 1000,
                    "fetched_at": fetched_at
                },
                "data": analysis
            }),
            content_type="application/json"
        )

        logger.info(f"Successfully uploaded to {ANALYSIS_PATH}")
    else:
        logger.info(f"Unable to find {DATA_PATH}")

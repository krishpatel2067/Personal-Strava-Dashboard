from firebase_functions import logger, scheduler_fn
from firebase_admin import initialize_app, get_app, storage, credentials
import time
import json
from analyze import analyze

DATA_PATH = "private/raw_data.json"
ANALYSIS_PATH = "public/analysis.json"

cred = credentials.Certificate("./serviceAccountKey.json")

try:
    app = get_app()
except ValueError as err:
    logger.info("Error:")
    logger.info(str(err))
    app = initialize_app(cred)


@scheduler_fn.on_schedule(schedule="every day 02:00")
def read_and_analyze():
    analysis_start = time.time() * 1000
    logger.info("Running Python function `read_and_analyze`...")

    bucket = storage.bucket(app=app)
    data_blob = bucket.get_blob(DATA_PATH)

    if data_blob:
        logger.info(f"Found {DATA_PATH}")
        overall_data = None

        with data_blob.open() as data_file:
            overall_data = json.load(data_file)

        if overall_data is None:
            logger.warning(f"Unable to load {DATA_PATH}")
            return

        metadata = overall_data["metadata"]
        data = overall_data["data"]

        analysis = analyze(data)
        analysis_blob = bucket.blob(ANALYSIS_PATH)

        analysis_end = time.time() * 1000
        metadata["analysis_end"] = analysis_end
        metadata["analysis_duration"] = analysis_end - analysis_start

        analysis_blob.upload_from_string(
            data=json.dumps({
                "metadata": metadata,
                "data": analysis
            }),
            content_type="application/json"
        )

        logger.info(f"Successfully uploaded to {ANALYSIS_PATH}")
    else:
        logger.warning(f"Unable to find {DATA_PATH}")

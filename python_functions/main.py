# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

from firebase_functions import https_fn, logger
from firebase_admin import initialize_app, storage, credentials
import pandas as pd

DATA_PATH = "private/data.json"

cred = credentials.Certificate("./serviceAccountKey.json")
app = initialize_app(cred)

@https_fn.on_request()
def read_and_analyze(req):
    logger.info("Got request!")
    
    bucket = storage.bucket(app=app)
    data_blob = bucket.get_blob(DATA_PATH)
    
    if data_blob:
        logger.info(f"Found {DATA_PATH}")
    else:
        logger.info(f"Unable to find {DATA_PATH}")    
    
    return https_fn.Response("Hello world from Python!")
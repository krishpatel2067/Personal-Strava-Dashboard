# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

from firebase_functions import https_fn, logger
from firebase_admin import initialize_app
import pandas as pd

# initialize_app()
#
#
@https_fn.on_request()
def on_request_example(req: https_fn.Request) -> https_fn.Response:
    df = pd.DataFrame({'Column1': [1, 2, 3], 'Column2': [4, 5, 6]})
    logger.info(df.to_json())
    logger.info("Got request!")
    return https_fn.Response("Hello world from Python!")
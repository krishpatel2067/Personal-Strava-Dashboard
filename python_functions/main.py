# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

from firebase_functions import https_fn, logger
from firebase_admin import initialize_app, storage, credentials
import pandas as pd

cred = credentials.Certificate("./serviceAccountKey.json")
app = initialize_app(cred)
#
#
@https_fn.on_request()
def read_and_analyze(req):
    logger.info("Got request!")
    
    bucket = storage.bucket(app=app)
    logger.info("all the blobs:")
    iterator = bucket.list_blobs()
    first_blob = next(iterator, "No files!")
    content = first_blob.download_as_string().decode("utf-8")
    logger.info("first blob contents:", first_blob.path)
    logger.info(content)
    
    return https_fn.Response("Hello world from Python!")
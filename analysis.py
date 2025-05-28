import pandas as pd
import json

def read_datastore(file_path):
    try:
        with open(file_path, 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        print(f'Error reading datastore: File not found: {file_path}')
        return None
    except json.JSONDecodeError:
        print(f'Error reading datastore: Invalid JSON format in file: {file_path}')
        return None
    

# TODO: LEARN ABOUT DF GROUPBY STUFF!
def analyze_and_store(file_path='analysis.json'):
    data = read_datastore('data.json')['data']
    df = pd.DataFrame(data)

    # total distance (m)
    total_dist = df.distance.sum()

    # max distance (m)
    max_dist = df.distance.max()
    # activity with max distance
    max_dist_act = df.iloc[df.distance.idxmax(), :].fillna(-1).to_dict()   # workout type seems to be NaN, so use -1 to signal that
    
    # max moving time
    max_mov_time = df.moving_time.max()
    # activity with max moving time
    max_mov_time_act = df.iloc[df.moving_time.idxmax(), :].fillna(-1).to_dict()

    # store in file
    with open(file_path, 'w') as file:
        json.dump({
            'total_distance': total_dist,
            'max_distance': max_dist,
            'max_distance_activity': max_dist_act,
            'max_moving_time': max_mov_time,
            'max_moving_time_activity': max_mov_time_act
        }, file)

analyze_and_store('analysis.json')
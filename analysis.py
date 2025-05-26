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
    

def analyze_and_store(file_path='analysis.json'):
    data = read_datastore('data.json')['data']
    df = pd.DataFrame(data)

    # total distance (m)
    total_dist = df.distance.sum()

    # store in file
    with open(file_path, 'w') as file:
        json.dump({
            'total_distance': total_dist
        }, file)

analyze_and_store('analysis.json')
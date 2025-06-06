import pandas as pd
import json
import os

def read_datastore(file_path):
    try:
        with open(file_path, "r") as file:
            return json.load(file)
    except FileNotFoundError:
        print(f"Error reading datastore: File not found: {file_path}")
        return None
    except json.JSONDecodeError:
        print(f"Error reading datastore: Invalid JSON format in file: {file_path}")
        return None


def remove_unnecessary_info(activity):
    del activity["map"]
    del activity["start_latlng"]
    del activity["end_latlng"]
    del activity["upload_id"]
    del activity["upload_id_str"]
    del activity["external_id"]
    return activity


# TODO: LEARN ABOUT DF GROUPBY STUFF!
def analyze_and_store(file_path="analysis.json"):
    data_file = os.path.join(os.path.dirname(__file__), "data.json")
    data = read_datastore(data_file)["data"]
    df = pd.DataFrame(data)

    # total distance (m)
    total_dist = df.distance.sum()

    # max distance (m)
    max_dist = df.distance.max()

    # activity with max distance
    # > workout type seems to be NaN, so use -1 to signal that
    max_dist_act = remove_unnecessary_info(df.iloc[df.distance.idxmax()].fillna(-1).to_dict())

    # total moving time (s)
    # > sum returns np.int64, which JSON.dumps complains about
    total_mov_time = int(df.moving_time.sum())

    # max moving time (s)
    max_mov_time = df.moving_time.max()

    # activity with max moving time
    max_mov_time_act = remove_unnecessary_info(df.iloc[df.moving_time.idxmax()].fillna(-1).to_dict())

    # total elevation gain (m)
    total_elv_gain = df.total_elevation_gain.sum()

    # max elevation gain (m)
    max_elv_gain = df.total_elevation_gain.max()

    # activity with max elevation gain
    max_elv_gain_act = remove_unnecessary_info(df.iloc[df.total_elevation_gain.idxmax()].fillna(-1).to_dict())
    
    # non-manual activity max elevation gain (m)
    non_manual_df = df[df.manual == False]
    nm_max_elv_gain = non_manual_df.total_elevation_gain.max()

    # non-manual activity with max elevation gain
    max_elv_gain_nm_act = remove_unnecessary_info(non_manual_df.loc[non_manual_df.total_elevation_gain.idxmax()].fillna(-1).to_dict())    

    # total kudos
    total_kudos = int(df.kudos_count.sum())
    
    # max kudos
    max_kudos = df.kudos_count.max()
    
    # max kudos activity
    max_kudos_act = remove_unnecessary_info(df.iloc[df.kudos_count.idxmax()].fillna(-1).to_dict())

    # average kudos per non-private activity
    avg_kudos_per_np_act = total_kudos / len(df[df.visibility != 'only_me'])

    # TODO: distance, time, # activities per sport type

    # store in file
    with open(file_path, "w") as file:
        json.dump({
            # distance
            "total_distance": total_dist,
            "max_distance": max_dist,
            "max_distance_activity": max_dist_act,

            # moving time
            "total_moving_time": total_mov_time,
            "max_moving_time": max_mov_time,
            "max_moving_time_activity": max_mov_time_act,

            # elevation gain
            "total_elevation_gain": total_elv_gain,
            "max_elevation_gain": max_elv_gain,
            "max_elevation_gain_activity": max_elv_gain_act,
            "non_manual_max_elevation_gain": nm_max_elv_gain,
            "max_elevation_gain_non_manual_activity": max_elv_gain_nm_act,
            
            # kudos
            "total_kudos": total_kudos,
            "max_kudos": max_kudos,
            "max_kudos_activity": max_kudos_act,
            "avg_kudos_per_non_private_activity": avg_kudos_per_np_act,
        }, file)


analyze_and_store("analysis.json")

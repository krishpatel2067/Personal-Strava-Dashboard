import pandas as pd
from numpy import float64 as np_float64, int64 as np_int64


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
    # --- ACTIVITIES -----------------------------------------------------
    df = pd.DataFrame(data["activities"])
    activities = {}

    # --- total ----------------------------------------------------------
    sport_type_group = df.groupby(by="sport_type")
    total = {
        "distance": df["distance"].sum(),
        "moving_time": df["moving_time"].sum(),
        "elapsed_time": df["elapsed_time"].sum(),
        "elevation_gain": df["total_elevation_gain"].sum(),
        "kudos": df["kudos_count"].sum(),
        "activities": df.shape[0],
        "recorded_activities": df["manual"].value_counts()[False],
        "distance_by_sport": sport_type_group["distance"].sum().to_dict(),
        "moving_time_by_sport": sport_type_group["moving_time"].sum().to_dict(),
        "elapsed_time_by_sport": sport_type_group["elapsed_time"].sum().to_dict(),
        "elevation_gain_by_sport": sport_type_group["total_elevation_gain"].sum().to_dict(),
        "kudos_by_sport": sport_type_group["kudos_count"].sum().to_dict(),
        "activities_by_sport": df["sport_type"].value_counts().to_dict()
    }

    activities["total"] = total

    # --- average --------------------------------------------------------

    mean = {
        # mean kudos (per non-private activity)
        "kudos": df[df["visibility"] != "only_me"]["kudos_count"].mean()
    }

    activities["mean"] = mean

    # --- periodic -------------------------------------------------------
    def get_periodic(df, col, freq):
        if "start_date_dt" not in df.columns:
            df["start_date_dt"] = pd.to_datetime(df["start_date"])

        # if freq W-MON:
        # label = "left" - then the Monday of the week is used as label
        # closed = "left" - then it considers Monday to Sunday as the week (excluding next Monday)

        if col == "_activities":
            # not a real column, just used as a special case to count activities
            # number of activities per week
            return (df
                    .groupby(pd.Grouper(key="start_date_dt", freq=freq, label="left", closed="left"))["id"]
                    .count()
                    .rename(index=lambda ts: int(ts.timestamp()) * 1000)
                    .to_dict())
        else:
            return (df
                    .groupby(pd.Grouper(key="start_date_dt", freq=freq, label="left", closed="left"))[col]
                    .sum()
                    .rename(index=lambda ts: int(ts.timestamp()) * 1000)
                    .to_dict())

    def get_periodic_by_sport(df, col, freq):
        return {sport: get_periodic(df[df["sport_type"] == sport], col, freq) for sport in df["sport_type"].unique()}

    # { alias : col_name }
    periodic_cols = {"distance": "distance", "kudos": "kudos_count", "activities": "_activities"}

    activities["weekly"] = {
        key: get_periodic(df, col, "W-MON")
        for key, col in periodic_cols.items()
    } | {
        key + "_by_sport": get_periodic_by_sport(df, col, "W-MON")
        for key, col in periodic_cols.items()
    }
    activities["monthly"] = {
        key: get_periodic(df, col, "MS")
        for key, col in periodic_cols.items()
    } | {
        key + "_by_sport": get_periodic_by_sport(df, col, "MS")
        for key, col in periodic_cols.items()
    }
    activities["yearly"] = {
        key: get_periodic(df, col, "YS")
        for key, col in periodic_cols.items()
    } | {
        key + "_by_sport": get_periodic_by_sport(df, col, "YS")
        for key, col in periodic_cols.items()
    }

    # --- ATHLETE --------------------------------------------------------
    athlete_fields = ["username", "firstname", "lastname", "created_at", "updated_at", "profile", "follower_count", "friend_count"]
    athlete = {field: data["athlete"][field] for field in athlete_fields if field in data["athlete"]}

    # --- GEAR ----------------------------------------------------------
    shoe_fields = ["brand_name", "model_name", "distance", "retired"]
    shoes = [{field: shoe[field] for field in shoe_fields if field in shoe} for shoe in data["gear"]["shoes"]]

    # np.int64 or np.float64 are not JSON serializable, so convert them to their plain counterparts
    return convert_np_types_to_plain({
        "activities": activities,
        "athlete": athlete,
        "athlete_stats": data["athlete_stats"],
        "gear": {
            "shoes": shoes,
            "bikes": []
        }
    })

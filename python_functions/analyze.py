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

    # total distance
    activities["total_distance"] = df["distance"].sum()

    # total moving time
    activities["total_moving_time"] = df["moving_time"].sum()

    # total elapsed time
    activities["total_elapsed_time"] = df["elapsed_time"].sum()

    # total elevation gain
    activities["total_elevation_gain"] = df["total_elevation_gain"].sum()

    # total kudos
    activities["total_kudos"] = df["kudos_count"].sum()

    # total activities
    activities["total_activities"] = df.shape[0]

    # total recorded activities
    activities["total_recorded_activities"] = df["manual"].value_counts()[False]

    # --- average --------------------------------------------------------

    # mean kudos (per non-private activity)
    activities["mean_kudos"] = activities["total_kudos"] / df["visibility"].value_counts().drop(index="only_me").values.sum()

    # --- group by sport type --------------------------------------------
    sport_type_group = df.groupby(by="sport_type")

    # distance by sport type
    activities["distance_by_sport"] = sport_type_group["distance"].sum().to_dict()

    # moving time by sport type
    activities["moving_time_by_sport"] = sport_type_group["moving_time"].sum().to_dict()

    # elapsed time by sport type
    activities["moving_time_by_sport"] = sport_type_group["elapsed_time"].sum().to_dict()

    # elevation gain by sport type
    activities["elevation_gain_by_sport"] = sport_type_group["total_elevation_gain"].sum().to_dict()

    # kudos by sport type
    activities["kudos_by_sport"] = sport_type_group["kudos_count"].sum().to_dict()

    # activities by sport type
    activities["activities_by_sport"] = df["sport_type"].value_counts().to_dict()

    # --- weekly ---------------------------------------------------------
    def get_weekly(column, target_df=df):
        if "start_date_dt" not in df.columns:
            df["start_date_dt"] = pd.to_datetime(df["start_date"])

        if column == "_activities":
            # not a real column
            # number of activities per week
            return (target_df
                    .groupby(pd.Grouper(key="start_date_dt", freq="W-MON", label="left", closed="left"))["id"]
                    .count()
                    .rename(index=lambda ts: int(ts.timestamp()) * 1000)
                    .to_dict())
        else:
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
    activities["weekly_distance"] = get_weekly("distance")
    activities["weekly_kudos"] = get_weekly("kudos_count")
    activities["weekly_activities"] = get_weekly("_activities")

    # weekly stats by sport type
    activities["weekly_distance_by_sport"] = get_weekly_by_sport("distance")
    activities["weekly_kudos_by_sport"] = get_weekly_by_sport("kudos_count")
    activities["weekly_activities_by_sport"] = get_weekly_by_sport("_activities")

    # --- ATHLETE --------------------------------------------------------
    athlete_fields = ["username", "firstname", "lastname", "created_at", "updated_at", "profile", "follower_count", "friend_count", ]
    athlete = {field: data["athlete"][field] for field in athlete_fields}

    # --- GEAR ----------------------------------------------------------
    shoe_fields = ["brand_name", "model_name", "distance", "retired"]
    shoes = [{field: shoe[field] for field in shoe_fields} for shoe in data["gear"]["shoes"]]

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

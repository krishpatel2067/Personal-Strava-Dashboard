import pandas as pd
from numpy import float64 as np_float64, int64 as np_int64


def DT_TO_TS(dt): return int(dt.timestamp()) * 1000


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
        "overall": {
            "distance": df["distance"].sum(),
            "moving_time": df["moving_time"].sum(),
            "elapsed_time": df["elapsed_time"].sum(),
            "elevation_gain": df["total_elevation_gain"].sum(),
            "kudos": df["kudos_count"].sum(),
            "activities": df.shape[0],
            "recorded_activities": df["manual"].value_counts()[False],
        },
        "by_sport": {
            "distance_by_sport": sport_type_group["distance"].sum().to_dict(),
            "moving_time_by_sport": sport_type_group["moving_time"].sum().to_dict(),
            "elapsed_time_by_sport": sport_type_group["elapsed_time"].sum().to_dict(),
            "elevation_gain_by_sport": sport_type_group["total_elevation_gain"].sum().to_dict(),
            "kudos_by_sport": sport_type_group["kudos_count"].sum().to_dict(),
            "activities_by_sport": sport_type_group["sport_type"].count().to_dict()
        }
    }

    activities["total"] = total

    # --- average --------------------------------------------------------

    mean = {
        # mean kudos (per non-private activity)
        "kudos": df[df["visibility"] != "only_me"]["kudos_count"].mean()
    }

    activities["mean"] = mean

    # --- periodic -------------------------------------------------------
    # sets to get full range of timestamps without holes and duplicates
    weekly_ts = set()
    monthly_ts = set()
    yearly_ts = set()

    def get_periodic(df, col, freq, ts_set):
        # if freq W-MON:
        # label = "left" - then the Monday of the week is used as label
        # closed = "left" - then it considers Monday to Sunday as the week (excluding next Monday)
        if "start_date_dt" not in df.columns:
            df["start_date_dt"] = pd.to_datetime(df["start_date"])

        group = df.groupby(pd.Grouper(key="start_date_dt", freq=freq, label="left", closed="left"))

        if col == "_activities":
            # not a real column, just used as a special case to count activities
            # number of activities per week
            series = group["id"].count()
        else:
            series = group[col].sum()

        series = series.rename(index=DT_TO_TS)
        ts_set.update(series.index)

        return series[series != 0].to_dict()

    def get_periodic_by_sport(df, col, freq, ts_set):
        return {sport: get_periodic(df[df["sport_type"] == sport], col, freq, ts_set) for sport in df["sport_type"].unique()}

    # { alias : col_name }
    periodic_cols = {"distance": "distance", "kudos": "kudos_count", "activities": "_activities"}

    activities["weekly"] = {
        "overall": {
            key: get_periodic(df, col, "W-MON", weekly_ts)
            for key, col in periodic_cols.items()
        },
        "by_sport": {
            key: get_periodic_by_sport(df, col, "W-MON", weekly_ts)
            for key, col in periodic_cols.items()
        }
    }
    activities["monthly"] = {
        "overall": {
            key: get_periodic(df, col, "MS", monthly_ts)
            for key, col in periodic_cols.items()
        },
        "by_sport": {
            key: get_periodic_by_sport(df, col, "MS", monthly_ts)
            for key, col in periodic_cols.items()
        }
    }
    activities["yearly"] = {
        "overall": {
            key: get_periodic(df, col, "YS", yearly_ts)
            for key, col in periodic_cols.items()
        },
        "by_sport": {
            key: get_periodic_by_sport(df, col, "YS", yearly_ts)
            for key, col in periodic_cols.items()
        }
    }

    activities["weekly"]["timestamps"] = sorted(list(weekly_ts))             # every Monday 00:00:00
    activities["monthly"]["timestamps"] = sorted(list(monthly_ts))           # every 1st day of the month 00:00:00
    activities["yearly"]["timestamps"] = sorted(list(yearly_ts))             # every 1st day of the year 00:00:00

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

import pytest
from analyze import analyze
import json


def is_nested_subdict(superset, subset):
    """Recursively checks if one nested dictionary is a subset of another."""
    if isinstance(subset, dict):
        return all(key in superset and is_nested_subdict(superset[key], val) for key, val in subset.items())
    else:
        return subset == superset


# ignore athlete, athlete_stats, gear since they're not "analyzed" per se
class TestAnalyze:
    with open("test_data.json", "r") as f:
        default_data = json.load(f)

    def test_analyze1(self):
        """Returns the correct numeric results for non-periodic analysis"""
        assert is_nested_subdict(analyze(self.default_data), {
            "activities": {
                "total": {
                    "distance": 150000,
                    "moving_time": 54000,
                    "elapsed_time": 7500,
                    "elevation_gain": 1500,
                    "kudos": 150,
                    "activities": 5,
                    "recorded_activities": 3,
                    "distance_by_sport": {"Run": 70000, "Walk": 80000},
                    "moving_time_by_sport": {"Run": 25200, "Walk": 28800},
                    "elapsed_time_by_sport": {"Run": 3500, "Walk": 4000},
                    "elevation_gain_by_sport": {"Run": 700, "Walk": 800},
                    "kudos_by_sport": {"Run": 70, "Walk": 80},
                    "activities_by_sport": {"Run": 3, "Walk": 2}
                },
                "mean": {"kudos": 20}
            }
        })

    def test_analyze2(self):
        """Returns the correct numeric results for weekly analysis"""

        new_dates = ["2025-12-29T00:00:00Z", "2026-01-02T00:00:00Z", "2026-01-04T23:59:00Z",
                     "2026-01-12T00:00:00Z", "2026-01-18T23:59:00Z"]

        for i, activity in enumerate(self.default_data["activities"]):
            activity["start_date"] = new_dates[i]

        assert is_nested_subdict(analyze(self.default_data), {
            "activities": {
                "weekly": {
                    "distance": {1766966400000: 60000, 1768176000000: 90000},
                    "kudos": {1766966400000: 60, 1768176000000: 90},
                    "activities": {1766966400000: 3, 1768176000000: 2},
                    "distance_by_sport": {
                        "Run": {1766966400000: 30000, 1768176000000: 40000},
                        "Walk": {1766966400000: 30000, 1768176000000: 50000}
                    },
                    "kudos_by_sport": {
                        "Run": {1766966400000: 30, 1768176000000: 40},
                        "Walk": {1766966400000: 30, 1768176000000: 50}
                    },
                    "activities_by_sport": {
                        "Run": {1766966400000: 2, 1768176000000: 1},
                        "Walk": {1766966400000: 1, 1768176000000: 1}
                    }
                }
            }
        })

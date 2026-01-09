import pytest
from analyze import analyze
import json


class TestAnalyze:
    with open("test_data.json", "r") as f:
        default_data = json.load(f)

    def test_analyze(self):
        assert analyze(self.default_data) == {
            "activities": {
                "total": {
                    "distance": 150000,
                    "moving_time": 54000,
                    "elapsed_time": 7500,
                    "elevation_gain": 1500,
                    "kudos": 150,
                    "activities": 5,
                    "recorded_activities": 3,
                    "distance_by_sport": {"Run": 80000, "Walk": 70000},
                    "moving_time_by_sport": {"Run": 25200, "Walk": 28800},
                    "elapsed_time_by_sport": {"Run": 3500, "Walk": 4000},
                    "elevation_gain_by_sport": {"Run": 1500, "Walk": 0},
                    "kudos_by_sport": {"Run": 70, "Walk": 80},
                    "activities_by_sport": {"Run": 3, "Walk": 2}
                },
                "mean": {"kudos": 20},
                "weekly": {},
                "monthly": {},
                "yearly": {}
            },
            "athlete": {},
            "athlete_stats": {},
            "gear": {
                "shoes": [],
                "bikes": []
            }
        }

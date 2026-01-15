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

    def test_non_periodic(self):
        """Returns the correct numeric results for non-periodic analysis"""
        assert is_nested_subdict(analyze(self.default_data), {
            "activities": {
                "total": {
                    "overall": {
                        "distance": 150000,
                        "moving_time": 7500,
                        "elapsed_time": 54000,
                        "elevation_gain": 1500,
                        "kudos": 150,
                        "activities": 5,
                        "recorded_activities": 3,
                    },
                    "by_sport": {
                        "distance_by_sport": {"Run": 70000, "Walk": 80000},
                        "moving_time_by_sport": {"Run": 3500, "Walk": 4000},
                        "elapsed_time_by_sport": {"Run": 25200, "Walk": 28800},
                        "elevation_gain_by_sport": {"Run": 700, "Walk": 800},
                        "kudos_by_sport": {"Run": 70, "Walk": 80},
                        "activities_by_sport": {"Run": 3, "Walk": 2}
                    }
                },
                "mean": {"kudos": 20}
            }
        })

    def test_weekly(self):
        """Returns the correct numeric results for weekly analysis"""

        new_dates = ["2025-12-29T00:00:00Z", "2026-01-02T00:00:00Z", "2026-01-04T23:59:00Z",
                     "2026-01-12T00:00:00Z", "2026-01-18T23:59:00Z"]

        for i, activity in enumerate(self.default_data["activities"]):
            activity["start_date"] = new_dates[i]

        assert is_nested_subdict(analyze(self.default_data), {
            "activities": {
                "weekly": {
                    "timestamps": [1766966400000, 1767571200000, 1768176000000],
                    "overall": {
                        "distance": {1766966400000: 60000, 1768176000000: 90000},
                        "kudos": {1766966400000: 60, 1768176000000: 90},
                        "activities": {1766966400000: 3, 1768176000000: 2},

                    },
                    "by_sport": {
                        "distance": {
                            "Run": {1766966400000: 30000, 1768176000000: 40000},
                            "Walk": {1766966400000: 30000, 1768176000000: 50000}
                        },
                        "kudos": {
                            "Run": {1766966400000: 30, 1768176000000: 40},
                            "Walk": {1766966400000: 30, 1768176000000: 50}
                        },
                        "activities": {
                            "Run": {1766966400000: 2, 1768176000000: 1},
                            "Walk": {1766966400000: 1, 1768176000000: 1}
                        }
                    }
                }
            }
        })

    def test_monthly(self):
        """Returns the correct numeric results for monthly analysis"""

        new_dates = ["2025-12-01T00:00:00Z", "2025-12-13T00:00:00Z", "2025-12-31T23:59:00Z",
                     "2026-01-01T00:00:00Z", "2026-01-31T23:59:00Z"]

        for i, activity in enumerate(self.default_data["activities"]):
            activity["start_date"] = new_dates[i]

        assert is_nested_subdict(analyze(self.default_data), {
            "activities": {
                "monthly": {
                    "timestamps": [1764547200000, 1767225600000],
                    "overall": {
                        "distance": {1764547200000: 60000, 1767225600000: 90000},
                        "kudos": {1764547200000: 60, 1767225600000: 90},
                        "activities": {1764547200000: 3, 1767225600000: 2},
                    },
                    "by_sport": {
                        "distance": {
                            "Run": {1764547200000: 30000, 1767225600000: 40000},
                            "Walk": {1764547200000: 30000, 1767225600000: 50000}
                        },
                        "kudos": {
                            "Run": {1764547200000: 30, 1767225600000: 40},
                            "Walk": {1764547200000: 30, 1767225600000: 50}
                        },
                        "activities": {
                            "Run": {1764547200000: 2, 1767225600000: 1},
                            "Walk": {1764547200000: 1, 1767225600000: 1}
                        }
                    }
                }
            }
        })

    def test_monthly_leap_year(self):
        """Returns the correct numeric results for monthly (leap year) analysis"""

        new_dates = ["2027-12-01T00:00:00Z", "2027-12-31T23:59:00Z",
                     "2028-02-01T00:00:00Z", "2028-02-29T23:59:00Z", "2028-03-01T00:00:00Z"]

        for i, activity in enumerate(self.default_data["activities"]):
            activity["start_date"] = new_dates[i]

        assert is_nested_subdict(analyze(self.default_data), {
            "activities": {
                "monthly": {
                    "timestamps": [1827619200000, 1830297600000, 1832976000000, 1835481600000],
                    "overall": {
                        "distance": {1827619200000: 30000, 1832976000000: 70000, 1835481600000: 50000},
                        "kudos": {1827619200000: 30, 1832976000000: 70, 1835481600000: 50},
                        "activities": {1827619200000: 2, 1832976000000: 2, 1835481600000: 1},
                    },
                    "by_sport": {
                        "distance": {
                            "Run": {1827619200000: 30000, 1832976000000: 40000},
                            "Walk": {1832976000000: 30000, 1835481600000: 50000}
                        },
                        "kudos": {
                            "Run": {1827619200000: 30, 1832976000000: 40},
                            "Walk": {1832976000000: 30, 1835481600000: 50}
                        },
                        "activities": {
                            "Run": {1827619200000: 2, 1832976000000: 1},
                            "Walk": {1832976000000: 1, 1835481600000: 1}
                        }
                    }
                }
            }
        })

    def test_yearly(self):
        """Returns the correct numeric results for yearly analysis"""

        new_dates = ["2024-01-01T00:00:00Z", "2024-07-01T00:00:00Z", "2024-12-31T23:59:00Z",  # leap year
                     "2026-01-01T00:00:00Z", "2026-12-31T23:59:00Z"]

        for i, activity in enumerate(self.default_data["activities"]):
            activity["start_date"] = new_dates[i]

        assert is_nested_subdict(analyze(self.default_data), {
            "activities": {
                "yearly": {
                    "timestamps": [1704067200000, 1735689600000, 1767225600000],
                    "overall": {
                        "distance": {1704067200000: 60000, 1767225600000: 90000},
                        "kudos": {1704067200000: 60, 1767225600000: 90},
                        "activities": {1704067200000: 3, 1767225600000: 2},
                    },
                    "by_sport": {
                        "distance": {
                            "Run": {1704067200000: 30000, 1767225600000: 40000},
                            "Walk": {1704067200000: 30000, 1767225600000: 50000}
                        },
                        "kudos": {
                            "Run": {1704067200000: 30, 1767225600000: 40},
                            "Walk": {1704067200000: 30, 1767225600000: 50}
                        },
                        "activities": {
                            "Run": {1704067200000: 2, 1767225600000: 1},
                            "Walk": {1704067200000: 1, 1767225600000: 1}
                        }
                    }
                }
            }
        })

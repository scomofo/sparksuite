(function(){
  window.SparkCurriculumV2Data = {
  "version": "2026-04-24",
  "format": "sparksuite-curriculum-v2",
  "principles": {
    "adhd_first": true,
    "session_shell_blocks": [
      "warm_engine",
      "drill",
      "song",
      "cooldown"
    ],
    "make_sound_in_seconds": 5,
    "novelty_cap_per_session": 1,
    "rotate_micro_activities_minutes": "3-5",
    "cumulative_progress_only": true,
    "no_negative_failure_feedback": true
  },
  "tracks": [
    {
      "instrument": "guitar",
      "title": "Guitar 30-Day ADHD-First Track",
      "session_count": 30,
      "sessions": [
        {
          "id": "gtr-d01",
          "instrument": "guitar",
          "day": 1,
          "title": "First sound in 2 minutes",
          "novelty_count": 1,
          "new_elements": [
            "open-string-strum"
          ],
          "prerequisites": [],
          "target_duration_min": 10,
          "focus_song": "\"Horse\" intro, open strings only",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d01-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d01-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d01-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d01-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "gtr-d02",
          "instrument": "guitar",
          "day": 2,
          "title": "How guitars get tuned",
          "novelty_count": 1,
          "new_elements": [
            "use-the-tuner"
          ],
          "prerequisites": [
            "gtr-d01"
          ],
          "target_duration_min": 10,
          "focus_song": "same",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d02-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d02-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d02-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d02-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "gtr-d03",
          "instrument": "guitar",
          "day": 3,
          "title": "The D chord",
          "novelty_count": 1,
          "new_elements": [
            "d-chord-shape"
          ],
          "prerequisites": [
            "gtr-d02"
          ],
          "target_duration_min": 10,
          "focus_song": "1-chord reggae",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d03-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d03-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d03-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d03-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "count",
            "detail": "8 clean",
            "prompt": "Hit the target: 8 clean."
          }
        },
        {
          "id": "gtr-d04",
          "instrument": "guitar",
          "day": 4,
          "title": "D with a drum loop",
          "novelty_count": 1,
          "new_elements": [
            "d-in-rhythm"
          ],
          "prerequisites": [
            "gtr-d03"
          ],
          "target_duration_min": 10,
          "focus_song": "1-chord pop",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d04-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d04-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d04-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d04-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "3 min",
            "prompt": "Stay with it for 3 min."
          }
        },
        {
          "id": "gtr-d05",
          "instrument": "guitar",
          "day": 5,
          "title": "The A chord",
          "novelty_count": 1,
          "new_elements": [
            "a-chord-shape"
          ],
          "prerequisites": [
            "gtr-d04"
          ],
          "target_duration_min": 10,
          "focus_song": "A loop",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d05-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d05-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d05-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d05-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "count",
            "detail": "8 clean",
            "prompt": "Hit the target: 8 clean."
          }
        },
        {
          "id": "gtr-d06",
          "instrument": "guitar",
          "day": 6,
          "title": "D to A, slowly",
          "novelty_count": 1,
          "new_elements": [
            "chord-change"
          ],
          "prerequisites": [
            "gtr-d05"
          ],
          "target_duration_min": 10,
          "focus_song": "D-A-D-A over drums",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d06-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d06-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d06-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d06-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "count",
            "detail": "4 changes",
            "prompt": "Hit the target: 4 changes."
          }
        },
        {
          "id": "gtr-d07",
          "instrument": "guitar",
          "day": 7,
          "title": "The E chord",
          "novelty_count": 1,
          "new_elements": [
            "e-chord-shape"
          ],
          "prerequisites": [
            "gtr-d06"
          ],
          "target_duration_min": 10,
          "focus_song": "E jam",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d07-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d07-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d07-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d07-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "count",
            "detail": "8 clean",
            "prompt": "Hit the target: 8 clean."
          }
        },
        {
          "id": "gtr-d08",
          "instrument": "guitar",
          "day": 8,
          "title": "A-D-E 12-bar blues",
          "novelty_count": 1,
          "new_elements": [
            "3-chord-blues"
          ],
          "prerequisites": [
            "gtr-d07"
          ],
          "target_duration_min": 10,
          "focus_song": "simple blues loop",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d08-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d08-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d08-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d08-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "4 min",
            "prompt": "Stay with it for 4 min."
          }
        },
        {
          "id": "gtr-d09",
          "instrument": "guitar",
          "day": 9,
          "title": "The Em chord",
          "novelty_count": 1,
          "new_elements": [
            "em-shape"
          ],
          "prerequisites": [
            "gtr-d08"
          ],
          "target_duration_min": 10,
          "focus_song": "\"Horse\" full (Em-D6add9)",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d09-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d09-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d09-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d09-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "gtr-d10",
          "instrument": "guitar",
          "day": 10,
          "title": "The Am chord",
          "novelty_count": 1,
          "new_elements": [
            "am-shape"
          ],
          "prerequisites": [
            "gtr-d09"
          ],
          "target_duration_min": 10,
          "focus_song": "\"Stand By Me\" (transposed)",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d10-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d10-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d10-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d10-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "gtr-d11",
          "instrument": "guitar",
          "day": 11,
          "title": "\"Stand By Me\" full",
          "novelty_count": 1,
          "new_elements": [
            "put-it-together"
          ],
          "prerequisites": [
            "gtr-d10"
          ],
          "target_duration_min": 10,
          "focus_song": "full verse loop",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d11-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d11-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d11-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d11-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "gtr-d12",
          "instrument": "guitar",
          "day": 12,
          "title": "Review and free play",
          "novelty_count": 0,
          "new_elements": [],
          "prerequisites": [
            "gtr-d11"
          ],
          "target_duration_min": 10,
          "focus_song": "user picks",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d12-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d12-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d12-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d12-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "gtr-d13",
          "instrument": "guitar",
          "day": 13,
          "title": "Down-down-down-down strum",
          "novelty_count": 1,
          "new_elements": [
            "first-strum-pattern"
          ],
          "prerequisites": [
            "gtr-d12"
          ],
          "target_duration_min": 10,
          "focus_song": "any prior song",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d13-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d13-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d13-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d13-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "3 min",
            "prompt": "Stay with it for 3 min."
          }
        },
        {
          "id": "gtr-d14",
          "instrument": "guitar",
          "day": 14,
          "title": "The and: downs and ups",
          "novelty_count": 1,
          "new_elements": [
            "du-alternation"
          ],
          "prerequisites": [
            "gtr-d13"
          ],
          "target_duration_min": 10,
          "focus_song": "same",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d14-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d14-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d14-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d14-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "3 min",
            "prompt": "Stay with it for 3 min."
          }
        },
        {
          "id": "gtr-d15",
          "instrument": "guitar",
          "day": 15,
          "title": "DDU UDU pattern",
          "novelty_count": 1,
          "new_elements": [
            "classic-strum"
          ],
          "prerequisites": [
            "gtr-d14"
          ],
          "target_duration_min": 10,
          "focus_song": "\"Stand By Me\"",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d15-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d15-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d15-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d15-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "gtr-d16",
          "instrument": "guitar",
          "day": 16,
          "title": "The G chord",
          "novelty_count": 1,
          "new_elements": [
            "g-shape"
          ],
          "prerequisites": [
            "gtr-d15"
          ],
          "target_duration_min": 10,
          "focus_song": "\"Knockin'\" intro",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d16-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d16-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d16-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d16-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "count",
            "detail": "8 clean",
            "prompt": "Hit the target: 8 clean."
          }
        },
        {
          "id": "gtr-d17",
          "instrument": "guitar",
          "day": 17,
          "title": "The C chord",
          "novelty_count": 1,
          "new_elements": [
            "c-shape"
          ],
          "prerequisites": [
            "gtr-d16"
          ],
          "target_duration_min": 10,
          "focus_song": "\"Knockin'\" full (G-D-Am-C)",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d17-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d17-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d17-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d17-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "gtr-d18",
          "instrument": "guitar",
          "day": 18,
          "title": "Review and free play",
          "novelty_count": 0,
          "new_elements": [],
          "prerequisites": [
            "gtr-d17"
          ],
          "target_duration_min": 10,
          "focus_song": "user picks",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d18-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d18-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d18-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d18-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "gtr-d19",
          "instrument": "guitar",
          "day": 19,
          "title": "1-minute changes",
          "novelty_count": 1,
          "new_elements": [
            "chord-change-speed"
          ],
          "prerequisites": [
            "gtr-d18"
          ],
          "target_duration_min": 10,
          "focus_song": "metronome-only",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d19-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d19-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d19-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d19-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "count",
            "detail": "30 in 60s",
            "prompt": "Hit the target: 30 in 60s."
          }
        },
        {
          "id": "gtr-d20",
          "instrument": "guitar",
          "day": 20,
          "title": "The Dm chord",
          "novelty_count": 1,
          "new_elements": [
            "dm-shape"
          ],
          "prerequisites": [
            "gtr-d19"
          ],
          "target_duration_min": 10,
          "focus_song": "\"Mad World\" intro",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d20-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d20-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d20-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d20-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "gtr-d21",
          "instrument": "guitar",
          "day": 21,
          "title": "G to C fast",
          "novelty_count": 1,
          "new_elements": [
            "change-drill"
          ],
          "prerequisites": [
            "gtr-d20"
          ],
          "target_duration_min": 10,
          "focus_song": "song of choice",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d21-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d21-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d21-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d21-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "count",
            "detail": "40 in 60s",
            "prompt": "Hit the target: 40 in 60s."
          }
        },
        {
          "id": "gtr-d22",
          "instrument": "guitar",
          "day": 22,
          "title": "Palm muting",
          "novelty_count": 1,
          "new_elements": [
            "muted-vs-open"
          ],
          "prerequisites": [
            "gtr-d21"
          ],
          "target_duration_min": 10,
          "focus_song": "any prior song",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d22-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d22-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d22-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d22-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "gtr-d23",
          "instrument": "guitar",
          "day": 23,
          "title": "Review and free play",
          "novelty_count": 0,
          "new_elements": [],
          "prerequisites": [
            "gtr-d22"
          ],
          "target_duration_min": 10,
          "focus_song": "user picks",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d23-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d23-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d23-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d23-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "gtr-d24",
          "instrument": "guitar",
          "day": 24,
          "title": "E minor pentatonic pos. 1",
          "novelty_count": 1,
          "new_elements": [
            "first-scale"
          ],
          "prerequisites": [
            "gtr-d23"
          ],
          "target_duration_min": 10,
          "focus_song": "jam over Em loop",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d24-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d24-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d24-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d24-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "3 min",
            "prompt": "Stay with it for 3 min."
          }
        },
        {
          "id": "gtr-d25",
          "instrument": "guitar",
          "day": 25,
          "title": "Noodle over the blues",
          "novelty_count": 1,
          "new_elements": [
            "improvise-with-6-notes"
          ],
          "prerequisites": [
            "gtr-d24"
          ],
          "target_duration_min": 10,
          "focus_song": "A-blues loop",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d25-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d25-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d25-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d25-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "4 min",
            "prompt": "Stay with it for 4 min."
          }
        },
        {
          "id": "gtr-d26",
          "instrument": "guitar",
          "day": 26,
          "title": "The F cheat chord",
          "novelty_count": 1,
          "new_elements": [
            "small-f"
          ],
          "prerequisites": [
            "gtr-d25"
          ],
          "target_duration_min": 10,
          "focus_song": "\"Let It Be\" intro",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d26-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d26-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d26-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d26-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "gtr-d27",
          "instrument": "guitar",
          "day": 27,
          "title": "Dynamics: loud and soft",
          "novelty_count": 1,
          "new_elements": [
            "pick-hand-control"
          ],
          "prerequisites": [
            "gtr-d26"
          ],
          "target_duration_min": 10,
          "focus_song": "prior song",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d27-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d27-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d27-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d27-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "gtr-d28",
          "instrument": "guitar",
          "day": 28,
          "title": "Review and free play",
          "novelty_count": 0,
          "new_elements": [],
          "prerequisites": [
            "gtr-d27"
          ],
          "target_duration_min": 10,
          "focus_song": "user picks",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d28-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d28-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d28-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d28-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "gtr-d29",
          "instrument": "guitar",
          "day": 29,
          "title": "Prep for showcase",
          "novelty_count": 0,
          "new_elements": [],
          "prerequisites": [
            "gtr-d28"
          ],
          "target_duration_min": 10,
          "focus_song": "user's chosen song",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d29-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d29-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d29-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d29-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "gtr-d30",
          "instrument": "guitar",
          "day": 30,
          "title": "Showcase day",
          "novelty_count": 1,
          "new_elements": [
            "record-yourself"
          ],
          "prerequisites": [
            "gtr-d29"
          ],
          "target_duration_min": 10,
          "focus_song": "user's chosen song",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "gtr-d30-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "gtr-d30-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "gtr-d30-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "gtr-d30-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "record_save",
            "prompt": "Record a take you want to keep."
          }
        }
      ]
    },
    {
      "instrument": "bass",
      "title": "Bass 30-Day ADHD-First Track",
      "session_count": 30,
      "sessions": [
        {
          "id": "bass-d01",
          "instrument": "bass",
          "day": 1,
          "title": "Make one note sound good",
          "novelty_count": 1,
          "new_elements": [
            "open-e-pluck"
          ],
          "prerequisites": [],
          "target_duration_min": 10,
          "focus_song": "rock drums at 80 BPM",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d01-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d01-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d01-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d01-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "3 min",
            "prompt": "Stay with it for 3 min."
          }
        },
        {
          "id": "bass-d02",
          "instrument": "bass",
          "day": 2,
          "title": "Tuning the bass",
          "novelty_count": 1,
          "new_elements": [
            "tuner-use"
          ],
          "prerequisites": [
            "bass-d01"
          ],
          "target_duration_min": 10,
          "focus_song": "tuner",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d02-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d02-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d02-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d02-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "bass-d03",
          "instrument": "bass",
          "day": 3,
          "title": "Quarter notes on E",
          "novelty_count": 1,
          "new_elements": [
            "steady-pulse"
          ],
          "prerequisites": [
            "bass-d02"
          ],
          "target_duration_min": 10,
          "focus_song": "drums at 70",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d03-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d03-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d03-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d03-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "3 min",
            "prompt": "Stay with it for 3 min."
          }
        },
        {
          "id": "bass-d04",
          "instrument": "bass",
          "day": 4,
          "title": "Open A too",
          "novelty_count": 1,
          "new_elements": [
            "2-string-pulse"
          ],
          "prerequisites": [
            "bass-d03"
          ],
          "target_duration_min": 10,
          "focus_song": "drums",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d04-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d04-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d04-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d04-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "3 min",
            "prompt": "Stay with it for 3 min."
          }
        },
        {
          "id": "bass-d05",
          "instrument": "bass",
          "day": 5,
          "title": "E-A groove",
          "novelty_count": 1,
          "new_elements": [
            "alternating-two-strings"
          ],
          "prerequisites": [
            "bass-d04"
          ],
          "target_duration_min": 10,
          "focus_song": "rock loop",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d05-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d05-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d05-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d05-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "bass-d06",
          "instrument": "bass",
          "day": 6,
          "title": "Fretting F on the E string",
          "novelty_count": 1,
          "new_elements": [
            "first-fretted-note"
          ],
          "prerequisites": [
            "bass-d05"
          ],
          "target_duration_min": 10,
          "focus_song": "pulse loop",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d06-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d06-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d06-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d06-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "count",
            "detail": "8 clean",
            "prompt": "Hit the target: 8 clean."
          }
        },
        {
          "id": "bass-d07",
          "instrument": "bass",
          "day": 7,
          "title": "\"Seven Nation Army\" riff (simplified)",
          "novelty_count": 1,
          "new_elements": [
            "whole-step-shape"
          ],
          "prerequisites": [
            "bass-d06"
          ],
          "target_duration_min": 10,
          "focus_song": "the song",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d07-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d07-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d07-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d07-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "bass-d08",
          "instrument": "bass",
          "day": 8,
          "title": "Eighth notes",
          "novelty_count": 1,
          "new_elements": [
            "rhythmic-subdivision"
          ],
          "prerequisites": [
            "bass-d07"
          ],
          "target_duration_min": 10,
          "focus_song": "same riff doubled",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d08-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d08-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d08-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d08-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "3 min",
            "prompt": "Stay with it for 3 min."
          }
        },
        {
          "id": "bass-d09",
          "instrument": "bass",
          "day": 9,
          "title": "D and G strings",
          "novelty_count": 1,
          "new_elements": [
            "all-4-strings-open"
          ],
          "prerequisites": [
            "bass-d08"
          ],
          "target_duration_min": 10,
          "focus_song": "4-string pulse",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d09-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d09-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d09-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d09-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "bass-d10",
          "instrument": "bass",
          "day": 10,
          "title": "Walking bassline on opens",
          "novelty_count": 1,
          "new_elements": [
            "moving-pulse"
          ],
          "prerequisites": [
            "bass-d09"
          ],
          "target_duration_min": 10,
          "focus_song": "jazz-ish drum",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d10-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d10-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d10-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d10-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "3 min",
            "prompt": "Stay with it for 3 min."
          }
        },
        {
          "id": "bass-d11",
          "instrument": "bass",
          "day": 11,
          "title": "Review and free play",
          "novelty_count": 0,
          "new_elements": [],
          "prerequisites": [
            "bass-d10"
          ],
          "target_duration_min": 10,
          "focus_song": "user picks",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d11-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d11-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d11-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d11-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "bass-d12",
          "instrument": "bass",
          "day": 12,
          "title": "The moveable anchor",
          "novelty_count": 1,
          "new_elements": [
            "right-hand-floating-thumb"
          ],
          "prerequisites": [
            "bass-d11"
          ],
          "target_duration_min": 10,
          "focus_song": "drills",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d12-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d12-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d12-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d12-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "bass-d13",
          "instrument": "bass",
          "day": 13,
          "title": "\"Come As You Are\" riff",
          "novelty_count": 1,
          "new_elements": [
            "chromatic-run"
          ],
          "prerequisites": [
            "bass-d12"
          ],
          "target_duration_min": 10,
          "focus_song": "the song",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d13-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d13-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d13-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d13-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "bass-d14",
          "instrument": "bass",
          "day": 14,
          "title": "Root-5th shape",
          "novelty_count": 1,
          "new_elements": [
            "interval-shape"
          ],
          "prerequisites": [
            "bass-d13"
          ],
          "target_duration_min": 10,
          "focus_song": "I-V in E",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d14-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d14-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d14-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d14-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "3 min",
            "prompt": "Stay with it for 3 min."
          }
        },
        {
          "id": "bass-d15",
          "instrument": "bass",
          "day": 15,
          "title": "Root-5-octave shape",
          "novelty_count": 1,
          "new_elements": [
            "upper-octave"
          ],
          "prerequisites": [
            "bass-d14"
          ],
          "target_duration_min": 10,
          "focus_song": "12-bar in E",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d15-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d15-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d15-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d15-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "bass-d16",
          "instrument": "bass",
          "day": 16,
          "title": "Minor pentatonic (first 3 notes)",
          "novelty_count": 1,
          "new_elements": [
            "scale-fragment"
          ],
          "prerequisites": [
            "bass-d15"
          ],
          "target_duration_min": 10,
          "focus_song": "E-min vamp",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d16-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d16-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d16-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d16-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "3 min",
            "prompt": "Stay with it for 3 min."
          }
        },
        {
          "id": "bass-d17",
          "instrument": "bass",
          "day": 17,
          "title": "\"Sunshine of Your Love\" intro",
          "novelty_count": 1,
          "new_elements": [
            "pentatonic-in-action"
          ],
          "prerequisites": [
            "bass-d16"
          ],
          "target_duration_min": 10,
          "focus_song": "the song",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d17-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d17-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d17-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d17-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "bass-d18",
          "instrument": "bass",
          "day": 18,
          "title": "Blues scale (6 notes)",
          "novelty_count": 1,
          "new_elements": [
            "added-b5"
          ],
          "prerequisites": [
            "bass-d17"
          ],
          "target_duration_min": 10,
          "focus_song": "12-bar blues",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d18-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d18-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d18-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d18-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "3 min",
            "prompt": "Stay with it for 3 min."
          }
        },
        {
          "id": "bass-d19",
          "instrument": "bass",
          "day": 19,
          "title": "Review and free play",
          "novelty_count": 0,
          "new_elements": [],
          "prerequisites": [
            "bass-d18"
          ],
          "target_duration_min": 10,
          "focus_song": "user picks",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d19-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d19-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d19-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d19-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "bass-d20",
          "instrument": "bass",
          "day": 20,
          "title": "Sliding between notes",
          "novelty_count": 1,
          "new_elements": [
            "legato-lh"
          ],
          "prerequisites": [
            "bass-d19"
          ],
          "target_duration_min": 10,
          "focus_song": "slide drills",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d20-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d20-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d20-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d20-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "bass-d21",
          "instrument": "bass",
          "day": 21,
          "title": "\"Another One Bites the Dust\" riff",
          "novelty_count": 1,
          "new_elements": [
            "iconic-disco"
          ],
          "prerequisites": [
            "bass-d20"
          ],
          "target_duration_min": 10,
          "focus_song": "the song",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d21-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d21-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d21-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d21-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "bass-d22",
          "instrument": "bass",
          "day": 22,
          "title": "Muting with the picking hand",
          "novelty_count": 1,
          "new_elements": [
            "right-hand-mute"
          ],
          "prerequisites": [
            "bass-d21"
          ],
          "target_duration_min": 10,
          "focus_song": "funk loop",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d22-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d22-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d22-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d22-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "3 min",
            "prompt": "Stay with it for 3 min."
          }
        },
        {
          "id": "bass-d23",
          "instrument": "bass",
          "day": 23,
          "title": "Syncopation basics",
          "novelty_count": 1,
          "new_elements": [
            "off-beat-emphasis"
          ],
          "prerequisites": [
            "bass-d22"
          ],
          "target_duration_min": 10,
          "focus_song": "funk groove",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d23-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d23-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d23-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d23-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "3 min",
            "prompt": "Stay with it for 3 min."
          }
        },
        {
          "id": "bass-d24",
          "instrument": "bass",
          "day": 24,
          "title": "Review and free play",
          "novelty_count": 0,
          "new_elements": [],
          "prerequisites": [
            "bass-d23"
          ],
          "target_duration_min": 10,
          "focus_song": "user picks",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d24-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d24-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d24-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d24-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "bass-d25",
          "instrument": "bass",
          "day": 25,
          "title": "Ghost notes",
          "novelty_count": 1,
          "new_elements": [
            "percussive-mute"
          ],
          "prerequisites": [
            "bass-d24"
          ],
          "target_duration_min": 10,
          "focus_song": "funk",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d25-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d25-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d25-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d25-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "bass-d26",
          "instrument": "bass",
          "day": 26,
          "title": "Root motion over changes",
          "novelty_count": 1,
          "new_elements": [
            "following-chords"
          ],
          "prerequisites": [
            "bass-d25"
          ],
          "target_duration_min": 10,
          "focus_song": "I-IV-V in A",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d26-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d26-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d26-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d26-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "4 min",
            "prompt": "Stay with it for 4 min."
          }
        },
        {
          "id": "bass-d27",
          "instrument": "bass",
          "day": 27,
          "title": "Improvising over a vamp",
          "novelty_count": 1,
          "new_elements": [
            "mix-pentatonic-and-groove"
          ],
          "prerequisites": [
            "bass-d26"
          ],
          "target_duration_min": 10,
          "focus_song": "E-min vamp",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d27-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d27-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d27-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d27-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "4 min",
            "prompt": "Stay with it for 4 min."
          }
        },
        {
          "id": "bass-d28",
          "instrument": "bass",
          "day": 28,
          "title": "Review and free play",
          "novelty_count": 0,
          "new_elements": [],
          "prerequisites": [
            "bass-d27"
          ],
          "target_duration_min": 10,
          "focus_song": "user picks",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d28-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d28-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d28-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d28-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "bass-d29",
          "instrument": "bass",
          "day": 29,
          "title": "Showcase prep",
          "novelty_count": 0,
          "new_elements": [],
          "prerequisites": [
            "bass-d28"
          ],
          "target_duration_min": 10,
          "focus_song": "user's song",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d29-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d29-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d29-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d29-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "bass-d30",
          "instrument": "bass",
          "day": 30,
          "title": "Showcase day",
          "novelty_count": 1,
          "new_elements": [
            "record-yourself"
          ],
          "prerequisites": [
            "bass-d29"
          ],
          "target_duration_min": 10,
          "focus_song": "user's song",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "bass-d30-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "bass-d30-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "bass-d30-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "bass-d30-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "record_save",
            "prompt": "Record a take you want to keep."
          }
        }
      ]
    },
    {
      "instrument": "piano",
      "title": "Piano 30-Day ADHD-First Track",
      "session_count": 30,
      "sessions": [
        {
          "id": "pno-d01",
          "instrument": "piano",
          "day": 1,
          "title": "Find middle C",
          "novelty_count": 1,
          "new_elements": [
            "keyboard-geography"
          ],
          "prerequisites": [],
          "target_duration_min": 10,
          "focus_song": "C 5-finger RH",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d01-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d01-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d01-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d01-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "pno-d02",
          "instrument": "piano",
          "day": 2,
          "title": "\"Ode to Joy\" (first 4 bars, RH)",
          "novelty_count": 1,
          "new_elements": [
            "rh-melody"
          ],
          "prerequisites": [
            "pno-d01"
          ],
          "target_duration_min": 10,
          "focus_song": "Ode intro",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d02-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d02-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d02-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d02-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "pno-d03",
          "instrument": "piano",
          "day": 3,
          "title": "Quarter, half, whole",
          "novelty_count": 1,
          "new_elements": [
            "note-durations"
          ],
          "prerequisites": [
            "pno-d02"
          ],
          "target_duration_min": 10,
          "focus_song": "same, with rhythm",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d03-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d03-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d03-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d03-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "3 min",
            "prompt": "Stay with it for 3 min."
          }
        },
        {
          "id": "pno-d04",
          "instrument": "piano",
          "day": 4,
          "title": "LH 5-finger in C",
          "novelty_count": 1,
          "new_elements": [
            "left-hand-alone"
          ],
          "prerequisites": [
            "pno-d03"
          ],
          "target_duration_min": 10,
          "focus_song": "C-position LH",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d04-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d04-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d04-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d04-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "pno-d05",
          "instrument": "piano",
          "day": 5,
          "title": "\"Ode to Joy\" hands-together",
          "novelty_count": 1,
          "new_elements": [
            "coordinating-hands"
          ],
          "prerequisites": [
            "pno-d04"
          ],
          "target_duration_min": 10,
          "focus_song": "Ode full A-section",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d05-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d05-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d05-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d05-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "pno-d06",
          "instrument": "piano",
          "day": 6,
          "title": "Review and free play",
          "novelty_count": 0,
          "new_elements": [],
          "prerequisites": [
            "pno-d05"
          ],
          "target_duration_min": 10,
          "focus_song": "user picks",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d06-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d06-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d06-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d06-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "pno-d07",
          "instrument": "piano",
          "day": 7,
          "title": "C-major triad (RH)",
          "novelty_count": 1,
          "new_elements": [
            "chord-shape"
          ],
          "prerequisites": [
            "pno-d06"
          ],
          "target_duration_min": 10,
          "focus_song": "C as a triad",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d07-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d07-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d07-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d07-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "pno-d08",
          "instrument": "piano",
          "day": 8,
          "title": "\"Amazing Grace\" RH melody",
          "novelty_count": 1,
          "new_elements": [
            "new-melody"
          ],
          "prerequisites": [
            "pno-d07"
          ],
          "target_duration_min": 10,
          "focus_song": "Amazing Grace A",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d08-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d08-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d08-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d08-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "pno-d09",
          "instrument": "piano",
          "day": 9,
          "title": "F-major triad (RH)",
          "novelty_count": 1,
          "new_elements": [
            "second-chord"
          ],
          "prerequisites": [
            "pno-d08"
          ],
          "target_duration_min": 10,
          "focus_song": "C to F switching",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d09-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d09-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d09-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d09-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "count",
            "detail": "4 changes",
            "prompt": "Hit the target: 4 changes."
          }
        },
        {
          "id": "pno-d10",
          "instrument": "piano",
          "day": 10,
          "title": "G7 chord (RH)",
          "novelty_count": 1,
          "new_elements": [
            "4-note-chord"
          ],
          "prerequisites": [
            "pno-d09"
          ],
          "target_duration_min": 10,
          "focus_song": "C-F-G7 loop",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d10-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d10-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d10-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d10-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "pno-d11",
          "instrument": "piano",
          "day": 11,
          "title": "I-IV-V7 in C",
          "novelty_count": 1,
          "new_elements": [
            "full-progression"
          ],
          "prerequisites": [
            "pno-d10"
          ],
          "target_duration_min": 10,
          "focus_song": "over drum loop",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d11-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d11-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d11-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d11-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "4 min",
            "prompt": "Stay with it for 4 min."
          }
        },
        {
          "id": "pno-d12",
          "instrument": "piano",
          "day": 12,
          "title": "Review and free play",
          "novelty_count": 0,
          "new_elements": [],
          "prerequisites": [
            "pno-d11"
          ],
          "target_duration_min": 10,
          "focus_song": "user picks",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d12-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d12-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d12-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d12-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "pno-d13",
          "instrument": "piano",
          "day": 13,
          "title": "LH root-notes under chords",
          "novelty_count": 1,
          "new_elements": [
            "bass-with-chords"
          ],
          "prerequisites": [
            "pno-d12"
          ],
          "target_duration_min": 10,
          "focus_song": "same progression",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d13-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d13-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d13-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d13-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "pno-d14",
          "instrument": "piano",
          "day": 14,
          "title": "Broken-chord LH pattern",
          "novelty_count": 1,
          "new_elements": [
            "alberti-lite"
          ],
          "prerequisites": [
            "pno-d13"
          ],
          "target_duration_min": 10,
          "focus_song": "\"Let It Be\" intro",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d14-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d14-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d14-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d14-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "pno-d15",
          "instrument": "piano",
          "day": 15,
          "title": "\"Let It Be\" full intro",
          "novelty_count": 1,
          "new_elements": [
            "application"
          ],
          "prerequisites": [
            "pno-d14"
          ],
          "target_duration_min": 10,
          "focus_song": "LB intro",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d15-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d15-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d15-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d15-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "pno-d16",
          "instrument": "piano",
          "day": 16,
          "title": "F sharp and the black keys",
          "novelty_count": 1,
          "new_elements": [
            "first-accidental"
          ],
          "prerequisites": [
            "pno-d15"
          ],
          "target_duration_min": 10,
          "focus_song": "G 5-finger position",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d16-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d16-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d16-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d16-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "pno-d17",
          "instrument": "piano",
          "day": 17,
          "title": "Moving to G position",
          "novelty_count": 1,
          "new_elements": [
            "key-change"
          ],
          "prerequisites": [
            "pno-d16"
          ],
          "target_duration_min": 10,
          "focus_song": "G I-IV-V7",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d17-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d17-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d17-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d17-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "pno-d18",
          "instrument": "piano",
          "day": 18,
          "title": "Review and free play",
          "novelty_count": 0,
          "new_elements": [],
          "prerequisites": [
            "pno-d17"
          ],
          "target_duration_min": 10,
          "focus_song": "user picks",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d18-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d18-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d18-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d18-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "pno-d19",
          "instrument": "piano",
          "day": 19,
          "title": "Reading treble clef",
          "novelty_count": 1,
          "new_elements": [
            "staff-reading-intro"
          ],
          "prerequisites": [
            "pno-d18"
          ],
          "target_duration_min": 10,
          "focus_song": "sight-read 4 bars",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d19-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d19-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d19-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d19-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "4 min",
            "prompt": "Stay with it for 4 min."
          }
        },
        {
          "id": "pno-d20",
          "instrument": "piano",
          "day": 20,
          "title": "Reading bass clef",
          "novelty_count": 1,
          "new_elements": [
            "lh-staff"
          ],
          "prerequisites": [
            "pno-d19"
          ],
          "target_duration_min": 10,
          "focus_song": "sight-read 4 bars",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d20-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d20-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d20-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d20-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "4 min",
            "prompt": "Stay with it for 4 min."
          }
        },
        {
          "id": "pno-d21",
          "instrument": "piano",
          "day": 21,
          "title": "\"Imagine\" intro (RH)",
          "novelty_count": 1,
          "new_elements": [
            "classic-pop"
          ],
          "prerequisites": [
            "pno-d20"
          ],
          "target_duration_min": 10,
          "focus_song": "Imagine intro",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d21-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d21-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d21-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d21-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "pno-d22",
          "instrument": "piano",
          "day": 22,
          "title": "\"Imagine\" hands-together",
          "novelty_count": 1,
          "new_elements": [
            "application"
          ],
          "prerequisites": [
            "pno-d21"
          ],
          "target_duration_min": 10,
          "focus_song": "same, H-T",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d22-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d22-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d22-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d22-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "pno-d23",
          "instrument": "piano",
          "day": 23,
          "title": "Review and free play",
          "novelty_count": 0,
          "new_elements": [],
          "prerequisites": [
            "pno-d22"
          ],
          "target_duration_min": 10,
          "focus_song": "user picks",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d23-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d23-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d23-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d23-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "pno-d24",
          "instrument": "piano",
          "day": 24,
          "title": "Dotted quarter-eighth",
          "novelty_count": 1,
          "new_elements": [
            "new-rhythm"
          ],
          "prerequisites": [
            "pno-d23"
          ],
          "target_duration_min": 10,
          "focus_song": "apply to known piece",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d24-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d24-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d24-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d24-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "pno-d25",
          "instrument": "piano",
          "day": 25,
          "title": "Inversions of C and F",
          "novelty_count": 1,
          "new_elements": [
            "voice-leading"
          ],
          "prerequisites": [
            "pno-d24"
          ],
          "target_duration_min": 10,
          "focus_song": "smoother progression",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d25-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d25-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d25-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d25-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "pno-d26",
          "instrument": "piano",
          "day": 26,
          "title": "Dynamics",
          "novelty_count": 1,
          "new_elements": [
            "piano-vs-forte"
          ],
          "prerequisites": [
            "pno-d25"
          ],
          "target_duration_min": 10,
          "focus_song": "apply to Ode or LB",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d26-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d26-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d26-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d26-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "pno-d27",
          "instrument": "piano",
          "day": 27,
          "title": "Pedaling (sustain)",
          "novelty_count": 1,
          "new_elements": [
            "right-foot-intro"
          ],
          "prerequisites": [
            "pno-d26"
          ],
          "target_duration_min": 10,
          "focus_song": "apply to Imagine",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d27-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d27-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d27-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d27-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "pno-d28",
          "instrument": "piano",
          "day": 28,
          "title": "Review and free play",
          "novelty_count": 0,
          "new_elements": [],
          "prerequisites": [
            "pno-d27"
          ],
          "target_duration_min": 10,
          "focus_song": "user picks",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d28-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d28-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d28-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d28-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "pno-d29",
          "instrument": "piano",
          "day": 29,
          "title": "Showcase prep",
          "novelty_count": 0,
          "new_elements": [],
          "prerequisites": [
            "pno-d28"
          ],
          "target_duration_min": 10,
          "focus_song": "user's piece",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d29-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d29-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d29-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d29-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "pno-d30",
          "instrument": "piano",
          "day": 30,
          "title": "Showcase day",
          "novelty_count": 1,
          "new_elements": [
            "record-yourself"
          ],
          "prerequisites": [
            "pno-d29"
          ],
          "target_duration_min": 10,
          "focus_song": "user's piece",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "pno-d30-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "pno-d30-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "pno-d30-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "pno-d30-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "record_save",
            "prompt": "Record a take you want to keep."
          }
        }
      ]
    },
    {
      "instrument": "ukulele",
      "title": "Ukulele 30-Day ADHD-First Track",
      "session_count": 30,
      "sessions": [
        {
          "id": "uke-d01",
          "instrument": "ukulele",
          "day": 1,
          "title": "First strum",
          "novelty_count": 1,
          "new_elements": [
            "open-string-downstrum"
          ],
          "prerequisites": [],
          "target_duration_min": 10,
          "focus_song": "freeplay over reggae loop",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d01-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d01-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d01-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d01-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "uke-d02",
          "instrument": "ukulele",
          "day": 2,
          "title": "Tuning the uke",
          "novelty_count": 1,
          "new_elements": [
            "tuner-use"
          ],
          "prerequisites": [
            "uke-d01"
          ],
          "target_duration_min": 10,
          "focus_song": "tuner",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d02-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d02-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d02-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d02-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "uke-d03",
          "instrument": "ukulele",
          "day": 3,
          "title": "The C chord",
          "novelty_count": 1,
          "new_elements": [
            "one-finger-chord"
          ],
          "prerequisites": [
            "uke-d02"
          ],
          "target_duration_min": 10,
          "focus_song": "\"Three Little Birds\" chorus",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d03-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d03-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d03-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d03-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "count",
            "detail": "8 clean",
            "prompt": "Hit the target: 8 clean."
          }
        },
        {
          "id": "uke-d04",
          "instrument": "ukulele",
          "day": 4,
          "title": "C with a reggae loop",
          "novelty_count": 1,
          "new_elements": [
            "c-in-rhythm"
          ],
          "prerequisites": [
            "uke-d03"
          ],
          "target_duration_min": 10,
          "focus_song": "reggae at 90",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d04-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d04-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d04-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d04-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "3 min",
            "prompt": "Stay with it for 3 min."
          }
        },
        {
          "id": "uke-d05",
          "instrument": "ukulele",
          "day": 5,
          "title": "The Am chord",
          "novelty_count": 1,
          "new_elements": [
            "two-finger-chord"
          ],
          "prerequisites": [
            "uke-d04"
          ],
          "target_duration_min": 10,
          "focus_song": "C to Am drill",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d05-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d05-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d05-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d05-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "count",
            "detail": "4 changes",
            "prompt": "Hit the target: 4 changes."
          }
        },
        {
          "id": "uke-d06",
          "instrument": "ukulele",
          "day": 6,
          "title": "The F chord",
          "novelty_count": 1,
          "new_elements": [
            "two-finger-chord"
          ],
          "prerequisites": [
            "uke-d05"
          ],
          "target_duration_min": 10,
          "focus_song": "C-Am-F loop",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d06-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d06-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d06-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d06-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "count",
            "detail": "8 clean",
            "prompt": "Hit the target: 8 clean."
          }
        },
        {
          "id": "uke-d07",
          "instrument": "ukulele",
          "day": 7,
          "title": "\"I'm Yours\" simplified",
          "novelty_count": 1,
          "new_elements": [
            "c-am-f"
          ],
          "prerequisites": [
            "uke-d06"
          ],
          "target_duration_min": 10,
          "focus_song": "the song",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d07-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d07-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d07-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d07-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "uke-d08",
          "instrument": "ukulele",
          "day": 8,
          "title": "The G7 chord",
          "novelty_count": 1,
          "new_elements": [
            "three-finger"
          ],
          "prerequisites": [
            "uke-d07"
          ],
          "target_duration_min": 10,
          "focus_song": "C-Am-F-G7",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d08-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d08-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d08-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d08-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "count",
            "detail": "8 clean",
            "prompt": "Hit the target: 8 clean."
          }
        },
        {
          "id": "uke-d09",
          "instrument": "ukulele",
          "day": 9,
          "title": "\"Stand By Me\" on uke",
          "novelty_count": 1,
          "new_elements": [
            "full-c-am-f-g7"
          ],
          "prerequisites": [
            "uke-d08"
          ],
          "target_duration_min": 10,
          "focus_song": "the song",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d09-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d09-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d09-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d09-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "uke-d10",
          "instrument": "ukulele",
          "day": 10,
          "title": "Review and free play",
          "novelty_count": 0,
          "new_elements": [],
          "prerequisites": [
            "uke-d09"
          ],
          "target_duration_min": 10,
          "focus_song": "user picks",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d10-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d10-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d10-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d10-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "uke-d11",
          "instrument": "ukulele",
          "day": 11,
          "title": "Island strum (D-DU-UDU)",
          "novelty_count": 1,
          "new_elements": [
            "strum-pattern"
          ],
          "prerequisites": [
            "uke-d10"
          ],
          "target_duration_min": 10,
          "focus_song": "\"Stand By Me\"",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d11-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d11-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d11-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d11-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "uke-d12",
          "instrument": "ukulele",
          "day": 12,
          "title": "The G chord",
          "novelty_count": 1,
          "new_elements": [
            "three-finger-triangle"
          ],
          "prerequisites": [
            "uke-d11"
          ],
          "target_duration_min": 10,
          "focus_song": "\"You Are My Sunshine\"",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d12-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d12-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d12-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d12-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "count",
            "detail": "8 clean",
            "prompt": "Hit the target: 8 clean."
          }
        },
        {
          "id": "uke-d13",
          "instrument": "ukulele",
          "day": 13,
          "title": "\"Sunshine\" on uke",
          "novelty_count": 1,
          "new_elements": [
            "c-f-g"
          ],
          "prerequisites": [
            "uke-d12"
          ],
          "target_duration_min": 10,
          "focus_song": "the song",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d13-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d13-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d13-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d13-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "uke-d14",
          "instrument": "ukulele",
          "day": 14,
          "title": "The Em chord",
          "novelty_count": 1,
          "new_elements": [
            "two-finger"
          ],
          "prerequisites": [
            "uke-d13"
          ],
          "target_duration_min": 10,
          "focus_song": "\"Riptide\" intro",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d14-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d14-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d14-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d14-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "uke-d15",
          "instrument": "ukulele",
          "day": 15,
          "title": "\"Riptide\" simplified",
          "novelty_count": 1,
          "new_elements": [
            "am-g-c-f"
          ],
          "prerequisites": [
            "uke-d14"
          ],
          "target_duration_min": 10,
          "focus_song": "the song",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d15-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d15-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d15-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d15-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "uke-d16",
          "instrument": "ukulele",
          "day": 16,
          "title": "The D chord",
          "novelty_count": 1,
          "new_elements": [
            "two-finger-on-2nd-fret"
          ],
          "prerequisites": [
            "uke-d15"
          ],
          "target_duration_min": 10,
          "focus_song": "D-Em-G switching",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d16-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d16-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d16-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d16-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "count",
            "detail": "4 changes",
            "prompt": "Hit the target: 4 changes."
          }
        },
        {
          "id": "uke-d17",
          "instrument": "ukulele",
          "day": 17,
          "title": "D7 chord",
          "novelty_count": 1,
          "new_elements": [
            "variant"
          ],
          "prerequisites": [
            "uke-d16"
          ],
          "target_duration_min": 10,
          "focus_song": "Key-of-G song",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d17-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d17-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d17-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d17-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "uke-d18",
          "instrument": "ukulele",
          "day": 18,
          "title": "Review and free play",
          "novelty_count": 0,
          "new_elements": [],
          "prerequisites": [
            "uke-d17"
          ],
          "target_duration_min": 10,
          "focus_song": "user picks",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d18-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d18-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d18-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d18-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "uke-d19",
          "instrument": "ukulele",
          "day": 19,
          "title": "1-minute changes",
          "novelty_count": 1,
          "new_elements": [
            "chord-change-speed"
          ],
          "prerequisites": [
            "uke-d18"
          ],
          "target_duration_min": 10,
          "focus_song": "metronome",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d19-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d19-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d19-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d19-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "count",
            "detail": "40 in 60s",
            "prompt": "Hit the target: 40 in 60s."
          }
        },
        {
          "id": "uke-d20",
          "instrument": "ukulele",
          "day": 20,
          "title": "Reggae chuck",
          "novelty_count": 1,
          "new_elements": [
            "muted-upstroke"
          ],
          "prerequisites": [
            "uke-d19"
          ],
          "target_duration_min": 10,
          "focus_song": "\"Three Little Birds\" full",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d20-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d20-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d20-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d20-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "uke-d21",
          "instrument": "ukulele",
          "day": 21,
          "title": "\"Three Little Birds\" full",
          "novelty_count": 1,
          "new_elements": [
            "application"
          ],
          "prerequisites": [
            "uke-d20"
          ],
          "target_duration_min": 10,
          "focus_song": "the song",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d21-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d21-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d21-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d21-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "uke-d22",
          "instrument": "ukulele",
          "day": 22,
          "title": "The A7 chord",
          "novelty_count": 1,
          "new_elements": [
            "useful-dominant"
          ],
          "prerequisites": [
            "uke-d21"
          ],
          "target_duration_min": 10,
          "focus_song": "in context",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d22-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d22-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d22-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d22-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "uke-d23",
          "instrument": "ukulele",
          "day": 23,
          "title": "Review and free play",
          "novelty_count": 0,
          "new_elements": [],
          "prerequisites": [
            "uke-d22"
          ],
          "target_duration_min": 10,
          "focus_song": "user picks",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d23-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d23-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d23-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d23-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "uke-d24",
          "instrument": "ukulele",
          "day": 24,
          "title": "The C7 chord",
          "novelty_count": 1,
          "new_elements": [
            "dominant-variant"
          ],
          "prerequisites": [
            "uke-d23"
          ],
          "target_duration_min": 10,
          "focus_song": "blues-ish vamp",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d24-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d24-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d24-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d24-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "uke-d25",
          "instrument": "ukulele",
          "day": 25,
          "title": "Basic 12-bar blues (C7-F7-G7)",
          "novelty_count": 1,
          "new_elements": [
            "form"
          ],
          "prerequisites": [
            "uke-d24"
          ],
          "target_duration_min": 10,
          "focus_song": "blues loop",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d25-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d25-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d25-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d25-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "4 min",
            "prompt": "Stay with it for 4 min."
          }
        },
        {
          "id": "uke-d26",
          "instrument": "ukulele",
          "day": 26,
          "title": "Fingerpicking: thumb and index",
          "novelty_count": 1,
          "new_elements": [
            "rh-pattern"
          ],
          "prerequisites": [
            "uke-d25"
          ],
          "target_duration_min": 10,
          "focus_song": "C arpeggio",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d26-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d26-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d26-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d26-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "timed",
            "detail": "3 min",
            "prompt": "Stay with it for 3 min."
          }
        },
        {
          "id": "uke-d27",
          "instrument": "ukulele",
          "day": 27,
          "title": "Fingerpicking 4-pattern",
          "novelty_count": 1,
          "new_elements": [
            "classic-pluck"
          ],
          "prerequisites": [
            "uke-d26"
          ],
          "target_duration_min": 10,
          "focus_song": "\"Over the Rainbow\" intro",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d27-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d27-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d27-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d27-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "uke-d28",
          "instrument": "ukulele",
          "day": 28,
          "title": "Review and free play",
          "novelty_count": 0,
          "new_elements": [],
          "prerequisites": [
            "uke-d27"
          ],
          "target_duration_min": 10,
          "focus_song": "user picks",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d28-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d28-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d28-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d28-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "uke-d29",
          "instrument": "ukulele",
          "day": 29,
          "title": "Showcase prep",
          "novelty_count": 0,
          "new_elements": [],
          "prerequisites": [
            "uke-d28"
          ],
          "target_duration_min": 10,
          "focus_song": "user's song",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d29-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d29-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d29-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d29-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "self_report",
            "prompt": "Did this feel playable today?"
          }
        },
        {
          "id": "uke-d30",
          "instrument": "ukulele",
          "day": 30,
          "title": "Showcase day",
          "novelty_count": 1,
          "new_elements": [
            "record-yourself"
          ],
          "prerequisites": [
            "uke-d29"
          ],
          "target_duration_min": 10,
          "focus_song": "user's song",
          "blocks": [
            {
              "type": "warm_engine",
              "activity_id": "uke-d30-warm_engine",
              "duration_sec": 90
            },
            {
              "type": "drill",
              "activity_id": "uke-d30-drill",
              "duration_sec": 180
            },
            {
              "type": "song",
              "activity_id": "uke-d30-song",
              "duration_sec": 240
            },
            {
              "type": "cooldown",
              "activity_id": "uke-d30-cooldown",
              "duration_sec": 90
            }
          ],
          "completion_criteria": {
            "type": "record_save",
            "prompt": "Record a take you want to keep."
          }
        }
      ]
    }
  ]
};
})();

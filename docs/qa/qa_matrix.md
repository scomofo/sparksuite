# SparkSuite QA Matrix

## Platforms
| Platform | Required? | Notes |
|---|---:|---|
| Chrome | Yes | Browser dev baseline |
| Edge | Yes | Windows browser sanity |
| Safari | Optional | Only if browser support is claimed |
| Windows desktop | Yes | Tauri packaged build |
| macOS desktop | If available | Tauri packaged build |
| Linux desktop | Optional | Only if supported |

## Instruments
| Instrument | Session start | Exercise complete | Session complete | Save progress | Notes |
|---|---:|---:|---:|---:|---|
| Guitar | Required | Required | Required | Required | Primary baseline |
| Piano | If enabled | If enabled | If enabled | If enabled | Use piano renderer/capabilities |
| Bass | If enabled | If enabled | If enabled | If enabled | String count differs |
| Ukulele | If enabled | If enabled | If enabled | If enabled | Four-string modularity check |

## Input Modes
| Input | Required? | Checks |
|---|---:|---|
| Keyboard | Yes | lane mapping, timing, remap if available |
| Mouse | If supported | click/tap input accuracy |
| MIDI | If supported | permission, note mapping, disconnect recovery |

## Core Flows
| Flow | Required? |
|---|---:|
| Select instrument | Yes |
| Start session | Yes |
| Render first segment | Yes |
| Start exercise | Yes |
| Hit note | Yes |
| Miss note | Yes |
| Complete exercise | Yes |
| Complete session | Yes |
| Update mastery | Yes |
| Award XP/reward | If implemented |
| Restart session | Yes |
| Fail/retry exercise | Yes |
| Load migrated save | Yes |
| Export debug bundle | Yes |
| Export/import user data | Yes |

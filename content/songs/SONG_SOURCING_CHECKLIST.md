# Song Sourcing Checklist

Static sources used for this inventory:

- `content/songs/index.json`
- `js/instruments/piano/data.js`
- `js/instruments/bass/data.js`
- `js/sparksuite/instruments/ukulele/ukulele_module.js`

Notes:

- This excludes community songs because they are dynamic.
- "Needs tabs/chart work" means the app does not currently have a clear authored chart/tab source for the song in its static catalog.
- Piano entries are included as repertoire targets even though they are not "tabs" in the guitar sense.

## Shared Main Library

- Achy Breaky Heart — Billy Ray Cyrus
- Another One Bites the Dust — Queen
- Bad Moon Rising — CCR
- Billie Jean — Michael Jackson
- Boom Boom — John Lee Hooker
- Brown Eyed Girl — Van Morrison
- Chain of Fools — Aretha Franklin
- Come As You Are — Nirvana
- Come Together — The Beatles
- Creep — Radiohead
- Eleanor Rigby — The Beatles
- Feel Good Inc — Gorillaz
- Get the Party Started — Pink
- Get Up Stand Up — Bob Marley
- Have You Ever Seen the Rain — CCR
- Higher Ground — Stevie Wonder
- Hotel California — Eagles
- Hysteria — Muse
- Jambalaya — Hank Williams
- Knockin' on Heaven's Door — Bob Dylan
- La Bamba — Ritchie Valens
- Let It Be — The Beatles
- Longview — Green Day
- Love Me Do — The Beatles
- Money — Pink Floyd
- Moves Like Jagger — Maroon 5
- Music — Madonna
- Peter Gunn — Henry Mancini
- Pumped Up Kicks — Foster the People
- Royals — Lorde
- Run Through the Jungle — CCR
- Seven Nation Army — The White Stripes
- Smells Like Teen Spirit — Nirvana
- Stand By Me — Ben E. King
- Sunshine of Your Love — Cream
- Sweet Child O' Mine — Guns N' Roses
- Tears in Heaven — Eric Clapton
- Three Little Birds — Bob Marley
- Tomorrow Never Knows — The Beatles
- Under Pressure — Queen & David Bowie
- What I Got — Sublime
- Whole Lotta Love — Led Zeppelin
- Wish You Were Here — Pink Floyd
- With or Without You — U2
- Wonderful Tonight — Eric Clapton
- Zombie — The Cranberries

## Piano Repertoire

- Row Row Row Your Boat — Traditional
- Twinkle Twinkle — Traditional
- Happy Birthday — Traditional
- La Bamba — Ritchie Valens
- Let It Be — The Beatles
- Stand By Me — Ben E. King
- All of Me — John Legend
- Hallelujah — Leonard Cohen
- Autumn Leaves — Jazz Standard
- Piano Man — Billy Joel
- Wonderwall — Oasis
- Country Roads — John Denver
- Perfect — Ed Sheeran
- Someone Like You — Adele
- Lean on Me — Bill Withers
- Can't Help Falling in Love — Elvis Presley
- Viva la Vida — Coldplay
- Stay With Me — Sam Smith
- Skinny Love — Bon Iver
- Imagine — John Lennon
- Fly Me to the Moon — Frank Sinatra
- Clocks — Coldplay
- Bohemian Rhapsody — Queen
- Moonlight Sonata — Beethoven
- Prelude in C — Johann Sebastian Bach
- River Flows in You — Yiruma
- 12-Bar Blues — Traditional
- Knockin' on Heaven's Door — Bob Dylan

## Bass Repertoire

- Seven Nation Army — White Stripes
- Another One Bites The Dust — Queen
- Sunshine Of Your Love — Cream
- Billie Jean — Michael Jackson
- Stand By Me — Ben E. King
- Come Together — The Beatles
- With Or Without You — U2
- Feel Good Inc — Gorillaz
- Pumped Up Kicks — Foster The People
- Zombie — The Cranberries
- Longview — Green Day
- Under Pressure — Queen & Bowie
- Sweet Child O Mine — GNR
- Smells Like Teen Spirit — Nirvana
- Money — Pink Floyd
- Hysteria — Muse
- Higher Ground — RHCP
- Superstition — Stevie Wonder
- Come As You Are — Nirvana
- Under Pressure — Queen & David Bowie
- Money — Pink Floyd
- Schism — Tool
- YYZ — Rush
- My Generation — The Who
- Longview — Green Day

## Ukulele Repertoire

- Island Loop — SparkSuite
- Sunset Switches — SparkSuite
- Palm Arpeggio — SparkSuite
- Moonlit Picking — SparkSuite
- Somewhere Over the Rainbow — IZ
- Riptide — Vance Joy
- I'm Yours — Jason Mraz
- Hey Soul Sister — Train
- Can't Help Falling in Love — Elvis
- Count on Me — Bruno Mars
- Lava — Disney
- Stand By Me — Ben E. King

## Needs Tabs / Chart Work

### Shared Songs With MIDI But No `chartId`

- Come Together — The Beatles
- With or Without You — U2
- Billie Jean — Michael Jackson
- Sunshine of Your Love — Cream
- Another One Bites the Dust — Queen
- Seven Nation Army — The White Stripes
- Under Pressure — Queen & David Bowie
- Longview — Green Day
- Zombie — The Cranberries
- Pumped Up Kicks — Foster the People
- Feel Good Inc — Gorillaz
- Higher Ground — Stevie Wonder
- Come As You Are — Nirvana
- Hysteria — Muse
- Money — Pink Floyd
- Smells Like Teen Spirit — Nirvana
- Sweet Child O' Mine — Guns N' Roses

### Bass Songs Missing Clear Authored Tab/Chart Sources

- Superstition — Stevie Wonder
- Schism — Tool
- YYZ — Rush
- My Generation — The Who

### Bass Catalog Entries To Normalize

- Under Pressure — duplicate variants
- Money — duplicate variants
- Longview — duplicate variants

### Ukulele Songs That Still Need Uke-Specific Tab/Chart Assets

- Island Loop — SparkSuite
- Sunset Switches — SparkSuite
- Palm Arpeggio — SparkSuite
- Moonlit Picking — SparkSuite
- Somewhere Over the Rainbow — IZ
- Riptide — Vance Joy
- I'm Yours — Jason Mraz
- Hey Soul Sister — Train
- Can't Help Falling in Love — Elvis
- Count on Me — Bruno Mars
- Lava — Disney
- Stand By Me — Ben E. King

### Piano Songs That Still Need Authored Arrangement Assets

- Row Row Row Your Boat — Traditional
- Twinkle Twinkle — Traditional
- Happy Birthday — Traditional
- All of Me — John Legend
- Hallelujah — Leonard Cohen
- Autumn Leaves — Jazz Standard
- Piano Man — Billy Joel
- Wonderwall — Oasis
- Country Roads — John Denver
- Perfect — Ed Sheeran
- Someone Like You — Adele
- Lean on Me — Bill Withers
- Can't Help Falling in Love — Elvis Presley
- Viva la Vida — Coldplay
- Stay With Me — Sam Smith
- Skinny Love — Bon Iver
- Imagine — John Lennon
- Fly Me to the Moon — Frank Sinatra
- Clocks — Coldplay
- Bohemian Rhapsody — Queen
- Moonlight Sonata — Beethoven
- Prelude in C — Johann Sebastian Bach
- River Flows in You — Yiruma
- 12-Bar Blues — Traditional

## Suggested Priority Order

1. Shared songs with MIDI but no `chartId`
2. Ukulele songs needing uke-specific tabs/charts
3. Bass-only unfinished songs: `Superstition`, `Schism`, `YYZ`, `My Generation`
4. Piano authored arrangement assets

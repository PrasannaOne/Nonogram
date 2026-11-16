# Device QA still required after v42

## Not yet verified on physical hardware
- Android Chrome tap accuracy and drag continuity on a 12x12 Hard board.
- 320px and 360px portrait clue readability with actual generated high-clue boards.
- Landscape layout on narrow Android devices and tablets.
- Dynamic browser chrome/address-bar resize and split-screen behaviour.
- PWA Add to Home Screen, standalone orientation, offline relaunch and cache update.
- Screen-reader announcements and enlarged system font settings.

## Quick manual test
1. Open the deployed preview on Android Chrome.
2. Select Hard and confirm a 12x12 puzzle appears.
3. Fill and cross cells by tap and drag, including near the board edges.
4. Rotate to landscape and back; verify clues remain aligned and no controls overlap.
5. Switch Easy -> Normal -> Hard and confirm each unfinished board resumes independently.
6. Reload during an unfinished 12x12 puzzle and verify exact restoration.
7. Install the PWA, open once online, then relaunch in airplane mode.

## Release rule
Do not mark v1.0 or claim universal device compatibility until the above checks are completed on real devices and at least one desktop browser.

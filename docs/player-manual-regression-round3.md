# Player Manual Regression - Round 3

## Test Meta
- Tester:
- Date:
- Build:
- Commit:
- OS:
- Player Type: `Emo` / `Bilibili` / `Both`
- Start Route:
- End Route:

## Scope
- Goal: verify no leaked events/timers during frequent track/page switching.
- Focus: playback state correctness, lifecycle cleanup, no ghost callbacks.

## Setup
- [ ] Open app with clean start.
- [ ] Open DevTools/diagnostics panel.
- [ ] Enable debug counters (if available).
- [ ] Prepare one playlist with at least 10 playable tracks.

## Baseline (before testing)
- Event listeners active:
- `setInterval` active:
- `setTimeout` active:
- Audio instances active:
- Memory used (MB):
- Current track id:

## Scenario 1 - Rapid Track Switching
Target: click previous/next quickly `50-100` times.

- [ ] Start playback from track A.
- [ ] Click `Next` rapidly for 25 times.
- [ ] Click `Previous` rapidly for 25 times.
- [ ] Repeat until total actions >= 50 (optional stress: 100).
- [ ] Stop on a known track and wait 10s.

Expected:
- Only one active audio stream.
- No duplicated `timeupdate`/progress callbacks.
- UI/lyrics/progress match current track.
- No increasing listener/timer trend after idle.

Record:
- Duplicate callback observed: Yes / No
- Ghost progress updates: Yes / No
- Audio overlap: Yes / No
- Notes:

## Scenario 2 - Track Switching + Rapid Page Switching
Target: switch tracks while navigating across list/detail/player pages for `30-50` route changes.

- [ ] Start playback.
- [ ] While playback is running, switch routes quickly:
  - `List -> Detail -> Player -> List` as one cycle.
- [ ] Perform 30 cycles minimum (optional stress: 50).
- [ ] During cycles, trigger `Next/Previous` every 2-3 route changes.

Expected:
- Route transitions do not create extra listeners.
- Returning to player shows single valid state source.
- No stale page keeps updating after route leave.

Record:
- Stale page updates after leave: Yes / No
- Repeated event handler firings: Yes / No
- Route-specific notes:

## Scenario 3 - Leave Player and Return
Target: leave player page for 10s, return, repeat `20` times.

- [ ] Enter player page and confirm playback.
- [ ] Leave to non-player page and wait 10s.
- [ ] Return to player page.
- [ ] Repeat 20 cycles.

Expected:
- No cumulative listeners after each return.
- Playback resumes with correct single state.
- No lag or duplicated UI updates on return.

Record:
- Listener count stable across cycles: Yes / No
- Return latency issue: Yes / No
- Notes:

## Scenario 4 - Destroy and Recreate Player
Target: enter player -> exit -> re-enter for `30` cycles.

- [ ] Enter player view.
- [ ] Exit player view (trigger unmount/destroy path).
- [ ] Re-enter player view (trigger mount/create path).
- [ ] Repeat 30 cycles.

Expected:
- Mount/unmount lifecycle fully cleans resources.
- No zombie timers/listeners survive destroy.
- No additional audio objects per cycle.

Record:
- Zombie timers found: Yes / No
- Zombie listeners found: Yes / No
- Audio instance count drift: Yes / No
- Notes:

## Exit Validation (after all scenarios)
- Event listeners active:
- `setInterval` active:
- `setTimeout` active:
- Audio instances active:
- Memory used (MB):

Pass criteria:
- `add/remove` listener counts balanced at end.
- Active timers return to near-baseline (allow small transient jitter).
- No duplicate playback callbacks.
- No ghost progress updates.
- No monotonic memory climb across full run.

## Failure Attribution
- Failure category:
  - [ ] Event leak
  - [ ] Timer leak
  - [ ] Audio instance leak
  - [ ] Route lifecycle leak
  - [ ] UI stale update
  - [ ] Other
- First failing action:
- Repro rate:
- Suspected module/component:
- Related logs/screenshots:
- Follow-up issue link:

## Sign-off
- Overall result: `PASS` / `FAIL`
- Blocking severity: `P0` / `P1` / `P2` / `P3`
- Owner:
- Retest required: Yes / No

# 04 · Gherkin Specification

These scenarios are the **behavioural contract** and the acceptance tests. Engine/codec
features are verifiable as headless unit tests; view features as component/E2E tests. Each
`Feature` is tagged with the phase that must make it pass (see
[03-BUILD-PHASES.md](03-BUILD-PHASES.md)).

Conventions: `@phaseN` tags map to build phases. Background sets shared context. Times are
written human-readably; the engine stores seconds.

---

## Feature: Timer engine `@phase1`

```gherkin
Feature: Timer engine
  As the core of the app
  The engine counts down a selected step accurately and exposes state via events
  Independently of any UI

  Background:
    Given a config with steps:
      | name      | duration |
      | Welcome   | 00:20    |
      | Journal   | 02:00    |
    And an injected clock starting at T0

  Scenario: Selecting a step enters READY at full duration
    When I select step "Welcome"
    Then the state is READY
    And the remaining time is 00:20
    And a "stepchange" event reports index 0 and next step "Journal"

  Scenario: Starting counts down from wall-clock, not tick count
    Given I selected step "Welcome"
    When I start the timer
    And the injected clock advances by 5 seconds
    Then the remaining time is 00:15
    And the state is RUNNING

  Scenario: No drift across a backgrounded gap
    Given I selected and started step "Journal"
    And only 2 ticks fire while the clock advances by 90 seconds
    Then the remaining time is 00:30
    # proves remaining derives from timestamps, not number of ticks

  Scenario: Reaching zero finishes the step and fires an alert event
    Given I selected and started step "Welcome"
    When the injected clock advances by 20 seconds
    Then the remaining time is 00:00
    And the state is FINISHED
    And a "finished" event is emitted for step "Welcome"

  Scenario: Pause then resume preserves remaining time
    Given I selected and started step "Journal"
    And the clock advances by 30 seconds
    When I pause
    And the clock advances by 600 seconds
    And I start again
    Then the remaining time is 01:30
    And the state is RUNNING

  Scenario: Reset returns the current step to full duration
    Given I selected and started step "Journal"
    And the clock advances by 40 seconds
    When I reset
    Then the remaining time is 02:00
    And the state is READY

  Scenario Outline: Urgency reflects fraction remaining against thresholds
    Given thresholds warn 0.25 and danger 0.10
    And I selected and started step "Journal"
    When the remaining fraction is <fraction>
    Then the urgency is "<urgency>"

    Examples:
      | fraction | urgency |
      | 0.50     | normal  |
      | 0.20     | warn    |
      | 0.05     | danger  |

  Scenario: next() and prev() move the active pointer
    Given I selected step "Welcome"
    When I call next()
    Then step "Journal" is selected and state is READY
    When I call prev()
    Then step "Welcome" is selected and state is READY
```

---

## Feature: Player Parity `@phase1 @phase2`

> The generalized player must reproduce the original `BTMB_Retreat_Timer.html`.

```gherkin
Feature: Player Parity
  As a presenter
  I want the new config-driven player to behave exactly like the original
  So nothing I relied on is lost

  Background:
    Given the player is loaded with the ported 19-step sample config

  Scenario: Idle state before selection
    Then the clock shows "00:00"
    And the cue label invites me to select a cue
    And the status reads "STANDBY"

  Scenario: Selecting a cue shows its number, label, and next-up hint
    When I click cue 1 in the list
    Then the cue label shows the cue 1 name highlighted
    And the cue number shows "CUE 1 OF 19"
    And the next hint names cue 2 and its duration

  Scenario: Colour and status escalate as time runs low
    Given I selected and started a 100 second cue
    When 80 seconds have passed
    Then the clock and progress bar are in the "warn" colour
    And the status reads "WARNING"
    When 95 seconds have passed
    Then the clock and progress bar are in the "danger" colour
    And the status reads "URGENT"

  Scenario: End of cue flashes and beeps and shows the done banner
    Given audio is permitted after a user gesture
    And I selected and started a short cue
    When the cue reaches zero
    Then the clock flashes
    And an audio alert plays
    And a "Time's Up" banner appears

  Scenario: Space toggles, F opens fullscreen, Esc exits
    Given a cue is selected
    When I press Space
    Then the timer starts
    When I press Space again
    Then the timer pauses
    When I press F
    Then the fullscreen view is shown
    When I press Esc
    Then the fullscreen view is closed

  Scenario: The active cue auto-scrolls into view in the list
    When I select a cue far down the list
    Then that cue scrolls into view and is highlighted
```

---

## Feature: Fullscreen presentation `@phase2`

```gherkin
Feature: Fullscreen presentation
  Scenario: Fullscreen mirrors the player state
    Given a cue is running in the windowed player
    When I enter fullscreen
    Then the fullscreen clock, label, progress, and next-up match the windowed values
    And they keep updating in sync while running
```

---

## Feature: Theming `@phase3`

```gherkin
Feature: Theming
  As an organizer
  I want to restyle the timer
  So it matches my brand

  Scenario: Selecting a preset restyles the whole player
    Given the player uses the "Retreat Amber" preset
    When I switch to the "Daylight" preset
    Then background, text, accent, and fonts update across the entire player
    And no component required a code change

  Scenario: Custom accent overrides the preset
    Given a preset is selected
    When I set a custom accent colour
    Then the theme preset becomes "custom"
    And the accent updates instantly in clock, progress, and active cue highlight

  Scenario: Urgency thresholds come from the theme
    Given a theme with warn 0.30 and danger 0.15
    When a running cue crosses 30% remaining
    Then it enters the warn colour earlier than the default theme would
```

---

## Feature: Builder `@phase4`

```gherkin
Feature: Builder
  As an organizer
  I want to compose a step list
  So I can run my own agenda

  Scenario: Add, edit, reorder, and delete steps
    Given an empty builder
    When I add a step "Intro" of 05:00
    And I add a step "Break" of 10:00
    And I move "Break" above "Intro"
    Then the step list order is "Break, Intro"
    When I edit "Intro" duration to 07:30
    Then "Intro" shows 07:30
    When I delete "Break"
    Then only "Intro" remains

  Scenario: Durations are entered as minutes and seconds but stored as seconds
    When I enter a step duration of 01:30
    Then the stored duration is 90 seconds

  Scenario: Live preview reflects edits
    When I rename the timer title to "Workshop Clock"
    Then the player preview header shows "Workshop Clock"

  Scenario: Invalid steps are rejected
    When I try to add a step with a blank name
    Then I see a validation message and the step is not added
    When I try to add a step of 00:00
    Then I see a validation message and the step is not added
```

---

## Feature: Share & restore `@phase4`

```gherkin
Feature: Share & restore
  As an organizer
  I want a link that captures my whole timer
  So others can open it with no account

  Scenario: A built timer round-trips through a URL
    Given I built a 3-step themed timer
    When I copy the share link
    And I open that link in a fresh browser tab
    Then the player shows the same title, steps, durations, and theme

  Scenario: Oversize timers fall back to a local slug with a warning
    Given a timer whose encoded link would exceed the URL size cap
    When I create a share link
    Then I am warned the link is local-only to this device
    And the link uses a short slug stored in localStorage

  Scenario: A malformed link recovers gracefully
    Given I open the player with a corrupted "?t=" value
    Then the player loads the default sample config
    And shows a non-blocking notice that the link could not be read
```

---

## Feature: Local saves `@phase4`

```gherkin
Feature: Local saves
  Scenario: Named saves persist across reloads
    Given I built a timer
    When I save it as "Morning Retreat"
    And I reload the page
    Then "Morning Retreat" appears in my saved timers
    And loading it restores the exact config

  Scenario: The working draft autosaves
    Given I am editing a timer in the builder
    When I reload without explicitly saving
    Then my in-progress draft is restored
```

---

## Feature: Astro embedding `@phase5`

```gherkin
Feature: Astro embedding
  Scenario: The player route works inside the site
    When I navigate to "/utilities/timer"
    Then the player island hydrates and is interactive
    And the site's global styles do not bleed into the timer
    And the timer's styles do not bleed into the site

  Scenario: The builder route works inside the site
    When I navigate to "/utilities/timer/builder"
    Then the builder island hydrates and is interactive

  Scenario: Share links resolve on the site routes
    When I open "/utilities/timer?t=<valid-config>"
    Then the player restores that config
```

---

## Feature: Ad slots `@phase6`

```gherkin
Feature: Ad slots
  As the site owner
  I want pluggable ad slots
  So the free tool promotes my offerings

  Scenario: Self-promo renders without cookies
    Given a slot configured as self-promo with my offerings
    When the utilities page loads
    Then my offerings render in the slot
    And no advertising cookies are set

  Scenario: Switching to a network is config-only
    Given a slot configured as self-promo
    When I change its strategy to "network"
    Then the slot renders the network ad after consent is granted
    And renders nothing before consent

  Scenario: Clean mode disables ads entirely
    Given a slot configured as "none"
    Then no ad content renders
    And the tool layout is unaffected
```

---

## Feature: Accessibility `@phase2 @phase3 @phase7`

```gherkin
Feature: Accessibility
  Scenario: The player is fully keyboard operable
    Then every control is reachable and operable by keyboard with visible focus

  Scenario: Urgency is not signalled by colour alone
    When a cue enters warn or danger
    Then a non-colour cue (text/status label) also conveys the urgency

  Scenario: Reduced motion is respected
    Given the user prefers reduced motion
    When a cue ends
    Then the flashing animation is suppressed
    And a non-animated end indication is still shown

  Scenario: State changes are announced to assistive tech
    When a cue starts, ends, or changes
    Then a screen-reader receives an announcement of the change
```

---

## Feature: Resilience `@phase7`

```gherkin
Feature: Resilience
  Scenario: Long sessions stay accurate
    Given a cue running for several hours of simulated time
    Then the displayed time matches wall-clock within one second

  Scenario: Backgrounded tab catches up on return
    Given a running cue
    When the tab is backgrounded for minutes and returns
    Then the remaining time reflects real elapsed time, not throttled ticks

  Scenario: Empty and extreme configs are handled
    When a config has zero steps
    Then the player shows an empty-state prompt instead of erroring
    When a step name is very long
    Then it truncates without breaking layout
```

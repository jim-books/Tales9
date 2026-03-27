# Demo Keyboard Shortcuts

Quick reference for running the full Tales9 demo flow without WebSocket backend.

## Session Control

| Key | Action |
|-----|--------|
| **S** | Start session with 4 users |
| **E** | End session (back to standby) |

## Demo Coasters

Place/remove interactive coasters at predefined positions. Each has a drink pre-assigned and animation ready to play.

| Key | Drink | Animation | Position |
|-----|-------|-----------|----------|
| **1** | Pisco-Colada | Tropical | Bottom-left |
| **2** | Espresso Martini | Bold | Top-center |
| **3** | Momo Sour | Energetic | Bottom-right |
| **4** | Apple Tart | Elegant | Top-center |

Press a number key to toggle the coaster on/off. When placed, the coaster immediately triggers its animation.

## Games

| Key | Action |
|-----|--------|
| **T** | Start Truth or Dare game |
| **K** | Start King's Game |
| **G** | End game |

## Debug

| Key | Action |
|-----|--------|
| **D** | Toggle diagnostics overlay (live state inspector) |

## Demo Flow Example

1. Press **S** to start a 4-player session (user nodes appear at corners)
2. Press **1**, **2**, **3**, **4** individually to place coasters with animations
3. Press **T** or **K** to trigger a game (spotlight + mini-game animation)
4. Press **G** to end the game
5. Press **E** to end the session (back to standby idle animation)

---

**Note:** These shortcuts bypass WebSocket entirely. They directly manipulate app state for demo/presentation purposes. For production, events come from the WebSocket server.

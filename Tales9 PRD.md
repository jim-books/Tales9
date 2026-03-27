  # Tales9: Smart Bar Table Product Requirements Document

**Version:** 2.0 (MVP Pilot at Barcode)  
**Last Updated:** March 27, 2026  
**Target Demo:** End of May 2026  
**Pilot Venue:** Barcode, Central, Hong Kong

---

## Executive Summary

Tales9 is a Smart Bar Table system that transforms cocktail service into an interactive, multi-sensory experience. The entire tabletop functions as a large interactive monitor, combining personal ordering interfaces with shared ambient visuals and physical drink tracking to create memorable moments for guests.

This PRD defines the **MVP pilot implementation at Barcode**, a bar in Central, Hong Kong. All environmental assumptions, visual design constraints, and operational workflows are scoped specifically for this initial venue context.

**Core Experience:** When guests sit at the table, each receives a draggable interface (User Node) for browsing menus, taking personalized quizzes, and ordering drinks. When drinks arrive on tracked coasters, the table responds with animations that bring the drink to life. Multiple drinks can interact with each other, and ingredient characters populate the table's edges, creating a shared social layer beyond individual transactions.

---

## Product Vision & Objectives

### Vision Statement

*Transform the bar table from a passive surface into an intelligent social platform—where every drink tells a story, every placement creates a moment, and every interaction strengthens connection.*

### Product Objectives

| Objective | Description | Success Criteria |
|-----------|-------------|------------------|
| **Engagement** | Create moments that feel remarkable and worth sharing | 70%+ of guests interact with table features |
| **Shareability** | Generate organic social content | 25%+ of sessions result in photo/video capture |
| **Reliability** | Maintain flawless operation in bar conditions | 99.5%+ uptime during operating hours |
| **Simplicity** | Require minimal staff training and intervention | Bartender proficiency after one 15-minute session |
| **Delight** | Exceed guest expectations for novelty | Observable positive reactions and conversation |

### Design Principles

1. **Delight Over Function** — Prioritize joy and surprise over pure utility
2. **Invisible Technology** — Guests experience magic, not machinery
3. **Graceful Degradation** — Never interrupt service or embarrass users
4. **Staff Empowerment** — Operations are intuitive for bartenders
5. **Social Connection** — Encourage shared experiences, not just individual transactions

---

## Core Value Proposition

| Stakeholder | Value Delivered |
|-------------|-----------------|
| **Venue Owners** | Premium differentiation, extended dwell time, social media buzz, enhanced brand positioning |
| **Brand Partners** | Immersive brand experiences, direct guest engagement, memorable product associations |
| **Guests** | Novel entertainment, Instagram-worthy moments, enhanced social experiences, personalized recommendations |
| **Bartenders** | Streamlined order management, conversation starters, enhanced service presentation |

---

## Physical Setup

### Table Configuration

The Smart Bar Table consists of:
- **33.2-inch square display monitor** (1:1 aspect ratio)
- **Resolution:** 1900 × 1900 pixels
- **Active display area:** 598 × 598 mm
- **Unit dimensions:** 632 × 632 × 60.8 mm (including mounting bracket)
- Touch-enabled multi-touch display
- Designed to accommodate **up to 4 simultaneous users**
- Each user assigned a unique color identity
- Protected by ≥3.5 mm high-strength tempered glass surface
- **Weight:** 17 kg (net)

**System:**
- Android 8.1 operating system
- RK3566 quad-core processor
- 2 GB RAM / 16 GB storage
- Network connectivity via Ethernet and Wi-Fi
- Operating power ≤65 W

**Status:** Hardware is already procured and on-site at Barcode.

### Environmental Context (Barcode)

The table operates in typical bar conditions:

| Factor | Specification |
|--------|---------------|
| **Lighting** | Low ambient (5–50 lux typical) |
| **Noise** | High (70–90 dB music and conversation) |
| **Temperature** | 18–26°C (65–80°F) |
| **Humidity** | 40–70% RH |
| **Liquid Exposure** | Spills and condensation expected |
| **Operating Hours** | 6–12 hours/day, evening/night service |
| **Guest Context** | Social setting; alcohol consumption assumed |

---

## Interaction Model

The Smart Bar Table operates across two spatial interface layers:

### A. Personal Space (Panel Interface)

Each user has access to a **User Node**—a circular, draggable interface element visually similar to the iPhone AssistiveTouch button. User Nodes provide personal access to:
- Menu browsing and filtering
- Personalized quiz for drink recommendations
- Drink detail views and descriptions
- Order placement and status tracking
- Venue information and editorial content

**User Node Behavior:**
- When a session starts, User Nodes **spawn at predefined positions**—positioned directly in front of each customer's seating location
- Each User Node has a **predefined owner** established at session start
- Ownership does not change if the node is dragged to a new position
- Users can reposition their User Node anywhere on the table surface after initial spawn
- The node **automatically orients toward the nearest table edge** for optimal readability
- When tapped, the User Node **expands into a panel** containing the user interface
- When closed, the panel **collapses back into the User Node**
- Multiple panels can be open simultaneously

**Multi-Panel Behavior:**
- Overlapping panels are **allowed** in this MVP
- Overlapping is not ideal but is **acceptable for the pilot**
- Users can reposition nodes at any time, including during panel opening/closing
- Visual cues or subtle animations may encourage users to avoid blocking each other
- Strict overlap prevention is not required

**Technical Limitation:** The system cannot distinguish which person's finger is touching the screen. While each User Node has a predefined owner, technically anyone could touch any node. Expected behavior relies on social norms (users interact with their own assigned node). Future iterations may need additional authentication or mitigation strategies.

### B. Common Space / Share Space

The **Common Space** is the remaining table area not occupied by user panels. This space serves multiple purposes:
- Displays ambient entertainment and responsive generative visuals
- Shows drink-related animations when coasters are placed
- Enables multi-drink and multi-user interactions
- Creates a dynamic, living background during idle moments
- Functions as the social layer connecting individual experiences

The Common Space is a deliberate design layer, not empty space—it reinforces that the table experience is communal and alive.

---

## Session States

### Standby Mode

Before guests officially begin a session, the table operates in **standby mode**:
- Displays subtle ambient animation across the entire surface
- Responds to touch input with **reactive touch-follow animation**
- Creates a **cloud-like or gas-like visual effect** that follows finger movement
- Serves as an ambient attention-grabber when the table is unoccupied

### Session Start

Sessions are **manually initiated by the bartender** using the dedicated bartender iOS app:
- The bartender selects the number of users (1–4)
- The system assigns each user a unique color identity
- User Nodes spawn on the table surface, one per user
- There is **no automatic seat or session detection** in this MVP

### Active Session

During an active session:
- User Nodes are interactive and can be repositioned
- Users browse menus, take quizzes, and place orders through their panels
- Drinks are tracked when coasters are placed on the surface
- The Common Space displays drink animations, Ingredient Sprites, and interactive effects
- Multiple interactions occur simultaneously across personal and shared layers

### Session End

The bartender manually ends the session via the iOS app:
- Clears all active orders and user assignments
- Returns the table to standby mode
- Resets coaster tracking and user color assignments

---

## User Interface Flow

The following screens and states comprise the guest-facing UI within User Node panels:

### 1. Home Screen

**Content:**
- Barcode logo/title
- Tagline: **"WHERE EVERY DRINK TELLS A STORY"**
- Three action cards:
  - **About the Bar** (wine glass icon) – Learn about Barcode and our story
  - **Take a Quiz** (clipboard icon) – Find your perfect drink based on your mood
  - **Menu** (menu icon) – Browse our full selection of drinks

**Interaction:** Users tap any card to navigate to that section.

---

### 2. About Screen

**Content:**
Displays static editorial content about Barcode, organized into sections:
- **Our Story:** Overview of Barcode's founding and concept
- **Our Philosophy:** Barcode's approach to cocktails and guest experience
- **What Makes Us Different:** Description of the interactive coaster system and personalized service

**Interaction:**
- Scrollable content within the panel
- Back button returns to Home

---

### 3. Menu Screen

**Header:**
- Title: **"BARCODE"** with **"── COCKTAIL MENU ──"** subtitle
- Search bar: **"🔍 Search Cocktails..."**

**Category Filters:**
- ALL (default selected)
- CLASSICS
- COFFEE BASED
- DESSERT INSPIRED

**Drink Cards:**
Each drink is displayed as a card showing:
- Photo of the cocktail
- Category tag (e.g., "CLASSICS")
- Drink name
- Flavor profile (e.g., "Fizzy/Sour", "Velvety/Tropical")
- Price (e.g., "$120")
- Two action buttons:
  - **DETAILS** – Opens drink detail modal
  - **ORDER** – Places order directly from menu

**Interaction:**
- Users can filter drinks by tapping category buttons
- Users can search by name
- Users can tap DETAILS to view full information
- Users can tap ORDER to place order directly from the menu list

---

### 4. Drink Detail Modal

**Content:**
- Full-size cocktail photo
- Category tag
- Drink name
- Flavor profile description
- Full ingredient list
- Price
- Detailed tasting notes or story

**Actions:**
- **ORDER** button (primary action)
- **BACK** or close button returns to menu

**Ordering:** Users can order from this detail view.

---

### 5. Quiz Flow

**Structure:**
Multi-step question flow with progress indicator.

**Example Questions:**
- Question 1 of 4: **"What's your mood today?"**
  - Options: ADVENTUROUS & ENERGETIC, RELAXED & CALM, SOCIAL & PLAYFUL, SOPHISTICATED & REFINED

Additional questions collect preferences around flavors, spirits, sweetness level, and experience goals.

**Result Screen:**
- **"Your Perfect Match"** heading
- Wine glass icon
- Recommended drink name (e.g., **"PISCO-COLADA"**)
- Drink description
- Two action buttons:
  - **TAKE QUIZ AGAIN** – Restart quiz
  - **VIEW FULL MENU** – Browse all drinks
- **BACK TO HOME** link

**Ordering from Quiz:**
The result screen should also include an **ORDER** action allowing users to order their recommended drink directly without navigating to the menu.

---

### 6. Order Status Panel

When a drink is ordered:
- A status panel displays within the user's interface
- Shows drink name
- Shows current status:
  - **"YOUR DRINK IS BEING PREPARED..."**
  - **"YOUR DRINK IS ON THE WAY..."**
  - **"YOUR DRINK HAS ARRIVED"** (triggered when coaster is detected)

The status progression provides transparency and anticipation.

---

## Drink Arrival & Coaster Tracking

### Coaster Placement Flow

1. **Guest orders** a drink through their panel (from menu, detail view, or quiz result)
2. **Bartender receives** the order via the bartender iOS app
3. **Bartender prepares** the drink
4. **Bartender assigns** a coaster ID to the order by **NFC scanning** the coaster with their iPhone (or manually entering the printed coaster number as backup)
5. **Bartender places** the coaster on the table surface, then places the glass on the coaster
6. **System detects** the coaster via touch tracking and identifies it by geometric signature
7. **System triggers** drink-specific animations in the Common Space around the coaster area
8. **Guest status panel** updates to show "YOUR DRINK HAS ARRIVED"

### Coaster Tracking Capability

**Core Requirement:** For this MVP, coaster tracking must support both **identity** and **position** tracking. This is a foundational capability of the Smart Bar Table experience, not optional background functionality.

**Detection Method:**
- Each coaster has **3 contact points** that touch the monitor surface
- The unique ratio of distances between these three points creates a **geometric signature**
- The system identifies the coaster by matching this signature
- Position is computed from the centroid of the three contact points

**Coaster Physical Design:**
- Each coaster is equipped with an **NFC tag** for identification
- Each coaster also displays a **printed number** on its surface for visual reference and manual backup

**Visual Response:**
When a tracked coaster is detected:
- Drink-specific animations appear around the glass
- Animations may include particle effects, ripples, color themes, or branded content
- The animation type is determined by the drink profile assigned to that coaster
- Animations occur in the Common Space, visible to all users at the table

**Drink Removal Detection:**
When a drink is lifted or removed from the table:
- The system detects the absence of the coaster's touch signature
- The associated drink animation **disappears from the Common Space**
- If the drink is placed back down, the animation reappears

**Coaster Assignment:**
The bartender assigns coaster IDs to drinks using the bartender iOS app before placing them on the table:
- **Primary method:** NFC scan—bartender taps their iPhone to the coaster to scan its NFC tag
- **Backup method:** Manual entry—bartender types the printed coaster number displayed on the surface
This mapping ensures the system knows which drink corresponds to which coaster signature when detected on the table.

---

## Ingredient Sprite Experience

### Overview

The **Ingredient Sprite** is a secondary shared animation layer that extends the drink experience into the Common Space. When a new coaster is placed on the table, a small animated character appears, representing the drink's key ingredient, flavor identity, or alcohol type.

### Visual Design

Ingredient Sprites are:
- Cartoon-style characters designed to represent ingredients (e.g., a peach character for peach-flavored drinks)
- Animated with arms, legs, and expressive movement
- Visually playful and approachable
- Sized appropriately to coexist with other table elements without obstructing views

### Trigger

When a **new coaster is detected** on the table surface:
- The system spawns an **Ingredient Sprite** linked to that drink
- The sprite appears near the coaster's detected position at the moment of placement

### Movement Behavior

After spawning:
1. The sprite **drops visually** toward the **outer edge of the table**
2. The table edges function as a **landing zone** or ground plane
3. Once landed, the sprite begins **moving along the perimeter** of the table
4. The perimeter includes the four edges and four corners, forming a continuous boundary path

### Shared Interaction Role

As more drinks are served, multiple Ingredient Sprites populate the table perimeter:
- Sprites **coexist** and move around one another
- Sprites can **mingle** when they encounter other sprites
- Sprite interactions may trigger small visual effects or reactions
- Each sprite maintains its unique identity tied to its corresponding drink

### Lifecycle

**Spawn:** When a new coaster is placed on the table
**Active:** While the drink remains on the table
**Despawn:** When the drink is removed from the table for an extended period, or at session end, the associated sprite disappears from the perimeter

### Experience Goal

The Ingredient Sprite system serves several purposes:
- Adds delight when a new drink arrives
- Visually connects physical coaster placement to a living digital response
- Extends the experience from the personal drink zone into the Common Space
- Encourages discovery and conversation between guests
- Reinforces that individual drink orders contribute to a **collective, communal atmosphere**

Ingredient Sprites are not merely decorative—they communicate that each new drink adds something to the shared experience at the Smart Bar Table.

---

## Shared Drink Interactions

### Proximity-Based Effects

When tracked drinks or coasters move close to one another, the system triggers **shared interactive effects** in the Common Space.

**Example: Battle Sequence**

If User A's drink and User B's drink are moved close together:
- The system detects proximity between the two coaster positions
- A **battle animation** is triggered in the Common Space between the two drinks
- Visual effects might include clashing particles, competing color themes, or character interactions
- The interaction is visible to all users at the table

### Shared Interaction Mechanics (from Interactive Elements)

The Smart Bar Table supports social games that leverage coaster tracking and the shared Common Space:

#### Game 1: Truth or Dare

**Phase 1: The Spin**
- A guest opens their panel and taps "Truth or Dare"
- The Common Space dims
- A massive, glowing arrow appears at the center and spins rapidly
- The arrow decelerates and locks onto one physical drink on the table
- All user panels display: *"The Arrow has chosen [Drink Name]!"*

**Phase 2: The Hot Seat**
- A pulsing spotlight appears in the Common Space directly under the chosen drink
- All user panels update to display: **[ TRUTH ]** or **[ DARE ]** buttons
- Social convention dictates that the spotlighted user makes the choice

**Phase 3: The Global Broadcast**
- When the victim taps their choice, the entire table flashes with a visual ripple
- All user panels display the randomly selected truth question or dare challenge
- The entire group reads and reacts simultaneously

---

#### Game 2: King's Game / 國王遊戲

**Phase 1: Crowning the King**
- A guest selects "King's Game" from their panel
- The Common Space displays a chaotic web of light connecting all drinks
- The web flashes rapidly before snapping to a single glass
- A glowing crown aura permanently surrounds that coaster in the Common Space
- All users immediately know who is King

**Phase 2: The King's Menu**
- The King's panel displays a list of actions/commands (e.g., "Swap Drinks", "Answer a Truth", "Down Your Glass")
- Other users' panels display: *"Bow to the King. Waiting for a decree..."*
- The King selects an action and taps **[ EXECUTE DECREE ]**

**Phase 3: The Roulette Spotlight**
- Fast-moving spotlights dart between drinks in the Common Space (excluding the King's drink)
- All panels flash: *"The King commands a Drink Swap! Choosing targets..."*
- Suspense builds as the table randomly selects victims

**Phase 4: The Decree Revealed**
- The spotlights freeze, locking bright halos under two randomly chosen glasses
- All panels display the full command: *"The King has spoken! The [Apple Tart] and the [Momo Sour] must swap drinks!"*
- Guests execute the decree in the physical space

---

## Bartender iOS App

### Purpose

The **bartender iOS app** is a dedicated staff tool that manages table operations, session control, and order processing. It is essential to the MVP workflow.

### Core Responsibilities

For the MVP pilot, the bartender app handles:

1. **Session Management**
   - Manually start a table session
   - Assign the number of users (1–4)
   - Manually end a session and reset the table

2. **Order Management**
   - Receive orders from the table in real-time
   - View pending orders with customer ID and drink details
   - Mark orders as in-progress or completed

3. **Coaster Assignment**
   - Assign a coaster ID to a specific drink/order via **NFC scan** using iPhone
   - Each coaster also displays a **printed number** for manual entry as a backup method
   - This mapping enables the table to display the correct animations when the coaster is detected

4. **Table Status Monitoring**
   - View current session state
   - See active users and their orders
   - Monitor table health and connectivity

### Operational Workflow

**Starting a Session:**
1. Guests sit at the table (table is in standby mode)
2. Bartender opens the iOS app
3. Bartender taps "Start Session" and selects number of users
4. User Nodes appear on the table surface

**Processing an Order:**
1. Guest places order via their panel
2. Bartender receives notification in iOS app
3. Bartender prepares the drink
4. Before serving, bartender assigns a coaster ID to the order by **NFC scanning** the coaster with their iPhone (or manually entering the printed coaster number)
5. Bartender places the coaster on the table, then places the glass
6. Table detects the coaster and triggers animations

**Ending a Session:**
1. Guests complete their experience
2. Bartender taps "End Session" in the iOS app
3. Table clears all assignments and returns to standby mode

---

## Target Users

### Primary Personas

**🥂 The Guest**
- **Profile:** Ages 25–45, urban professionals, disposable income, socially active
- **Behavior:** Photographs experiences, shares on social media, seeks novel entertainment
- **Needs:** Memorable moments, social currency, effortless interaction
- **Pain Points:** "Seen it all" fatigue, high expectations for premium venues

**🛎️ The Bartender**
- **Profile:** Ages 21–40, hospitality professionals working at Barcode
- **Behavior:** Manages orders, configures table settings, troubleshoots issues
- **Needs:** Easy operation, quick problem resolution, tools that don't distract from service
- **Pain Points:** Complex technology, maintenance interruptions, guest questions they can't answer

### Secondary Personas

**📋 The Venue Manager**
- Manages brand partnerships, events, and staff training
- Needs easy configuration, analytics, and reliability
- Concerned about failures during events or slow setup

**🏷️ The Brand Representative**
- Ensures brand standards and visual consistency
- Needs customization options, visual sign-off, and performance data
- Concerned about off-brand experiences and lack of real-time control

---

## Success Metrics

### Technical Performance

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Detection Accuracy** | >99% | Correct coaster ID / total placements |
| **Detection Latency** | <100ms | Touch event → animation start |
| **Frame Rate** | 60 fps | Browser DevTools performance monitoring |
| **System Uptime** | >99.5% | Operating hours / scheduled hours |
| **Memory Stability** | No growth | RAM usage over 8-hour session |

### User Experience

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Guest Interaction** | >70% | Guests who interact with table features |
| **Social Sharing** | >25% | Sessions resulting in photo/video capture |
| **Staff Training Time** | <15 min | Time to bartender proficiency |
| **Configuration Speed** | <2 min | Time to switch drink profiles or themes |
| **Support Incidents** | <5% | Sessions requiring staff troubleshooting |

### Business Impact

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Dwell Time** | +15% | Average time at table vs. baseline |
| **Return Visits** | +10% | Repeat customer rate |
| **Brand Recall** | >80% | Post-visit guest survey |
| **Social Mentions** | >20/week | Hashtag and geotag tracking |
| **Partner Satisfaction** | >4.5/5 | Brand partner survey |

---

## Scope & Constraints

### In Scope for MVP

**Product Features:**
- Standby mode with touch-reactive ambient animation
- Manual session start/end via bartender iOS app
- Support for up to 4 simultaneous users
- User Node creation, positioning, expansion, and panel interface
- Home, About, Menu, Quiz, Detail, and Order Status screens
- Menu browsing with category filters and search
- Personalized quiz flow with drink recommendations
- Direct ordering from menu list, detail view, and quiz results
- Coaster tracking via 3-point geometric signature
- Manual coaster-to-drink assignment via bartender app
- Drink-specific animations triggered by coaster placement
- Ingredient Sprite spawning, movement, and perimeter behavior
- Proximity-based shared drink interactions (e.g., battle sequences)
- Truth or Dare and King's Game social interaction modes
- Bartender iOS app for session and order management

**Pilot Venue:**
- Implementation at Barcode, Central, Hong Kong
- Environmental assumptions based on Barcode's physical space and operational context

**Timeline:**
- MVP demo presentation at end of May 2026

---

### Out of Scope for MVP

**Not Included:**
- Automatic seat or session detection
- Strict user authentication or finger identity tracking
- Strict prevention of overlapping panels
- Automatic coaster-to-drink assignment (NFC or other)
- Payment processing or POS integration
- Multi-table networking or venue-wide features
- Guest-facing mobile app
- Real-time guest analytics dashboard
- Multi-language support beyond English
- Accessibility features (screen readers, voice control)

**Deferred to Future Versions:**
- NFC-enabled coaster identification
- Advanced panel collision/overlap management
- Biometric or device-based user authentication
- Integration with venue loyalty programs
- Advanced analytics and reporting tools

---

## Future Direction: Version 2

### Generative AI SDK for Venue Customization

**Strategic Goal:** Transform Tales9 from a single-venue prototype into a **platform** that any bar or venue can customize with their own identity.

**Planned Capabilities (Post-MVP):**
- **Brand Configuration:** Venues define their own branding, color schemes, typography, and visual identity
- **Custom Animations:** Venues create or select animations that reflect their concept and style
- **Interactive Elements:** Venues choose which games, interactions, and social features to enable
- **Content Management:** Venues manage their own drink menus, editorial content, and quiz questions
- **Generative Visuals:** AI-driven animation generation based on venue identity, allowing unique experiences without custom development

**Vision:** Version 2 enables platformization, allowing Tales9 to scale to multiple venues while preserving each venue's unique character and guest experience.

**Status:** Not part of MVP scope. Strategic direction only.

---

## Milestones & Timeline

| Milestone | Target Date | Success Criteria |
|-----------|-------------|------------------|
| **Planning & Definition** | Feb 14, 2026 | Project management structure; CAD and materials sourced; sensor libraries and repository setup; mood boards and UI sketches |
| **Prototyping** | Feb 28, 2026 | Raw touch data → screen coordinate mapping logic; sensor frame prototype and heat testing; idle visual prototypes; vertical slice video proof |
| **Deep Build** | Mar 14, 2026 | Full hardware assembly with waterproofing and screen mount; multi-touch calibration working; draft animation effects; bartender iOS app functional |
| **Testing** | Mar 28, 2026 | User testing complete; bugs logged and prioritized; hardware stability validated; UX timing and flow observations documented |
| **Iterations** | Apr 18, 2026 | High-resolution final assets; latency <100ms achieved; final aesthetic polish; draft Final Report and Pitch Deck |
| **Finalization** | May 9, 2026 | Code freeze; offline mode verified; 3-minute pitch video produced; demo site setup; submission materials ready (Report, Video, Repository, Live Demo) |

---

## Technical Notes / Appendix

*This section contains technical implementation details for engineering reference. The main PRD body focuses on product behavior and user experience.*

### Coaster Tracking System Architecture

The coaster tracking system is modular and consists of five major components:

#### A. Input Adapter

Handles raw input from possible sources:
- Multi-touch events from the display
- Sensor data streams
- Camera/object detection feed
- Custom hardware data streams
- WebSocket or local API events

**Responsibility:** Abstract the input source so the tracking logic is independent of hardware.

---

#### B. Tracking Engine

Computes tracking state from raw input:
- Active touch points on the surface
- Object presence detection
- Centroid calculation for multi-point objects
- Movement velocity and direction
- Enter/exit state transitions
- Stable placement detection (distinguishing intentional placement from transient touches)

**Responsibility:** Convert raw touch data into meaningful object tracking state.

---

#### C. Calibration Mapper

Converts raw coordinates into display coordinates:
- Accounts for physical coaster diameter
- Maps total detection area to display resolution
- Applies screen size calibration
- Transforms physical measurements to pixel coordinates

**Responsibility:** Ensure accurate visual placement of animations relative to physical coasters.

---

#### D. Animation Renderer

Uses mapped position and identity to:
- Place visuals under or around the coaster in the Common Space
- Trigger drink-specific animation profiles
- Adjust color themes, particle effects, and visual styles
- Render Ingredient Sprites and shared interaction effects

**Responsibility:** Translate tracking data into visual output.

---

#### E. Diagnostics UI

Displays real-time system information for debugging and calibration:
- Active touch point count
- Computed centroid coordinates
- Active coaster IDs and animation states
- Calibration values and transform parameters
- Current configuration and presets

**Responsibility:** Provide visibility into system internals for troubleshooting.

---

### Functional Design Principles

#### Modular Animation Dispatch

Animations should **not** be hardcoded for each drink individually. Instead, the system uses **configurable drink profiles** that map to animation families:

**Drink Profile Structure:**

- Drink ID
- Ingredient theme
- Color palette
- Effect type (particles, ripples, waves, etc.)
- Animation family (energetic, elegant, tropical, etc.)
- Sprite character assignment

This modular approach enables:
- Easy addition of new drinks without code changes
- Consistent animation styles across drink categories
- Flexible brand customization in future versions

#### Centroid Computation

Centroid calculation is a **reusable utility** for:
- Computing the center point of multi-touch coaster signatures
- Determining proximity between multiple coasters
- Positioning animations and sprites relative to drinks

#### Calibration Mapping

Calibration is a **reusable transform** that converts:
- Physical coordinates (raw touch input, measured in sensor units)
- Display coordinates (pixel positions for rendering animations)

This separation ensures the system can adapt to different display sizes, resolutions, and physical table dimensions.

---

## Technical Stack Reference

### Display Hardware
- **33.2-inch square display monitor** with **1900 × 1900 resolution**
- **Android 8.1** operating system
- **RK3566 quad-core processor**
- **2 GB RAM / 16 GB storage**
- **Multi-touch capacitive input**
- **Ethernet and Wi-Fi connectivity**

---

### Display Application

The guest-facing table experience will be implemented as a **hybrid Android kiosk application** combining a native Android host with a web-rendered UI and real-time graphics layer.

#### Native Host Layer
- **Language:** Kotlin
- **Role:** Android kiosk shell / container app

**Responsibilities:**
- Launch automatically on device boot
- Run in fullscreen kiosk mode
- Hide system UI and prevent accidental exits
- Manage app lifecycle and recovery from crashes
- Host the embedded local server
- Provide access to device-level diagnostics and health checks
- Load and display the React application in a fullscreen WebView

#### Frontend UI Layer
- **Framework:** React
- **Language:** TypeScript
- **Build Tool:** Vite
- **State Management:** Zustand
- **Routing:** React Router

**Responsibilities:**
- User Node rendering and interaction
- Panel-based UI flows
- Home, About, Menu, Quiz, Detail, and Order Status screens
- Search, filtering, and menu browsing
- Quiz logic presentation and recommendation display
- Bartender-triggered session state updates reflected on screen
- Diagnostics and calibration UI for internal testing

#### Real-Time Visual / Interaction Layer
- **Rendering Library:** PixiJS

**Responsibilities:**
- Standby ambient animation
- Touch-follow reactive visual effects
- Drink-specific animations linked to coaster placement
- Ingredient Sprite spawning and perimeter movement
- Proximity-based shared drink interactions
- Shared game visuals such as Truth or Dare and King's Game
- Low-latency rendering of common-space effects

#### Display App Interaction Engine
Implemented as internal TypeScript modules within the display application.

**Core Modules:**
- **Input Adapter:** consumes standard Android multi-touch events
- **Tracking Engine:** groups and tracks 3-point coaster signatures
- **Calibration Mapper:** converts touch coordinates into display coordinates
- **Animation Dispatcher:** maps coaster identity and drink profile to visual behavior
- **Diagnostics UI:** exposes tracking/debug information for setup and testing

---

### Backend

The backend will run as an **embedded local server on the table device**, designed for **offline-capable, low-latency operation**.

#### Backend Runtime
- **Language:** Kotlin
- **Framework:** Ktor
- **Deployment Model:** Embedded server running locally on the Android table device

#### Backend Responsibilities
- Session start / end state management
- User slot and color assignment
- Order intake and order lifecycle management
- Coaster-to-drink assignment storage
- Communication with bartender iOS app over local network
- Event broadcasting to display app and bartender app
- Persistence of operational data and configuration
- Background sync of completed orders and session data to Firebase
- Diagnostics and table status reporting

#### API / Communication
- **REST API** for operational commands and state queries
- **WebSockets** for real-time updates such as:
  - new orders
  - order status changes
  - session changes
  - coaster assignment updates
  - table diagnostics

#### Data Storage
- **Database:** SQLite
- **Android Persistence Layer:** Room

**Stored Data Includes:**
- active and historical sessions
- user slot assignments
- drink catalog cache (populated from Firebase at startup)
- order records
- coaster assignment mappings
- calibration values
- local configuration (synced from Firebase at startup)
- diagnostic and event logs

#### Cloud Sync Layer (Firebase)
- **Firebase Firestore** — configuration sync, multi-table venue settings, completed order backup
- **Firebase Storage** — remote asset delivery: logos, drink images, sprite graphics
- **Firebase Analytics** (optional) — usage metrics and session telemetry

**Data Ownership by Layer:**

| Data Type | Storage | Rationale |
|-----------|---------|-----------|
| Real-time tracking state | Local only | Latency-critical; no round-trip tolerated |
| Active session state | Local (primary) + Firebase (background sync) | Offline resilience |
| Orders | Local (primary) + Firebase (backup/sync) | Must work if internet drops |
| Drink catalog / Menu | Firebase → cached locally in SQLite | Easy remote updates, offline fallback |
| Assets (logos, images, sprites) | Firebase Storage → cached locally | Remote updates without redeploy |
| Multi-table config | Firebase | Central management across venues |
| Analytics / Logs | Firebase | Centralized monitoring and debugging |

**Startup Sequence:**
1. Table pulls latest config, menu, and assets from Firebase → caches to SQLite
2. During session: all real-time operations use local SQLite; Firebase syncs in background
3. If internet drops: full functionality continues from local cache
4. Completed sessions and orders are synced to Firebase when connectivity is restored

---

### Bartender iOS App
- **Platform:** Native iOS application
- **Primary Device Capability:** NFC reading for coaster assignment
- **Network Model:** Hybrid — connects to both the table's local embedded server and Firebase
- **Communication:** REST API + WebSocket updates (local); Firebase SDK (cloud)

**Connection Modes:**

| Mode | When Used | Capabilities |
|------|-----------|--------------|
| **Local (primary)** | On venue Wi-Fi, during active service | Full real-time control: session management, NFC coaster assignment, live order updates |
| **Firebase (secondary)** | Remote or off-network | Order monitoring, session history, menu and config management |

**Responsibilities:**
- Start and end sessions (local connection)
- Set user count (local connection)
- Receive table orders in real time (local connection during service; Firebase when remote)
- Update drink preparation state
- Assign coaster IDs via NFC scan (requires local connection — NFC triggers table animation)
- Enter printed coaster number manually as backup
- Monitor table status and connectivity
- Access historical session data and analytics (Firebase)
- Push menu or configuration updates to the table (Firebase → table cache)

---

### Networking Model

The MVP uses a **hybrid local-first architecture**: all latency-critical and session-critical operations run locally on the table device, while Firebase provides cloud sync for configuration, assets, and analytics.

#### Local Network (Primary Path)
- The table device acts as the **local source of truth** for all active session state
- The bartender iOS app connects to the table over the **same local Wi-Fi network**
- Core operations remain functional even if internet access is unavailable
- Real-time coaster tracking, order placement, and animation triggering never touch the internet

#### Firebase Sync (Secondary Path)
- At startup, the table pulls the latest drink catalog, brand assets, and venue configuration from Firebase and caches them locally in SQLite
- During a session, completed orders and session events are synced to Firebase in the background
- The bartender iOS app can connect directly to Firebase for order monitoring when outside the venue network (useful for remote management and debugging)
- If internet connectivity is unavailable, all cached data serves as the fallback; sync resumes when connectivity is restored

#### Path Decision Summary

| Operation | Path | Rationale |
|-----------|------|-----------|
| Coaster detection → animation | Local only | <100ms latency requirement |
| Order placement | Local → Firebase (async) | Reliability first, backup second |
| Session start/end | Local → Firebase (async) | Offline resilience |
| Menu / catalog updates | Firebase → local cache | Remote update without redeploy |
| Asset delivery | Firebase Storage → local cache | Remote update without redeploy |
| Multi-table config | Firebase | Central management |
| Analytics | Firebase | Centralized monitoring |

#### Benefits
- Sub-100ms coaster response (local path, zero internet dependency)
- Offline resilience during internet outages (local cache fallback)
- Remote debugging and development visibility (Firebase)
- Easy menu and asset updates without redeploy (Firebase)
- Multi-table venue configuration sync (Firebase)

---

### Architecture Principles

#### Local-First Operation
All essential user and bartender workflows must continue functioning without internet access. The system distinguishes between data that is strictly local and data that is cloud-synced:

**Local only (never sent to cloud during session):**
- Real-time coaster tracking state
- Touch input processing and calibration
- Active coaster-to-drink assignments

**Local primary, Firebase background sync:**
- Active session state (users, slots, color assignments)
- Orders (local is authoritative; Firebase receives async copies)
- Completed session records

**Firebase primary, locally cached:**
- Drink catalog and menu content
- Brand assets (logos, drink images, sprite graphics)
- Venue configuration and multi-table settings

**Firebase only:**
- Analytics and usage telemetry
- Multi-table management and venue-wide configuration

**Cache invalidation:** On startup, the table fetches the latest catalog, assets, and config from Firebase. Cached data is used immediately if Firebase is unreachable. Cache is versioned by a server-provided `updatedAt` timestamp; stale items are replaced on successful sync.

The following workflows must remain fully functional with no internet access:
- session control
- ordering
- coaster assignment
- coaster-triggered animation behavior
- drink arrival updates

#### Separation of Concerns
- **Display app** owns touch processing, coaster tracking, calibration, and visual rendering
- **Embedded backend** owns business state, order state, persistence, and local network APIs

#### Modular Animation Dispatch
Drink visuals are driven by configurable drink profiles rather than hardcoded one-off implementations.

Each drink profile may include:
- drink ID
- ingredient theme
- color palette
- animation family
- effect type
- associated Ingredient Sprite character

---

### Suggested Repository Structure

#### Android Host / Embedded Backend
- Kotlin Android kiosk shell
- Embedded Ktor server
- SQLite / Room persistence
- Device diagnostics and startup management

#### Display Frontend
- React + TypeScript app
- PixiJS rendering layer
- UI flows and tracking engine modules

#### Bartender App
- Native iOS app
- NFC coaster assignment
- Local table control and order management

---

### Final Stack Decision

| Layer | Chosen Stack |
|---|---|
| **Display Host** | Kotlin Android kiosk shell |
| **Display UI** | React + TypeScript |
| **Real-Time Visuals** | PixiJS |
| **Frontend State** | Zustand |
| **Frontend Build Tool** | Vite |
| **Embedded Backend** | Kotlin + Ktor |
| **Local Database** | SQLite |
| **Persistence Layer** | Room |
| **Realtime Communication** | WebSockets |
| **Operational API** | REST |
| **Bartender App** | Native iOS app with NFC support |
| **Cloud Sync / Config** | Firebase Firestore |
| **Asset Storage** | Firebase Storage |
| **Analytics** | Firebase Analytics |

---

## Assumptions / Open Questions

### Assumptions Made

1. **User Assignment:** Bartender assigns users to specific seating positions when starting a session
2. **Color Assignment:** The system auto-assigns colors to User Nodes in a fixed order (e.g., User 1 = Blue, User 2 = Green, etc.)
3. **User Node Spawn Positions:** Predefined spawn positions align with standard seating arrangement at Barcode (4 positions around the square table)
4. **Coaster Inventory:** Barcode has at least 4 unique coaster geometric signatures with NFC tags for the MVP
5. **Network Environment:** The table and bartender iOS app operate on the same local Wi-Fi network at Barcode; internet access is available but not guaranteed
6. **Drink Menu Data:** Barcode provides a structured menu with drink names, ingredients, descriptions, prices, and photos — delivered via Firebase and cached locally
7. **Quiz Logic:** Quiz recommendations use a rule-based or weighted algorithm (not AI-generated) for the MVP
8. **Sprite Character Library:** A library of Ingredient Sprite characters is pre-designed for common ingredients (fruits, spirits, flavors) and hosted in Firebase Storage
9. **Interaction Proximity Threshold:** "Close together" for drink interactions is defined as approximately 10–15cm distance between coaster centroids
10. **Order Capacity:** Maximum 4 simultaneous orders per session (one per user)
11. **Drink Removal Delay:** Sprite despawn occurs after approximately 10–15 seconds of drink removal (prevents accidental removal from triggering immediate despawn)
12. **NFC Reader:** The bartender's iPhone has NFC reading capability enabled (available on iPhone 7 and later with iOS 11+)
13. **Firebase Project:** A Firebase project is provisioned for Tales9 with Firestore, Storage, and Analytics enabled
14. **Venue ID:** Barcode operates as a single-table venue for the MVP; the Firebase data model uses a `venueId / tableId` hierarchy to support future multi-table expansion
15. **Asset Versioning:** Firebase Storage assets are versioned via Firestore metadata (`version` + `updatedAt` fields); the table re-downloads assets only when the server version is newer than the locally cached version
16. **Cache Expiration:** Locally cached menu and config data is considered stale after 24 hours and triggers a background refresh on next startup with connectivity

### Open Questions

1. **Coaster Physical Design:** What is the exact diameter and material specification for the coasters? Are they already manufactured or still in design?
2. **Session Duration:** What is the expected average session length? Does the table auto-timeout after inactivity?
3. **Shared Interaction Opt-In:** Are battle sequences and social games always active, or do users need to explicitly enable them?
4. **Barcode Branding Assets:** Does Barcode have existing brand guidelines, logos, typography, and color palettes to integrate?
5. **NFC Tag Specification:** What NFC tag type is embedded in the coasters (e.g., NTAG213, NTAG215)? What data format is stored on the tag?
6. **Sprite Removal Timing:** What is the exact delay before an Ingredient Sprite despawns after drink removal (currently assumed 10–15 seconds)?
7. **Quiz Question Content:** Has Barcode provided specific quiz questions and answer options, or should we design generic mixology-focused questions for the MVP?
8. **Common Space Default State:** What specific ambient animation or visual theme should display in the Common Space during standby and idle moments?
9. **Firebase Security Rules:** What are the access control boundaries for Firestore and Firebase Storage? Who can write menu data and config — admin SDK only, or venue manager via app?
10. **Offline Cache Expiration Policy:** Should cached menu/config data expire after a fixed duration (currently assumed 24 hours), or should it remain valid indefinitely until a successful sync replaces it?
11. **Multi-Table Venue ID Structure:** What is the Firebase document hierarchy for a multi-table venue? Proposed structure: `venues/{venueId}/tables/{tableId}/sessions/{sessionId}` — does this match expected scale?
12. **Asset Versioning Strategy:** Should assets be versioned by hash (content-addressed) or by a server-managed integer version field? Hash-based versioning avoids cache invalidation bugs but requires infrastructure changes.
13. **Firebase Analytics Consent:** Is guest analytics data subject to any consent or PDPO (Hong Kong Personal Data Privacy Ordinance) requirements at Barcode?

---

**End of Product Requirements Document**

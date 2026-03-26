# Tales9 Spring Work Plan

## 🌟 Key Features

*In shorts, our "Wow" factors:*

1. 📍 **Multi-Object Detection:** The table tracks **multiple** 🥃 glasses and coasters simultaneously with pinpoint accuracy.
2. 🌊 **Reactive Visuals:** Digital ripples, glows, and lines appear instantly under physical objects.
3. 🥂 **"Cheers" Recognition:** Special particle effects trigger when two glasses touch or are brought close together.
4. 🛎️ **Service Interface:** A specific **gesture** signals the "bartender" (backend dashboard) that a refill is needed.
5. 🛡️ **Spill-Proof Design:** The electronics are protected by a liquid-resistant surface (**IP54 rated**).

---

## 📋 User Requirements & Technical Specs


|     | User Requirement     | Technical Specification                    |
| --- | -------------------- | ------------------------------------------ |
| ⚡   | **Instant Reaction** | **Latency < 500ms** (Input to Render loop) |
| 🎯  | **Precision**        | **Accuracy ±5mm** from object center       |
| 🎞️ | **Smooth Visuals**   | **Min 30 FPS** (Targeting 60 FPS)          |
| 💪  | **Durability**       | **IP54 Rating** (Splash/Dust proof)        |
| 👥  | **Multi-User**       | Track **4+ Objects** concurrently          |


## 🚩 Working Plan

**Legend:** 🧠 **Shadow** (PM / Vice-design) | 🛠️ **Dan** (Hardware / Vice-code) | 💻 **Jimmy** (Code / Vice-PM) | 🎨 **Dawoo** (Design / Vice-hardware)


| Dates                             | Phase                        | Task / Activity        | Deliverable / Output                                            | Owner            |
| --------------------------------- | ---------------------------- | ---------------------- | --------------------------------------------------------------- | ---------------- |
| **Feb 1 – Feb 14***(Weeks 1-2)*   | **🌱 Planning & Definition** | **PM Setup**           | Setup Trello/Notion & Define API Structure.                     | 🧠 Shadow        |
|                                   |                              | **Hardware Audit**     | Source materials & CAD Design for table.                        | 🛠️ Dan          |
|                                   |                              | **Env Setup**          | Research sensor libraries & GitHub Repo init.                   | 💻 Jimmy         |
|                                   |                              | **Creative Concept**   | Mood boards & UI/Animation sketches.                            | 🎨 Dawoo         |
|                                   |                              |                        |                                                                 |                  |
| **Feb 15 – Feb 28***(Weeks 3-4)*  | **⚙️ Prototyping**           | **Core Logic**         | **[CRITICAL]** Code Raw Data →→Screen Coordinates logic.        | 💻 Jimmy         |
|                                   |                              | **Mount Building**     | Build sensor frame & test screen heat dissipation.              | 🛠️ Dan          |
|                                   |                              | **Idle Visuals**       | Design background animations (when no drinks present).          | 🎨 Dawoo         |
|                                   |                              | **Doc Check**          | Document "Vertical Slice" progress (Video Proof).               | 🧠 Shadow        |
|                                   |                              |                        |                                                                 |                  |
| **Mar 1 – Mar 14***(Weeks 5-6)*   | **🏗️ Deep Build**           | **Assembly**           | **[CRITICAL]** Full carpentry, waterproofing & screen mounting. | 🛠️ Dan          |
|                                   |                              | **Multi-Touch**        | Implement ghost-touch rejection & calibration.                  | 💻 Jimmy         |
|                                   |                              | **Draft Interactions** | Create "Draft 1" ripples/connection effects.                    | 🎨 Dawoo         |
|                                   |                              | **Backend UI**         | Develop "Service/Bartender" signal interface.                   | 🧠 Shadow        |
|                                   |                              |                        |                                                                 |                  |
| **Mar 15 – Mar 28***(Weeks 7-8)*  | **🔍 Testing**               | **User Testing**       | **[CRITICAL]** Conduct sessions; record feedback/bugs.          | 🧠 Shadow        |
|                                   |                              | **Debugging**          | On-site crash logging & error fixing.                           | 💻 Jimmy         |
|                                   |                              | **Stability Check**    | Monitor hardware for overheating during long runs.              | 🛠️ Dan          |
|                                   |                              | **UX Observation**     | Observe user reactions to visual timing.                        | 🎨 Dawoo         |
|                                   |                              |                        |                                                                 |                  |
| **Mar 29 – Apr 18***(Weeks 9-11)* | **💎 Iterations**            | **Asset Swap**         | **[CRITICAL]** Replace drafts with High-Res final renders.      | 🎨 Dawoo         |
|                                   |                              | **Optimization**       | Reduce latency (<100ms) & clean code.                           | 💻 Jimmy         |
|                                   |                              | **Aesthetics**         | Final painting, edge sealing, and trim work.                    | 🛠️ Dan          |
|                                   |                              | **Report Draft**       | Begin drafting Final Report & Pitch Deck structure.             | 🧠 Shadow        |
|                                   |                              |                        |                                                                 |                  |
| **Apr 19 – May 9***(Weeks 12-14)* | **🚀 Finalizations**         | **Code Freeze**        | Ensure "Offline Mode" works; no new features.                   | 💻 Jimmy         |
|                                   |                              | **Pitch Video**        | Edit 3-min video & design project poster.                       | 🎨 Dawoo         |
|                                   |                              | **Logistics**          | Transport table to demo site & setup.                           | 🛠️ Dan          |
|                                   |                              | **Submission**         | **[GRADED]** Final Report, Video, Repo, & Live Demo.            | 🧠 Shadow (Lead) |


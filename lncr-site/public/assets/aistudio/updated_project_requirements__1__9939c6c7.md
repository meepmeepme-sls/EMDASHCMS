# Project Requirements: Late Night Combat Robotics Calculator

## 1. Project Overview & Architecture
*   **Target Domain:** `latenightcombat.com`
*   **Hosting:** Cloudflare Pages Free Plan (Static SPA deployment).
*   **Tech Stack:** Pure Client-Side JavaScript / React (Vite) + Tailwind CSS. Zero backend databases or server-side runtimes required; all calculations run instantly in the user's browser.
*   **Design Philosophy:** Modular, clean interface emulating Level 5 Robotics (separate pages/tabs per calculator tool), avoiding clutter via progressive disclosure.

## 2. Unit System & Field-Level Conversion
*   **Default Standard:** All internal calculations and default inputs must use **SI Units** (e.g., millimeters, kilograms, meters per second, Joules).
*   **Field-Level Toggles:** Instead of a global unit switcher, each dimensional and weight input field must feature an attached toggle button (e.g., `mm / in`, `kg / lbs`, `m/s / mph`) allowing users to freely mix measurement systems based on personal preference.

## 3. Battery Chemistry & Voltage Modeling
*   **Chemistry Selection:** A sliding/segmented toggle allowing users to choose between:
    *   **LiPo** (Lithium Polymer)
    *   **LiHV** (High Voltage Lithium)
    *   **NiMH** (Nickel-Metal Hydride)
*   **Voltage State Selection:** A toggle for **Nominal** vs. **Max (Fresh off charger)** voltage calculations:
    *   *LiPo:* Nominal $3.7\text{V}$ / cell, Max $4.2\text{V}$ / cell
    *   *LiHV:* Nominal $3.8\text{V}$ / cell, Max $4.35\text{V}$ / cell
    *   *NiMH:* Nominal $1.2\text{V}$ / cell, Max $1.4\text{V}$ / cell
*   **Weight Class Voltage Limits:**
    *   *Ants & Fairies:* $2\text{S}$ to $4\text{S}$
    *   *Beetles:* $3\text{S}$ to $8\text{S}$
    *   *Big Bots:* $4\text{S}$ to $16\text{S}$

## 4. Tournament Compliance & Safety Warnings
*   **Rule Validation:** Real-time checking against common combat robotics safety standards (SPARC and NHRL specifications).
*   **Warning Triggers:** Visually flag or alert users if:
    *   Weapon tip speed or kinetic energy exceeds typical arena/weight class safety thresholds.
    *   Selected battery voltage or cell count exceeds regulation limits for the active weight class.

## 5. Sharing & Exporting Capabilities
*   **URL Query Parameters:** Support configuration sharing via URL query strings (e.g., `latenightcombat.com/weapon?kv=1400&voltage=14.8&ratio=2`), updating dynamically as inputs change so users can copy-paste links directly.
*   **CSV Export:** Provide a download button on calculation results to export the complete configuration and performance metrics as a `.csv` file.

## 6. Core Modules (Pages)
1.  **Drivetrain Speed Calculator:** Motor KV, cell count, gear ratio, wheel diameter, and calculated vehicle speed.
2.  **Weapon Kinetic Energy & Tip Speed:** Geometry presets (Disk, Bar, Tube/Drum), material densities (Steel, Titanium, Aluminum), MOI, and energy storage in Joules.
3.  **Advanced Electronics & Spin-Up:** Motor and battery internal resistance ($R_i$), system resistance ($R_{sys}$), stall current, stall torque, and asymptotic spin-up time curves.
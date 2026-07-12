---
version: alpha
name: Personal Portfolio Design System
description: A premium void-black developer system with monospace accents, high-contrast typography, and rare atmospheric glows.
colors:
  # The Void Palette
  canvas: "#000000"           # Pure ink background
  surface-card: "#09090b"     # Subtle lift for feature/project cards
  surface-elevated: "#121214" # High-emphasis surfaces / hover states
  surface-deep: "#050507"     # Deep wells (ideal for code windows)
  
  # High Contrast Typography
  primary: "#fcfdff"          # Brightest pixel (headings, active states)
  body: "rgba(252, 253, 255, 0.86)" # Highly legible off-white text
  muted: "rgba(252, 253, 255, 0.60)" # Faint captions / metadata
  border: "#1a1a1e"           # Crisp, thin borders
  
  # Interactive High-Voltage Accents
  accent-green: "#11ff99"     # "Active status" glow or primary CTAs
  accent-blue: "#3b9eff"      # Focus indicators / links
  accent-purple: "#7928ca"    # Optional second-degree brand glow
typography:
  display-xl:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: "600"
    lineHeight: "1.1"
    letterSpacing: "-0.04em"
  heading-lg:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: "600"
    lineHeight: "1.3"
    letterSpacing: "-0.02em"
  body-md:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: "400"
    lineHeight: "1.6"
  code:
    fontFamily: "Geist Mono, monospace"
    fontSize: "0.85rem"
    lineHeight: "1.6"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "96px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-secondary:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    border: "1px solid {colors.border}"
    padding: "10px 20px"
  project-card:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.lg}"
    border: "1px solid {colors.border}"
    padding: "{spacing.lg}"
---

## Overview

A premium, performance-oriented void-black canvas designed specifically to showcase high-quality software, AI tools, and technical projects.

## Colors

- **The Canvas (#000000):** True black keeps screen emissions low and draws maximum focus to typography.
- **The Accents:**
  - **Green Accent (#11ff99):** Represents live, active systems. Use it for "Open to work," status indicators, and high-priority action badges.
  - **Blue Accent (#3b9eff):** Used sparingly for links and subtle backdrop glows.

## Typography

Utilizes the **Geist** family of typefaces. Headlines are heavily weighted (600) with tight, negative tracking to look dense and precise. Monospace elements display technical details.

## Components

### project-card

The central canvas item. Displays personal repositories, articles, or AI agents.
- Thin 1px border (`#1a1a1e`) with curved corners (`12px`).
- On-hover, subtle scale or a tiny shift in border-color to `rgba(252,253,255,0.15)`.

### status-badge

A floating indicator saying "Building Jarvis" or "System Online."
- Background: `rgba(17, 255, 153, 0.1)`
- Text: `{colors.accent-green}`
- Padding: `4px 8px`, rounded to `full`.

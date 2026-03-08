# Duelo - Product Requirements Document

## Overview
Duelo is a competitive real-time quiz mobile app built with Expo (React Native) and FastAPI backend with MongoDB.

## Core Features
- Real-time quiz duels between players
- Theme-based categories (Screen, Arena, Legends, etc.)
- Player profiles with XP tracking
- Chat/messaging system
- Leaderboard
- Matchmaking system

## Architecture
- **Frontend**: Expo (React Native) with Expo Router
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Platform**: Cross-platform (iOS, Android, Web)

## Completed Work

### Session 1 - Bug Fixes
- Fixed page overlap bug on web preview (disabled stack animations)
- Fixed cosmic background not appearing on all pages
- Fixed background being overly zoomed on web
- Fixed profile page crash on Expo Go (null safety with optional chaining)
- Created platform-aware CosmicBackground component

### Session 2 - Icon Updates (March 2026)
- Replaced all tab bar (footer) icons with custom game-themed .webp images:
  - Accueil: Castle icon (Home_icon.webp)
  - MESSAGE: Heart with people icon (Social_icon.webp)
  - Jouer: Crossed swords icon (Play_icon.webp)
  - Thèmes: Cards with lightning icon (Themes_icon.webp)
  - Profil: Person silhouette icon (Profile_icon.webp)

## Key Files
- `frontend/app/(tabs)/_layout.tsx` - Tab navigator with custom icons
- `frontend/app/_layout.tsx` - Root stack navigator
- `frontend/components/CosmicBackground.tsx` - Background component
- `frontend/assets/tabs/` - Custom tab icon images (.webp)
- `backend/server.py` - FastAPI backend

## Backlog
- P2: Review redundancy of accueil.tsx vs home.tsx in tabs
- P3: General code refactoring

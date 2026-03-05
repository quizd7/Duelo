#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 1
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Duelo - Competitive multiplayer quiz app with advanced engagement system (XP, win streaks, MMR, seasonal leaderboards). Complete frontend for engagement system including profile stats, matchmaking versus screen, and glow effects."

backend:
  - task: "Guest Registration API"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Guest registration works. Creates user with unique pseudo."

  - task: "Game Questions API"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Returns 7 random questions per category."

  - task: "Matchmaking API with Bot"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Returns bot opponent with level, streak, and streak_badge."

  - task: "Match Submit with XP Calculation"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Fixed TOTAL_QUESTIONS bug. Now calculates XP with base, victory, perfection, giant_slayer, and streak bonuses. Updates user MMR, streak, and seasonal XP."
        - working: true
          agent: "testing"
          comment: "PASSED - XP calculation working perfectly. Base XP (score*2), Victory bonus (50), Perfection bonus (50 for 7/7 correct), Giant Slayer bonus (100 for beating 15+ level higher opponent), Streak bonus calculated correctly. All XP breakdown fields present and accurate. MMR updates properly. Winner assignment correct."

  - task: "Profile API with Advanced Stats"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Returns user stats including level, title, mmr, streak_badge, seasonal_total_xp, and match history with xp_breakdown."
        - working: true
          agent: "testing"
          comment: "PASSED - Profile API working perfectly. Returns all required fields: level, title, mmr, current_streak, streak_badge, seasonal_total_xp, win_rate. Match history includes xp_earned and xp_breakdown. Data types and ranges validated correctly."

  - task: "Leaderboard API with Seasonal View"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Returns leaderboard with alltime/seasonal views, includes streak_badge and level."
        - working: true
          agent: "testing"
          comment: "PASSED - Leaderboard API working perfectly. Both alltime and seasonal views return correct data structure with required fields: pseudo, avatar_seed, total_xp, level, streak_badge, rank. Query parameters scope=world, view=alltime/seasonal, limit=10 all working correctly."

  - task: "Seed Questions API"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Seeds 30 questions across 3 categories."

frontend:
  - task: "Profile Screen with Advanced Stats"
    implemented: true
    working: true
    file: "frontend/app/(tabs)/profile.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "New profile with level card, XP progress bar, streak badge (fire/bolt/glow), MMR display, seasonal XP, category XP bars, and match history with XP earned."

  - task: "Matchmaking Versus Screen"
    implemented: true
    working: true
    file: "frontend/app/matchmaking.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "New versus screen after search. Shows both players with animations, opponent streak badge, level, and glow effect for 10+ streaks."

  - task: "Leaderboard with Seasonal/AllTime"
    implemented: true
    working: true
    file: "frontend/app/(tabs)/leaderboard.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Shows All-Time and Seasonal toggle, streak badges, glow text for 10+ streaks."

  - task: "Home Screen with Streak Display"
    implemented: true
    working: true
    file: "frontend/app/(tabs)/home.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Updated to show current streak badge in header. Fetches user data on load."

  - task: "Results Screen with XP Breakdown"
    implemented: true
    working: true
    file: "frontend/app/results.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Shows detailed XP breakdown: base, victory, perfection, giant_slayer, streak bonuses."

metadata:
  created_by: "main_agent"
  version: "2.0"
  test_sequence: 2
  run_ui: false

test_plan:
  current_focus: []
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    - agent: "main"
      message: "Completed the advanced engagement system frontend. Fixed TOTAL_QUESTIONS bug in backend. Updated profile.tsx with level card, MMR, streak badges, glow effect. Updated matchmaking.tsx with versus screen showing opponent streak. Updated home.tsx with streak display. All screens verified via screenshots. Please test the backend APIs: submit match (XP calculation), profile (advanced stats), and leaderboard (seasonal view)."
    - agent: "testing"
      message: "BACKEND TESTING COMPLETE ✅ - All high-priority APIs tested and working perfectly. Match Submit API: XP calculation accurate with all bonus types (base, victory, perfection, giant slayer, streak). Profile API: returns all advanced stats including level, title, MMR, win rate, streak badges, seasonal XP, match history with XP breakdown. Leaderboard API: both alltime and seasonal views working with all required fields. Matchmaking API: returns proper bot opponent data. All API responses validated for structure and data types. Total tests: 6 passed, 0 failed."

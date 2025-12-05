# No Changes Required - Tracker Processing Toggle

## Description
No changes are required in the discord-bot repository for the guild-level tracker processing toggle feature.

## Background
The discord-bot acts as a client to the league-api, calling internal API endpoints to register and add trackers. The enforcement of guild-level tracker processing settings happens entirely in the backend API layer.

## Current Behavior
- `/register` command calls `apiService.registerTrackers()` → internal API endpoint
- `/add-tracker` command calls `apiService.addTracker()` → internal API endpoint
- The API handles all business logic including whether to process trackers

## Verification
- [ ] Verify bot commands continue to work when processing is disabled
  - Trackers should still be registered/added
  - User should receive success message
  - Processing decision happens in API, not bot
- [ ] No code changes needed
- [ ] No new dependencies needed

## Notes
If future enhancements require bot-side awareness of processing status (e.g., different success messages), that would be a separate feature. For now, the bot remains a thin client layer.

## Related Issues
- Backend issue: Add Guild-Level Tracker Processing Toggle
- Frontend issue: Add UI for guild-level tracker processing toggle


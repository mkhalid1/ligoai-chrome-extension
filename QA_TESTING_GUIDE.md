# QA Testing Guide - Social Platform Engagement Feature

## Overview
This guide covers testing the newly migrated engagement functionality for Reddit, Twitter/X, and Facebook. The feature adds "Engage" buttons to posts on these platforms that allow users to send post content to the LiGo sidebar for comment generation.

## Prerequisites
1. **LiGo Extension**: Load the development build (`build/chrome-mv3-dev`) in Chrome
2. **LiGo Account**: Ensure you have a valid LiGo account and are signed in
3. **Test Platforms**: Access to Reddit, Twitter/X, and Facebook accounts
4. **Permissions**: Grant the extension necessary permissions when prompted

## Build Instructions
```bash
cd ligoai-chrome-extension
npm run build:dev
```
Load the extension from `build/chrome-mv3-dev` folder in Chrome Developer Mode.

---

## Test Scenarios

### 🔴 Reddit Testing (`reddit.com`)

#### ✅ Test Case R1: Feed Page Button Visibility
**Steps:**
1. Navigate to `https://reddit.com` or `https://www.reddit.com` (home feed)
2. Browse to any subreddit feed (e.g., `https://reddit.com/r/technology`)
3. Look for posts with the LiGo "Engage" button

**Expected Results:**
- Blue "Engage" buttons appear on Reddit posts in feed views (LiGo blue: #106AD8)
- Buttons are positioned in the post header area, NOT covering the three dots menu
- Buttons have LiGo icon + "Engage" text with proper vertical alignment
- Buttons have rounded corners and LiGo brand styling

#### ✅ Test Case R2: Individual Post Page Widget
**Steps:**
1. Navigate to an individual Reddit post (e.g., `https://www.reddit.com/r/ArtificialInteligence/comments/1ndi9sr/...`)
2. Look for the LiGo floating action button (FAB) widget on the right side
3. Hover over the LiGo widget to see the menu

**Expected Results:**
- NO "Engage" buttons visible on individual post pages
- LiGo widget (blue FAB) appears on the right side of the screen
- Widget menu shows "Generate Comments" option (in addition to existing options)
- Widget menu shows: Generate Post, Generate Comments, Save to Inspirations, Hide on this site

#### ✅ Test Case R3: Feed Page Engage Button Functionality
**Steps:**
1. On a Reddit feed page, click an "Engage" button on any post
2. Observe the button state change and sidebar behavior

**Expected Results:**
- Button shows "Processing..." briefly, then "Sent!"
- Button color changes to green during success state
- LiGo sidebar opens automatically
- Post title and content appear in sidebar textarea
- Auto-generation of comments occurs (if enabled in settings)

#### ✅ Test Case R4: Individual Post Page Widget Functionality
**Steps:**
1. On an individual Reddit post page, hover over the LiGo widget
2. Click "Generate Comments" from the menu
3. Verify sidebar interaction

**Expected Results:**
- Menu item shows loading state briefly
- LiGo sidebar opens automatically
- Post title and content appear in sidebar textarea
- Comments are automatically generated (not post content)
- Same content extraction as feed page, but optimized for comment generation

#### ✅ Test Case R5: Content Extraction Accuracy
**Steps:**
1. Test on different types of Reddit posts:
   - Text posts with titles and body text
   - Link posts with titles only
   - Posts with long content (truncated)
2. Verify extracted content quality

**Expected Results:**
- Post titles are correctly extracted
- Post body text is extracted when available
- Content formatting is preserved (line breaks, paragraphs)
- No HTML artifacts in extracted text

#### ✅ Test Case R6: UI Integration & Positioning
**Steps:**
1. Navigate to Reddit feed and locate "Engage" buttons
2. Verify button positioning relative to Reddit's three dots menu
3. Check icon and text alignment within buttons
4. Test hover effects and visual feedback

**Expected Results:**
- Buttons do NOT cover or interfere with Reddit's three dots overflow menu
- LiGo icon is perfectly centered vertically within the button
- "Engage" text is properly aligned next to the icon
- Button uses LiGo blue color scheme (#106AD8), not Reddit orange
- Hover effect shows darker blue (#0E5CC7)
- Proper spacing between button and other Reddit UI elements

#### ✅ Test Case R7: Performance & Reliability
**Steps:**
1. Scroll through Reddit feed rapidly
2. Test on both old and new Reddit interfaces
3. Test with dynamically loaded content
4. Click multiple buttons in quick succession

**Expected Results:**
- No duplicate buttons appear
- Buttons appear on newly loaded posts
- No console errors
- System remains responsive

---

### 🐦 Twitter/X Testing (`x.com` / `twitter.com`)

#### ✅ Test Case T1: Basic Button Visibility  
**Steps:**
1. Navigate to `https://x.com` or `https://twitter.com`
2. Browse the home timeline
3. Look for the LiGo "Engage" buttons on tweets

**Expected Results:**
- Blue Twitter-themed "Engage" buttons appear on tweets
- Buttons are positioned in the tweet action bar
- Buttons have rounded Twitter-style design
- Buttons appear on both feed and individual tweet pages

#### ✅ Test Case T2: Button Functionality
**Steps:**
1. Click on an "Engage" button on any tweet
2. Monitor button state changes
3. Verify sidebar interaction

**Expected Results:**
- Button shows "Processing..." then "Sent!"
- LiGo sidebar opens
- Tweet text content appears in sidebar
- Auto-generation works if enabled

#### ✅ Test Case T3: Content Extraction Quality
**Steps:**
1. Test on various tweet types:
   - Short text tweets
   - Long text tweets (280 characters)
   - Tweets with mentions (@username)
   - Tweets with hashtags (#hashtag)
   - Tweets with URLs
   - Thread replies

**Expected Results:**
- Tweet text is accurately extracted
- Mentions and hashtags are preserved
- URLs are included in extracted content
- Text formatting is maintained

#### ✅ Test Case T4: Cross-Platform Compatibility
**Steps:**
1. Test on both `x.com` and `twitter.com` domains
2. Test navigation between different Twitter pages
3. Test with Twitter's dynamic content loading

**Expected Results:**
- Functionality works on both domains
- Buttons persist through navigation
- Performance remains consistent

---

### 📘 Facebook Testing (`facebook.com`)

#### ✅ Test Case F1: Basic Button Visibility
**Steps:**
1. Navigate to `https://facebook.com`
2. Browse the news feed
3. Look for LiGo "Engage" buttons on posts

**Expected Results:**
- Blue Facebook-themed "Engage" buttons appear
- Buttons are positioned appropriately within posts
- Buttons adapt to both feed view and post detail view
- Facebook-style rounded button design

#### ✅ Test Case F2: Button Functionality
**Steps:**
1. Click "Engage" on a Facebook post
2. Monitor the interaction flow
3. Check sidebar functionality

**Expected Results:**
- Button processes and provides feedback
- Sidebar opens with post content
- Content generation works as expected

#### ✅ Test Case F3: Content Extraction & "See More"
**Steps:**
1. Test on posts with "See More" links
2. Test on regular short posts
3. Test on posts with various formatting

**Expected Results:**
- "See More" is automatically clicked to expand content
- Full post text is extracted after expansion
- Text formatting is preserved
- No truncated content issues

#### ✅ Test Case F4: Layout Adaptability
**Steps:**
1. Test in Facebook feed view
2. Test in individual post view
3. Test with different post types (status, photos, links)

**Expected Results:**
- Button positioning adapts to different layouts
- Functionality works across all post types
- No visual conflicts with Facebook's UI

---

## 🔧 Integration Testing

### ✅ Test Case I1: Authentication Flow
**Steps:**
1. Test engagement buttons while signed out of LiGo
2. Sign in to LiGo and test again
3. Sign out during usage

**Expected Results:**
- Signed out users see "Please sign in" notification
- Sidebar opens for authentication
- Functionality works normally after sign-in
- Graceful handling of auth state changes

### ✅ Test Case I2: Settings Integration
**Steps:**
1. Enable "Auto-generate comments" in LiGo settings
2. Test engagement buttons
3. Disable auto-generation and test again

**Expected Results:**
- Auto-generation respects user settings
- Comments generate automatically when enabled
- Only content transfer occurs when disabled
- Settings changes take effect immediately

### ✅ Test Case I3: Sidebar Communication
**Steps:**
1. Test engagement while sidebar is already open
2. Test with sidebar closed
3. Test rapid successive engagements

**Expected Results:**
- Content appears in sidebar reliably
- No content duplication
- Smooth communication between content scripts and sidebar
- Proper handling of sidebar state

---

## 🔍 Regression Testing

### ✅ Test Case R1: Existing LinkedIn Functionality  
**Steps:**
1. Test all existing LinkedIn features:
   - Profile extraction ("Save to LiGo")
   - Comment generation
   - Bulk reply analysis
   - Context menus
2. Compare with previous version behavior

**Expected Results:**
- All LinkedIn functionality remains intact
- No performance degradation
- All existing features work as before

### ✅ Test Case R2: Extension Performance
**Steps:**
1. Monitor extension memory usage
2. Test on pages with many posts
3. Leave extension running for extended periods
4. Check for memory leaks

**Expected Results:**
- No significant memory leaks
- Reasonable CPU usage
- Responsive performance on all platforms
- No browser slowdown

### ✅ Test Case R3: Cross-Platform Interference
**Steps:**
1. Navigate between LinkedIn, Reddit, Twitter, and Facebook
2. Test engagement buttons on each platform
3. Verify no cross-contamination of functionality

**Expected Results:**
- Platform-specific styling maintained
- No interference between platform scripts
- Clean transitions between platforms

---

## 🚨 Error Scenarios

### ✅ Test Case E1: Network Issues
**Steps:**
1. Disconnect internet during engagement
2. Test with slow network connections
3. Test with intermittent connectivity

**Expected Results:**
- Graceful error handling
- Appropriate user notifications
- No extension crashes
- Retry mechanisms work

### ✅ Test Case E2: Platform UI Changes
**Steps:**
1. Test on different Reddit interfaces (old/new)
2. Test if platform updates break functionality
3. Test with browser zoom levels

**Expected Results:**
- Functionality adapts to different interfaces
- Buttons remain accessible at different zoom levels
- Graceful degradation if selectors fail

### ✅ Test Case E3: Extension Reload/Update
**Steps:**
1. Reload the extension while on test platforms
2. Update the extension
3. Test hot reloading during development

**Expected Results:**
- Clean extension reinitialization
- No orphaned elements on pages
- Functionality resumes after reload

---

## 📊 Test Results Template

| Test Case | Platform | Status | Notes |
|-----------|----------|---------|-------|
| R1 | Reddit | ✅/❌ | |
| R2 | Reddit | ✅/❌ | |
| R3 | Reddit | ✅/❌ | |
| R4 | Reddit | ✅/❌ | |
| T1 | Twitter/X | ✅/❌ | |
| T2 | Twitter/X | ✅/❌ | |
| T3 | Twitter/X | ✅/❌ | |
| T4 | Twitter/X | ✅/❌ | |
| F1 | Facebook | ✅/❌ | |
| F2 | Facebook | ✅/❌ | |
| F3 | Facebook | ✅/❌ | |
| F4 | Facebook | ✅/❌ | |
| I1 | All | ✅/❌ | |
| I2 | All | ✅/❌ | |
| I3 | All | ✅/❌ | |

---

## 🐛 Bug Reporting

When reporting issues, please include:

1. **Platform**: Reddit/Twitter/Facebook
2. **Browser**: Chrome version
3. **Extension Version**: 2.0.6 (Dev)
4. **Steps to Reproduce**: Detailed steps
5. **Expected vs Actual**: What should happen vs what happened
6. **Screenshots**: If applicable
7. **Console Errors**: Check browser developer console
8. **Network Tab**: For API-related issues

---

## 📝 Success Criteria

The migration is considered successful when:

- ✅ All engagement buttons appear correctly on all platforms
- ✅ Content extraction works accurately for all post types
- ✅ Sidebar integration functions smoothly
- ✅ No existing LinkedIn functionality is broken
- ✅ Performance remains acceptable across all platforms
- ✅ Error handling is robust and user-friendly
- ✅ Authentication and settings integration work properly

---

## 📞 Support

For technical issues during testing:
1. Check browser console for errors
2. Verify extension permissions
3. Ensure latest build is loaded
4. Test in incognito mode to rule out conflicts

---

*This QA guide covers the successful migration of engagement functionality from the legacy extension to the new Plasmo-based architecture. The modular approach ensures maintainability while preserving all original functionality.*
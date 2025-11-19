# Lyrics Display Application - Requirements Document

## 1. Application Overview

The Lyrics Display Application is a real-time, multi-language lyrics presentation system designed for church worship services. It provides synchronized display of song lyrics across multiple devices, supporting Tamil, Hindi, and English languages with real-time updates and flexible presentation options.

### Key Components:
- **Controller Interface** - Admin interface for managing and controlling lyrics
- **Live Display Interface** - Public-facing display for congregation viewing
- **Firebase Integration** - Real-time database and Firestore for data persistence and synchronization

## 2. Core Features

### 2.1 Multi-Language Support
- **Supported Languages**: Tamil, Hindi, English
- **Language Toggle**: Ability to show/hide specific languages dynamically
- **Individual Font Sizing**: Each language can have its own font size (default: 20px)
- **Language Selection**: Checkbox controls for enabling/disabling language display

### 2.2 Lyrics Management

#### Adding Lyrics
- **Title Field** (Required): Primary song title
- **Alternative Title Field** (Optional): Secondary or translated title
- **Lyrics Input**: Separate text areas for each language (Tamil, Hindi, English)
- **Section Counter**: Real-time counting of lyrics sections/verses as user types
- **Storage**: Lyrics stored in Firestore database with unique document IDs

#### Lyrics List Display
- Displays all available songs from Firestore
- Click-to-select functionality for preview
- Dynamic list updates via Firestore listeners
- "+ Add" button to open lyrics creation dialog

### 2.3 Display Control System

#### Preview Control
- **Section Navigation**: Numbered buttons for each verse/section
- **Current Index Tracking**: Highlights active section
- **Real-time Updates**: Changes reflect immediately in Firebase Realtime Database
- **Automatic Capitalization**: First letter of each word capitalized on display

#### Alignment Options
Three display modes available:
1. **Top-Bottom**: Languages stacked vertically
2. **Side-by-Side**: Languages displayed horizontally
3. **Top-Left/Bottom-Right**: Diagonal layout arrangement

#### Live Mode Control
- **Live/Stop Toggle**: Button to enable/disable live display
- **Status Indication**:
  - Green button = Ready to go live
  - Red button = Currently live
- **Default Display**: Shows "Shalom" when not live

### 2.4 Real-Time Synchronization

#### Firebase Realtime Database Structure:
- **Preview Path**: Stores current selected lyrics ID
- **Live Path**: Stores live display state and settings
  - `currentIndex`: Current verse/section being displayed
  - `alignment`: Current alignment mode
  - `isLive`: Live status boolean
  - `visible_langs`: Array of enabled languages
  - `tamilfontSize`: Tamil font size setting
  - `hindifontSize`: Hindi font size setting
  - `englishfontSize`: English font size setting

## 3. Data Parsing and Handling

### 3.1 Lyrics Text Parsing

#### Section Separation
- **Delimiter**: Double newline (`\n\n`) separates verses/sections
- **Processing**: `split(/\n\s*\n/)` regex pattern handles variations in spacing
- **Empty Line Handling**: Single newlines preserved within sections

#### Line Break Processing (addNewLineElem function)
```javascript
// Current implementation:
lyrics.split("\n")
  .map((line) => (line.trim() ? line + "\\n" : ""))
```
- Splits lyrics by newline characters
- Adds `\n` marker to non-empty lines for display formatting
- Removes empty lines from storage

### 3.2 Display Text Formatting

#### Text Transformation
- **Capitalization**: `replace(/\b\w/g, (l) => l.toUpperCase())`
  - Capitalizes first letter of each word
  - Applied during rendering, not storage
- **Section Access**: Uses array indexing with currentIndex
- **Fallback**: Empty string if section doesn't exist

### 3.3 Data Flow

1. **Lyrics Creation**:
   - User inputs → Form validation → Text parsing → Firestore storage

2. **Lyrics Selection**:
   - Click song → Update preview path → Fetch from Firestore → Parse sections

3. **Live Display**:
   - Controller changes → Realtime DB update → Live page receives → Parse & display

4. **Settings Sync**:
   - Font size/alignment/language changes → Realtime DB → All connected clients update

## 4. User Interface Components

### 4.1 Controller Page Components
- **LyricsControlBar**: Top control panel with language, alignment, and live controls
- **LyricsList**: Left sidebar with song list and add functionality
- **LyricsPreviewControl**: Main preview area with navigation controls

### 4.2 Live Page Components
- **LiveLyricsBlock**: Full-screen lyrics display component
- **Dynamic Styling**: Responsive to alignment and font size settings

## 5. Technical Architecture

### 5.2 State Management
- **Local State**: React hooks (useState, useEffect, useRef)
- **Real-time State**: Firebase listeners (onValue, onSnapshot)
- **Unsubscribe Pattern**: Cleanup functions to prevent memory leaks

### 5.3 Firebase Configuration
- **Firestore**: Document storage for lyrics content
- **Realtime Database**: Live synchronization of display state
- **Regional Endpoint**: Asia-Southeast1 for optimized latency

## 6. Security and Performance Considerations

### 6.1 Current Implementation
- Public read/write access (requires security rules configuration)
- Firebase API keys exposed in client code
- Real-time listeners with proper cleanup

## 7. Future Enhancement Opportunities

1. **Search Functionality**: Add search bar for lyrics list
2. **Keyboard Navigation**: Arrow keys for section navigation
3. **Themes**: Dark/light mode support
4. **Export/Import**: Backup and restore lyrics database
5. **Verse Highlighting**: Highlight specific lines within sections
6. **Transition Effects**: Smooth transitions between sections
7. **Preview Mode**: See next section while displaying current
8. **History Tracking**: Log of recently displayed songs
9. **Playlist Feature**: Pre-arranged song sequences
10. **Mobile Control App**: Remote control from mobile devices

## 8. Known Issues and Limitations

1. **No Authentication**: Currently no user access control
2. **Fixed Languages**: Hard-coded to three specific languages
3. **No Offline Support**: Requires constant internet connection
4. **Limited Text Formatting**: No support for bold, italic, or colors
5. **No Media Support**: Text-only, no images or videos
6. **Single Database**: All users share same lyrics database
7. **No Versioning**: No history or version control for lyrics edits


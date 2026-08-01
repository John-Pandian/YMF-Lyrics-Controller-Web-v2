import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { ref, set, onValue } from 'firebase/database';
import { db, realtimeDb } from '../firebase_client';
import './App.css';

// Helper function to parse lyrics sections
const parseLyricsSections = (text) => {
  if (!text) return [];
  return text.split(/\n\s*\n/).filter(section => section.trim());
};

// Helper function to capitalize first letter of each word
const capitalizeWords = (text) => {
  if (!text) return '';
  return text.replace(/\b\w/g, (l) => l.toUpperCase());
};

// Bible structure data with chapters and verses
const BIBLE_STRUCTURE = [
  { name: 'Genesis', chapters: 50, verses: [31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26] },
  { name: 'Exodus', chapters: 40, verses: [22,25,22,31,23,30,25,32,35,29,10,51,22,31,27,36,16,27,25,26,36,31,33,18,40,37,21,43,46,38,18,35,23,35,35,38,29,31,43,38] },
  { name: 'Leviticus', chapters: 27, verses: [17,16,17,35,19,30,38,36,24,20,47,8,59,57,33,34,16,30,37,27,24,33,44,23,55,46,34] },
  { name: 'Numbers', chapters: 36, verses: [54,34,51,49,31,27,89,26,23,36,35,16,33,45,41,50,13,32,22,29,35,41,30,25,18,65,23,31,40,16,54,42,56,29,34,13] },
  { name: 'Deuteronomy', chapters: 34, verses: [46,37,29,49,33,25,26,20,29,22,32,32,18,29,23,22,20,22,21,20,23,30,25,22,19,19,26,68,29,20,30,52,29,12] },
  { name: 'Joshua', chapters: 24, verses: [18,24,17,24,15,27,26,35,27,43,23,24,33,15,63,10,18,28,51,9,45,34,16,33] },
  { name: 'Judges', chapters: 21, verses: [36,23,31,24,31,40,25,35,57,18,40,15,25,20,20,31,13,31,30,48,25] },
  { name: 'Ruth', chapters: 4, verses: [22,23,18,22] },
  { name: '1 Samuel', chapters: 31, verses: [28,36,21,22,12,21,17,22,27,27,15,25,23,52,35,23,58,30,24,42,15,23,29,22,44,25,12,25,11,31,13] },
  { name: '2 Samuel', chapters: 24, verses: [27,32,39,12,25,23,29,18,13,19,27,31,39,33,37,23,29,33,43,26,22,51,39,25] },
  { name: '1 Kings', chapters: 22, verses: [53,46,28,34,18,38,51,66,28,29,43,33,34,31,34,34,24,46,21,43,29,53] },
  { name: '2 Kings', chapters: 25, verses: [18,25,27,44,27,33,20,29,37,36,21,21,25,29,38,20,41,37,37,21,26,20,37,20,30] },
  { name: '1 Chronicles', chapters: 29, verses: [54,55,24,43,26,81,40,40,44,14,47,40,14,17,29,43,27,17,19,8,30,19,32,31,31,32,34,21,30] },
  { name: '2 Chronicles', chapters: 36, verses: [17,18,17,22,14,42,22,18,31,19,23,16,22,15,19,14,19,34,11,37,20,12,21,27,28,23,9,27,36,27,21,33,25,33,27,23] },
  { name: 'Ezra', chapters: 10, verses: [11,70,13,24,17,22,28,36,15,44] },
  { name: 'Nehemiah', chapters: 13, verses: [11,20,32,23,19,19,73,18,38,39,36,47,31] },
  { name: 'Esther', chapters: 10, verses: [22,23,15,17,14,14,10,17,32,3] },
  { name: 'Job', chapters: 42, verses: [22,13,26,21,27,30,21,22,35,22,20,25,28,22,35,22,16,21,29,29,34,30,17,25,6,14,23,28,25,31,40,22,33,37,16,33,24,41,30,24,34,17] },
  { name: 'Psalms', chapters: 150, verses: [6,12,8,8,12,10,17,9,20,18,7,8,6,7,5,11,15,50,14,9,13,31,6,10,22,12,14,9,11,12,24,11,22,22,28,12,40,22,13,17,13,11,5,26,17,11,9,14,20,23,19,9,6,7,23,13,11,11,17,12,8,12,11,10,13,20,7,35,36,5,24,20,28,23,10,12,20,72,13,19,16,8,18,12,13,17,7,18,52,17,16,15,5,23,11,13,12,9,9,5,8,28,22,35,45,48,43,13,31,7,10,10,9,8,18,19,2,29,176,7,8,9,4,8,5,6,5,6,8,8,3,18,3,3,21,26,9,8,24,13,10,7,12,15,21,10,20,14,9,6] },
  { name: 'Proverbs', chapters: 31, verses: [33,22,35,27,23,35,27,36,18,32,31,28,25,35,33,33,28,24,29,30,31,29,35,34,28,28,27,28,27,33,31] },
  { name: 'Ecclesiastes', chapters: 12, verses: [18,26,22,16,20,12,29,17,18,20,10,14] },
  { name: 'Song of Solomon', chapters: 8, verses: [17,17,11,16,16,13,13,14] },
  { name: 'Isaiah', chapters: 66, verses: [31,22,26,6,30,13,25,22,21,34,16,6,22,32,9,14,14,7,25,6,17,25,18,23,12,21,13,29,24,33,9,20,24,17,10,22,38,22,8,31,29,25,28,28,25,13,15,22,26,11,23,15,12,17,13,12,21,14,21,22,11,12,19,12,25,24] },
  { name: 'Jeremiah', chapters: 52, verses: [19,37,25,31,31,30,34,22,26,25,23,17,27,22,21,21,27,23,15,18,14,30,40,10,38,24,22,17,32,24,40,44,26,22,19,32,21,28,18,16,18,22,13,30,5,28,7,47,39,46,64,34] },
  { name: 'Lamentations', chapters: 5, verses: [22,22,66,22,22] },
  { name: 'Ezekiel', chapters: 48, verses: [28,10,27,17,17,14,27,18,11,22,25,28,23,23,8,63,24,32,14,49,32,31,49,27,17,21,36,26,21,26,18,32,33,31,15,38,28,23,29,49,26,20,27,31,25,24,23,35] },
  { name: 'Daniel', chapters: 12, verses: [21,49,30,37,31,28,28,27,27,21,45,13] },
  { name: 'Hosea', chapters: 14, verses: [11,23,5,19,15,11,16,14,17,15,12,14,16,9] },
  { name: 'Joel', chapters: 3, verses: [20,32,21] },
  { name: 'Amos', chapters: 9, verses: [15,16,15,13,27,14,17,14,15] },
  { name: 'Obadiah', chapters: 1, verses: [21] },
  { name: 'Jonah', chapters: 4, verses: [17,10,10,11] },
  { name: 'Micah', chapters: 7, verses: [16,13,12,13,15,16,20] },
  { name: 'Nahum', chapters: 3, verses: [15,13,19] },
  { name: 'Habakkuk', chapters: 3, verses: [17,20,19] },
  { name: 'Zephaniah', chapters: 3, verses: [18,15,20] },
  { name: 'Haggai', chapters: 2, verses: [15,23] },
  { name: 'Zechariah', chapters: 14, verses: [21,13,10,14,11,15,14,23,17,12,17,14,9,21] },
  { name: 'Malachi', chapters: 4, verses: [14,17,18,6] },
  { name: 'Matthew', chapters: 28, verses: [25,23,17,25,48,34,29,34,38,42,30,50,58,36,39,28,27,35,30,34,46,46,39,51,46,75,66,20] },
  { name: 'Mark', chapters: 16, verses: [45,28,35,41,43,56,37,38,50,52,33,44,37,72,47,20] },
  { name: 'Luke', chapters: 24, verses: [80,52,38,44,39,49,50,56,62,42,54,59,35,35,32,31,37,43,48,47,38,71,56,53] },
  { name: 'John', chapters: 21, verses: [51,25,36,54,47,71,53,59,41,42,57,50,38,31,27,33,26,40,42,31,25] },
  { name: 'Acts', chapters: 28, verses: [26,47,26,37,42,15,60,40,43,48,30,25,52,28,41,40,34,28,41,38,40,30,35,27,27,32,44,31] },
  { name: 'Romans', chapters: 16, verses: [32,29,31,25,21,23,25,39,33,21,36,21,14,23,33,27] },
  { name: '1 Corinthians', chapters: 16, verses: [31,16,23,21,13,20,40,13,27,33,34,31,13,40,58,24] },
  { name: '2 Corinthians', chapters: 13, verses: [24,17,18,18,21,18,16,24,15,18,33,21,14] },
  { name: 'Galatians', chapters: 6, verses: [24,21,29,31,26,18] },
  { name: 'Ephesians', chapters: 6, verses: [23,22,21,32,33,24] },
  { name: 'Philippians', chapters: 4, verses: [30,30,21,23] },
  { name: 'Colossians', chapters: 4, verses: [29,23,25,18] },
  { name: '1 Thessalonians', chapters: 5, verses: [10,20,13,18,28] },
  { name: '2 Thessalonians', chapters: 3, verses: [12,17,18] },
  { name: '1 Timothy', chapters: 6, verses: [20,15,16,16,25,21] },
  { name: '2 Timothy', chapters: 4, verses: [18,26,17,22] },
  { name: 'Titus', chapters: 3, verses: [16,15,15] },
  { name: 'Philemon', chapters: 1, verses: [25] },
  { name: 'Hebrews', chapters: 13, verses: [14,18,19,16,14,20,28,13,28,39,40,29,25] },
  { name: 'James', chapters: 5, verses: [27,26,18,17,20] },
  { name: '1 Peter', chapters: 5, verses: [25,25,22,19,14] },
  { name: '2 Peter', chapters: 3, verses: [21,22,18] },
  { name: '1 John', chapters: 5, verses: [10,29,24,21,21] },
  { name: '2 John', chapters: 1, verses: [13] },
  { name: '3 John', chapters: 1, verses: [14] },
  { name: 'Jude', chapters: 1, verses: [25] },
  { name: 'Revelation', chapters: 22, verses: [20,29,22,11,14,17,17,13,21,11,19,17,18,20,8,21,18,24,21,15,27,21] }
];

// BibleVerseScreen Component
const BibleVerseScreen = ({ onClose }) => {
  const [testament, setTestament] = useState('OT'); // 'OT' or 'NT'
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [recentVerses, setRecentVerses] = useState([]);
  const [showSetConfirmation, setShowSetConfirmation] = useState(false);
  const [currentSetVerse, setCurrentSetVerse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const searchInputRef = useRef(null);
  const [verseDisplaySettings, setVerseDisplaySettings] = useState({
    fontSize: 60,
    textColor: '#ffffff',
    backgroundColor: '#000000'
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Split books by testament
  const oldTestament = BIBLE_STRUCTURE.slice(0, 39);
  const newTestament = BIBLE_STRUCTURE.slice(39);
  const displayedBooks = testament === 'OT' ? oldTestament : newTestament;

  // Load recent verses from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('recentBibleVerses');
    if (saved) {
      try {
        setRecentVerses(JSON.parse(saved));
      } catch (e) {
        setRecentVerses([]);
      }
    }
  }, []);

  // Listen to current verse from Firebase
  useEffect(() => {
    const verseRef = ref(realtimeDb, 'bibleVerse');
    const unsubscribe = onValue(verseRef, (snapshot) => {
      const verse = snapshot.val();
      if (verse) {
        setCurrentSetVerse(verse);
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to verse display settings from Firebase
  useEffect(() => {
    const settingsRef = ref(realtimeDb, 'verseDisplay');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      const settings = snapshot.val();
      if (settings) {
        setVerseDisplaySettings({
          fontSize: settings.fontSize || 60,
          textColor: settings.textColor || '#ffffff',
          backgroundColor: settings.backgroundColor || '#000000'
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Focus search input when "/" is pressed
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === '/' && searchInputRef.current && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current.focus();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Save recent verses to localStorage
  const saveRecentVerse = (verseRef) => {
    const updated = [verseRef, ...recentVerses.filter(v => v !== verseRef)].slice(0, 20);
    setRecentVerses(updated);
    localStorage.setItem('recentBibleVerses', JSON.stringify(updated));
  };

  // Save verse display settings to Firebase
  const saveVerseDisplaySettings = (settings) => {
    const settingsRef = ref(realtimeDb, 'verseDisplay');
    set(settingsRef, settings);
  };

  const handleBookClick = (book) => {
    setSelectedBook(book);
    setSelectedChapter(null);
    setSelectedVerse(null);
  };

  const handleChapterClick = (chapterNum) => {
    setSelectedChapter(chapterNum);
    setSelectedVerse(null);
  };

  const handleVerseClick = (verseNum) => {
    setSelectedVerse(verseNum);
    setShowSetConfirmation(false);
  };

  const handleSetVerse = () => {
    if (selectedBook && selectedChapter && selectedVerse) {
      const verseRef = `${selectedBook.name} ${selectedChapter}:${selectedVerse}`;
      saveRecentVerse(verseRef);

      // Save to Firebase
      const verseRefDb = ref(realtimeDb, 'bibleVerse');
      set(verseRefDb, verseRef);

      // Set display mode to verse
      const displayModeRef = ref(realtimeDb, 'displayMode');
      set(displayModeRef, 'verse');

      // Show confirmation
      setShowSetConfirmation(true);

      // Hide confirmation after 2 seconds
      setTimeout(() => {
        setShowSetConfirmation(false);
      }, 2000);
    }
  };

  const handleRecentClick = (verseRef) => {
    // Save to Firebase
    const verseRefDb = ref(realtimeDb, 'bibleVerse');
    set(verseRefDb, verseRef);
    saveRecentVerse(verseRef);

    // Set display mode to verse
    const displayModeRef = ref(realtimeDb, 'displayMode');
    set(displayModeRef, 'verse');

    // Show confirmation
    setShowSetConfirmation(true);
    setTimeout(() => {
      setShowSetConfirmation(false);
    }, 2000);
  };

  // Smart search with fuzzy matching
  const fuzzyMatch = (str, pattern) => {
    const strLower = str.toLowerCase();
    const patternLower = pattern.toLowerCase();

    // Exact match or starts with
    if (strLower.includes(patternLower)) {
      return strLower.startsWith(patternLower) ? 100 : 90;
    }

    // Character by character fuzzy match
    let patternIdx = 0;
    let score = 0;

    for (let i = 0; i < strLower.length && patternIdx < patternLower.length; i++) {
      if (strLower[i] === patternLower[patternIdx]) {
        score += 1;
        patternIdx++;
      }
    }

    if (patternIdx === patternLower.length) {
      return (score / pattern.length) * 80;
    }

    return 0;
  };

  // Parse full verse reference (e.g., "Genesis 1:1" or "John 3:16")
  const parseVerseReference = (query) => {
    const match = query.match(/^(.+?)\s+(\d+)(?::(\d+))?$/);
    if (match) {
      const bookName = match[1].trim();
      const chapterNum = parseInt(match[2]);
      const verseNum = match[3] ? parseInt(match[3]) : null;

      // Find matching book with fuzzy search
      const results = BIBLE_STRUCTURE
        .map(book => ({
          book,
          score: fuzzyMatch(book.name, bookName)
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);

      if (results.length > 0) {
        const book = results[0].book;
        return { book, chapter: chapterNum, verse: verseNum };
      }
    }
    return null;
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      // Check if it's a full reference first
      const parsed = parseVerseReference(searchQuery);
      if (parsed) {
        // Don't show suggestions for full references
        setSearchSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      // Otherwise show book suggestions
      const results = BIBLE_STRUCTURE
        .map(book => ({
          book,
          score: fuzzyMatch(book.name, searchQuery)
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(item => item.book);

      setSearchSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedSuggestionIndex(0);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const handleSearchSelect = (book) => {
    setSelectedBook(book);
    setSelectedChapter(null);
    setSelectedVerse(null);
    setSearchQuery('');
    setShowSuggestions(false);

    // Switch to correct testament
    const bookIndex = BIBLE_STRUCTURE.findIndex(b => b.name === book.name);
    setTestament(bookIndex < 39 ? 'OT' : 'NT');
  };

  const handleSearchKeyDown = (e) => {
    if (!showSuggestions || searchSuggestions.length === 0) {
      // Handle Enter (or Shift+Enter) for full verse reference
      if (e.key === 'Enter') {
        const parsed = parseVerseReference(searchQuery);
        if (parsed) {
          setSelectedBook(parsed.book);
          setSelectedChapter(parsed.chapter);
          setSelectedVerse(parsed.verse);
          setSearchQuery('');

          // Switch to correct testament
          const bookIndex = BIBLE_STRUCTURE.findIndex(b => b.name === parsed.book.name);
          setTestament(bookIndex < 39 ? 'OT' : 'NT');

          // If Shift+Enter, also set the verse to Firebase
          if (e.shiftKey && parsed.chapter && parsed.verse) {
            const verseRef = `${parsed.book.name} ${parsed.chapter}:${parsed.verse}`;
            saveRecentVerse(verseRef);

            // Save to Firebase
            const verseRefDb = ref(realtimeDb, 'bibleVerse');
            set(verseRefDb, verseRef);

            // Set display mode to verse
            const displayModeRef = ref(realtimeDb, 'displayMode');
            set(displayModeRef, 'verse');

            // Show confirmation
            setShowSetConfirmation(true);
            setTimeout(() => {
              setShowSetConfirmation(false);
            }, 2000);
          }
        }
      }
      return;
    }

    // Handle keyboard navigation in suggestions
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev =>
        prev < searchSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchSuggestions[selectedSuggestionIndex]) {
        const book = searchSuggestions[selectedSuggestionIndex];
        setSearchQuery(book.name + ' ');
        setShowSuggestions(false);
        // Focus stays in input so user can continue typing chapter:verse
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const hasSelectedVerse = selectedBook && selectedChapter && selectedVerse;

  return (
    <div className="bible-app">
      {/* Top Bar */}
      <div className="bible-top-bar">
        <div className="bible-tabs">
          <button
            className={`tab-btn ${testament === 'OT' ? 'active' : ''}`}
            onClick={() => setTestament('OT')}
          >
            OT
          </button>
          <button
            className={`tab-btn ${testament === 'NT' ? 'active' : ''}`}
            onClick={() => setTestament('NT')}
          >
            NT
          </button>
        </div>

        {/* Search Box */}
        <div className="bible-search-wrapper">
          <input
            ref={searchInputRef}
            type="text"
            className="bible-search-box"
            placeholder="Search books (e.g., Genesis, John, Psalms...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleSearchKeyDown}
          />
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="search-suggestions">
              {searchSuggestions.map((book, index) => (
                <div
                  key={book.name}
                  className={`search-suggestion-item ${index === selectedSuggestionIndex ? 'selected' : ''}`}
                  onClick={() => handleSearchSelect(book)}
                >
                  <span className="suggestion-name">{book.name}</span>
                  <span className="suggestion-info">{book.chapters} ch</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bible-actions">
          <button className="action-btn settings-icon-btn" onClick={() => setShowSettingsModal(true)} title="Display Settings">
            ⚙
          </button>
          <button className="action-btn" onClick={onClose}>✕ Close</button>
          {hasSelectedVerse && (
            <button className="action-btn set-btn" onClick={handleSetVerse}>
              Set Verse
            </button>
          )}
        </div>
      </div>

      {/* Main Content - 3 Columns */}
      <div className="bible-main">
        {/* Left Sidebar - Books */}
        <div className="bible-sidebar">
          <div className="books-list">
            {displayedBooks.map((book) => (
              <div
                key={book.name}
                className={`book-item ${selectedBook?.name === book.name ? 'active' : ''}`}
                onClick={() => handleBookClick(book)}
              >
                {book.name}
              </div>
            ))}
          </div>
        </div>

        {/* Middle Section - Chapters and Verses */}
        <div className="bible-middle">
          {/* Chapters Grid */}
          <div className="grid-section">
            <div className="numbers-grid-container">
              {!selectedBook ? (
                <div className="grid-empty-state">Select a book</div>
              ) : (
                <div className="numbers-grid">
                  {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((num) => (
                    <div
                      key={num}
                      className={`number-box ${selectedChapter === num ? 'selected' : ''}`}
                      onClick={() => handleChapterClick(num)}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="section-divider"></div>

          {/* Verses Grid */}
          <div className="grid-section">
            <div className="numbers-grid-container">
              {!selectedBook ? (
                <div className="grid-empty-state"></div>
              ) : !selectedChapter ? (
                <div className="grid-empty-state">Select a chapter</div>
              ) : (
                <div className="numbers-grid">
                  {Array.from(
                    { length: selectedBook.verses[selectedChapter - 1] },
                    (_, i) => i + 1
                  ).map((num) => (
                    <div
                      key={num}
                      className={`number-box ${selectedVerse === num ? 'selected' : ''}`}
                      onClick={() => handleVerseClick(num)}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Display Area */}
        <div className="bible-display">
          {/* Selected Verse Preview */}
          <div className="display-section">
            <div className="section-label">Selected</div>
            {hasSelectedVerse ? (
              <div className="verse-preview">
                {selectedBook.name} {selectedChapter}:{selectedVerse}
              </div>
            ) : (
              <div className="verse-preview empty">Select a verse</div>
            )}
          </div>

          <div className="display-divider"></div>

          {/* Current Set Verse */}
          <div className="display-section">
            <div className="section-label">Current Display</div>
            {currentSetVerse ? (
              <div className="verse-current">
                {currentSetVerse}
                {showSetConfirmation && (
                  <div className="success-badge">✓ Updated</div>
                )}
              </div>
            ) : (
              <div className="verse-current empty">No verse set</div>
            )}
          </div>

          <div className="display-divider"></div>

          {/* Recent Verses */}
          <div className="display-section recent-section">
            <div className="section-label">Recent Verses</div>
            {recentVerses.length === 0 ? (
              <div className="empty-state">No recent verses</div>
            ) : (
              <div className="recent-list">
                {recentVerses.slice(0, 10).map((verseRef, index) => (
                  <div
                    key={index}
                    className="recent-item"
                    onClick={() => handleRecentClick(verseRef)}
                    title="Click to set this verse"
                  >
                    {verseRef}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verse Display Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content verse-settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Display Settings (TV Only)</h2>
              <button className="modal-close" onClick={() => setShowSettingsModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="settings-controls">
                <div className="setting-item">
                  <label>Font Size: {verseDisplaySettings.fontSize}px</label>
                  <input
                    type="range"
                    min="20"
                    max="120"
                    value={verseDisplaySettings.fontSize}
                    onChange={(e) => {
                      const newSettings = { ...verseDisplaySettings, fontSize: parseInt(e.target.value) };
                      setVerseDisplaySettings(newSettings);
                      saveVerseDisplaySettings(newSettings);
                    }}
                    className="slider"
                  />
                </div>
                <div className="setting-item">
                  <label>Text Color</label>
                  <input
                    type="color"
                    value={verseDisplaySettings.textColor}
                    onChange={(e) => {
                      const newSettings = { ...verseDisplaySettings, textColor: e.target.value };
                      setVerseDisplaySettings(newSettings);
                      saveVerseDisplaySettings(newSettings);
                    }}
                    className="color-picker"
                  />
                </div>
                <div className="setting-item">
                  <label>Background Color</label>
                  <input
                    type="color"
                    value={verseDisplaySettings.backgroundColor}
                    onChange={(e) => {
                      const newSettings = { ...verseDisplaySettings, backgroundColor: e.target.value };
                      setVerseDisplaySettings(newSettings);
                      saveVerseDisplaySettings(newSettings);
                    }}
                    className="color-picker"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Settings Component
const Settings = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSettingsChange(localSettings);
    localStorage.setItem('appSettings', JSON.stringify(localSettings));
    onClose();
  };

  const handleReset = () => {
    const defaultSettings = {
      visibleLanguages: ['tamil', 'hindi', 'english'],
      tamilFontSize: 20,
      hindiFontSize: 20,
      englishFontSize: 20,
      alignment: 'top-bottom',
      autoCapitalize: true,
      showSongNumbers: true,
      showAlternativeTitle: true,
      previewLanguage: 'english',
      backgroundColor: '#0a0a0a',
      tamilTextColor: '#ffffff',
      hindiTextColor: '#ffffff',
      englishTextColor: '#ffffff'
    };
    setLocalSettings(defaultSettings);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>⚙️ Settings</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h3>Language Settings</h3>

            <div className="setting-item">
              <span style={{display: 'block', marginBottom: '8px'}}>Visible Languages:</span>
              <div style={{display: 'flex', gap: '12px'}}>
                <label style={{display: 'flex', alignItems: 'center'}}>
                  <input
                    type="checkbox"
                    checked={localSettings.visibleLanguages?.includes('tamil')}
                    onChange={(e) => {
                      const langs = e.target.checked
                        ? [...(localSettings.visibleLanguages || []), 'tamil']
                        : (localSettings.visibleLanguages || []).filter(l => l !== 'tamil');
                      setLocalSettings({...localSettings, visibleLanguages: langs});
                    }}
                  />
                  <span>தமிழ் (Tamil)</span>
                </label>
                <label style={{display: 'flex', alignItems: 'center'}}>
                  <input
                    type="checkbox"
                    checked={localSettings.visibleLanguages?.includes('hindi')}
                    onChange={(e) => {
                      const langs = e.target.checked
                        ? [...(localSettings.visibleLanguages || []), 'hindi']
                        : (localSettings.visibleLanguages || []).filter(l => l !== 'hindi');
                      setLocalSettings({...localSettings, visibleLanguages: langs});
                    }}
                  />
                  <span>हिन्दी (Hindi)</span>
                </label>
                <label style={{display: 'flex', alignItems: 'center'}}>
                  <input
                    type="checkbox"
                    checked={localSettings.visibleLanguages?.includes('english')}
                    onChange={(e) => {
                      const langs = e.target.checked
                        ? [...(localSettings.visibleLanguages || []), 'english']
                        : (localSettings.visibleLanguages || []).filter(l => l !== 'english');
                      setLocalSettings({...localSettings, visibleLanguages: langs});
                    }}
                  />
                  <span>English</span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <span style={{display: 'block', marginBottom: '12px', fontWeight: '500'}}>Font Sizes</span>
              <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <span style={{width: '70px', fontSize: '14px'}}>தமிழ்</span>
                  <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                    <button
                      onClick={() => setLocalSettings({...localSettings, tamilFontSize: 16})}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: localSettings.tamilFontSize === 16 ? '1px solid #4a5568' : '1px solid #d1d5db',
                        background: localSettings.tamilFontSize === 16 ? '#4a5568' : 'transparent',
                        color: localSettings.tamilFontSize === 16 ? 'white' : '#6b7280',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                    >
                      S
                    </button>
                    <button
                      onClick={() => setLocalSettings({...localSettings, tamilFontSize: 20})}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: localSettings.tamilFontSize === 20 ? '1px solid #4a5568' : '1px solid #d1d5db',
                        background: localSettings.tamilFontSize === 20 ? '#4a5568' : 'transparent',
                        color: localSettings.tamilFontSize === 20 ? 'white' : '#6b7280',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                    >
                      M
                    </button>
                    <button
                      onClick={() => setLocalSettings({...localSettings, tamilFontSize: 26})}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: localSettings.tamilFontSize === 26 ? '1px solid #4a5568' : '1px solid #d1d5db',
                        background: localSettings.tamilFontSize === 26 ? '#4a5568' : 'transparent',
                        color: localSettings.tamilFontSize === 26 ? 'white' : '#6b7280',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                    >
                      L
                    </button>
                    <span style={{margin: '0 8px', color: '#9ca3af'}}>|</span>
                    <input
                      type="number"
                      min="10"
                      max="48"
                      value={localSettings.tamilFontSize || 20}
                      onChange={(e) => setLocalSettings({...localSettings, tamilFontSize: parseInt(e.target.value) || 20})}
                      style={{
                        width: '50px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '13px',
                        textAlign: 'center'
                      }}
                    />
                    <span style={{fontSize: '12px', color: '#6b7280'}}>px</span>
                  </div>
                </div>

                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <span style={{width: '70px', fontSize: '14px'}}>हिन्दी</span>
                  <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                    <button
                      onClick={() => setLocalSettings({...localSettings, hindiFontSize: 16})}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: localSettings.hindiFontSize === 16 ? '1px solid #4a5568' : '1px solid #d1d5db',
                        background: localSettings.hindiFontSize === 16 ? '#4a5568' : 'transparent',
                        color: localSettings.hindiFontSize === 16 ? 'white' : '#6b7280',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                    >
                      S
                    </button>
                    <button
                      onClick={() => setLocalSettings({...localSettings, hindiFontSize: 20})}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: localSettings.hindiFontSize === 20 ? '1px solid #4a5568' : '1px solid #d1d5db',
                        background: localSettings.hindiFontSize === 20 ? '#4a5568' : 'transparent',
                        color: localSettings.hindiFontSize === 20 ? 'white' : '#6b7280',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                    >
                      M
                    </button>
                    <button
                      onClick={() => setLocalSettings({...localSettings, hindiFontSize: 26})}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: localSettings.hindiFontSize === 26 ? '1px solid #4a5568' : '1px solid #d1d5db',
                        background: localSettings.hindiFontSize === 26 ? '#4a5568' : 'transparent',
                        color: localSettings.hindiFontSize === 26 ? 'white' : '#6b7280',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                    >
                      L
                    </button>
                    <span style={{margin: '0 8px', color: '#9ca3af'}}>|</span>
                    <input
                      type="number"
                      min="10"
                      max="48"
                      value={localSettings.hindiFontSize || 20}
                      onChange={(e) => setLocalSettings({...localSettings, hindiFontSize: parseInt(e.target.value) || 20})}
                      style={{
                        width: '50px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '13px',
                        textAlign: 'center'
                      }}
                    />
                    <span style={{fontSize: '12px', color: '#6b7280'}}>px</span>
                  </div>
                </div>

                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <span style={{width: '70px', fontSize: '14px'}}>English</span>
                  <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                    <button
                      onClick={() => setLocalSettings({...localSettings, englishFontSize: 16})}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: localSettings.englishFontSize === 16 ? '1px solid #4a5568' : '1px solid #d1d5db',
                        background: localSettings.englishFontSize === 16 ? '#4a5568' : 'transparent',
                        color: localSettings.englishFontSize === 16 ? 'white' : '#6b7280',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                    >
                      S
                    </button>
                    <button
                      onClick={() => setLocalSettings({...localSettings, englishFontSize: 20})}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: localSettings.englishFontSize === 20 ? '1px solid #4a5568' : '1px solid #d1d5db',
                        background: localSettings.englishFontSize === 20 ? '#4a5568' : 'transparent',
                        color: localSettings.englishFontSize === 20 ? 'white' : '#6b7280',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                    >
                      M
                    </button>
                    <button
                      onClick={() => setLocalSettings({...localSettings, englishFontSize: 26})}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: localSettings.englishFontSize === 26 ? '1px solid #4a5568' : '1px solid #d1d5db',
                        background: localSettings.englishFontSize === 26 ? '#4a5568' : 'transparent',
                        color: localSettings.englishFontSize === 26 ? 'white' : '#6b7280',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                    >
                      L
                    </button>
                    <span style={{margin: '0 8px', color: '#9ca3af'}}>|</span>
                    <input
                      type="number"
                      min="10"
                      max="48"
                      value={localSettings.englishFontSize || 20}
                      onChange={(e) => setLocalSettings({...localSettings, englishFontSize: parseInt(e.target.value) || 20})}
                      style={{
                        width: '50px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '13px',
                        textAlign: 'center'
                      }}
                    />
                    <span style={{fontSize: '12px', color: '#6b7280'}}>px</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>Display Settings</h3>

            <div className="setting-item">
              <label>
                <span>Text alignment:</span>
                <select
                  value={localSettings.alignment || 'top-bottom'}
                  onChange={(e) => setLocalSettings({...localSettings, alignment: e.target.value})}
                  style={{marginLeft: '12px'}}
                >
                  <option value="top-bottom">Top-Bottom</option>
                  <option value="side-by-side">Side-by-Side</option>
                  <option value="diagonal">Diagonal</option>
                </select>
              </label>
            </div>

            <div className="setting-item">
              <label style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <span>Background Color:</span>
                <input
                  type="color"
                  value={localSettings.backgroundColor || '#0a0a0a'}
                  onChange={(e) => setLocalSettings({...localSettings, backgroundColor: e.target.value})}
                  style={{
                    width: '50px',
                    height: '30px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={localSettings.backgroundColor || '#0a0a0a'}
                  onChange={(e) => setLocalSettings({...localSettings, backgroundColor: e.target.value})}
                  style={{
                    width: '80px',
                    padding: '4px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}
                />
              </label>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={localSettings.autoCapitalize}
                  onChange={(e) => setLocalSettings({...localSettings, autoCapitalize: e.target.checked})}
                />
                <span>Auto-capitalize lyrics</span>
              </label>
            </div>

            <div className="setting-item">
              <span style={{display: 'block', marginBottom: '12px', fontWeight: '500'}}>Text Colors per Language</span>
              <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <span style={{width: '70px', fontSize: '14px'}}>தமிழ்</span>
                  <input
                    type="color"
                    value={localSettings.tamilTextColor || '#ffffff'}
                    onChange={(e) => setLocalSettings({...localSettings, tamilTextColor: e.target.value})}
                    style={{
                      width: '50px',
                      height: '30px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={localSettings.tamilTextColor || '#ffffff'}
                    onChange={(e) => setLocalSettings({...localSettings, tamilTextColor: e.target.value})}
                    style={{
                      width: '80px',
                      padding: '4px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <span style={{width: '70px', fontSize: '14px'}}>हिन्दी</span>
                  <input
                    type="color"
                    value={localSettings.hindiTextColor || '#ffffff'}
                    onChange={(e) => setLocalSettings({...localSettings, hindiTextColor: e.target.value})}
                    style={{
                      width: '50px',
                      height: '30px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={localSettings.hindiTextColor || '#ffffff'}
                    onChange={(e) => setLocalSettings({...localSettings, hindiTextColor: e.target.value})}
                    style={{
                      width: '80px',
                      padding: '4px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <span style={{width: '70px', fontSize: '14px'}}>English</span>
                  <input
                    type="color"
                    value={localSettings.englishTextColor || '#ffffff'}
                    onChange={(e) => setLocalSettings({...localSettings, englishTextColor: e.target.value})}
                    style={{
                      width: '50px',
                      height: '30px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={localSettings.englishTextColor || '#ffffff'}
                    onChange={(e) => setLocalSettings({...localSettings, englishTextColor: e.target.value})}
                    style={{
                      width: '80px',
                      padding: '4px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={localSettings.showSongNumbers}
                  onChange={(e) => setLocalSettings({...localSettings, showSongNumbers: e.target.checked})}
                />
                <span>Show song numbers in list</span>
              </label>
            </div>
            <div className="setting-item">
              <label>
                <span>Section preview language:</span>
                <select
                  value={localSettings.previewLanguage || 'english'}
                  onChange={(e) => setLocalSettings({...localSettings, previewLanguage: e.target.value})}
                  style={{marginLeft: '12px'}}
                >
                  <option value="english">English (default)</option>
                  <option value="tamil">Tamil</option>
                  <option value="hindi">Hindi</option>
                </select>
              </label>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={localSettings.showAlternativeTitle}
                  onChange={(e) => setLocalSettings({...localSettings, showAlternativeTitle: e.target.checked})}
                />
                <span>Show alternative titles</span>
              </label>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className="reset-button" onClick={handleReset}>
            Reset to Defaults
          </button>
          <div className="footer-buttons">
            <button className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button className="save-button" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// LyricsControlBar Component
const LyricsControlBar = ({ darkMode, setDarkMode, onOpenSettings, onOpenBibleVerse, settings }) => {
  const [liveStatus, setLiveStatus] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayMode, setDisplayMode] = useState('lyrics');

  useEffect(() => {
    const liveRef = ref(realtimeDb, 'live');
    const unsubscribe = onValue(liveRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLiveStatus(data.isLive || false);
        setCurrentIndex(data.currentIndex || 0);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const displayModeRef = ref(realtimeDb, 'displayMode');
    const unsubscribe = onValue(displayModeRef, (snapshot) => {
      const mode = snapshot.val();
      if (mode) {
        setDisplayMode(mode);
      }
    });

    return () => unsubscribe();
  }, []);

  // Update live settings whenever settings change
  useEffect(() => {
    if (settings) {
      const liveRef = ref(realtimeDb, 'live');
      const updates = {
        alignment: settings.alignment || 'top-bottom',
        visible_langs: settings.visibleLanguages || ['tamil', 'hindi', 'english'],
        tamilfontSize: settings.tamilFontSize || 20,
        hindifontSize: settings.hindiFontSize || 20,
        englishfontSize: settings.englishFontSize || 20,
        backgroundColor: settings.backgroundColor || '#0a0a0a',
        tamilTextColor: settings.tamilTextColor || '#ffffff',
        hindiTextColor: settings.hindiTextColor || '#ffffff',
        englishTextColor: settings.englishTextColor || '#ffffff',
        isLive: liveStatus,
        currentIndex: currentIndex
      };
      set(liveRef, updates);
    }
  }, [settings, liveStatus, currentIndex]);

  const toggleLive = () => {
    const newLiveStatus = !liveStatus;
    setLiveStatus(newLiveStatus);
    const liveRef = ref(realtimeDb, 'live/isLive');
    set(liveRef, newLiveStatus);
  };

  const toggleDisplayMode = (mode) => {
    setDisplayMode(mode);
    const displayModeRef = ref(realtimeDb, 'displayMode');
    set(displayModeRef, mode);
  };

  return (
    <div className="lyrics-control-bar">
      <div className="control-bar-left">
        <div className="app-logo">
          <span className="logo-icon">🎵</span>
          <div className="logo-text">
            <h1 className="app-name">Lyrics Control</h1>
            <span className="app-subtitle">Worship Display System</span>
          </div>
        </div>
      </div>

      <div className="control-bar-center">
        <div className="live-status-container">
          {liveStatus ? (
            <div className="live-indicator active">
              <span className="live-dot"></span>
              <span className="live-text">LIVE</span>
            </div>
          ) : (
            <div className="live-indicator inactive">
              <span className="live-text">OFFLINE</span>
            </div>
          )}
        </div>

        <button
          className={`main-live-button ${liveStatus ? 'stop' : 'go'}`}
          onClick={toggleLive}
        >
          <span className="button-icon">{liveStatus ? '⏹' : '▶️'}</span>
          <span className="button-text">{liveStatus ? 'Stop Broadcasting' : 'Start Broadcasting'}</span>
        </button>

        <button
          className="display-button"
          onClick={() => window.open('/live', '_blank')}
          title="Open Live Display"
        >
          <span className="button-icon">🖥️</span>
          <span className="button-text">Display</span>
        </button>

        <button
          className="bible-verse-button"
          onClick={onOpenBibleVerse}
          title="Select Bible Verse"
        >
          <span className="button-icon">📖</span>
          <span className="button-text">Bible Verse</span>
        </button>

        <div className="display-mode-toggle">
          <button
            className={`mode-btn ${displayMode === 'lyrics' ? 'active' : ''}`}
            onClick={() => toggleDisplayMode('lyrics')}
            title="Show Lyrics"
          >
            Lyrics
          </button>
          <button
            className={`mode-btn ${displayMode === 'verse' ? 'active' : ''}`}
            onClick={() => toggleDisplayMode('verse')}
            title="Show Bible Verse"
          >
            Verse
          </button>
        </div>
      </div>

      <div className="control-bar-right">
        <div className="quick-actions">
          <button
            className="icon-button theme-btn"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          <button
            className="icon-button settings-btn"
            onClick={onOpenSettings}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>
    </div>
  );
};

// LyricsList Component
const LyricsList = ({ onSelectLyrics, selectedId, settings = {} }) => {
  const [lyricsList, setLyricsList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState({
    tamil: false,
    hindi: false,
    english: false
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [queue, setQueue] = useState(() => {
    // Load queue from localStorage
    const savedQueue = localStorage.getItem('songQueue');
    return savedQueue ? JSON.parse(savedQueue) : [];
  });
  const [showQueue, setShowQueue] = useState(false);
  const [newLyrics, setNewLyrics] = useState({
    title: '',
    alternativeTitle: '',
    tamil: '',
    hindi: '',
    english: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'lyrics'), orderBy('title'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const lyrics = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Map Firestore field names to expected field names
        lyrics.push({
          id: doc.id,
          title: data.title,
          alternativeTitle: data.altTitle || data.alternativeTitle,
          tamil: data.tamilLyrics || data.tamil,
          hindi: data.hindiLyrics || data.hindi,
          english: data.englishLyrics || data.english
        });
      });
      setLyricsList(lyrics);
      setFilteredList(lyrics);
    });

    return () => unsubscribe();
  }, []);

  // Apply filters whenever search term or language filters change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, languageFilter, lyricsList]);

  const applyFilters = () => {
    let filtered = [...lyricsList];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(song =>
        song.title.toLowerCase().includes(searchLower) ||
        (song.alternativeTitle && song.alternativeTitle.toLowerCase().includes(searchLower))
      );
    }

    // Apply language filters
    const hasLanguageFilter = languageFilter.tamil || languageFilter.hindi || languageFilter.english;
    if (hasLanguageFilter) {
      filtered = filtered.filter(song => {
        return (
          (languageFilter.tamil && song.tamil) ||
          (languageFilter.hindi && song.hindi) ||
          (languageFilter.english && song.english)
        );
      });
    }

    setFilteredList(filtered);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const toggleLanguageFilter = (lang) => {
    setLanguageFilter(prev => ({
      ...prev,
      [lang]: !prev[lang]
    }));
  };

  // Queue management functions
  const addToQueue = (song) => {
    const newQueue = [...queue, song];
    setQueue(newQueue);
    localStorage.setItem('songQueue', JSON.stringify(newQueue));
  };

  const removeFromQueue = (songId) => {
    const newQueue = queue.filter(song => song.id !== songId);
    setQueue(newQueue);
    localStorage.setItem('songQueue', JSON.stringify(newQueue));
  };

  const clearQueue = () => {
    setQueue([]);
    localStorage.removeItem('songQueue');
  };

  const isInQueue = (songId) => {
    return queue.some(song => song.id === songId);
  };

  const handleAddLyrics = async () => {
    if (!newLyrics.title) {
      alert('Please enter a title');
      return;
    }

    try {
      await addDoc(collection(db, 'lyrics'), {
        title: newLyrics.title,
        altTitle: newLyrics.alternativeTitle,
        tamilLyrics: newLyrics.tamil,
        hindiLyrics: newLyrics.hindi,
        englishLyrics: newLyrics.english,
        createdAt: new Date()
      });

      setShowAddDialog(false);
      setNewLyrics({
        title: '',
        alternativeTitle: '',
        tamil: '',
        hindi: '',
        english: ''
      });
    } catch (error) {
      console.error('Error adding lyrics:', error);
      alert('Failed to add lyrics');
    }
  };

  const getSectionCount = (text) => {
    return parseLyricsSections(text).length;
  };

  return (
    <div className="lyrics-list">
      <div className="list-header">
        <div className="header-content">
          <h3>📚 Song Library</h3>
          <span className="song-count">{lyricsList.length} songs</span>
        </div>
        <div style={{display: 'flex', gap: '8px'}}>
          <button
            onClick={() => setShowQueue(!showQueue)}
            className="queue-toggle-button"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: showQueue ? '#4a5568' : '#e5e7eb',
              color: showQueue ? 'white' : '#4a5568',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <span>📋</span>
            <span>Queue ({queue.length})</span>
          </button>
          <button onClick={() => setShowAddDialog(true)} className="add-button">
            <span className="add-icon">+</span>
            <span className="add-text">Add Song</span>
          </button>
        </div>
      </div>

      <div className="list-search">
        <input
          type="text"
          placeholder="🔍 Search songs..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="language-filters">
        <span className="filter-label">Filter by:</span>
        <button
          className={`filter-btn tamil-filter ${languageFilter.tamil ? 'active' : ''}`}
          onClick={() => toggleLanguageFilter('tamil')}
          title="Filter Tamil songs"
        >
          <span className="filter-icon">த</span>
          <span className="filter-text">Tamil</span>
        </button>
        <button
          className={`filter-btn hindi-filter ${languageFilter.hindi ? 'active' : ''}`}
          onClick={() => toggleLanguageFilter('hindi')}
          title="Filter Hindi songs"
        >
          <span className="filter-icon">हि</span>
          <span className="filter-text">Hindi</span>
        </button>
        <button
          className={`filter-btn english-filter ${languageFilter.english ? 'active' : ''}`}
          onClick={() => toggleLanguageFilter('english')}
          title="Filter English songs"
        >
          <span className="filter-icon">E</span>
          <span className="filter-text">English</span>
        </button>
        {(languageFilter.tamil || languageFilter.hindi || languageFilter.english) && (
          <button
            className="filter-clear"
            onClick={() => setLanguageFilter({ tamil: false, hindi: false, english: false })}
            title="Clear filters"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {showQueue && (
        <div className="queue-section" style={{
          padding: '20px',
          background: 'linear-gradient(to bottom, #f9fafb, #f3f4f6)',
          borderBottom: '3px solid #e5e7eb',
          maxHeight: '350px',
          overflowY: 'auto'
        }}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <span style={{fontSize: '20px'}}>🎵</span>
              <div>
                <h4 style={{margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937'}}>Today's Queue</h4>
                <p style={{margin: 0, fontSize: '12px', color: '#6b7280'}}>{queue.length} song{queue.length !== 1 ? 's' : ''} selected</p>
              </div>
            </div>
            {queue.length > 0 && (
              <button
                onClick={clearQueue}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#fee2e2',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#fecaca';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#fee2e2';
                }}
              >
                ✕ Clear All
              </button>
            )}
          </div>
          {queue.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: 'white',
              borderRadius: '12px',
              border: '2px dashed #e5e7eb'
            }}>
              <div style={{fontSize: '32px', marginBottom: '8px'}}>📋</div>
              <div style={{color: '#6b7280', fontSize: '14px'}}>
                Queue is empty
              </div>
              <div style={{color: '#9ca3af', fontSize: '12px', marginTop: '4px'}}>
                Click on song numbers to add them here
              </div>
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
              {queue.map((song, index) => (
                <div
                  key={song.id}
                  className={`queue-item ${selectedId === song.id ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: selectedId === song.id ? '#4a5568' : 'white',
                    borderRadius: '8px',
                    border: selectedId === song.id ? '1px solid #4a5568' : '1px solid #e5e7eb',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onClick={() => onSelectLyrics(song)}
                  onMouseEnter={(e) => {
                    if (selectedId !== song.id) {
                      e.currentTarget.style.background = '#f9fafb';
                      e.currentTarget.style.transform = 'translateX(2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedId !== song.id) {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }
                  }}
                >
                  {selectedId === song.id && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '3px',
                      background: '#10b981'
                    }} />
                  )}

                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: selectedId === song.id ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                    color: selectedId === song.id ? 'white' : '#4a5568',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginRight: '12px',
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </div>

                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={{
                      fontWeight: '500',
                      fontSize: '14px',
                      color: selectedId === song.id ? 'white' : '#1f2937',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {song.title}
                    </div>
                    {song.alternativeTitle && (
                      <div style={{
                        fontSize: '12px',
                        color: selectedId === song.id ? 'rgba(255,255,255,0.7)' : '#6b7280',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {song.alternativeTitle}
                      </div>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginLeft: '12px'
                  }}>
                    {song.tamil && (
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: selectedId === song.id ? 'rgba(255,255,255,0.2)' : '#fef3c7',
                        color: selectedId === song.id ? 'white' : '#92400e',
                        fontSize: '10px',
                        fontWeight: '600'
                      }}>த</span>
                    )}
                    {song.hindi && (
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: selectedId === song.id ? 'rgba(255,255,255,0.2)' : '#dbeafe',
                        color: selectedId === song.id ? 'white' : '#1e40af',
                        fontSize: '10px',
                        fontWeight: '600'
                      }}>हि</span>
                    )}
                    {song.english && (
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: selectedId === song.id ? 'rgba(255,255,255,0.2)' : '#dcfce7',
                        color: selectedId === song.id ? 'white' : '#166534',
                        fontSize: '10px',
                        fontWeight: '600'
                      }}>E</span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromQueue(song.id);
                    }}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      border: 'none',
                      background: selectedId === song.id ? 'rgba(255,255,255,0.2)' : 'transparent',
                      color: selectedId === song.id ? 'white' : '#9ca3af',
                      cursor: 'pointer',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#fee2e2';
                      e.target.style.color = '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = selectedId === song.id ? 'rgba(255,255,255,0.2)' : 'transparent';
                      e.target.style.color = selectedId === song.id ? 'white' : '#9ca3af';
                    }}
                    title="Remove from queue"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="songs-list">
        {lyricsList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎵</div>
            <div className="empty-text">No songs yet</div>
            <div className="empty-subtext">Click "Add Song" to get started</div>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔎</div>
            <div className="empty-text">No results found</div>
            <div className="empty-subtext">
              {searchTerm && (languageFilter.tamil || languageFilter.hindi || languageFilter.english)
                ? 'Try adjusting your search or filters'
                : searchTerm
                ? 'Try a different search term'
                : 'No songs match the selected languages'}
            </div>
          </div>
        ) : (
          filteredList.map((lyrics, index) => (
            <div
              key={lyrics.id}
              className={`song-item ${selectedId === lyrics.id ? 'selected' : ''}`}
              onClick={() => onSelectLyrics(lyrics)}
            >
              <div
                className={`song-number-wrapper ${isInQueue(lyrics.id) ? 'queued' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isInQueue(lyrics.id)) {
                    removeFromQueue(lyrics.id);
                  } else {
                    addToQueue(lyrics);
                  }
                }}
                style={{
                  position: 'relative',
                  cursor: 'pointer'
                }}
                title={isInQueue(lyrics.id) ? 'Click to remove from queue' : 'Click to add to queue'}
              >
                <div className={`song-number ${isInQueue(lyrics.id) ? 'in-queue' : ''}`}
                  style={{
                    background: isInQueue(lyrics.id) ? '#10b981' : '',
                    color: isInQueue(lyrics.id) ? 'white' : '',
                    transition: 'all 0.2s'
                  }}
                >
                  {isInQueue(lyrics.id) ? '✓' : index + 1}
                </div>
              </div>
              <div className="song-content">
                <div className="song-title">{lyrics.title}</div>
                {lyrics.alternativeTitle && (
                  <div className="song-alt-title">{lyrics.alternativeTitle}</div>
                )}
              </div>
              <div className="song-languages">
                {lyrics.tamil && <span className="lang-badge tamil-badge">த</span>}
                {lyrics.hindi && <span className="lang-badge hindi-badge">हि</span>}
                {lyrics.english && <span className="lang-badge english-badge">E</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {showAddDialog && (
        <div className="modal-overlay">
          <div className="add-dialog">
            <h2>Add New Lyrics</h2>
            <input
              type="text"
              placeholder="Title *"
              value={newLyrics.title}
              onChange={(e) => setNewLyrics({...newLyrics, title: e.target.value})}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Alternative Title"
              value={newLyrics.alternativeTitle}
              onChange={(e) => setNewLyrics({...newLyrics, alternativeTitle: e.target.value})}
              className="input-field"
            />

            <div className="lyrics-input-group">
              <label>
                Tamil ({getSectionCount(newLyrics.tamil)} sections)
              </label>
              <textarea
                placeholder="Enter Tamil lyrics (separate sections with double newline)"
                value={newLyrics.tamil}
                onChange={(e) => setNewLyrics({...newLyrics, tamil: e.target.value})}
                rows="5"
              />
            </div>

            <div className="lyrics-input-group">
              <label>
                Hindi ({getSectionCount(newLyrics.hindi)} sections)
              </label>
              <textarea
                placeholder="Enter Hindi lyrics (separate sections with double newline)"
                value={newLyrics.hindi}
                onChange={(e) => setNewLyrics({...newLyrics, hindi: e.target.value})}
                rows="5"
              />
            </div>

            <div className="lyrics-input-group">
              <label>
                English ({getSectionCount(newLyrics.english)} sections)
              </label>
              <textarea
                placeholder="Enter English lyrics (separate sections with double newline)"
                value={newLyrics.english}
                onChange={(e) => setNewLyrics({...newLyrics, english: e.target.value})}
                rows="5"
              />
            </div>

            <div className="dialog-buttons">
              <button onClick={() => setShowAddDialog(false)} className="cancel-button">
                Cancel
              </button>
              <button onClick={handleAddLyrics} className="save-button">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// LyricsPreviewControl Component
const LyricsPreviewControl = ({ selectedLyrics, settings, onSettingsChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sections, setSections] = useState({
    tamil: [],
    hindi: [],
    english: []
  });
  const [visibleLanguages, setVisibleLanguages] = useState(
    settings?.visibleLanguages || ['tamil', 'hindi', 'english']
  );

  // Sync with settings
  useEffect(() => {
    if (settings?.visibleLanguages) {
      setVisibleLanguages(settings.visibleLanguages);
    }
  }, [settings?.visibleLanguages]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        handleSectionClick(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < sections.tamil.length - 1) {
        handleSectionClick(currentIndex + 1);
      } else if (e.key === 'Home') {
        handleSectionClick(0);
      } else if (e.key === 'End' && sections.tamil.length > 0) {
        handleSectionClick(sections.tamil.length - 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, sections]);

  const toggleLanguage = (lang) => {
    let newVisibleLangs;
    if (visibleLanguages.includes(lang)) {
      // Don't allow removing all languages
      if (visibleLanguages.length === 1) return;
      newVisibleLangs = visibleLanguages.filter(l => l !== lang);
    } else {
      newVisibleLangs = [...visibleLanguages, lang];
    }

    setVisibleLanguages(newVisibleLangs);

    // Update settings and Firebase
    const updatedSettings = { ...settings, visibleLanguages: newVisibleLangs };
    onSettingsChange(updatedSettings);
    localStorage.setItem('appSettings', JSON.stringify(updatedSettings));

    // Update Firebase
    const liveRef = ref(realtimeDb, 'live/visible_langs');
    set(liveRef, newVisibleLangs);
  };

  useEffect(() => {
    if (selectedLyrics) {
      const tamilSections = parseLyricsSections(selectedLyrics.tamil || '');
      const hindiSections = parseLyricsSections(selectedLyrics.hindi || '');
      const englishSections = parseLyricsSections(selectedLyrics.english || '');

      console.log('Parsed sections:', {
        tamil: tamilSections.length,
        hindi: hindiSections.length,
        english: englishSections.length
      });

      setSections({
        tamil: tamilSections,
        hindi: hindiSections,
        english: englishSections
      });
      setCurrentIndex(0);

      // Update preview in realtime database
      const previewRef = ref(realtimeDb, 'preview');
      set(previewRef, selectedLyrics.id);
    }
  }, [selectedLyrics]);

  useEffect(() => {
    // Update current index in realtime database
    const liveRef = ref(realtimeDb, 'live');
    const unsubscribe = onValue(liveRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.currentIndex !== undefined) {
        setCurrentIndex(data.currentIndex);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSectionClick = (index) => {
    console.log('Section clicked:', index);
    setCurrentIndex(index);
    const liveRef = ref(realtimeDb, 'live/currentIndex');
    set(liveRef, index);
  };

  if (!selectedLyrics) {
    return (
      <div className="preview-control">
        <div className="no-selection">Select a song to preview</div>
      </div>
    );
  }

  const maxSections = Math.max(
    sections.tamil.length,
    sections.hindi.length,
    sections.english.length
  );

  return (
    <div className="preview-control">
      <div className="preview-header">
        <div className="preview-title">
          <h2>{selectedLyrics.title}</h2>
          {selectedLyrics.alternativeTitle && (
            <h3>{selectedLyrics.alternativeTitle}</h3>
          )}
        </div>

        <div className="quick-lang-toggles">
          <button
            className={`quick-lang-btn ${visibleLanguages.includes('tamil') ? 'active' : ''}`}
            onClick={() => toggleLanguage('tamil')}
            title="Toggle Tamil"
          >
            த
          </button>
          <button
            className={`quick-lang-btn ${visibleLanguages.includes('hindi') ? 'active' : ''}`}
            onClick={() => toggleLanguage('hindi')}
            title="Toggle Hindi"
          >
            हि
          </button>
          <button
            className={`quick-lang-btn ${visibleLanguages.includes('english') ? 'active' : ''}`}
            onClick={() => toggleLanguage('english')}
            title="Toggle English"
          >
            E
          </button>
        </div>
      </div>

      <div className="section-navigation">
        <button
          className="nav-btn prev"
          onClick={() => handleSectionClick(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          title="Previous (←)"
        >
          ‹
        </button>

        <div className="section-dots">
          {[...Array(maxSections)].map((_, index) => {
            // Get full preview text for hover with language preference
            const getPreviewText = () => {
              const tamil = sections.tamil[index] || '';
              const hindi = sections.hindi[index] || '';
              const english = sections.english[index] || '';

              // Priority: English first, then fallback to other available languages
              const previewLang = settings?.previewLanguage || 'english';

              let preview = '';
              let langLabel = '';

              // Try preferred language first (default to English)
              if (previewLang === 'english' && english) {
                preview = english;
                langLabel = 'English';
              } else if (previewLang === 'tamil' && tamil) {
                preview = tamil;
                langLabel = 'Tamil';
              } else if (previewLang === 'hindi' && hindi) {
                preview = hindi;
                langLabel = 'Hindi';
              }
              // Fallback logic if preferred language not available
              else if (english) {
                preview = english;
                langLabel = 'English';
              } else if (hindi) {
                preview = hindi;
                langLabel = 'Hindi';
              } else if (tamil) {
                preview = tamil;
                langLabel = 'Tamil';
              } else {
                preview = `Section ${index + 1} - No content`;
                langLabel = '';
              }

              return { text: preview, language: langLabel };
            };

            const previewData = getPreviewText();

            return (
              <div
                key={index}
                className={`dot-wrapper ${currentIndex === index ? 'active' : ''}`}
              >
                <button
                  className={`section-dot ${currentIndex === index ? 'active' : ''}`}
                  onClick={() => handleSectionClick(index)}
                  aria-label={`Section ${index + 1}`}
                >
                  <span className="dot-number">{index + 1}</span>
                </button>
                <div className="hover-preview">
                  <div className="preview-arrow"></div>
                  <div className="preview-content">
                    <div className="preview-header">
                      Section {index + 1}
                      {previewData.language && (
                        <span className="preview-lang"> · {previewData.language}</span>
                      )}
                    </div>
                    <div className="preview-lyrics">{previewData.text}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          className="nav-btn next"
          onClick={() => handleSectionClick(Math.min(maxSections - 1, currentIndex + 1))}
          disabled={currentIndex === maxSections - 1}
          title="Next (→)"
        >
          ›
        </button>
      </div>

      <div className="preview-content">
        {visibleLanguages.includes('tamil') && (
          <div className="preview-section">
            <h4>Tamil</h4>
            <div className="preview-text">
              {sections.tamil && sections.tamil[currentIndex]
                ? settings?.autoCapitalize ? capitalizeWords(sections.tamil[currentIndex]) : sections.tamil[currentIndex]
                : <span style={{color: '#999', fontStyle: 'italic'}}>No Tamil lyrics for this section</span>}
            </div>
          </div>
        )}
        {visibleLanguages.includes('hindi') && (
          <div className="preview-section">
            <h4>Hindi</h4>
            <div className="preview-text">
              {sections.hindi && sections.hindi[currentIndex]
                ? settings?.autoCapitalize ? capitalizeWords(sections.hindi[currentIndex]) : sections.hindi[currentIndex]
                : <span style={{color: '#999', fontStyle: 'italic'}}>No Hindi lyrics for this section</span>}
            </div>
          </div>
        )}
        {visibleLanguages.includes('english') && (
          <div className="preview-section">
            <h4>English</h4>
            <div className="preview-text">
              {sections.english && sections.english[currentIndex]
                ? settings?.autoCapitalize ? capitalizeWords(sections.english[currentIndex]) : sections.english[currentIndex]
                : <span style={{color: '#999', fontStyle: 'italic'}}>No English lyrics for this section</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Controller Page Component
const ControllerPage = ({ selectedLyrics, setSelectedLyrics, darkMode, setDarkMode, settings, onSettingsChange }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showBibleVerse, setShowBibleVerse] = useState(false);

  // If Bible verse screen is open, show it instead of controller
  if (showBibleVerse) {
    return <BibleVerseScreen onClose={() => setShowBibleVerse(false)} />;
  }

  return (
    <div className="controller-page">
      <LyricsControlBar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenSettings={() => setShowSettings(true)}
        onOpenBibleVerse={() => setShowBibleVerse(true)}
        settings={settings}
      />
      <div className="controller-main">
        <LyricsList
          onSelectLyrics={setSelectedLyrics}
          selectedId={selectedLyrics?.id}
          settings={settings}
        />
        <LyricsPreviewControl
          selectedLyrics={selectedLyrics}
          settings={settings}
          onSettingsChange={onSettingsChange}
        />
      </div>
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={onSettingsChange}
      />
    </div>
  );
};

// LiveLyricsBlock Component
const LiveLyricsBlock = () => {
  const [liveSettings, setLiveSettings] = useState({
    isLive: false,
    alignment: 'top-bottom',
    visible_langs: ['tamil', 'hindi', 'english'],
    tamilfontSize: 20,
    hindifontSize: 20,
    englishfontSize: 20,
    backgroundColor: '#0a0a0a',
    tamilTextColor: '#ffffff',
    hindiTextColor: '#ffffff',
    englishTextColor: '#ffffff',
    currentIndex: 0
  });
  const [currentLyrics, setCurrentLyrics] = useState(null);
  const [sections, setSections] = useState({
    tamil: [],
    hindi: [],
    english: []
  });

  useEffect(() => {
    // Listen to live settings
    const liveRef = ref(realtimeDb, 'live');
    const unsubscribeLive = onValue(liveRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLiveSettings(data);
      }
    });

    // Listen to preview selection
    const previewRef = ref(realtimeDb, 'preview');
    const unsubscribePreview = onValue(previewRef, async (snapshot) => {
      const lyricsId = snapshot.val();
      if (lyricsId) {
        const docRef = doc(db, 'lyrics', lyricsId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Map Firestore field names to expected field names
          const lyrics = {
            title: data.title,
            altTitle: data.altTitle || data.alternativeTitle,
            tamil: data.tamilLyrics || data.tamil,
            hindi: data.hindiLyrics || data.hindi,
            english: data.englishLyrics || data.english
          };
          setCurrentLyrics(lyrics);
          setSections({
            tamil: parseLyricsSections(lyrics.tamil),
            hindi: parseLyricsSections(lyrics.hindi),
            english: parseLyricsSections(lyrics.english)
          });
        }
      }
    });

    return () => {
      unsubscribeLive();
      unsubscribePreview();
    };
  }, []);

  if (!liveSettings.isLive) {
    return (
      <div className="live-display default-display" style={{ background: liveSettings.backgroundColor || '#0a0a0a' }}>
        <h1>Shalom</h1>
      </div>
    );
  }

  const getAlignmentClass = () => {
    switch(liveSettings.alignment) {
      case 'side-by-side': return 'side-by-side';
      case 'diagonal': return 'diagonal';
      default: return 'top-bottom';
    }
  };

  const visibleLangs = liveSettings.visible_langs || ['tamil', 'hindi', 'english'];
  const currentIdx = liveSettings.currentIndex || 0;

  // Check if there's any content to display
  const hasContent = visibleLangs.some(lang => {
    if (lang === 'tamil') return sections.tamil && sections.tamil[currentIdx];
    if (lang === 'hindi') return sections.hindi && sections.hindi[currentIdx];
    if (lang === 'english') return sections.english && sections.english[currentIdx];
    return false;
  });

  if (!hasContent) {
    return (
      <div className="live-display default-display" style={{ background: liveSettings.backgroundColor || '#0a0a0a' }}>
        <h2 style={{ color: '#999' }}>No lyrics to display</h2>
        <p style={{ color: '#777', marginTop: '10px' }}>Please select a song and go live</p>
      </div>
    );
  }

  return (
    <div className={`live-display ${getAlignmentClass()}`} style={{ background: liveSettings.backgroundColor || '#0a0a0a' }}>
      {visibleLangs.includes('tamil') && sections.tamil && sections.tamil[currentIdx] && (
        <div
          className="live-language tamil"
          style={{
            fontSize: `${liveSettings.tamilfontSize || 20}px`,
            color: liveSettings.tamilTextColor || '#ffffff'
          }}
        >
          {capitalizeWords(sections.tamil[currentIdx])}
        </div>
      )}
      {visibleLangs.includes('hindi') && sections.hindi && sections.hindi[currentIdx] && (
        <div
          className="live-language hindi"
          style={{
            fontSize: `${liveSettings.hindifontSize || 20}px`,
            color: liveSettings.hindiTextColor || '#ffffff'
          }}
        >
          {capitalizeWords(sections.hindi[currentIdx])}
        </div>
      )}
      {visibleLangs.includes('english') && sections.english && sections.english[currentIdx] && (
        <div
          className="live-language english"
          style={{
            fontSize: `${liveSettings.englishfontSize || 20}px`,
            color: liveSettings.englishTextColor || '#ffffff'
          }}
        >
          {capitalizeWords(sections.english[currentIdx])}
        </div>
      )}
    </div>
  );
};

// Main App Component
function App() {
  const [currentView, setCurrentView] = useState('controller');
  const [selectedLyrics, setSelectedLyrics] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    // Load dark mode preference from localStorage
    const savedMode = localStorage.getItem('darkMode');
    return savedMode === 'true';
  });
  const [settings, setSettings] = useState(() => {
    // Load settings from localStorage or use defaults
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    return {
      visibleLanguages: ['tamil', 'hindi', 'english'],
      tamilFontSize: 20,
      hindiFontSize: 20,
      englishFontSize: 20,
      alignment: 'top-bottom',
      autoCapitalize: true,
      showSongNumbers: true,
      showAlternativeTitle: true,
      previewLanguage: 'english',
      backgroundColor: '#0a0a0a',
      tamilTextColor: '#ffffff',
      hindiTextColor: '#ffffff',
      englishTextColor: '#ffffff'
    };
  });

  // Check if we're on the /live route
  const isLiveRoute = window.location.pathname === '/live';

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    // Save preference to localStorage
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Load settings from Firebase on mount
  useEffect(() => {
    const liveRef = ref(realtimeDb, 'live');
    const unsubscribe = onValue(liveRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Get current localStorage settings for fields not in Firebase
        const savedSettings = localStorage.getItem('appSettings');
        const localSettings = savedSettings ? JSON.parse(savedSettings) : {};

        // Map Firebase settings to app settings format
        const firebaseSettings = {
          visibleLanguages: data.visible_langs || ['tamil', 'hindi', 'english'],
          tamilFontSize: data.tamilfontSize || 20,
          hindiFontSize: data.hindifontSize || 20,
          englishFontSize: data.englishfontSize || 20,
          alignment: data.alignment || 'top-bottom',
          backgroundColor: data.backgroundColor || '#0a0a0a',
          tamilTextColor: data.tamilTextColor || '#ffffff',
          hindiTextColor: data.hindiTextColor || '#ffffff',
          englishTextColor: data.englishTextColor || '#ffffff',
          autoCapitalize: localSettings.autoCapitalize !== undefined ? localSettings.autoCapitalize : true,
          showSongNumbers: localSettings.showSongNumbers !== undefined ? localSettings.showSongNumbers : true,
          showAlternativeTitle: localSettings.showAlternativeTitle !== undefined ? localSettings.showAlternativeTitle : true,
          previewLanguage: localSettings.previewLanguage || 'english'
        };

        setSettings(firebaseSettings);
        localStorage.setItem('appSettings', JSON.stringify(firebaseSettings));
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync selected lyrics with Firebase on mount and when preview changes
  useEffect(() => {
    const previewRef = ref(realtimeDb, 'preview');
    const unsubscribe = onValue(previewRef, async (snapshot) => {
      const lyricsId = snapshot.val();
      if (lyricsId) {
        // Only update if it's a different song or we don't have a selection
        if (!selectedLyrics || selectedLyrics.id !== lyricsId) {
          // Fetch the selected lyrics from Firestore
          const docRef = doc(db, 'lyrics', lyricsId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Map Firestore field names to expected field names
            const lyrics = {
              id: lyricsId,
              title: data.title,
              alternativeTitle: data.altTitle || data.alternativeTitle,
              tamil: data.tamilLyrics || data.tamil,
              hindi: data.hindiLyrics || data.hindi,
              english: data.englishLyrics || data.english
            };
            setSelectedLyrics(lyrics);
          }
        }
      } else {
        // Clear selection if no preview ID in Firebase
        setSelectedLyrics(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // If we're on /live route, show only the live display
  if (isLiveRoute) {
    return <LiveLyricsBlock />;
  }

  // Show controller page directly without navigation bar
  return (
    <div className="app-container">
      <ControllerPage
        selectedLyrics={selectedLyrics}
        setSelectedLyrics={setSelectedLyrics}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        settings={settings}
        onSettingsChange={setSettings}
      />
    </div>
  );
}

export default App;

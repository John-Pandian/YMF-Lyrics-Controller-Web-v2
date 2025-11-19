import React, { useState, useEffect } from 'react';
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
      previewLanguage: 'english'
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
const LyricsControlBar = ({ darkMode, setDarkMode, onOpenSettings, settings }) => {
  const [liveStatus, setLiveStatus] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

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
        <button onClick={() => setShowAddDialog(true)} className="add-button">
          <span className="add-icon">+</span>
          <span className="add-text">Add Song</span>
        </button>
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
              <div className="song-number">{index + 1}</div>
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

  return (
    <div className="controller-page">
      <LyricsControlBar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenSettings={() => setShowSettings(true)}
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
      <div className="live-display default-display">
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
      <div className="live-display default-display">
        <h2 style={{ color: '#999' }}>No lyrics to display</h2>
        <p style={{ color: '#777', marginTop: '10px' }}>Please select a song and go live</p>
      </div>
    );
  }

  return (
    <div className={`live-display ${getAlignmentClass()}`}>
      {visibleLangs.includes('tamil') && sections.tamil && sections.tamil[currentIdx] && (
        <div
          className="live-language tamil"
          style={{ fontSize: `${liveSettings.tamilfontSize || 20}px` }}
        >
          {capitalizeWords(sections.tamil[currentIdx])}
        </div>
      )}
      {visibleLangs.includes('hindi') && sections.hindi && sections.hindi[currentIdx] && (
        <div
          className="live-language hindi"
          style={{ fontSize: `${liveSettings.hindifontSize || 20}px` }}
        >
          {capitalizeWords(sections.hindi[currentIdx])}
        </div>
      )}
      {visibleLangs.includes('english') && sections.english && sections.english[currentIdx] && (
        <div
          className="live-language english"
          style={{ fontSize: `${liveSettings.englishfontSize || 20}px` }}
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
      previewLanguage: 'english'
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

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

// LyricsControlBar Component
const LyricsControlBar = ({ onSettingsChange }) => {
  const [liveStatus, setLiveStatus] = useState(false);
  const [alignment, setAlignment] = useState('top-bottom');
  const [visibleLangs, setVisibleLangs] = useState(['tamil', 'hindi', 'english']);
  const [tamilFontSize, setTamilFontSize] = useState(20);
  const [hindiFontSize, setHindiFontSize] = useState(20);
  const [englishFontSize, setEnglishFontSize] = useState(20);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const liveRef = ref(realtimeDb, 'live');
    const unsubscribe = onValue(liveRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLiveStatus(data.isLive || false);
        setAlignment(data.alignment || 'top-bottom');
        setVisibleLangs(data.visible_langs || ['tamil', 'hindi', 'english']);
        setTamilFontSize(data.tamilfontSize || 20);
        setHindiFontSize(data.hindifontSize || 20);
        setEnglishFontSize(data.englishfontSize || 20);
        setCurrentIndex(data.currentIndex || 0);
      }
    });

    return () => unsubscribe();
  }, []);

  const updateLiveSettings = (updates) => {
    const liveRef = ref(realtimeDb, 'live');
    // Preserve currentIndex when updating other settings
    const currentSettings = {
      isLive: liveStatus,
      alignment,
      visible_langs: visibleLangs,
      tamilfontSize: tamilFontSize,
      hindifontSize: hindiFontSize,
      englishfontSize: englishFontSize,
      currentIndex: currentIndex, // Preserve the current index
      ...updates
    };
    set(liveRef, currentSettings);
    if (onSettingsChange) onSettingsChange(currentSettings);
  };

  const toggleLive = () => {
    const newLiveStatus = !liveStatus;
    setLiveStatus(newLiveStatus);
    updateLiveSettings({ isLive: newLiveStatus });
  };

  const handleAlignmentChange = (newAlignment) => {
    setAlignment(newAlignment);
    updateLiveSettings({ alignment: newAlignment });
  };

  const toggleLanguage = (lang) => {
    const newVisibleLangs = visibleLangs.includes(lang)
      ? visibleLangs.filter(l => l !== lang)
      : [...visibleLangs, lang];
    setVisibleLangs(newVisibleLangs);
    updateLiveSettings({ visible_langs: newVisibleLangs });
  };

  const handleFontSizeChange = (lang, size) => {
    const newSize = parseInt(size) || 20;
    switch(lang) {
      case 'tamil':
        setTamilFontSize(newSize);
        updateLiveSettings({ tamilfontSize: newSize });
        break;
      case 'hindi':
        setHindiFontSize(newSize);
        updateLiveSettings({ hindifontSize: newSize });
        break;
      case 'english':
        setEnglishFontSize(newSize);
        updateLiveSettings({ englishfontSize: newSize });
        break;
    }
  };

  return (
    <div className="lyrics-control-bar">
      <div className="control-section languages">
        <h3>🌐 Language Settings</h3>
        <div className="language-controls">
          {[
            { id: 'tamil', label: 'தமிழ் (Tamil)', emoji: '🟦' },
            { id: 'hindi', label: 'हिन्दी (Hindi)', emoji: '🟧' },
            { id: 'english', label: 'English', emoji: '🟩' }
          ].map(lang => (
            <div key={lang.id} className={`lang-control ${visibleLangs.includes(lang.id) ? 'active' : ''}`}>
              <div className="lang-header">
                <label className="lang-toggle">
                  <input
                    type="checkbox"
                    checked={visibleLangs.includes(lang.id)}
                    onChange={() => toggleLanguage(lang.id)}
                  />
                  <span className="toggle-slider"></span>
                  <span className="lang-label">
                    <span className="lang-emoji">{lang.emoji}</span>
                    {lang.label}
                  </span>
                </label>
              </div>
              <div className="font-size-control">
                <button
                  className="size-btn decrease"
                  onClick={() => handleFontSizeChange(lang.id,
                    (lang.id === 'tamil' ? tamilFontSize : lang.id === 'hindi' ? hindiFontSize : englishFontSize) - 2
                  )}
                >
                  −
                </button>
                <div className="size-display">
                  <input
                    type="number"
                    value={lang.id === 'tamil' ? tamilFontSize : lang.id === 'hindi' ? hindiFontSize : englishFontSize}
                    onChange={(e) => handleFontSizeChange(lang.id, e.target.value)}
                    min="10"
                    max="100"
                    className="font-size-input"
                  />
                  <span className="size-label">px</span>
                </div>
                <button
                  className="size-btn increase"
                  onClick={() => handleFontSizeChange(lang.id,
                    (lang.id === 'tamil' ? tamilFontSize : lang.id === 'hindi' ? hindiFontSize : englishFontSize) + 2
                  )}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="control-section">
        <h3>Alignment</h3>
        <div className="alignment-controls">
          <button
            className={alignment === 'top-bottom' ? 'active' : ''}
            onClick={() => handleAlignmentChange('top-bottom')}
          >
            Top-Bottom
          </button>
          <button
            className={alignment === 'side-by-side' ? 'active' : ''}
            onClick={() => handleAlignmentChange('side-by-side')}
          >
            Side-by-Side
          </button>
          <button
            className={alignment === 'diagonal' ? 'active' : ''}
            onClick={() => handleAlignmentChange('diagonal')}
          >
            Diagonal
          </button>
        </div>
      </div>

      <div className="control-section live-controls">
        <button
          className={`live-button ${liveStatus ? 'live' : 'ready'}`}
          onClick={toggleLive}
        >
          {liveStatus ? '⏹ STOP' : '▶️ GO LIVE'}
        </button>
        <button
          className="open-live-btn"
          onClick={() => window.open('/live', '_blank')}
          title="Open Live Display in new window"
        >
          📺 Open Live Display
        </button>
      </div>
    </div>
  );
};

// LyricsList Component
const LyricsList = ({ onSelectLyrics, selectedId }) => {
  const [lyricsList, setLyricsList] = useState([]);
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
    });

    return () => unsubscribe();
  }, []);

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
        <h3>Songs</h3>
        <button onClick={() => setShowAddDialog(true)} className="add-button">
          + Add
        </button>
      </div>

      <div className="songs-list">
        {lyricsList.map((lyrics) => (
          <div
            key={lyrics.id}
            className={`song-item ${selectedId === lyrics.id ? 'selected' : ''}`}
            onClick={() => onSelectLyrics(lyrics)}
          >
            <div className="song-title">{lyrics.title}</div>
            {lyrics.alternativeTitle && (
              <div className="song-alt-title">{lyrics.alternativeTitle}</div>
            )}
          </div>
        ))}
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
const LyricsPreviewControl = ({ selectedLyrics }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sections, setSections] = useState({
    tamil: [],
    hindi: [],
    english: []
  });

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
      <h2>{selectedLyrics.title}</h2>
      {selectedLyrics.alternativeTitle && (
        <h3>{selectedLyrics.alternativeTitle}</h3>
      )}

      <div className="section-buttons">
        {[...Array(maxSections)].map((_, index) => (
          <button
            key={index}
            className={`section-button ${currentIndex === index ? 'active' : ''}`}
            onClick={() => handleSectionClick(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className="preview-content">
        <div className="preview-section">
          <h4>Tamil</h4>
          <div className="preview-text">
            {sections.tamil && sections.tamil[currentIndex]
              ? capitalizeWords(sections.tamil[currentIndex])
              : <span style={{color: '#999', fontStyle: 'italic'}}>No Tamil lyrics for this section</span>}
          </div>
        </div>
        <div className="preview-section">
          <h4>Hindi</h4>
          <div className="preview-text">
            {sections.hindi && sections.hindi[currentIndex]
              ? capitalizeWords(sections.hindi[currentIndex])
              : <span style={{color: '#999', fontStyle: 'italic'}}>No Hindi lyrics for this section</span>}
          </div>
        </div>
        <div className="preview-section">
          <h4>English</h4>
          <div className="preview-text">
            {sections.english && sections.english[currentIndex]
              ? capitalizeWords(sections.english[currentIndex])
              : <span style={{color: '#999', fontStyle: 'italic'}}>No English lyrics for this section</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

// Controller Page Component
const ControllerPage = ({ selectedLyrics, setSelectedLyrics }) => {
  return (
    <div className="controller-page">
      <LyricsControlBar />
      <div className="controller-main">
        <LyricsList
          onSelectLyrics={setSelectedLyrics}
          selectedId={selectedLyrics?.id}
        />
        <LyricsPreviewControl selectedLyrics={selectedLyrics} />
      </div>
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

  // Check if we're on the /live route
  const isLiveRoute = window.location.pathname === '/live';

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
      />
    </div>
  );
}

export default App;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';
import './GlobalSearch.css';

function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
        setResults(null);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults(null); return; }
    setLoading(true);
    try {
      const resp = await axios.get(`${API_URL}/search`, { params: { q } });
      setResults(resp.data.results);
    } catch (err) {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const handleSelect = (item) => {
    setOpen(false);
    setQuery('');
    setResults(null);
    if (item.type === 'employee') navigate(`/employees/${item.id}`);
    else if (item.type === 'project') navigate('/projects');
    else if (item.type === 'user') navigate('/users');
  };

  const allResults = results ? [
    ...( results.employees || []),
    ...( results.projects || []),
    ...( results.users || []),
  ] : [];

  return (
    <div className="global-search-wrap" ref={wrapRef}>
      <button
        className="search-trigger"
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        title="Search (Ctrl+K)"
      >
        🔍 <span className="search-hint">Ctrl+K</span>
      </button>

      {open && (
        <div className="search-modal-overlay" onClick={() => setOpen(false)}>
          <div className="search-modal" onClick={e => e.stopPropagation()}>
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search employees, projects, users..."
                className="search-input"
                autoFocus
              />
              {query && <button className="search-clear" onClick={() => { setQuery(''); setResults(null); }}>✕</button>}
            </div>

            {loading && <div className="search-loading">Searching...</div>}

            {results && allResults.length === 0 && !loading && (
              <div className="search-empty">No results found for "{query}"</div>
            )}

            {results && allResults.length > 0 && (
              <div className="search-results">
                {results.employees?.length > 0 && (
                  <div className="result-group">
                    <div className="result-group-title">👥 Employees</div>
                    {results.employees.map(item => (
                      <div key={item.id} className="result-item" onClick={() => handleSelect(item)}>
                        <span className="result-title">{item.title}</span>
                        {item.subtitle && <span className="result-sub">{item.subtitle}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {results.projects?.length > 0 && (
                  <div className="result-group">
                    <div className="result-group-title">📁 Projects</div>
                    {results.projects.map(item => (
                      <div key={item.id} className="result-item" onClick={() => handleSelect(item)}>
                        <span className="result-title">{item.title}</span>
                        {item.subtitle && <span className="result-sub">{item.subtitle}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {results.users?.length > 0 && (
                  <div className="result-group">
                    <div className="result-group-title">👤 Users</div>
                    {results.users.map(item => (
                      <div key={item.id} className="result-item" onClick={() => handleSelect(item)}>
                        <span className="result-title">{item.title}</span>
                        {item.subtitle && <span className="result-sub">{item.subtitle}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="search-footer">
              Press <kbd>ESC</kbd> to close · <kbd>↵</kbd> to navigate
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;

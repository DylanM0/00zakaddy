import React, { useState } from 'react';
import { FiCheck, FiAlertCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const ComparisonResult = ({ result, mode }) => {
  const [expandedMatches, setExpandedMatches] = useState({});

  const toggleMatch = (index) => {
    setExpandedMatches(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getSimilarityColor = (similarity) => {
    if (similarity >= 90) return '#10b981'; // green
    if (similarity >= 75) return '#f59e0b'; // amber
    if (similarity >= 60) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const highlightText = (text, differences) => {
    if (!differences || (!differences.added?.length && !differences.removed?.length)) {
      return <span>{text}</span>;
    }

    const words = text.split(' ');
    return (
      <span>
        {words.map((word, idx) => {
          const cleanWord = word.toLowerCase().replace(/[^\w가-힣]/g, '');
          const isAdded = differences.added?.includes(cleanWord);
          const isRemoved = differences.removed?.includes(cleanWord);

          if (isAdded) {
            return <span key={idx} className="highlight-added">{word} </span>;
          } else if (isRemoved) {
            return <span key={idx} className="highlight-removed">{word} </span>;
          }
          return <span key={idx}>{word} </span>;
        })}
      </span>
    );
  };

  if (mode === 'one-to-one') {
    return (
      <div className="comparison-result">
        <div className="result-header">
          <h2>비교 결과</h2>
          <div className="overall-similarity">
            <span className="label">전체 유사도:</span>
            <span
              className="percentage"
              style={{ color: getSimilarityColor(result.comparison.overallSimilarity) }}
            >
              {result.comparison.overallSimilarity.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="statistics-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FiCheck />
            </div>
            <div className="stat-content">
              <span className="stat-value">{result.comparison.totalMatches}</span>
              <span className="stat-label">일치하는 항목</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FiAlertCircle />
            </div>
            <div className="stat-content">
              <span className="stat-value">{result.statistics.sourceMatchPercentage}%</span>
              <span className="stat-label">원본 일치율</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FiAlertCircle />
            </div>
            <div className="stat-content">
              <span className="stat-value">{result.statistics.targetMatchPercentage}%</span>
              <span className="stat-label">대상 일치율</span>
            </div>
          </div>
        </div>

        <div className="documents-container">
          <div className="document-panel">
            <h3>원본 문서</h3>
            <div className="document-name">{result.source.name}</div>
            <div className="document-content">
              {result.source.lines.map((line, idx) => {
                const match = result.comparison.matches.find(m => m.sourceLineIndex === idx);
                return (
                  <div
                    key={idx}
                    className={`line ${match ? 'highlighted' : ''}`}
                    style={match ? { backgroundColor: `rgba(16, 185, 129, ${match.similarity / 200})` } : {}}
                  >
                    <span className="line-number">{idx + 1}</span>
                    <span className="line-text">{line}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="document-panel">
            <h3>비교 문서</h3>
            <div className="document-name">{result.target.name}</div>
            <div className="document-content">
              {result.target.lines.map((line, idx) => {
                const match = result.comparison.matches.find(m => m.targetLineIndex === idx);
                return (
                  <div
                    key={idx}
                    className={`line ${match ? 'highlighted' : ''}`}
                    style={match ? { backgroundColor: `rgba(16, 185, 129, ${match.similarity / 200})` } : {}}
                  >
                    <span className="line-number">{idx + 1}</span>
                    <span className="line-text">{line}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="matches-section">
          <h3>일치 항목 상세 ({result.comparison.matches.length}개)</h3>
          <div className="matches-list">
            {result.comparison.matches.map((match, idx) => (
              <div key={idx} className="match-item">
                <div className="match-header" onClick={() => toggleMatch(idx)}>
                  <div className="match-info">
                    <span className="match-index">#{idx + 1}</span>
                    <div className="similarity-badge" style={{ backgroundColor: getSimilarityColor(match.similarity) }}>
                      {match.similarity}%
                    </div>
                    <span className="line-info">
                      원본 줄 {match.sourceLineIndex + 1} ↔ 대상 줄 {match.targetLineIndex + 1}
                    </span>
                  </div>
                  <button className="expand-btn">
                    {expandedMatches[idx] ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                </div>

                {expandedMatches[idx] && (
                  <div className="match-details">
                    <div className="text-comparison">
                      <div className="text-item">
                        <label>원본:</label>
                        <p>{highlightText(match.sourceLine, { removed: match.differences.removed })}</p>
                      </div>
                      <div className="text-item">
                        <label>대상:</label>
                        <p>{highlightText(match.targetLine, { added: match.differences.added })}</p>
                      </div>
                    </div>
                    {(match.differences.added?.length > 0 || match.differences.removed?.length > 0) && (
                      <div className="differences">
                        {match.differences.removed?.length > 0 && (
                          <div className="diff-section">
                            <label>제거된 단어:</label>
                            <div className="word-tags">
                              {match.differences.removed.map((word, i) => (
                                <span key={i} className="word-tag removed">{word}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {match.differences.added?.length > 0 && (
                          <div className="diff-section">
                            <label>추가된 단어:</label>
                            <div className="word-tags">
                              {match.differences.added.map((word, i) => (
                                <span key={i} className="word-tag added">{word}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // One-to-Many mode
  return (
    <div className="comparison-result">
      <div className="result-header">
        <h2>비교 결과</h2>
        <div className="source-info">
          <span className="label">원본 문서:</span>
          <span className="value">{result.source.name}</span>
        </div>
      </div>

      <div className="targets-overview">
        {result.results.map((targetResult, idx) => (
          <div key={idx} className="target-summary-card">
            <div className="target-header">
              <h4>{targetResult.targetName}</h4>
              <div
                className="similarity-badge large"
                style={{ backgroundColor: getSimilarityColor(targetResult.overallSimilarity) }}
              >
                {targetResult.overallSimilarity.toFixed(2)}%
              </div>
            </div>
            <div className="target-stats">
              <div className="stat">
                <span className="stat-label">일치 항목:</span>
                <span className="stat-value">{targetResult.totalMatches}</span>
              </div>
              <div className="stat">
                <span className="stat-label">원본 일치율:</span>
                <span className="stat-value">{targetResult.statistics.sourceMatchPercentage}%</span>
              </div>
              <div className="stat">
                <span className="stat-label">대상 일치율:</span>
                <span className="stat-value">{targetResult.statistics.targetMatchPercentage}%</span>
              </div>
            </div>

            <div className="target-details">
              <h5>상위 일치 항목</h5>
              <div className="top-matches">
                {targetResult.matches.slice(0, 5).map((match, mIdx) => (
                  <div key={mIdx} className="mini-match">
                    <div className="mini-match-header">
                      <span className="similarity-badge small" style={{ backgroundColor: getSimilarityColor(match.similarity) }}>
                        {match.similarity}%
                      </span>
                      <span className="line-info-small">
                        {match.sourceLineIndex + 1} → {match.targetLineIndex + 1}
                      </span>
                    </div>
                    <p className="match-preview">{match.sourceLine.substring(0, 100)}...</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComparisonResult;

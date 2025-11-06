import React, { useState } from 'react';
import { FiCheck, FiAlertCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const ComparisonResult = ({ result, mode }) => {
  const [expandedMatches, setExpandedMatches] = useState({});
  const [selectedSourceLine, setSelectedSourceLine] = useState(null);
  const [selectedTargetLine, setSelectedTargetLine] = useState(null);
  const [hoveredSourceLine, setHoveredSourceLine] = useState(null);
  const [selectedTargetIndex, setSelectedTargetIndex] = useState(0); // For one-to-many mode
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0); // For many-to-many mode

  const toggleMatch = (index) => {
    setExpandedMatches(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Pastel color system: 10% intervals
  const getSimilarityColor = (similarity) => {
    if (similarity >= 95) return '#86efac'; // 100% - green pastel
    if (similarity >= 85) return '#bbf7d0'; // 90% - light green pastel
    if (similarity >= 75) return '#d9f99d'; // 80% - lime pastel
    if (similarity >= 65) return '#fef08a'; // 70% - yellow pastel
    if (similarity >= 55) return '#fed7aa'; // 60% - orange pastel
    return '#fecaca'; // 50% - red pastel
  };

  // Get background color with opacity for highlighting
  const getLineBackgroundColor = (similarity) => {
    const color = getSimilarityColor(similarity);
    return color;
  };

  // Explanation of similarity percentage
  const getSimilarityExplanation = (similarity, matchingChars, totalChars) => {
    return `${matchingChars}/${totalChars} 글자 일치 (${similarity}%)`;
  };

  const highlightText = (text, differences) => {
    if (!differences) return <span>{text}</span>;

    const words = text.split(' ');
    return (
      <span>
        {words.map((word, idx) => {
          const cleanWord = word.toLowerCase().replace(/[^\w\s가-힣]/g, '');
          const isAdded = differences.added?.some(w => w.toLowerCase() === cleanWord);
          const isRemoved = differences.removed?.some(w => w.toLowerCase() === cleanWord);
          const isCommon = differences.common?.some(w => w.toLowerCase() === cleanWord);

          if (isAdded) {
            return <span key={idx} className="highlight-added">{word} </span>;
          } else if (isRemoved) {
            return <span key={idx} className="highlight-removed">{word} </span>;
          } else if (isCommon) {
            return <span key={idx} className="highlight-common">{word} </span>;
          }
          return <span key={idx}>{word} </span>;
        })}
      </span>
    );
  };

  const handleSourceLineClick = (lineIndex) => {
    const match = result.comparison.matches.find(m => m.sourceLineIndex === lineIndex);
    if (match) {
      setSelectedSourceLine(lineIndex);
      setSelectedTargetLine(match.targetLineIndex);

      // Scroll to target line
      const targetElement = document.getElementById(`target-line-${match.targetLineIndex}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleTargetLineClick = (lineIndex) => {
    const match = result.comparison.matches.find(m => m.targetLineIndex === lineIndex);
    if (match) {
      setSelectedTargetLine(lineIndex);
      setSelectedSourceLine(match.sourceLineIndex);

      // Scroll to source line
      const sourceElement = document.getElementById(`source-line-${match.sourceLineIndex}`);
      if (sourceElement) {
        sourceElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const getMatchesForSourceLine = (lineIndex) => {
    return result.comparison.matches.filter(m => m.sourceLineIndex === lineIndex);
  };

  // Get page number for a given line index (for PDF)
  const getPageForLine = (pages, lineIndex, allLines) => {
    if (!pages || pages.length === 0) return null;

    let cumulativeLines = 0;
    for (const page of pages) {
      const pageLines = page.text.split(/\n/).filter(l => l.trim().length > 0);
      if (lineIndex < cumulativeLines + pageLines.length) {
        return {
          pageNumber: page.pageNumber,
          lineInPage: lineIndex - cumulativeLines + 1
        };
      }
      cumulativeLines += pageLines.length;
    }
    return { pageNumber: pages[pages.length - 1].pageNumber, lineInPage: 1 };
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
              style={{
                color: getSimilarityColor(result.comparison.overallSimilarity),
                background: getSimilarityColor(result.comparison.overallSimilarity) + '40',
                padding: '0.5rem 1rem',
                borderRadius: '0.75rem',
                border: `2px solid ${getSimilarityColor(result.comparison.overallSimilarity)}`
              }}
            >
              {result.comparison.overallSimilarity.toFixed(1)}%
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
                const matches = getMatchesForSourceLine(idx);
                const highestMatch = matches.length > 0 ? matches[0] : null;
                const isSelected = selectedSourceLine === idx;
                const sourcePageInfo = result.source.isPDF
                  ? getPageForLine(result.source.pages, idx, result.source.lines)
                  : null;

                return (
                  <div
                    key={idx}
                    id={`source-line-${idx}`}
                    className={`line ${highestMatch ? 'highlighted' : ''} ${isSelected ? 'selected' : ''}`}
                    style={highestMatch ? {
                      backgroundColor: getLineBackgroundColor(highestMatch.similarity),
                      cursor: 'pointer'
                    } : {}}
                    onClick={() => handleSourceLineClick(idx)}
                    onMouseEnter={() => setHoveredSourceLine(idx)}
                    onMouseLeave={() => setHoveredSourceLine(null)}
                  >
                    <span className="line-number">
                      {sourcePageInfo && (
                        <span className="page-badge">P{sourcePageInfo.pageNumber}</span>
                      )}
                      {idx + 1}
                    </span>
                    <span className="line-text">{line}</span>

                    {hoveredSourceLine === idx && matches.length > 0 && (
                      <div className="line-tooltip">
                        {matches.map((match, mIdx) => {
                          const targetPageInfo = result.target.isPDF
                            ? getPageForLine(result.target.pages, match.targetLineIndex, result.target.lines)
                            : null;

                          return (
                            <div key={mIdx}>
                              {result.target.name}의
                              {targetPageInfo
                                ? ` 페이지 ${targetPageInfo.pageNumber} - ${match.targetLineIndex + 1}번째 문장`
                                : ` ${match.targetLineIndex + 1}번째 문장`
                              }과 {match.similarity}% 유사
                              {mIdx < matches.length - 1 && <br />}
                            </div>
                          );
                        })}
                      </div>
                    )}
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
                const isSelected = selectedTargetLine === idx;
                const targetPageInfo = result.target.isPDF
                  ? getPageForLine(result.target.pages, idx, result.target.lines)
                  : null;

                return (
                  <div
                    key={idx}
                    id={`target-line-${idx}`}
                    className={`line ${match ? 'highlighted' : ''} ${isSelected ? 'selected' : ''}`}
                    style={match ? {
                      backgroundColor: getLineBackgroundColor(match.similarity),
                      cursor: 'pointer'
                    } : {}}
                    onClick={() => handleTargetLineClick(idx)}
                  >
                    <span className="line-number">
                      {targetPageInfo && (
                        <span className="page-badge">P{targetPageInfo.pageNumber}</span>
                      )}
                      {idx + 1}
                    </span>
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
                    <div
                      className="similarity-badge"
                      style={{
                        backgroundColor: getSimilarityColor(match.similarity),
                        color: '#0f172a',
                        borderColor: getSimilarityColor(match.similarity)
                      }}
                    >
                      {match.similarity}%
                    </div>
                    <span className="line-info">
                      원본 {match.sourceLineIndex + 1}번 ↔ 대상 {match.targetLineIndex + 1}번
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
                        <label>원본 문장:</label>
                        <p>{highlightText(match.sourceLine, match.differences)}</p>
                      </div>
                      <div className="text-item">
                        <label>비교 문장:</label>
                        <p>{highlightText(match.targetLine, match.differences)}</p>
                      </div>
                    </div>

                    {/* Character-level statistics */}
                    {match.differences?.matchingChars && (
                      <div className="char-stats">
                        <div className="char-stats-title">
                          유사도 상세 분석
                        </div>
                        <div className="char-stats-content">
                          <div className="char-stat">
                            <span className="char-stat-label">일치하는 글자</span>
                            <span className="char-stat-value">{match.differences.matchingChars}</span>
                          </div>
                          <div className="char-stat">
                            <span className="char-stat-label">전체 글자</span>
                            <span className="char-stat-value">{match.differences.totalChars}</span>
                          </div>
                          <div className="char-stat">
                            <span className="char-stat-label">글자 일치율</span>
                            <span className="char-stat-value">
                              {((match.differences.matchingChars / match.differences.totalChars) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Word-level differences */}
                    {(match.differences?.common?.length > 0 ||
                      match.differences?.added?.length > 0 ||
                      match.differences?.removed?.length > 0) && (
                      <div className="differences">
                        {match.differences?.common?.length > 0 && (
                          <div className="diff-section">
                            <label>✓ 같은 단어 ({match.differences.common.length}개):</label>
                            <div className="word-tags">
                              {match.differences.common.slice(0, 20).map((word, i) => (
                                <span key={i} className="word-tag common">{word}</span>
                              ))}
                              {match.differences.common.length > 20 && (
                                <span className="word-tag common">+{match.differences.common.length - 20}개 더</span>
                              )}
                            </div>
                          </div>
                        )}

                        {match.differences?.removed?.length > 0 && (
                          <div className="diff-section">
                            <label>- 원본에만 있는 단어 ({match.differences.removed.length}개):</label>
                            <div className="word-tags">
                              {match.differences.removed.map((word, i) => (
                                <span key={i} className="word-tag removed">{word}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {match.differences?.added?.length > 0 && (
                          <div className="diff-section">
                            <label>+ 비교 문서에만 있는 단어 ({match.differences.added.length}개):</label>
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

  // Many-to-Many mode
  if (mode === 'many-to-many') {
    const selectedSource = result.comparisonMatrix[selectedSourceIndex];
    const selectedTarget = selectedSource.results[selectedTargetIndex];

    return (
      <div className="comparison-result">
        <div className="result-header">
          <h2>N:N 전체 비교 결과</h2>
        </div>

        {/* Source Document Selector */}
        <div className="many-to-many-layout">
          <div className="source-list-panel">
            <h3>원본 문서 ({result.comparisonMatrix.length}개)</h3>
            <div className="source-list">
              {result.comparisonMatrix.map((sourceData, idx) => {
                // Calculate average similarity for this source
                const avgSimilarity = sourceData.results.length > 0
                  ? sourceData.results.reduce((sum, r) => sum + r.overallSimilarity, 0) / sourceData.results.length
                  : 0;
                const totalMatches = sourceData.results.reduce((sum, r) => sum + r.totalMatches, 0);

                return (
                  <div
                    key={idx}
                    className={`source-list-item ${selectedSourceIndex === idx ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedSourceIndex(idx);
                      setSelectedTargetIndex(0);
                      setSelectedSourceLine(null);
                      setSelectedTargetLine(null);
                      setExpandedMatches({});
                    }}
                  >
                    <div className="source-item-header">
                      <h4>{sourceData.sourceName}</h4>
                      {sourceData.isPDF && <span className="pdf-badge">PDF</span>}
                    </div>
                    <div className="source-item-stats">
                      <div className="source-stat">
                        <span className="source-stat-label">평균 유사도</span>
                        <div
                          className="similarity-badge small"
                          style={{
                            backgroundColor: getSimilarityColor(avgSimilarity),
                            color: '#0f172a',
                            borderColor: getSimilarityColor(avgSimilarity)
                          }}
                        >
                          {avgSimilarity.toFixed(1)}%
                        </div>
                      </div>
                      <div className="source-stat">
                        <span className="source-stat-label">총 일치 항목</span>
                        <span className="source-stat-value">{totalMatches}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="comparison-details-panel">
            <div className="selected-source-header">
              <h3>선택된 원본: {selectedSource.sourceName}</h3>
            </div>

            {/* Multi-Document Summary for Selected Source */}
            <div className="multi-document-summary">
              <h4>비교 대상 문서 ({selectedSource.results.length}개)</h4>
              <div className="summary-grid">
                {selectedSource.results.map((targetResult, idx) => (
                  <div
                    key={idx}
                    className={`summary-card ${selectedTargetIndex === idx ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedTargetIndex(idx);
                      setSelectedSourceLine(null);
                      setSelectedTargetLine(null);
                    }}
                  >
                    <div className="summary-card-header">
                      <h4>{targetResult.targetName}</h4>
                      <div
                        className="similarity-badge"
                        style={{
                          backgroundColor: getSimilarityColor(targetResult.overallSimilarity),
                          color: '#0f172a',
                          borderColor: getSimilarityColor(targetResult.overallSimilarity)
                        }}
                      >
                        {targetResult.overallSimilarity.toFixed(1)}%
                      </div>
                    </div>
                    <div className="summary-stats">
                      <div className="summary-stat">
                        <span className="summary-stat-value">{targetResult.totalMatches}</span>
                        <span className="summary-stat-label">일치 항목</span>
                      </div>
                      <div className="summary-stat">
                        <span className="summary-stat-value">{targetResult.statistics.sourceMatchPercentage}%</span>
                        <span className="summary-stat-label">원본 일치율</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Comparison for Selected Target */}
            <div className="selected-target-comparison">
              <h4>상세 비교: {selectedTarget.targetName}</h4>

              <div className="statistics-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <FiCheck />
                  </div>
                  <div className="stat-content">
                    <span className="stat-value">{selectedTarget.totalMatches}</span>
                    <span className="stat-label">일치하는 항목</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <FiAlertCircle />
                  </div>
                  <div className="stat-content">
                    <span className="stat-value">{selectedTarget.statistics.sourceMatchPercentage}%</span>
                    <span className="stat-label">원본 일치율</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <FiAlertCircle />
                  </div>
                  <div className="stat-content">
                    <span className="stat-value">{selectedTarget.statistics.targetMatchPercentage}%</span>
                    <span className="stat-label">대상 일치율</span>
                  </div>
                </div>
              </div>

              <div className="documents-container">
                <div className="document-panel">
                  <h3>원본 문서</h3>
                  <div className="document-name">{selectedSource.sourceName}</div>
                  <div className="document-content">
                    {selectedSource.sourceLines.map((line, idx) => {
                      const matches = selectedTarget.matches.filter(m => m.sourceLineIndex === idx);
                      const highestMatch = matches.length > 0 ? matches[0] : null;
                      const isSelected = selectedSourceLine === idx;
                      const sourcePageInfo = selectedSource.isPDF
                        ? getPageForLine(selectedSource.pages, idx, selectedSource.sourceLines)
                        : null;

                      return (
                        <div
                          key={idx}
                          id={`source-line-${idx}`}
                          className={`line ${highestMatch ? 'highlighted' : ''} ${isSelected ? 'selected' : ''}`}
                          style={highestMatch ? {
                            backgroundColor: getLineBackgroundColor(highestMatch.similarity),
                            cursor: 'pointer'
                          } : {}}
                          onClick={() => {
                            if (highestMatch) {
                              setSelectedSourceLine(idx);
                              setSelectedTargetLine(highestMatch.targetLineIndex);
                              const targetElement = document.getElementById(`target-line-${highestMatch.targetLineIndex}`);
                              if (targetElement) {
                                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }
                          }}
                          onMouseEnter={() => setHoveredSourceLine(idx)}
                          onMouseLeave={() => setHoveredSourceLine(null)}
                        >
                          <span className="line-number">
                            {sourcePageInfo && (
                              <span className="page-badge">P{sourcePageInfo.pageNumber}</span>
                            )}
                            {idx + 1}
                          </span>
                          <span className="line-text">{line}</span>

                          {hoveredSourceLine === idx && matches.length > 0 && (
                            <div className="line-tooltip">
                              {matches.map((match, mIdx) => {
                                const targetPageInfo = selectedTarget.isPDF
                                  ? getPageForLine(selectedTarget.pages, match.targetLineIndex, selectedTarget.targetLines)
                                  : null;

                                return (
                                  <div key={mIdx}>
                                    {selectedTarget.targetName}의
                                    {targetPageInfo
                                      ? ` 페이지 ${targetPageInfo.pageNumber} - ${match.targetLineIndex + 1}번째 문장`
                                      : ` ${match.targetLineIndex + 1}번째 문장`
                                    }과 {match.similarity}% 유사
                                    {mIdx < matches.length - 1 && <br />}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="document-panel">
                  <h3>비교 문서</h3>
                  <div className="document-name">{selectedTarget.targetName}</div>
                  <div className="document-content">
                    {selectedTarget.targetLines.map((line, idx) => {
                      const match = selectedTarget.matches.find(m => m.targetLineIndex === idx);
                      const isSelected = selectedTargetLine === idx;
                      const targetPageInfo = selectedTarget.isPDF
                        ? getPageForLine(selectedTarget.pages, idx, selectedTarget.targetLines)
                        : null;

                      return (
                        <div
                          key={idx}
                          id={`target-line-${idx}`}
                          className={`line ${match ? 'highlighted' : ''} ${isSelected ? 'selected' : ''}`}
                          style={match ? {
                            backgroundColor: getLineBackgroundColor(match.similarity),
                            cursor: 'pointer'
                          } : {}}
                          onClick={() => {
                            if (match) {
                              setSelectedTargetLine(idx);
                              setSelectedSourceLine(match.sourceLineIndex);
                              const sourceElement = document.getElementById(`source-line-${match.sourceLineIndex}`);
                              if (sourceElement) {
                                sourceElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }
                          }}
                        >
                          <span className="line-number">
                            {targetPageInfo && (
                              <span className="page-badge">P{targetPageInfo.pageNumber}</span>
                            )}
                            {idx + 1}
                          </span>
                          <span className="line-text">{line}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="matches-section">
                <h3>일치 항목 상세 ({selectedTarget.matches.length}개)</h3>
                <div className="matches-list">
                  {selectedTarget.matches.map((match, idx) => (
                    <div key={idx} className="match-item">
                      <div className="match-header" onClick={() => toggleMatch(idx)}>
                        <div className="match-info">
                          <span className="match-index">#{idx + 1}</span>
                          <div
                            className="similarity-badge"
                            style={{
                              backgroundColor: getSimilarityColor(match.similarity),
                              color: '#0f172a',
                              borderColor: getSimilarityColor(match.similarity)
                            }}
                          >
                            {match.similarity}%
                          </div>
                          <span className="line-info">
                            원본 {match.sourceLineIndex + 1}번 ↔ 대상 {match.targetLineIndex + 1}번
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
                              <label>원본 문장:</label>
                              <p>{highlightText(match.sourceLine, match.differences)}</p>
                            </div>
                            <div className="text-item">
                              <label>비교 문장:</label>
                              <p>{highlightText(match.targetLine, match.differences)}</p>
                            </div>
                          </div>

                          {match.differences?.matchingChars && (
                            <div className="char-stats">
                              <div className="char-stats-title">유사도 상세 분석</div>
                              <div className="char-stats-content">
                                <div className="char-stat">
                                  <span className="char-stat-label">일치하는 글자</span>
                                  <span className="char-stat-value">{match.differences.matchingChars}</span>
                                </div>
                                <div className="char-stat">
                                  <span className="char-stat-label">전체 글자</span>
                                  <span className="char-stat-value">{match.differences.totalChars}</span>
                                </div>
                                <div className="char-stat">
                                  <span className="char-stat-label">글자 일치율</span>
                                  <span className="char-stat-value">
                                    {((match.differences.matchingChars / match.differences.totalChars) * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {(match.differences?.common?.length > 0 ||
                            match.differences?.added?.length > 0 ||
                            match.differences?.removed?.length > 0) && (
                            <div className="differences">
                              {match.differences?.common?.length > 0 && (
                                <div className="diff-section">
                                  <label>✓ 같은 단어 ({match.differences.common.length}개):</label>
                                  <div className="word-tags">
                                    {match.differences.common.slice(0, 20).map((word, i) => (
                                      <span key={i} className="word-tag common">{word}</span>
                                    ))}
                                    {match.differences.common.length > 20 && (
                                      <span className="word-tag common">+{match.differences.common.length - 20}개 더</span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {match.differences?.removed?.length > 0 && (
                                <div className="diff-section">
                                  <label>- 원본에만 있는 단어 ({match.differences.removed.length}개):</label>
                                  <div className="word-tags">
                                    {match.differences.removed.map((word, i) => (
                                      <span key={i} className="word-tag removed">{word}</span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {match.differences?.added?.length > 0 && (
                                <div className="diff-section">
                                  <label>+ 비교 문서에만 있는 단어 ({match.differences.added.length}개):</label>
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
          </div>
        </div>
      </div>
    );
  }

  // One-to-Many mode
  const selectedTarget = result.results[selectedTargetIndex];

  // Create a one-to-one comparison object for the selected target
  const oneToOneComparison = {
    source: result.source,
    target: {
      name: selectedTarget.targetName,
      text: selectedTarget.targetText,
      lines: selectedTarget.targetLines
    },
    comparison: {
      overallSimilarity: selectedTarget.overallSimilarity,
      totalMatches: selectedTarget.totalMatches,
      matches: selectedTarget.matches,
      sourceLines: result.source.lines.length,
      targetLines: selectedTarget.targetLines.length
    },
    statistics: selectedTarget.statistics
  };

  return (
    <div className="comparison-result">
      <div className="result-header">
        <h2>다중 문서 비교 결과</h2>
        <div className="source-info">
          <span className="label">원본 문서:</span>
          <span className="value">{result.source.name}</span>
        </div>
      </div>

      {/* Overall Summary */}
      <div className="multi-document-summary">
        <h3>전체 비교 요약 ({result.results.length}개 문서)</h3>
        <div className="summary-grid">
          {result.results.map((targetResult, idx) => (
            <div
              key={idx}
              className={`summary-card ${selectedTargetIndex === idx ? 'selected' : ''}`}
              onClick={() => {
                setSelectedTargetIndex(idx);
                setSelectedSourceLine(null);
                setSelectedTargetLine(null);
              }}
            >
              <div className="summary-card-header">
                <h4>{targetResult.targetName}</h4>
                <div
                  className="similarity-badge"
                  style={{
                    backgroundColor: getSimilarityColor(targetResult.overallSimilarity),
                    color: '#0f172a',
                    borderColor: getSimilarityColor(targetResult.overallSimilarity)
                  }}
                >
                  {targetResult.overallSimilarity.toFixed(1)}%
                </div>
              </div>
              <div className="summary-stats">
                <div className="summary-stat">
                  <span className="summary-stat-value">{targetResult.totalMatches}</span>
                  <span className="summary-stat-label">일치 항목</span>
                </div>
                <div className="summary-stat">
                  <span className="summary-stat-value">{targetResult.statistics.sourceMatchPercentage}%</span>
                  <span className="summary-stat-label">원본 일치율</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Target Selector */}
      <div className="target-selector">
        <label htmlFor="target-select">비교 대상 선택:</label>
        <select
          id="target-select"
          value={selectedTargetIndex}
          onChange={(e) => {
            setSelectedTargetIndex(parseInt(e.target.value));
            setSelectedSourceLine(null);
            setSelectedTargetLine(null);
          }}
        >
          {result.results.map((targetResult, idx) => (
            <option key={idx} value={idx}>
              {targetResult.targetName} (유사도: {targetResult.overallSimilarity.toFixed(1)}%)
            </option>
          ))}
        </select>
      </div>

      {/* Detailed Comparison for Selected Target (same as 1:1 mode) */}
      <div className="selected-target-comparison">
        <h3>상세 비교: {selectedTarget.targetName}</h3>

        <div className="statistics-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FiCheck />
            </div>
            <div className="stat-content">
              <span className="stat-value">{selectedTarget.totalMatches}</span>
              <span className="stat-label">일치하는 항목</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FiAlertCircle />
            </div>
            <div className="stat-content">
              <span className="stat-value">{selectedTarget.statistics.sourceMatchPercentage}%</span>
              <span className="stat-label">원본 일치율</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FiAlertCircle />
            </div>
            <div className="stat-content">
              <span className="stat-value">{selectedTarget.statistics.targetMatchPercentage}%</span>
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
                const matches = selectedTarget.matches.filter(m => m.sourceLineIndex === idx);
                const highestMatch = matches.length > 0 ? matches[0] : null;
                const isSelected = selectedSourceLine === idx;

                return (
                  <div
                    key={idx}
                    id={`source-line-${idx}`}
                    className={`line ${highestMatch ? 'highlighted' : ''} ${isSelected ? 'selected' : ''}`}
                    style={highestMatch ? {
                      backgroundColor: getLineBackgroundColor(highestMatch.similarity),
                      cursor: 'pointer'
                    } : {}}
                    onClick={() => {
                      if (highestMatch) {
                        setSelectedSourceLine(idx);
                        setSelectedTargetLine(highestMatch.targetLineIndex);
                        const targetElement = document.getElementById(`target-line-${highestMatch.targetLineIndex}`);
                        if (targetElement) {
                          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }
                    }}
                    onMouseEnter={() => setHoveredSourceLine(idx)}
                    onMouseLeave={() => setHoveredSourceLine(null)}
                  >
                    <span className="line-number">{idx + 1}</span>
                    <span className="line-text">{line}</span>

                    {hoveredSourceLine === idx && matches.length > 0 && (
                      <div className="line-tooltip">
                        {matches.map((match, mIdx) => (
                          <div key={mIdx}>
                            {selectedTarget.targetName}의 {match.targetLineIndex + 1}번째 문장과 {match.similarity}% 유사
                            {mIdx < matches.length - 1 && <br />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="document-panel">
            <h3>비교 문서</h3>
            <div className="document-name">{selectedTarget.targetName}</div>
            <div className="document-content">
              {selectedTarget.targetLines.map((line, idx) => {
                const match = selectedTarget.matches.find(m => m.targetLineIndex === idx);
                const isSelected = selectedTargetLine === idx;

                return (
                  <div
                    key={idx}
                    id={`target-line-${idx}`}
                    className={`line ${match ? 'highlighted' : ''} ${isSelected ? 'selected' : ''}`}
                    style={match ? {
                      backgroundColor: getLineBackgroundColor(match.similarity),
                      cursor: 'pointer'
                    } : {}}
                    onClick={() => {
                      if (match) {
                        setSelectedTargetLine(idx);
                        setSelectedSourceLine(match.sourceLineIndex);
                        const sourceElement = document.getElementById(`source-line-${match.sourceLineIndex}`);
                        if (sourceElement) {
                          sourceElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }
                    }}
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
          <h3>일치 항목 상세 ({selectedTarget.matches.length}개)</h3>
          <div className="matches-list">
            {selectedTarget.matches.map((match, idx) => (
              <div key={idx} className="match-item">
                <div className="match-header" onClick={() => toggleMatch(idx)}>
                  <div className="match-info">
                    <span className="match-index">#{idx + 1}</span>
                    <div
                      className="similarity-badge"
                      style={{
                        backgroundColor: getSimilarityColor(match.similarity),
                        color: '#0f172a',
                        borderColor: getSimilarityColor(match.similarity)
                      }}
                    >
                      {match.similarity}%
                    </div>
                    <span className="line-info">
                      원본 {match.sourceLineIndex + 1}번 ↔ 대상 {match.targetLineIndex + 1}번
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
                        <label>원본 문장:</label>
                        <p>{highlightText(match.sourceLine, match.differences)}</p>
                      </div>
                      <div className="text-item">
                        <label>비교 문장:</label>
                        <p>{highlightText(match.targetLine, match.differences)}</p>
                      </div>
                    </div>

                    {match.differences?.matchingChars && (
                      <div className="char-stats">
                        <div className="char-stats-title">유사도 상세 분석</div>
                        <div className="char-stats-content">
                          <div className="char-stat">
                            <span className="char-stat-label">일치하는 글자</span>
                            <span className="char-stat-value">{match.differences.matchingChars}</span>
                          </div>
                          <div className="char-stat">
                            <span className="char-stat-label">전체 글자</span>
                            <span className="char-stat-value">{match.differences.totalChars}</span>
                          </div>
                          <div className="char-stat">
                            <span className="char-stat-label">글자 일치율</span>
                            <span className="char-stat-value">
                              {((match.differences.matchingChars / match.differences.totalChars) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {(match.differences?.common?.length > 0 ||
                      match.differences?.added?.length > 0 ||
                      match.differences?.removed?.length > 0) && (
                      <div className="differences">
                        {match.differences?.common?.length > 0 && (
                          <div className="diff-section">
                            <label>✓ 같은 단어 ({match.differences.common.length}개):</label>
                            <div className="word-tags">
                              {match.differences.common.slice(0, 20).map((word, i) => (
                                <span key={i} className="word-tag common">{word}</span>
                              ))}
                              {match.differences.common.length > 20 && (
                                <span className="word-tag common">+{match.differences.common.length - 20}개 더</span>
                              )}
                            </div>
                          </div>
                        )}

                        {match.differences?.removed?.length > 0 && (
                          <div className="diff-section">
                            <label>- 원본에만 있는 단어 ({match.differences.removed.length}개):</label>
                            <div className="word-tags">
                              {match.differences.removed.map((word, i) => (
                                <span key={i} className="word-tag removed">{word}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {match.differences?.added?.length > 0 && (
                          <div className="diff-section">
                            <label>+ 비교 문서에만 있는 단어 ({match.differences.added.length}개):</label>
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
    </div>
  );
};

export default ComparisonResult;

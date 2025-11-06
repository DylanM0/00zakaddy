import React, { useState } from 'react';
import FileUploader from './components/FileUploader';
import ComparisonResult from './components/ComparisonResult';
import { compareOneToOne, compareOneToMany, compareManyToMany } from './services/api';
import { FiSettings, FiFileText } from 'react-icons/fi';
import './styles/App.css';

function App() {
  const [mode, setMode] = useState('one-to-one'); // 'one-to-one', 'one-to-many', or 'many-to-many'
  const [sourceFile, setSourceFile] = useState(null);
  const [sourceFiles, setSourceFiles] = useState([]);
  const [targetFile, setTargetFile] = useState(null);
  const [targetFiles, setTargetFiles] = useState([]);
  const [threshold, setThreshold] = useState(90);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCompare = async () => {
    setError(null);
    setResult(null);

    if (mode === 'many-to-many') {
      if (sourceFiles.length === 0) {
        setError('원본 문서를 하나 이상 선택해주세요.');
        return;
      }
      if (targetFiles.length === 0) {
        setError('비교할 문서를 하나 이상 선택해주세요.');
        return;
      }
    } else {
      if (!sourceFile) {
        setError('원본 문서를 선택해주세요.');
        return;
      }

      if (mode === 'one-to-one' && !targetFile) {
        setError('비교할 문서를 선택해주세요.');
        return;
      }

      if (mode === 'one-to-many' && targetFiles.length === 0) {
        setError('비교할 문서를 하나 이상 선택해주세요.');
        return;
      }
    }

    setLoading(true);

    try {
      let response;
      if (mode === 'one-to-one') {
        response = await compareOneToOne(sourceFile, targetFile, threshold);
      } else if (mode === 'one-to-many') {
        response = await compareOneToMany(sourceFile, targetFiles, threshold);
      } else {
        response = await compareManyToMany(sourceFiles, targetFiles, threshold);
      }

      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSourceFile(null);
    setSourceFiles([]);
    setTargetFile(null);
    setTargetFiles([]);
    setResult(null);
    setError(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <FiFileText size={32} />
            <h1>문서 비교 도구</h1>
          </div>
          <p className="subtitle">AI 기반 문서 유사도 분석 시스템</p>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          {!result ? (
            <div className="upload-section">
              <div className="mode-selector">
                <button
                  className={`mode-btn ${mode === 'one-to-one' ? 'active' : ''}`}
                  onClick={() => setMode('one-to-one')}
                >
                  <div className="mode-icon">1:1</div>
                  <div className="mode-label">단일 비교</div>
                </button>
                <button
                  className={`mode-btn ${mode === 'one-to-many' ? 'active' : ''}`}
                  onClick={() => setMode('one-to-many')}
                >
                  <div className="mode-icon">1:N</div>
                  <div className="mode-label">다중 비교</div>
                </button>
                <button
                  className={`mode-btn ${mode === 'many-to-many' ? 'active' : ''}`}
                  onClick={() => setMode('many-to-many')}
                >
                  <div className="mode-icon">N:N</div>
                  <div className="mode-label">전체 비교</div>
                </button>
              </div>

              <div className="settings-panel">
                <div className="settings-header">
                  <FiSettings />
                  <h3>설정</h3>
                </div>
                <div className="threshold-setting">
                  <label>
                    유사도 임계값: <strong>{threshold}%</strong>
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={threshold}
                    onChange={(e) => setThreshold(parseInt(e.target.value))}
                    className="threshold-slider"
                  />
                  <div className="threshold-labels">
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                  <p className="threshold-hint">
                    {threshold}% 이상 유사한 항목만 표시됩니다.
                  </p>
                </div>
              </div>

              <div className="upload-area">
                {mode === 'many-to-many' ? (
                  <>
                    <FileUploader
                      label="원본 문서들 (최대 10개)"
                      onFileSelect={setSourceFiles}
                      selectedFile={sourceFiles}
                      multiple={true}
                    />
                    <FileUploader
                      label="비교 문서들 (최대 10개)"
                      onFileSelect={setTargetFiles}
                      selectedFile={targetFiles}
                      multiple={true}
                    />
                  </>
                ) : (
                  <>
                    <FileUploader
                      label="원본 문서"
                      onFileSelect={setSourceFile}
                      selectedFile={sourceFile}
                      multiple={false}
                    />

                    {mode === 'one-to-one' ? (
                      <FileUploader
                        label="비교 문서"
                        onFileSelect={setTargetFile}
                        selectedFile={targetFile}
                        multiple={false}
                      />
                    ) : (
                      <FileUploader
                        label="비교 문서들 (최대 10개)"
                        onFileSelect={setTargetFiles}
                        selectedFile={targetFiles}
                        multiple={true}
                      />
                    )}
                  </>
                )}
              </div>

              {error && (
                <div className="error-message">
                  <p>{error}</p>
                </div>
              )}

              <div className="action-buttons">
                <button
                  className="btn btn-primary"
                  onClick={handleCompare}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      비교 중...
                    </>
                  ) : (
                    '문서 비교 시작'
                  )}
                </button>

                {(sourceFile || targetFile || targetFiles.length > 0) && (
                  <button
                    className="btn btn-secondary"
                    onClick={handleReset}
                    disabled={loading}
                  >
                    초기화
                  </button>
                )}
              </div>

              <div className="features-info">
                <h3>지원 기능</h3>
                <ul>
                  <li>✓ 다양한 파일 형식 지원 (PDF, Word, Excel, CSV, TXT)</li>
                  <li>✓ 1:1, 1:N, N:N 비교 모드</li>
                  <li>✓ 문자 기반 유사도 분석</li>
                  <li>✓ 단어 단위 차이점 하이라이트</li>
                  <li>✓ PDF 페이지 정보 표시</li>
                  <li>✓ 실시간 유사도 퍼센트 표시</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="result-section">
              <div className="result-actions">
                <button className="btn btn-secondary" onClick={handleReset}>
                  새로운 비교 시작
                </button>
              </div>

              <ComparisonResult result={result} mode={mode} />
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>© 2024 문서 비교 도구. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;

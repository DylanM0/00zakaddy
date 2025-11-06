# 문서 비교 도구 (Document Comparison Tool)

AI 기반 문서 유사도 분석 시스템으로, 다양한 형식의 문서를 비교하고 유사도를 분석합니다.

## 주요 기능

- **다양한 파일 형식 지원**: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), CSV, TXT
- **비교 모드**:
  - **1:1 비교**: 두 문서 간 상세 비교
  - **1:N 비교**: 하나의 원본 문서와 여러 문서 동시 비교
- **AI 기반 유사도 분석**:
  - Dice Coefficient
  - Levenshtein Distance
  - Jaccard Similarity
  - 복합 가중치 알고리즘
- **스마트 비교**:
  - 완전히 같지 않은 문장도 감지
  - 단어 단위 변경 사항 추적
  - 퍼센트 기반 유사도 임계값 설정 (50-100%)
- **시각화**:
  - 원본과 비교 문서 나란히 표시
  - 일치하는 라인 하이라이트
  - 추가/제거된 단어 강조
  - 실시간 유사도 퍼센트 표시

## 기술 스택

### Backend
- Node.js + Express
- pdf-parse (PDF 파싱)
- mammoth (Word 문서 파싱)
- xlsx (Excel 파싱)
- csv-parser (CSV 파싱)
- string-similarity (유사도 계산)
- natural (자연어 처리)

### Frontend
- React 18
- Axios (API 통신)
- react-dropzone (파일 업로드)
- react-icons (아이콘)
- Modern CSS (그라디언트, 반응형 디자인)

## 설치 방법

### 1. 저장소 클론
```bash
git clone <repository-url>
cd document-comparison
```

### 2. 백엔드 설정
```bash
cd backend
npm install
npm start
```

백엔드 서버는 `http://localhost:5000`에서 실행됩니다.

### 3. 프론트엔드 설정
새 터미널을 열고:
```bash
cd frontend
npm install
npm start
```

프론트엔드는 `http://localhost:3000`에서 실행됩니다.

## 사용 방법

### 1:1 비교
1. 상단에서 "1:1 단일 비교" 모드 선택
2. 유사도 임계값 설정 (예: 90%)
3. 원본 문서 업로드
4. 비교할 문서 업로드
5. "문서 비교 시작" 버튼 클릭
6. 결과 확인:
   - 전체 유사도
   - 일치하는 항목 개수
   - 원본/대상 일치율
   - 라인별 상세 비교
   - 단어 단위 차이점

### 1:N 비교
1. 상단에서 "1:N 다중 비교" 모드 선택
2. 유사도 임계값 설정
3. 원본 문서 업로드
4. 비교할 문서 여러 개 업로드 (최대 10개)
5. "문서 비교 시작" 버튼 클릭
6. 각 문서별 비교 결과 확인

## API 엔드포인트

### POST `/api/compare/one-to-one`
두 문서 비교

**Request:**
- `source` (file): 원본 문서
- `target` (file): 비교 문서
- `threshold` (number): 유사도 임계값 (기본값: 90)

**Response:**
```json
{
  "success": true,
  "source": { "name": "...", "text": "...", "lines": [...] },
  "target": { "name": "...", "text": "...", "lines": [...] },
  "comparison": {
    "overallSimilarity": 85.5,
    "totalMatches": 42,
    "matches": [...]
  },
  "statistics": {...}
}
```

### POST `/api/compare/one-to-many`
하나의 원본 문서와 여러 문서 비교

**Request:**
- `source` (file): 원본 문서
- `targets` (files[]): 비교 문서들
- `threshold` (number): 유사도 임계값

### POST `/api/compare/parse`
단일 파일 파싱 및 텍스트 추출

## 프로젝트 구조

```
document-comparison/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── comparison.js      # API 라우트
│   │   ├── services/
│   │   │   ├── fileParser.js      # 파일 파싱 서비스
│   │   │   └── similarityService.js # 유사도 계산 서비스
│   │   └── server.js               # Express 서버
│   ├── uploads/                    # 임시 파일 저장
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUploader.js    # 파일 업로드 컴포넌트
│   │   │   └── ComparisonResult.js # 결과 표시 컴포넌트
│   │   ├── services/
│   │   │   └── api.js              # API 클라이언트
│   │   ├── styles/
│   │   │   └── App.css             # 스타일시트
│   │   ├── App.js                  # 메인 앱 컴포넌트
│   │   └── index.js                # 엔트리 포인트
│   └── package.json
└── README.md
```

## 유사도 계산 알고리즘

이 도구는 다음 알고리즘들을 조합하여 정확한 유사도를 계산합니다:

1. **Dice Coefficient (50%)**: 문자열 간 유사도 측정
2. **Levenshtein Distance (30%)**: 편집 거리 기반 유사도
3. **Jaccard Similarity (20%)**: 단어 집합 간 유사도

최종 유사도 = (Dice × 0.5) + (Levenshtein × 0.3) + (Jaccard × 0.2)

## 특징

- **스마트 매칭**: 완전히 일치하지 않아도 비슷한 문장 감지
- **단어 추적**: 추가/제거/변경된 단어 강조 표시
- **대용량 지원**: 최대 50MB 파일 업로드
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모두 지원
- **실시간 분석**: 빠른 처리 속도
- **한글 지원**: 한국어 문서 완벽 지원

## 환경 변수

### Backend
필요한 경우 `.env` 파일 생성:
```
PORT=5000
```

### Frontend
필요한 경우 `.env` 파일 생성:
```
REACT_APP_API_URL=http://localhost:5000/api
```

## 개발 모드

### Backend
```bash
cd backend
npm run dev  # nodemon으로 자동 재시작
```

### Frontend
```bash
cd frontend
npm start    # 핫 리로드 지원
```

## 프로덕션 빌드

### Frontend
```bash
cd frontend
npm run build
```

빌드된 파일은 `frontend/build/` 디렉토리에 생성됩니다.

## 라이센스

MIT License

## 기여

이슈 리포트와 풀 리퀘스트를 환영합니다!

## 주의사항

- 업로드된 파일은 비교 후 자동으로 삭제됩니다
- 대용량 파일의 경우 처리 시간이 길어질 수 있습니다
- 한 번에 최대 10개의 문서를 비교할 수 있습니다 (1:N 모드)

## 문의

문제가 발생하거나 제안사항이 있으시면 이슈를 등록해주세요.

const fs = require('fs').promises;
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const { Readable } = require('stream');

class FileParser {
  /**
   * Parse file based on its type and extract text content
   * @param {string} filePath - Path to the file
   * @param {string} fileType - Type of the file (pdf, docx, txt, xlsx, csv)
   * @returns {Promise<string>} Extracted text content
   */
  async parseFile(filePath, fileType) {
    try {
      switch (fileType.toLowerCase()) {
        case 'pdf':
          return await this.parsePDF(filePath);
        case 'docx':
        case 'doc':
          return await this.parseWord(filePath);
        case 'txt':
          return await this.parseText(filePath);
        case 'xlsx':
        case 'xls':
          return await this.parseExcel(filePath);
        case 'csv':
          return await this.parseCSV(filePath);
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      throw new Error(`Failed to parse file: ${error.message}`);
    }
  }

  /**
   * Parse PDF file
   */
  async parsePDF(filePath) {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  }

  /**
   * Parse Word document
   */
  async parseWord(filePath) {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  /**
   * Parse text file
   */
  async parseText(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  }

  /**
   * Parse Excel file
   */
  async parseExcel(filePath) {
    const workbook = xlsx.readFile(filePath);
    let allText = '';

    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

      data.forEach(row => {
        allText += row.join(' ') + '\n';
      });
    });

    return allText;
  }

  /**
   * Parse CSV file
   */
  async parseCSV(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const rows = [];

    return new Promise((resolve, reject) => {
      const stream = Readable.from(content);

      stream
        .pipe(csv())
        .on('data', (row) => {
          rows.push(Object.values(row).join(' '));
        })
        .on('end', () => {
          resolve(rows.join('\n'));
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * Split text into sentences
   */
  splitIntoSentences(text) {
    // Simple sentence splitting (can be improved with NLP library)
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Split text into lines
   */
  splitIntoLines(text) {
    return text
      .split(/\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }
}

module.exports = new FileParser();

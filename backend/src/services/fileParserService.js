import Papa from 'papaparse';
import XLSX from 'xlsx';
import xml2js from 'xml2js';
// import pdf from 'pdf-parse/lib/pdf-parse.js'; // Temporarily disabled due to module export issue
import fs from 'fs';
import logger from '../config/logger.js';

/**
 * Parse CSV file and extract contacts
 * Expected format: phone, name, email, tags (optional columns)
 */
export async function parseCSV(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    return new Promise((resolve, reject) => {
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.toLowerCase().trim(),
        complete: (results) => {
          const contacts = results.data
            .filter(row => row.phone || row.telefone || row.numero)
            .map(row => ({
              phone: cleanPhone(row.phone || row.telefone || row.numero),
              name: row.name || row.nome || '',
              email: row.email || '',
              tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [],
              customFields: extractCustomFields(row)
            }))
            .filter(contact => contact.phone);

          resolve(contacts);
        },
        error: (error) => reject(error)
      });
    });
  } catch (error) {
    logger.error('CSV parse error:', error);
    throw new Error(`Failed to parse CSV: ${error.message}`);
  }
}

/**
 * Parse Excel files (XLS, XLSX)
 */
export async function parseExcel(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    const contacts = data
      .filter(row => row.phone || row.telefone || row.numero || row.Phone || row.Telefone)
      .map(row => {
        // Convert keys to lowercase for consistent access
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
          normalizedRow[key.toLowerCase().trim()] = row[key];
        });

        return {
          phone: cleanPhone(
            normalizedRow.phone ||
            normalizedRow.telefone ||
            normalizedRow.numero ||
            normalizedRow.whatsapp
          ),
          name: normalizedRow.name || normalizedRow.nome || normalizedRow.contact || '',
          email: normalizedRow.email || '',
          tags: normalizedRow.tags ? String(normalizedRow.tags).split(',').map(t => t.trim()) : [],
          customFields: extractCustomFields(normalizedRow)
        };
      })
      .filter(contact => contact.phone);

    return contacts;
  } catch (error) {
    logger.error('Excel parse error:', error);
    throw new Error(`Failed to parse Excel: ${error.message}`);
  }
}

/**
 * Parse XML file
 * Expected structure: <contacts><contact><phone></phone><name></name></contact></contacts>
 */
export async function parseXML(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const parser = new xml2js.Parser({ explicitArray: false });

    const result = await parser.parseStringPromise(fileContent);

    let contactsArray = [];

    // Handle different XML structures
    if (result.contacts && result.contacts.contact) {
      contactsArray = Array.isArray(result.contacts.contact)
        ? result.contacts.contact
        : [result.contacts.contact];
    } else if (result.contact) {
      contactsArray = Array.isArray(result.contact)
        ? result.contact
        : [result.contact];
    }

    const contacts = contactsArray
      .filter(contact => contact.phone || contact.telefone || contact.numero)
      .map(contact => ({
        phone: cleanPhone(contact.phone || contact.telefone || contact.numero),
        name: contact.name || contact.nome || '',
        email: contact.email || '',
        tags: contact.tags ? String(contact.tags).split(',').map(t => t.trim()) : [],
        customFields: extractCustomFields(contact)
      }))
      .filter(contact => contact.phone);

    return contacts;
  } catch (error) {
    logger.error('XML parse error:', error);
    throw new Error(`Failed to parse XML: ${error.message}`);
  }
}

/**
 * Parse PDF and extract phone numbers
 * Uses regex to find phone patterns
 * TEMPORARILY DISABLED due to pdf-parse module export issue
 */
export async function parsePDF(filePath) {
  logger.warn('PDF parsing is temporarily disabled due to module export issue');
  throw new Error('PDF parsing is temporarily disabled. Please use CSV or Excel files instead.');

  /* TEMPORARILY DISABLED
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    const text = data.text;

    // Regex patterns for phone numbers (Brazilian format as example)
    const phonePatterns = [
      /\+?\d{1,3}[\s-]?\(?\d{2,3}\)?[\s-]?\d{4,5}[\s-]?\d{4}/g, // International/BR format
      /\(?\d{2,3}\)?[\s-]?\d{4,5}[\s-]?\d{4}/g, // Local BR format
      /\d{10,11}/g // Simple numeric
    ];

    const phones = new Set();

    phonePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = cleanPhone(match);
          if (cleaned && cleaned.length >= 10) {
            phones.add(cleaned);
          }
        });
      }
    });

    // Try to extract names (lines before phone numbers)
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const contacts = [];

    Array.from(phones).forEach((phone, index) => {
      contacts.push({
        phone,
        name: `Contact ${index + 1}`, // Generic name, user can update later
        email: '',
        tags: ['pdf-import'],
        customFields: {}
      });
    });

    return contacts;
  } catch (error) {
    logger.error('PDF parse error:', error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
  */
}

/**
 * Clean and normalize phone number
 */
function cleanPhone(phone) {
  if (!phone) return '';

  // Remove all non-numeric characters
  let cleaned = String(phone).replace(/\D/g, '');

  // Remove leading country code if present (e.g., 55 for Brazil)
  if (cleaned.length > 11 && cleaned.startsWith('55')) {
    cleaned = cleaned.substring(2);
  }

  // Ensure it has at least 10 digits (area code + number)
  if (cleaned.length < 10) return '';

  return cleaned;
}

/**
 * Extract custom fields from row (fields not in standard set)
 */
function extractCustomFields(row) {
  const standardFields = ['phone', 'telefone', 'numero', 'whatsapp', 'name', 'nome', 'contact', 'email', 'tags'];
  const customFields = {};

  Object.keys(row).forEach(key => {
    const normalizedKey = key.toLowerCase().trim();
    if (!standardFields.includes(normalizedKey) && row[key]) {
      customFields[key] = row[key];
    }
  });

  return customFields;
}

/**
 * Main parser function - detects file type and calls appropriate parser
 */
export async function parseFile(filePath, mimeType) {
  const extension = filePath.split('.').pop().toLowerCase();

  logger.info('Parsing file:', { filePath, mimeType, extension });

  try {
    if (mimeType.includes('csv') || extension === 'csv') {
      return await parseCSV(filePath);
    } else if (
      mimeType.includes('spreadsheet') ||
      mimeType.includes('excel') ||
      extension === 'xlsx' ||
      extension === 'xls'
    ) {
      return await parseExcel(filePath);
    } else if (mimeType.includes('xml') || extension === 'xml') {
      return await parseXML(filePath);
    } else if (mimeType.includes('pdf') || extension === 'pdf') {
      return await parsePDF(filePath);
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    logger.error('File parse error:', error);
    throw error;
  }
}

export default {
  parseFile,
  parseCSV,
  parseExcel,
  parseXML,
  parsePDF,
  cleanPhone
};

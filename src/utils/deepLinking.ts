import { ExportedDeck, importDeckFromJSON } from "../data/storage";
import * as base64 from 'base-64';

// Maximum allowed size for deck import (1MB to prevent memory issues)
const MAX_DECK_SIZE_BYTES = 1024 * 1024;

// Maximum URL length to prevent excessively long URLs
const MAX_URL_LENGTH = 100000;

const utf8ToBytes = (str: string): number[] => {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charCode = str.charCodeAt(i);
    if (charCode < 0x80) {
      bytes.push(charCode);
    } else if (charCode < 0x800) {
      bytes.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f));
    } else if (charCode < 0xd800 || charCode >= 0xe000) {
      bytes.push(0xe0 | (charCode >> 12), 0x80 | ((charCode >> 6) & 0x3f), 0x80 | (charCode & 0x3f));
    } else {
      i++;
      charCode = 0x10000 + (((charCode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      bytes.push(
        0xf0 | (charCode >> 18),
        0x80 | ((charCode >> 12) & 0x3f),
        0x80 | ((charCode >> 6) & 0x3f),
        0x80 | (charCode & 0x3f)
      );
    }
  }
  return bytes;
};

const bytesToUtf8 = (bytes: number[]): string => {
  const chars: string[] = [];
  let i = 0;
  while (i < bytes.length) {
    const byte1 = bytes[i++];
    if (byte1 < 0x80) {
      chars.push(String.fromCharCode(byte1));
    } else if (byte1 < 0xe0) {
      const byte2 = bytes[i++];
      chars.push(String.fromCharCode(((byte1 & 0x1f) << 6) | (byte2 & 0x3f)));
    } else if (byte1 < 0xf0) {
      const byte2 = bytes[i++];
      const byte3 = bytes[i++];
      chars.push(String.fromCharCode(((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f)));
    } else {
      const byte2 = bytes[i++];
      const byte3 = bytes[i++];
      const byte4 = bytes[i++];
      const codePoint = ((byte1 & 0x07) << 18) | ((byte2 & 0x3f) << 12) | ((byte3 & 0x3f) << 6) | (byte4 & 0x3f);
      const high = ((codePoint - 0x10000) >> 10) + 0xd800;
      const low = ((codePoint - 0x10000) & 0x3ff) + 0xdc00;
      chars.push(String.fromCharCode(high, low));
    }
  }
  return chars.join('');
};

/**
 * Validates that a JSON string represents a valid ExportedDeck
 */
const validateDeckJSON = (data: any): { valid: boolean; error?: string } => {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid data format: expected object' };
  }

  if (!data.version || typeof data.version !== 'string') {
    return { valid: false, error: 'Missing or invalid version field' };
  }

  if (!data.deck || typeof data.deck !== 'object') {
    return { valid: false, error: 'Missing or invalid deck object' };
  }

  if (!data.deck.name || typeof data.deck.name !== 'string' || data.deck.name.trim().length === 0) {
    return { valid: false, error: 'Missing or invalid deck name' };
  }

  if (data.deck.name.length > 100) {
    return { valid: false, error: 'Deck name exceeds maximum length (100 characters)' };
  }

  if (!Array.isArray(data.cards)) {
    return { valid: false, error: 'Missing or invalid cards array' };
  }

  if (data.cards.length === 0) {
    return { valid: false, error: 'Deck must contain at least one card' };
  }

  if (data.cards.length > 10000) {
    return { valid: false, error: 'Deck exceeds maximum card limit (10000 cards)' };
  }

  for (let i = 0; i < data.cards.length; i++) {
    const card = data.cards[i];
    if (!card || typeof card !== 'object') {
      return { valid: false, error: `Card ${i + 1} has invalid format` };
    }
    if (typeof card.front !== 'string' || card.front.trim().length === 0) {
      return { valid: false, error: `Card ${i + 1} has invalid or empty front` };
    }
    if (typeof card.back !== 'string' || card.back.trim().length === 0) {
      return { valid: false, error: `Card ${i + 1} has invalid or empty back` };
    }
    if (card.front.length > 5000) {
      return { valid: false, error: `Card ${i + 1} front exceeds maximum length (5000 characters)` };
    }
    if (card.back.length > 5000) {
      return { valid: false, error: `Card ${i + 1} back exceeds maximum length (5000 characters)` };
    }
  }

  return { valid: true };
};

/**
 * Encodes a deck JSON string into a moa:// URL
 * @throws Error if deckJSON is invalid or exceeds size limits
 */
export const encodeDeckToUrl = (deckJSON: string): string => {
  if (!deckJSON || typeof deckJSON !== 'string') {
    throw new Error('Invalid input: deckJSON must be a non-empty string');
  }

  // Validate size before encoding
  const sizeInBytes = new Blob([deckJSON]).size;
  if (sizeInBytes > MAX_DECK_SIZE_BYTES) {
    throw new Error(`Deck size (${(sizeInBytes / 1024).toFixed(1)}KB) exceeds maximum allowed size (${MAX_DECK_SIZE_BYTES / 1024}KB)`);
  }

  // Validate JSON structure
  try {
    const parsed = JSON.parse(deckJSON);
    const validation = validateDeckJSON(parsed);
    if (!validation.valid) {
      throw new Error(`Invalid deck format: ${validation.error}`);
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw error;
  }

  const bytes = utf8ToBytes(deckJSON);
  const latin1 = String.fromCharCode(...bytes);
  const base64Encoded = base64.encode(latin1);
  const urlSafe = base64Encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const url = `moa://import-deck?data=${urlSafe}`;

  // Validate final URL length
  if (url.length > MAX_URL_LENGTH) {
    throw new Error(`Generated URL is too long (${url.length} characters). Consider reducing deck size.`);
  }

  return url;
};

/**
 * Decodes a deck from a moa:// URL
 * @returns The decoded JSON string, or null if decoding fails
 */
export const decodeDeckFromURL = (url: string): string | null => {
  try {
    // Validate input
    if (!url || typeof url !== 'string') {
      console.error('Invalid URL: must be a non-empty string');
      return null;
    }

    // Validate URL length
    if (url.length > MAX_URL_LENGTH) {
      console.error(`URL too long: ${url.length} characters (max: ${MAX_URL_LENGTH})`);
      return null;
    }

    // Validate URL format
    if (!url.startsWith('moa://import-deck?data=')) {
      console.error('Invalid URL format: must start with moa://import-deck?data=');
      return null;
    }

    console.log('Decoding URL:', url.substring(0, 50) + '...');
    const match = url.match(/data=([^&]+)/);
    console.log('Regex match result:', match ? 'found' : 'not found');
    
    if (!match || !match[1]) {
      console.error('No data parameter found in URL');
      return null;
    }

    const dataParam = match[1];

    // Validate base64-url characters (only alphanumeric, -, _)
    if (!/^[A-Za-z0-9\-_]+$/.test(dataParam)) {
      console.error('Invalid characters in data parameter');
      return null;
    }

    // Convert URL-safe base64 back to standard base64
    let base64Str = dataParam.replace(/-/g, '+').replace(/_/g, '/');
    while (base64Str.length % 4) {
      base64Str += '=';
    }
    console.log('Reconstructed base64 (first 50 chars):', base64Str.substring(0, 50));

    // Decode base64
    const latin1 = base64.decode(base64Str);
    const bytes: number[] = [];
    for (let i = 0; i < latin1.length; i++) {
      bytes.push(latin1.charCodeAt(i));
    }
    
    // Check decoded size before converting to UTF-8
    if (bytes.length > MAX_DECK_SIZE_BYTES) {
      console.error(`Decoded data too large: ${(bytes.length / 1024).toFixed(1)}KB (max: ${MAX_DECK_SIZE_BYTES / 1024}KB)`);
      return null;
    }

    const decoded = bytesToUtf8(bytes);
    
    console.log('Decoded JSON length:', decoded.length);
    console.log('Decoded JSON preview:', decoded.substring(0, 100));
    
    return decoded;
  } catch (error) {
    console.error('Error decoding URL:', error);
    return null;
  }
}

/**
 * Handles importing a deck from a moa:// URL
 * @returns Object with success status, deck name (if successful), and error message (if failed)
 */
export const handleImportURL = async (url: string): Promise<{ success: boolean, deckName?: string, error?: string}> => {
  try {
    console.log('handleImportURL called with:', url.substring(0, 50) + '...');
    
    // Validate and decode URL
    const deckJSON = decodeDeckFromURL(url);
    if (!deckJSON) {
      console.error('decodeDeckFromURL returned null');
      return { success: false, error: 'Invalid import link - failed to decode URL'};
    }

    // Parse JSON
    console.log('Parsing JSON...');
    let importedData: ExportedDeck;
    try {
      importedData = JSON.parse(deckJSON);
    } catch (error) {
      console.error('JSON parse error:', error);
      return { success: false, error: 'Invalid import link - malformed JSON data' };
    }

    // Validate deck structure
    const validation = validateDeckJSON(importedData);
    if (!validation.valid) {
      console.error('Deck validation failed:', validation.error);
      return { success: false, error: `Invalid deck: ${validation.error}` };
    }

    console.log('Parsed deck name:', importedData.deck.name);
    console.log('Number of cards:', importedData.cards.length);
    
    // Import deck to storage
    console.log('Importing deck to storage...');
    await importDeckFromJSON(deckJSON);
    console.log('Import completed successfully');

    return { success: true, deckName: importedData.deck.name };
  } catch (error) {
    console.error('Error importing deck:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Failed to import deck: ${errorMessage}`};
  }
}

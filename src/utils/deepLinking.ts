import { ExportedDeck, importDeckFromJSON } from "../data/storage";
import * as base64 from 'base-64';

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

export const encodeDeckToUrl = (deckJSON: string): string => {
  const bytes = utf8ToBytes(deckJSON);
  const latin1 = String.fromCharCode(...bytes);
  const base64Encoded = base64.encode(latin1);
  const urlSafe = base64Encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `moa://import-deck?data=${urlSafe}`;
};

export const decodeDeckFromURL = (url: string): string | null => {
  try {
    console.log('Decoding URL:', url);
    const match = url.match(/data=([^&]+)/);
    console.log('Regex match result:', match);
    
    if (!match) {
      console.error('No data parameter found in URL');
      return null;
    }

    let base64Str = match[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64Str.length % 4) {
      base64Str += '=';
    }
    console.log('Reconstructed base64 (first 50 chars):', base64Str.substring(0, 50));

    const latin1 = base64.decode(base64Str);
    const bytes: number[] = [];
    for (let i = 0; i < latin1.length; i++) {
      bytes.push(latin1.charCodeAt(i));
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

export const handleImportURL = async (url: string): Promise<{ success: boolean, deckName?: string, error?: string}> => {
  try {
    console.log('handleImportURL called with:', url);
    
    const deckJSON = decodeDeckFromURL(url);
    if (!deckJSON) {
      console.error('decodeDeckFromURL returned null');
      return { success: false, error: 'Invalid import link - failed to decode'};
    }

    console.log('Parsing JSON...');
    const importedData: ExportedDeck = JSON.parse(deckJSON);
    console.log('Parsed deck name:', importedData.deck.name);
    console.log('Number of cards:', importedData.cards.length);
    
    console.log('Importing deck to storage...');
    await importDeckFromJSON(deckJSON);
    console.log('Import completed successfully');

    return { success: true, deckName: importedData.deck.name };
  } catch (error) {
    console.error('Error importing deck:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Failed to import: ${errorMessage}`};
  }
}

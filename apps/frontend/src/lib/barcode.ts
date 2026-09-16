/**
 * Pure TypeScript Code 128 (Subset B) Barcode SVG Generator
 * Zero runtime dependencies, SSR & Turbopack compatible.
 */

const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112' // 100-106 (104 = Start B, 106 = Stop)
];

export interface BarcodeOptions {
  height?: number;
  unitWidth?: number;
  quietZone?: number;
  showText?: boolean;
  fontSize?: number;
  color?: string;
  bgColor?: string;
}

export interface BarcodeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BarcodeData {
  rects: BarcodeRect[];
  totalWidth: number;
  totalHeight: number;
  text: string;
  svg: string;
}

/**
 * Encodes an ASCII string into Code 128B barcode rectangles and SVG
 */
export function generateBarcode128(text: string, options: BarcodeOptions = {}): BarcodeData {
  const {
    height = 50,
    unitWidth = 2,
    quietZone = 10,
    showText = true,
    fontSize = 12,
    color = '#000000',
    bgColor = '#ffffff',
  } = options;

  // Clean text to printable ASCII (32-126)
  const cleanText = (text || '').replace(/[^\x20-\x7E]/g, '');
  if (!cleanText) {
    return {
      rects: [],
      totalWidth: 0,
      totalHeight: 0,
      text: '',
      svg: '',
    };
  }

  // Calculate checksum for Code 128B
  // Start Code B is index 104
  const startCode = 104;
  let checksum = startCode;
  const indices: number[] = [startCode];

  for (let i = 0; i < cleanText.length; i++) {
    const code = cleanText.charCodeAt(i) - 32;
    indices.push(code);
    checksum += code * (i + 1);
  }

  const checkIndex = checksum % 103;
  indices.push(checkIndex);
  const stopCode = 106;
  indices.push(stopCode);

  // Convert pattern codes to bars and spaces
  const rects: BarcodeRect[] = [];
  let currentX = quietZone * unitWidth;

  for (const codeIdx of indices) {
    const pattern = CODE128_PATTERNS[codeIdx];
    if (!pattern) continue;

    let isBar = true;
    for (let p = 0; p < pattern.length; p++) {
      const barWidth = parseInt(pattern[p], 10) * unitWidth;
      if (isBar) {
        rects.push({
          x: currentX,
          y: 0,
          width: barWidth,
          height,
        });
      }
      currentX += barWidth;
      isBar = !isBar;
    }
  }

  const totalWidth = currentX + quietZone * unitWidth;
  const totalHeight = height + (showText ? fontSize + 8 : 0);

  // Build SVG XML string
  const rectsSvg = rects
    .map(r => `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" fill="${color}" />`)
    .join('');

  const textSvg = showText
    ? `<text x="${totalWidth / 2}" y="${height + fontSize + 2}" font-family="monospace" font-size="${fontSize}" font-weight="600" text-anchor="middle" fill="${color}">${cleanText}</text>`
    : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}" style="background-color: ${bgColor};">
    ${rectsSvg}
    ${textSvg}
  </svg>`;

  return {
    rects,
    totalWidth,
    totalHeight,
    text: cleanText,
    svg,
  };
}

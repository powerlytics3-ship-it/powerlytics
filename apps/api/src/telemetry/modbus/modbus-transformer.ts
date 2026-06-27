export type Endianness = 'ABCD' | 'CDAB' | 'BADC' | 'DCBA' | 'NONE';

export function applyEndianness(registers: number[], endianness: Endianness, bitsToRead: number): number {
  if (registers.length === 1 || endianness === 'NONE') {
    return registers[0]!;
  }

  let bytes: number[] = [];
  for (const reg of registers) {
    bytes.push((reg >> 8) & 0xff, reg & 0xff);
  }

  switch (endianness) {
    case 'ABCD': break;
    case 'CDAB': bytes = [...bytes.slice(2), ...bytes.slice(0, 2)]; break;
    case 'BADC': bytes = [bytes[1]!, bytes[0]!, bytes[3]!, bytes[2]!]; break;
    case 'DCBA': bytes = [...bytes].reverse(); break;
  }

  let value = 0;
  const bytesToUse = Math.ceil(bitsToRead / 8);
  for (let i = 0; i < bytesToUse; i++) {
    value = (value << 8) | (bytes[i] ?? 0);
  }

  const mask = (1 << bitsToRead) - 1;
  return value & mask;
}

export function calibrate(rawValue: number, scaling: number, offset: number): number {
  return rawValue * scaling + offset;
}

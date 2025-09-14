import { nanoid } from 'nanoid';

export function generatePrefixedId(prefix: string, length: number = 6): string {
  return `${prefix}${nanoid(length)}`;
}

// Regras de convidados compartilhadas entre painel, API do RSVP e Resumo.
// Os membros ficam no JSON `Guest.familyMembers`; a idade só existe para crianças.

export type MemberType = 'adulto' | 'crianca' | 'bebe';

export type FamilyMember = {
  name: string;
  type: MemberType;
  confirmed: boolean;
  age?: number | null;
};

// Regra do buffet: criança até esta idade (inclusive) não paga. Bebê de colo nunca paga.
export const FREE_UNTIL_AGE = 5;
export const MAX_CHILD_AGE = 17;

export const MEMBER_TYPE_LABEL: Record<MemberType, string> = {
  adulto: 'Adulto',
  crianca: 'Criança',
  bebe: 'Bebê de colo',
};

export function parseMembers(raw: string | null | undefined): FamilyMember[] {
  try {
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function isValidChildAge(age: unknown): age is number {
  return typeof age === 'number' && Number.isInteger(age) && age >= 0 && age <= MAX_CHILD_AGE;
}

/** true = entra no buffet, false = não paga, null = criança sem idade informada */
export function paysBuffet(m: FamilyMember): boolean | null {
  if (m.type === 'adulto') return true;
  if (m.type === 'bebe') return false;
  return isValidChildAge(m.age) ? m.age > FREE_UNTIL_AGE : null;
}

export type BuffetSummary = {
  people: number;      // adultos + crianças (bebês de colo não ocupam vaga)
  adults: number;
  children: number;
  babies: number;
  buffet: number;      // pessoas que entram no cálculo de comida
  free: number;        // crianças até FREE_UNTIL_AGE + bebês
  ageMissing: number;  // crianças sem idade: contam no buffet até a idade ser informada
};

/** Resume os membros confirmados de uma ou mais famílias. */
export function summarizeConfirmed(members: FamilyMember[]): BuffetSummary {
  const s: BuffetSummary = { people: 0, adults: 0, children: 0, babies: 0, buffet: 0, free: 0, ageMissing: 0 };
  for (const m of members) {
    if (!m.confirmed) continue;
    if (m.type === 'adulto') s.adults++;
    else if (m.type === 'crianca') s.children++;
    else s.babies++;

    const pays = paysBuffet(m);
    if (pays === false) s.free++;
    else {
      // Sem idade conta como pagante: melhor sobrar comida do que faltar
      s.buffet++;
      if (pays === null) s.ageMissing++;
    }
  }
  s.people = s.adults + s.children;
  return s;
}

/** Contagens gravadas em Guest.adultsCount / childrenCount (bebês não ocupam vaga). */
export function countsFromMembers(members: FamilyMember[], status: string) {
  if (status !== 'confirmado') return { adultsCount: 0, childrenCount: 0 };
  const confirmed = members.filter(m => m.confirmed);
  return {
    adultsCount: confirmed.filter(m => m.type === 'adulto').length,
    childrenCount: confirmed.filter(m => m.type === 'crianca').length,
  };
}

/** Nome exibido quando a família é cadastrada sem nome: "Ana", "Ana e Rui", "Ana, Rui e Lia", "Ana, Rui e mais 3". */
export function familyNameFromMembers(members: FamilyMember[]): string {
  const names = members.map(m => m.name.trim()).filter(Boolean);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} e ${names[1]}`;
  if (names.length === 3) return `${names[0]}, ${names[1]} e ${names[2]}`;
  return `${names[0]}, ${names[1]} e mais ${names.length - 2}`;
}

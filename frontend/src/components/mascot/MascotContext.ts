// Which mascot the signed-in account has (set by the admin). Layout provides it from the stored user, so it is
// known before /auth/me answers; signed out (no stored user) it is always Kulka.
import { createContext, useContext } from 'react';
import type { MascotKind } from '../../types';

export const MascotContext = createContext<MascotKind>('kulka');
export const useMascotKind = () => useContext(MascotContext);
export const mascotOf = (user?: { mascot?: string } | null): MascotKind => (user?.mascot === 'ariana' ? 'ariana' : 'kulka');

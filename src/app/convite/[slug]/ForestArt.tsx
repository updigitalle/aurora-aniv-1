import React from 'react';

/*
 * Arte vetorial do Bosque Encantado — recriação fiel (e animável) da arte
 * do convite em aquarela: laço rosa, borboletas, corça deitada, raposa,
 * esquilo, árvore, cogumelos e grama.
 */

// ─── Laço rosa ────────────────────────────────────────────────────────────────
export function PinkBow({ className = '', width = 150 }: { className?: string; width?: number }) {
  return (
    <svg viewBox="0 0 200 130" width={width} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="bowGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7D3DB" />
          <stop offset="55%" stopColor="#F2C4CE" />
          <stop offset="100%" stopColor="#DC93A4" />
        </linearGradient>
        <linearGradient id="bowGradDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EBB3BF" />
          <stop offset="100%" stopColor="#D48497" />
        </linearGradient>
      </defs>
      {/* caudas */}
      <path d="M97 62 C70 80 52 104 42 122 C58 116 76 112 88 98 Z" fill="url(#bowGradDark)" opacity="0.95" />
      <path d="M103 62 C130 80 148 104 158 122 C142 116 124 112 112 98 Z" fill="url(#bowGradDark)" opacity="0.95" />
      {/* laços */}
      <path d="M96 52 C70 18 30 14 18 34 C8 52 30 74 60 70 C78 67 92 60 96 52 Z" fill="url(#bowGrad)" />
      <path d="M104 52 C130 18 170 14 182 34 C192 52 170 74 140 70 C122 67 108 60 104 52 Z" fill="url(#bowGrad)" />
      {/* dobras internas */}
      <path d="M92 52 C72 36 48 32 34 40 C46 56 70 62 92 56 Z" fill="#E8AABA" opacity="0.55" />
      <path d="M108 52 C128 36 152 32 166 40 C154 56 130 62 108 56 Z" fill="#E8AABA" opacity="0.55" />
      {/* nó central */}
      <ellipse cx="100" cy="55" rx="15" ry="13" fill="url(#bowGradDark)" />
      <ellipse cx="100" cy="52" rx="11" ry="8" fill="#F4C9D3" opacity="0.7" />
    </svg>
  );
}

// ─── Borboleta ────────────────────────────────────────────────────────────────
export function Butterfly({
  className = '',
  width = 34,
  color = '#EFB9C6',
}: { className?: string; width?: number; color?: string }) {
  return (
    <svg viewBox="0 0 40 36" width={width} className={className} aria-hidden="true">
      <g className="animate-wing">
        <path d="M19 18 C8 4 -2 8 2 17 C5 24 13 24 19 20 Z" fill={color} opacity="0.9" />
        <path d="M19 20 C10 26 4 32 9 34 C14 35 18 28 19 22 Z" fill={color} opacity="0.75" />
        <path d="M21 18 C32 4 42 8 38 17 C35 24 27 24 21 20 Z" fill={color} opacity="0.9" />
        <path d="M21 20 C30 26 36 32 31 34 C26 35 22 28 21 22 Z" fill={color} opacity="0.75" />
      </g>
      <ellipse cx="20" cy="20" rx="1.6" ry="6" fill="#8A6B4F" />
      <path d="M19 14 C17 11 15 9 14 8 M21 14 C23 11 25 9 26 8" stroke="#8A6B4F" strokeWidth="0.9" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// ─── Árvore ───────────────────────────────────────────────────────────────────
export function Tree({ className = '', width = 150 }: { className?: string; width?: number }) {
  return (
    <svg viewBox="0 0 160 260" width={width} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="treeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9AA888" />
          <stop offset="100%" stopColor="#7E8C6B" />
        </linearGradient>
      </defs>
      {/* tronco com galhos */}
      <path d="M76 258 L76 150 C76 130 64 118 52 106 M76 170 C76 150 92 140 102 128 M76 200 C76 188 64 180 58 172"
        stroke="#7C5F45" strokeWidth="11" fill="none" strokeLinecap="round" />
      <g className="animate-tree">
        {/* copa em formato de pinheiro arredondado */}
        <path d="M80 6 C50 50 24 110 20 168 C20 186 44 196 80 196 C116 196 140 186 140 168 C136 110 110 50 80 6 Z"
          fill="url(#treeGrad)" />
        {/* luz aquarela */}
        <path d="M80 24 C62 58 46 100 42 150 C50 162 64 168 80 168 Z" fill="#ADBA9B" opacity="0.45" />
      </g>
    </svg>
  );
}

// ─── Cogumelo ─────────────────────────────────────────────────────────────────
export function Mushroom({ className = '', width = 34 }: { className?: string; width?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={width} className={className} aria-hidden="true">
      <path d="M14 24 C14 32 15 37 16 39 L24 39 C25 37 26 32 26 24 Z" fill="#F4E9D8" stroke="#D8C3A5" strokeWidth="0.8" />
      <path d="M2 22 C2 10 10 2 20 2 C30 2 38 10 38 22 C38 24 36 25 33 25 L7 25 C4 25 2 24 2 22 Z" fill="#B24A3F" />
      <path d="M6 20 C8 12 13 6 20 5 C16 8 12 14 11 21 Z" fill="#C96A5C" opacity="0.7" />
      <circle cx="12" cy="13" r="2.6" fill="#F7EFE2" opacity="0.95" />
      <circle cx="22" cy="8.5" r="2" fill="#F7EFE2" opacity="0.95" />
      <circle cx="29" cy="16" r="2.4" fill="#F7EFE2" opacity="0.95" />
    </svg>
  );
}

// ─── Corça deitada (dormindo) ─────────────────────────────────────────────────
export function Deer({ className = '', width = 210 }: { className?: string; width?: number }) {
  return (
    <svg viewBox="0 0 240 170" width={width} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="deerBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B98B5F" />
          <stop offset="100%" stopColor="#9E7148" />
        </linearGradient>
      </defs>
      {/* corpo deitado */}
      <path d="M60 150 C30 150 18 132 24 114 C30 98 50 88 80 86 L170 92 C200 96 218 112 214 132 C211 146 196 152 176 152 Z"
        fill="url(#deerBody)" />
      {/* barriga clara */}
      <path d="M70 148 C52 146 42 136 46 122 C50 112 64 106 84 106 L150 110 C172 114 184 126 180 140 C177 148 166 150 152 150 Z"
        fill="#D9BC97" opacity="0.65" />
      {/* perninha dobrada */}
      <path d="M96 150 C92 140 98 132 110 132 C124 132 134 140 132 150 Z" fill="#8A6240" opacity="0.8" />
      {/* pescoço e cabeça erguida */}
      <path d="M170 100 C172 70 176 48 188 36 C200 26 216 30 220 44 C224 58 216 72 204 82 C196 90 190 98 188 108 Z"
        fill="url(#deerBody)" />
      {/* focinho */}
      <path d="M212 38 C222 36 230 42 230 50 C230 58 222 62 212 60 C206 58 204 48 212 38 Z" fill="#D9BC97" />
      <ellipse cx="226" cy="50" rx="3.4" ry="2.8" fill="#5C4330" />
      {/* orelhas */}
      <g className="animate-ear">
        <path d="M192 36 C182 22 170 14 162 16 C160 26 168 38 182 44 Z" fill="url(#deerBody)" />
        <path d="M188 36 C181 27 173 21 168 21 C168 28 174 36 183 40 Z" fill="#E3C6A4" opacity="0.8" />
      </g>
      <path d="M206 30 C208 16 216 6 224 6 C228 14 224 26 214 34 Z" fill="url(#deerBody)" />
      <path d="M208 29 C210 19 215 11 220 10 C222 16 219 24 212 30 Z" fill="#E3C6A4" opacity="0.8" />
      {/* olho fechado (dormindo) + cílios */}
      <path d="M196 52 C200 56 206 56 210 52" stroke="#5C4330" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M196 54 L192 57 M201 56 L199 60 M208 55 L210 59" stroke="#5C4330" strokeWidth="1.2" strokeLinecap="round" />
      {/* bochecha rosada */}
      <ellipse cx="206" cy="64" rx="6" ry="3.6" fill="#E8A8A0" opacity="0.55" />
      {/* pintinhas */}
      <g fill="#EFDCBE" opacity="0.9">
        <circle cx="70" cy="104" r="3" />
        <circle cx="88" cy="96" r="2.6" />
        <circle cx="106" cy="102" r="3" />
        <circle cx="78" cy="118" r="2.4" />
        <circle cx="122" cy="96" r="2.4" />
      </g>
      {/* rabinho */}
      <path d="M30 122 C20 116 16 108 20 102 C28 104 34 112 34 120 Z" fill="#8A6240" />
    </svg>
  );
}

// ─── Raposa sentada ───────────────────────────────────────────────────────────
export function Fox({ className = '', width = 150 }: { className?: string; width?: number }) {
  return (
    <svg viewBox="0 0 170 190" width={width} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="foxBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D08648" />
          <stop offset="100%" stopColor="#B86A33" />
        </linearGradient>
      </defs>
      {/* cauda enrolada na frente */}
      <g className="animate-tail">
        <path d="M28 168 C8 158 2 138 12 124 C20 114 36 112 48 120 C62 130 70 150 64 168 C54 176 38 176 28 168 Z"
          fill="url(#foxBody)" />
        <path d="M22 164 C10 156 8 142 16 132 C24 140 30 152 32 166 Z" fill="#F3E3CE" />
      </g>
      {/* corpo sentado */}
      <path d="M85 60 C115 60 138 92 138 132 C138 162 122 178 96 178 C70 178 54 162 54 132 C54 92 60 60 85 60 Z"
        fill="url(#foxBody)" />
      {/* peito branco */}
      <path d="M96 92 C112 96 122 116 120 140 C118 162 108 174 96 174 C84 174 76 160 76 140 C76 116 84 90 96 92 Z"
        fill="#F3E3CE" />
      {/* cabeça */}
      <path d="M96 14 C118 14 134 30 134 50 C134 70 118 84 96 84 C74 84 58 70 58 50 C58 30 74 14 96 14 Z"
        fill="url(#foxBody)" />
      {/* orelhas */}
      <path d="M66 30 C60 14 62 4 70 0 C80 4 84 16 80 28 Z" fill="url(#foxBody)" />
      <path d="M70 26 C66 16 67 9 71 6 C76 9 78 17 76 25 Z" fill="#5C4330" opacity="0.75" />
      <path d="M126 30 C132 14 130 4 122 0 C112 4 108 16 112 28 Z" fill="url(#foxBody)" />
      <path d="M122 26 C126 16 125 9 121 6 C116 9 114 17 116 25 Z" fill="#5C4330" opacity="0.75" />
      {/* máscara branca do focinho */}
      <path d="M96 50 C108 50 118 58 118 68 C118 78 108 84 96 84 C84 84 74 78 74 68 C74 58 84 50 96 50 Z"
        fill="#F3E3CE" />
      {/* olhos fechados felizes */}
      <path d="M76 48 C80 52 86 52 90 48" stroke="#5C4330" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M102 48 C106 52 112 52 116 48" stroke="#5C4330" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* nariz */}
      <ellipse cx="96" cy="62" rx="4.4" ry="3.4" fill="#5C4330" />
      <path d="M96 65 L96 71" stroke="#5C4330" strokeWidth="1.6" strokeLinecap="round" />
      {/* bochechas */}
      <ellipse cx="73" cy="58" rx="5.5" ry="3.4" fill="#E8A8A0" opacity="0.55" />
      <ellipse cx="119" cy="58" rx="5.5" ry="3.4" fill="#E8A8A0" opacity="0.55" />
    </svg>
  );
}

// ─── Esquilo com coração ──────────────────────────────────────────────────────
export function Squirrel({ className = '', width = 92 }: { className?: string; width?: number }) {
  return (
    <svg viewBox="0 0 110 120" width={width} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="sqBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D0905E" />
          <stop offset="100%" stopColor="#B57544" />
        </linearGradient>
      </defs>
      {/* cauda grande enrolada */}
      <g className="animate-tail">
        <path d="M70 96 C100 92 110 64 100 40 C92 22 72 16 60 28 C76 30 88 44 86 62 C84 78 74 88 58 92 Z"
          fill="url(#sqBody)" />
        <path d="M74 88 C94 82 100 60 92 42 C90 56 84 74 70 84 Z" fill="#E2B488" opacity="0.6" />
      </g>
      {/* corpo */}
      <path d="M42 116 C24 116 14 104 14 88 C14 70 26 56 42 56 C58 56 68 70 68 88 C68 104 60 116 42 116 Z"
        fill="url(#sqBody)" />
      {/* barriga */}
      <path d="M42 112 C32 112 26 102 26 90 C26 78 33 70 42 70 C51 70 58 78 58 90 C58 102 52 112 42 112 Z"
        fill="#EBCBA4" />
      {/* cabeça */}
      <circle cx="42" cy="40" r="22" fill="url(#sqBody)" />
      {/* orelhas */}
      <path d="M28 24 C24 14 26 7 32 5 C37 9 38 17 35 24 Z" fill="url(#sqBody)" />
      <path d="M56 24 C60 14 58 7 52 5 C47 9 46 17 49 24 Z" fill="url(#sqBody)" />
      {/* olhos fechados */}
      <path d="M31 38 C34 41 38 41 41 38 M45 38 C48 41 52 41 55 38" stroke="#5C4330" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* nariz/boquinha */}
      <ellipse cx="43" cy="46" rx="2.6" ry="2" fill="#5C4330" />
      {/* bochechas */}
      <ellipse cx="28" cy="46" rx="4" ry="2.6" fill="#E8A8A0" opacity="0.6" />
      <ellipse cx="58" cy="46" rx="4" ry="2.6" fill="#E8A8A0" opacity="0.6" />
      {/* coração nas patinhas */}
      <path d="M42 78 C38 70 28 70 26 78 C24 85 32 92 42 98 C52 92 60 85 58 78 C56 70 46 70 42 78 Z"
        fill="#D87E72" />
      <path d="M34 76 C32 73 29 73 28 76" stroke="#F3D4CE" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

// ─── Montinho de grama ────────────────────────────────────────────────────────
export function GrassMound({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 90" preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#96B06B" />
          <stop offset="100%" stopColor="#7C9655" />
        </linearGradient>
      </defs>
      <path d="M0 90 L0 56 C60 30 140 22 220 34 C280 42 330 26 400 24 C470 22 540 36 600 52 L600 90 Z"
        fill="url(#grassGrad)" />
      <path d="M0 90 L0 70 C90 50 200 48 300 56 C400 64 500 56 600 66 L600 90 Z" fill="#6F8A4B" opacity="0.55" />
    </svg>
  );
}

// ─── Folhinha (para animação de queda) ───────────────────────────────────────
export function Leaf({ className = '', width = 16, color = '#8A9678' }: { className?: string; width?: number; color?: string }) {
  return (
    <svg viewBox="0 0 20 20" width={width} className={className} aria-hidden="true">
      <path d="M10 1 C16 5 19 11 17 17 C11 19 4 16 2 9 C4 4 7 2 10 1 Z" fill={color} opacity="0.8" />
      <path d="M5 14 C8 11 12 7 15 4" stroke="#FFFFFF" strokeWidth="0.8" fill="none" opacity="0.5" />
    </svg>
  );
}

// Original xianxia landscape for the homepage hero (inline SVG, ~13KB, no download).
// A cultivator rides a flying sword past floating karst peaks and a pagoda
// island under a pale moon, with immortal cranes, mist bands and a red seal.
// The scene sits centre-right so the headline (left) stays readable and the
// middle survives the crop on narrow screens. Generated from a script, then
// hand-checked; edit the shapes here directly.
export default function InkWashArt() {
  return (
    <svg
      className="ink-art"
      viewBox="0 0 1200 380"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
      <linearGradient id="mnl-hero-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#f5efe7"/><stop offset="0.7" stopColor="#ece2d4"/><stop offset="1" stopColor="#e2d6c5"/>
      </linearGradient>
      <radialGradient id="mnl-hero-moonGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#f2d4bf" stopOpacity="0.9"/><stop offset="0.5" stopColor="#efcdb6" stopOpacity="0.3"/><stop offset="1" stopColor="#efcdb6" stopOpacity="0"/>
      </radialGradient>
      <linearGradient id="mnl-hero-far" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#b3aaa0"/><stop offset="0.7" stopColor="#d6cdc1" stopOpacity="0.4"/><stop offset="1" stopColor="#e2d6c5" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="mnl-hero-mid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#6a625b"/><stop offset="0.65" stopColor="#9c9289" stopOpacity="0.55"/><stop offset="1" stopColor="#c8bdb0" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="mnl-hero-near" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#2e2a28"/><stop offset="1" stopColor="#4a4440"/>
      </linearGradient>
      <linearGradient id="mnl-hero-mist" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#f3ece3" stopOpacity="0"/><stop offset="0.5" stopColor="#f3ece3" stopOpacity="0.92"/><stop offset="1" stopColor="#f3ece3" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="mnl-hero-island" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#46403b"/><stop offset="0.6" stopColor="#6f675f" stopOpacity="0.7"/><stop offset="1" stopColor="#9a9087" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="mnl-hero-fall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffffff" stopOpacity="0.95"/><stop offset="1" stopColor="#ffffff" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="mnl-hero-trail" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0" stopColor="#c08f63" stopOpacity="0.95"/><stop offset="1" stopColor="#c08f63" stopOpacity="0"/>
      </linearGradient>
      <filter id="mnl-hero-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.6"/></filter>
      </defs>
      <rect width="1200" height="380" fill="url(#mnl-hero-sky)"/>
      <circle cx="930" cy="104" r="170" fill="url(#mnl-hero-moonGlow)"/>
      <circle cx="930" cy="104" r="64" fill="#eecab3" opacity="0.7"/>
      <g filter="url(#mnl-hero-soft)" opacity="0.85">
      <path d="M13.6 380 L13.6 380.0 L13.0 363.3 L14.4 346.7 L15.9 330.0 L20.5 313.3 L22.0 296.7 L19.7 280.0 Q22.9 264.0 29.5 268.0 Q40.0 256.0 51.4 266.0 Q58.0 266.0 56.3 280.0 L55.9 296.7 L58.7 313.3 L60.8 330.0 L61.5 346.7 L60.6 363.3 L68.3 380.0 L68.3 380 Z" fill="url(#mnl-hero-far)"/>
      <path d="M90.4 380 L90.4 380.0 L89.3 365.7 L91.5 351.3 L91.5 337.0 L96.6 322.7 L97.7 308.3 L95.5 294.0 Q96.5 278.0 101.8 282.0 Q110.0 270.0 119.0 280.0 Q124.2 280.0 124.4 294.0 L122.4 308.3 L124.3 322.7 L124.1 337.0 L129.3 351.3 L129.2 365.7 L129.6 380.0 L129.6 380 Z" fill="url(#mnl-hero-far)"/>
      <path d="M398.4 380 L398.4 380.0 L398.9 361.3 L398.5 342.7 L403.5 324.0 L402.0 305.3 L401.6 286.7 L404.2 268.0 Q404.7 252.0 410.6 256.0 Q420.0 244.0 430.2 254.0 Q436.1 254.0 436.5 268.0 L437.8 286.7 L436.3 305.3 L439.9 324.0 L440.2 342.7 L443.8 361.3 L441.7 380.0 L441.7 380 Z" fill="url(#mnl-hero-far)"/>
      <path d="M493.1 380 L493.1 380.0 L493.2 355.3 L496.2 330.7 L499.3 306.0 L499.4 281.3 L493.7 256.7 L494.9 232.0 Q500.2 216.0 507.9 220.0 Q520.0 208.0 533.2 218.0 Q540.9 218.0 541.9 232.0 L543.7 256.7 L543.5 281.3 L542.3 306.0 L546.4 330.7 L547.1 355.3 L553.8 380.0 L553.8 380 Z" fill="url(#mnl-hero-far)"/>
      <path d="M553.8 380 L553.8 380.0 L555.5 349.0 L558.1 318.0 L558.4 287.0 L562.3 256.0 L566.4 225.0 L565.2 194.0 Q566.0 178.0 573.0 182.0 Q584.0 170.0 596.0 180.0 Q603.0 180.0 607.9 194.0 L602.5 225.0 L606.1 256.0 L605.5 287.0 L604.1 318.0 L611.1 349.0 L609.2 380.0 L609.2 380 Z" fill="url(#mnl-hero-far)"/>
      <path d="M623.6 380 L623.6 380.0 L625.2 358.3 L632.4 336.7 L629.4 315.0 L629.7 293.3 L634.1 271.7 L632.4 250.0 Q633.8 234.0 640.1 238.0 Q650.0 226.0 660.8 236.0 Q667.1 236.0 670.8 250.0 L670.8 271.7 L668.1 293.3 L672.4 315.0 L668.4 336.7 L670.6 358.3 L674.4 380.0 L674.4 380 Z" fill="url(#mnl-hero-far)"/>
      <path d="M970.5 380 L970.5 380.0 L976.9 352.3 L979.0 324.7 L978.6 297.0 L978.3 269.3 L982.6 241.7 L977.9 214.0 Q981.1 198.0 988.5 202.0 Q1000.0 190.0 1012.6 200.0 Q1020.0 200.0 1021.6 214.0 L1022.8 241.7 L1022.8 269.3 L1019.1 297.0 L1026.7 324.7 L1028.8 352.3 L1027.7 380.0 L1027.7 380 Z" fill="url(#mnl-hero-far)"/>
      <path d="M1032.4 380 L1032.4 380.0 L1038.3 344.7 L1035.0 309.3 L1037.3 274.0 L1037.5 238.7 L1041.3 203.3 L1040.3 168.0 Q1045.3 152.0 1053.3 156.0 Q1066.0 144.0 1079.8 154.0 Q1087.8 154.0 1085.9 168.0 L1085.1 203.3 L1086.7 238.7 L1089.8 274.0 L1096.1 309.3 L1091.5 344.7 L1095.9 380.0 L1095.9 380 Z" fill="url(#mnl-hero-far)"/>
      <path d="M1105.1 380 L1105.1 380.0 L1107.2 354.7 L1105.0 329.3 L1112.8 304.0 L1109.9 278.7 L1108.5 253.3 L1111.7 228.0 Q1114.0 212.0 1121.0 216.0 Q1132.0 204.0 1144.0 214.0 Q1151.0 214.0 1151.9 228.0 L1149.0 253.3 L1150.9 278.7 L1151.1 304.0 L1158.8 329.3 L1154.2 354.7 L1155.4 380.0 L1155.4 380 Z" fill="url(#mnl-hero-far)"/>
      <path d="M1163.8 380 L1163.8 380.0 L1166.0 350.0 L1167.4 320.0 L1165.2 290.0 L1167.5 260.0 L1165.4 230.0 L1166.3 200.0 Q1169.8 184.0 1176.1 188.0 Q1186.0 176.0 1196.8 186.0 Q1203.1 186.0 1203.0 200.0 L1206.1 230.0 L1206.7 260.0 L1203.6 290.0 L1210.4 320.0 L1210.7 350.0 L1212.2 380.0 L1212.2 380 Z" fill="url(#mnl-hero-far)"/>
      </g>
      <rect y="212" width="1200" height="90" fill="url(#mnl-hero-mist)"/>
      <path d="M660.0 380 L660.0 380.0 L663.2 350.7 L673.6 321.3 L675.3 292.0 L676.9 262.7 L670.1 233.3 L667.9 204.0 Q675.7 188.0 685.1 192.0 Q700.0 180.0 716.2 190.0 Q725.6 190.0 724.6 204.0 L729.3 233.3 L727.5 262.7 L734.7 292.0 L729.9 321.3 L730.8 350.7 L733.5 380.0 L733.5 380 Z" fill="url(#mnl-hero-mid)"/>
      <path d="M694.6 200.0 L695.6 238.8 L697.8 277.6 L697.3 316.4 L694.4 355.2 " fill="none" stroke="#4a443f" strokeWidth="1.2" opacity="0.35"/>
      <path d="M688.9 190.3 L692.5 176.6 L696.1 190.3 Z" fill="#4d4640"/>
      <path d="M697.0 192.3 L700.6 178.2 L704.2 192.3 Z" fill="#4d4640"/>
      <path d="M705.5 190.5 L709.1 178.3 L712.7 190.5 Z" fill="#4d4640"/>
      <path d="M765.3 380 L765.3 380.0 L762.2 359.0 L764.2 338.0 L771.8 317.0 L768.4 296.0 L772.2 275.0 L772.3 254.0 Q772.0 238.0 779.0 242.0 Q790.0 230.0 802.0 240.0 Q809.0 240.0 808.7 254.0 L814.0 275.0 L810.0 296.0 L813.6 317.0 L810.2 338.0 L818.2 359.0 L814.4 380.0 L814.4 380 Z" fill="url(#mnl-hero-mid)"/>
      <path d="M786.0 250.0 L788.6 278.8 L789.8 307.6 L787.3 336.4 L784.8 365.2 " fill="none" stroke="#4a443f" strokeWidth="1.2" opacity="0.35"/>
      <path d="M778.5 240.0 L782.1 229.4 L785.7 240.0 Z" fill="#4d4640"/>
      <path d="M788.3 241.6 L791.9 228.6 L795.5 241.6 Z" fill="#4d4640"/>
      <path d="M796.2 242.6 L799.8 230.6 L803.4 242.6 Z" fill="#4d4640"/>
      <path d="M1071.5 380 L1071.5 380.0 L1072.1 357.3 L1072.1 334.7 L1075.6 312.0 L1076.8 289.3 L1077.8 266.7 L1084.8 244.0 Q1083.9 228.0 1094.0 232.0 Q1110.0 220.0 1127.4 230.0 Q1137.5 230.0 1135.6 244.0 L1136.9 266.7 L1141.2 289.3 L1140.7 312.0 L1148.4 334.7 L1145.8 357.3 L1154.1 380.0 L1154.1 380 Z" fill="url(#mnl-hero-mid)"/>
      <path d="M1104.2 240.0 L1103.6 270.8 L1107.5 301.6 L1104.2 332.4 L1104.5 363.2 " fill="none" stroke="#4a443f" strokeWidth="1.2" opacity="0.35"/>
      <path d="M1098.4 231.3 L1102.0 221.1 L1105.6 231.3 Z" fill="#4d4640"/>
      <path d="M1105.1 232.4 L1108.7 222.3 L1112.3 232.4 Z" fill="#4d4640"/>
      <path d="M1113.2 232.2 L1116.8 219.9 L1120.4 232.2 Z" fill="#4d4640"/>
      <g transform="translate(905 150) scale(1.45)">
      <path d="M51 22 L54 22 L56 150 L49 150 Z" fill="url(#mnl-hero-fall)"/>
      <path d="M-34 14 Q0 4 58 12 Q54 22 42 28 Q34 44 24 62 Q14 74 6 86 Q-2 66 -12 50 Q-24 34 -34 14 Z" fill="url(#mnl-hero-island)"/>
      <path d="M-30 15 Q2 7 54 13" fill="none" stroke="#2f2b29" strokeWidth="2"/>
      <g fill="#2f2b29">
      <rect x="-1" y="-6" width="22" height="20"/>
      <path d="M-20 -4 Q-8 -8 -1 -12 L21 -12 Q28 -8 40 -4 Q25 -6 10 -6 Q-5 -6 -20 -4 Z"/>
      <rect x="2" y="-26" width="16" height="15"/>
      <path d="M-14 -23 Q-4 -27 2 -31 L18 -31 Q24 -27 34 -23 Q22 -25 10 -25 Q-2 -25 -14 -23 Z"/>
      <rect x="5" y="-43" width="10" height="13"/>
      <path d="M-8 -40 Q0 -44 5 -48 L15 -48 Q20 -44 28 -40 Q19 -42 10 -42 Q1 -42 -8 -40 Z"/>
      <rect x="9" y="-62" width="2" height="16"/>
      <circle cx="10" cy="-63" r="2"/>
      <path d="M-30 14 L-25 1 L-20 14 Z M-22 14 L-18 4 L-14 14 Z M42 13 L47 2 L52 13 Z"/>
      </g>
      </g>
      <ellipse cx="985" cy="332" rx="60" ry="10" fill="#ffffff" opacity="0.35" filter="url(#mnl-hero-soft)"/>
      <g transform="translate(812 214) scale(1.1)" opacity="0.9">
      <path d="M-20 0 Q4 -6 28 0 Q22 8 12 12 Q6 24 0 32 Q-6 22 -12 12 Q-18 8 -20 0 Z" fill="url(#mnl-hero-island)"/>
      <path d="M-12 0 L-7 -12 L-2 0 Z M4 0 L8 -9 L12 0 Z" fill="#4a443f"/>
      </g>
      <g transform="translate(612 92) scale(1.0)" fill="none" stroke="#2f2b29" strokeLinecap="round" strokeLinejoin="round">
      <path d="M-18 0 Q0 -2 20 0" strokeWidth="2.6"/>
      <path d="M20 0 L34 -4" strokeWidth="1.6"/>
      <path d="M-18 0 L-34 4" strokeWidth="1.2"/>
      <path d="M-2 -1 Q-8 -14.0 -20 -20.0 Q-6 -12.0 6 -1" fill="#2f2b29" strokeWidth="1"/>
      <path d="M-2 0 Q-6 10.0 -16 14.0 Q-4 9.0 6 1" fill="#3a3532" strokeWidth="1" opacity="0.8"/>
      <circle cx="33" cy="-4.5" r="1.4" fill="#b23a2b" stroke="none"/>
      </g>
      <g transform="translate(676 66) scale(0.8)" fill="none" stroke="#2f2b29" strokeLinecap="round" strokeLinejoin="round">
      <path d="M-18 0 Q0 -2 20 0" strokeWidth="2.6"/>
      <path d="M20 0 L34 -4" strokeWidth="1.6"/>
      <path d="M-18 0 L-34 4" strokeWidth="1.2"/>
      <path d="M-2 -1 Q-8 -9.8 -20 -14.0 Q-6 -8.4 6 -1" fill="#2f2b29" strokeWidth="1"/>
      <path d="M-2 0 Q-6 7.0 -16 9.8 Q-4 6.3 6 1" fill="#3a3532" strokeWidth="1" opacity="0.8"/>
      <circle cx="33" cy="-4.5" r="1.4" fill="#b23a2b" stroke="none"/>
      </g>
      <g transform="translate(560 120) scale(0.65)" fill="none" stroke="#2f2b29" strokeLinecap="round" strokeLinejoin="round">
      <path d="M-18 0 Q0 -2 20 0" strokeWidth="2.6"/>
      <path d="M20 0 L34 -4" strokeWidth="1.6"/>
      <path d="M-18 0 L-34 4" strokeWidth="1.2"/>
      <path d="M-2 -1 Q-8 -12.6 -20 -18.0 Q-6 -10.8 6 -1" fill="#2f2b29" strokeWidth="1"/>
      <path d="M-2 0 Q-6 9.0 -16 12.6 Q-4 8.1 6 1" fill="#3a3532" strokeWidth="1" opacity="0.8"/>
      <circle cx="33" cy="-4.5" r="1.4" fill="#b23a2b" stroke="none"/>
      </g>
      <path d="M470 196 Q600 178 720 160" fill="none" stroke="url(#mnl-hero-trail)" strokeWidth="3" strokeLinecap="round"/>
      <path d="M500 206 Q610 190 716 170" fill="none" stroke="url(#mnl-hero-trail)" strokeWidth="1.3" strokeLinecap="round" opacity="0.65"/>
      <g transform="translate(742 152) scale(1.75)">
      {/* slim tapered blade, guard, grip and tassel */}
      <path d="M-14 0.6 L40 -0.8 L48 0 L40 0.8 L-14 2.2 Z" fill="#2f2b29"/>
      <rect x="-16" y="-2" width="2.4" height="6.4" rx="0.8" fill="#2f2b29"/>
      <path d="M-16 1.2 L-24 1.4" stroke="#2f2b29" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M-24 1.4 Q-29 4 -33 9" fill="none" stroke="#b23a2b" strokeWidth="1.3" strokeLinecap="round"/>
      {/* standing figure: feet apart on the blade, robe hem whipping back */}
      <path d="M2 -1 L4 -12 M14 -1 L11 -12" stroke="#2f2b29" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M6 -33 Q11 -34 13 -29 L15 -18 Q17 -12 20 -9 Q10 -10 3 -9 Q-6 -8 -16 -12 Q-8 -14 -1 -16 Q3 -24 6 -33 Z" fill="#2f2b29"/>
      <path d="M7 -27 Q1 -22 -1 -17" stroke="#2f2b29" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <circle cx="9.5" cy="-37.5" r="4" fill="#2f2b29"/>
      <path d="M8 -41.5 Q5 -45 1 -44.5" fill="none" stroke="#2f2b29" strokeWidth="2" strokeLinecap="round"/>
      {/* sash and hair ribbon streaming behind */}
      <path d="M7 -26 Q-6 -29 -18 -23 Q-30 -17 -44 -21" fill="none" stroke="#b23a2b" strokeWidth="2" strokeLinecap="round"/>
      <path d="M5 -20 Q-5 -22 -14 -18" fill="none" stroke="#b23a2b" strokeWidth="1.1" strokeLinecap="round" opacity="0.7"/>
      <path d="M6 -40 Q-2 -43 -10 -39" fill="none" stroke="#2f2b29" strokeWidth="1.1" strokeLinecap="round" opacity="0.8"/>
      </g>
      <path d="M0 318 L0 295.8 L60 288.4 L120 294.6 L180 295.8 L240 303.1 L300 281.4 L360 295.9 L420 286.0 L480 286.9 L540 302.7 L600 294.2 L660 296.0 L720 302.3 L780 307.2 L840 292.2 L900 297.6 L960 294.2 L1020 294.4 L1080 300.2 L1140 292.5 L1200 295.1 L1200 380 L0 380 Z" fill="url(#mnl-hero-mid)" opacity="0.75" filter="url(#mnl-hero-soft)"/>
      <rect y="300" width="1200" height="44" fill="url(#mnl-hero-mist)" opacity="0.9"/>
      <path fill="url(#mnl-hero-near)" d="M0 352 C 110 330 200 322 300 330 C 370 316 430 314 500 326 C 590 320 670 332 760 344 C 850 328 930 324 1010 334 C 1080 322 1140 328 1200 336 L1200 380 L0 380 Z"/>
      <g fill="#2a2624" transform="translate(1040 256)">
      <path d="M18 86 L22 86 L23 24 L17 24 Z"/>
      <path d="M-24 42 C -2 32 32 30 62 38 C 40 44 12 46 -24 42 Z"/>
      <path d="M-10 24 C 10 14 38 14 58 20 C 38 28 14 28 -10 24 Z"/>
      <path d="M2 8 C 16 0 34 0 48 6 C 34 12 20 12 2 8 Z"/>
      </g>
      <g transform="translate(1124 312)">
      <rect width="36" height="36" rx="4" fill="#b23a2b" opacity="0.92"/>
      <text x="18" y="23.5" textAnchor="middle" fontFamily="Inter, -apple-system, Helvetica, Arial, sans-serif" fontSize="11.5" fontWeight="700" fill="#f6f1ea" letterSpacing="0.5">MNL</text>
      </g>
    </svg>
  );
}

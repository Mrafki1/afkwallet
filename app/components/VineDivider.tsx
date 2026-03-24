export default function VineDivider({ flip = false }: { flip?: boolean }) {
  return (
    <div
      className="w-full overflow-hidden"
      style={{ transform: flip ? "scaleY(-1)" : undefined }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 52"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full h-12"
      >
        {/* Main vine stem */}
        <path
          d="M0,30 C120,10 240,48 360,30 C480,12 600,48 720,30 C840,12 960,48 1080,30 C1200,12 1320,48 1440,30"
          stroke="#4a7c59"
          strokeWidth="2.5"
          fill="none"
        />
        {/* Tendrils */}
        <path d="M180,22 C190,10 200,8 210,14" stroke="#5a9e6f" strokeWidth="1.5" fill="none"/>
        <path d="M540,38 C550,50 560,52 570,46" stroke="#5a9e6f" strokeWidth="1.5" fill="none"/>
        <path d="M900,22 C910,10 920,8 930,14" stroke="#5a9e6f" strokeWidth="1.5" fill="none"/>
        <path d="M1260,38 C1270,50 1280,52 1290,46" stroke="#5a9e6f" strokeWidth="1.5" fill="none"/>

        {/* Leaves above the vine */}
        <ellipse cx="90"   cy="16" rx="16" ry="7" fill="#4a7c59" transform="rotate(-30 90 16)"/>
        <ellipse cx="240"  cy="42" rx="14" ry="6" fill="#5a9e6f" transform="rotate(28 240 42)"/>
        <ellipse cx="390"  cy="16" rx="16" ry="7" fill="#3d6b4a" transform="rotate(-35 390 16)"/>
        <ellipse cx="540"  cy="42" rx="14" ry="6" fill="#4a7c59" transform="rotate(25 540 42)"/>
        <ellipse cx="660"  cy="16" rx="16" ry="7" fill="#5a9e6f" transform="rotate(-28 660 16)"/>
        <ellipse cx="810"  cy="42" rx="14" ry="6" fill="#3d6b4a" transform="rotate(32 810 42)"/>
        <ellipse cx="960"  cy="16" rx="16" ry="7" fill="#4a7c59" transform="rotate(-30 960 16)"/>
        <ellipse cx="1110" cy="42" rx="14" ry="6" fill="#5a9e6f" transform="rotate(28 1110 42)"/>
        <ellipse cx="1260" cy="16" rx="16" ry="7" fill="#3d6b4a" transform="rotate(-35 1260 16)"/>
        <ellipse cx="1380" cy="42" rx="14" ry="6" fill="#4a7c59" transform="rotate(25 1380 42)"/>

        {/* Small berries */}
        <circle cx="180" cy="44" r="3.5" fill="#7a5430"/>
        <circle cx="185" cy="40" r="3"   fill="#8b6343"/>
        <circle cx="174" cy="41" r="2.5" fill="#6a4422"/>

        <circle cx="540" cy="16" r="3.5" fill="#7a5430"/>
        <circle cx="546" cy="12" r="3"   fill="#8b6343"/>
        <circle cx="534" cy="13" r="2.5" fill="#6a4422"/>

        <circle cx="900" cy="44" r="3.5" fill="#7a5430"/>
        <circle cx="906" cy="40" r="3"   fill="#8b6343"/>
        <circle cx="894" cy="41" r="2.5" fill="#6a4422"/>

        <circle cx="1260" cy="16" r="3.5" fill="#7a5430"/>
        <circle cx="1266" cy="12" r="3"   fill="#8b6343"/>
        <circle cx="1254" cy="13" r="2.5" fill="#6a4422"/>

        {/* Small flowers */}
        <circle cx="330" cy="28" r="4"   fill="#e8b84b"/>
        <circle cx="330" cy="28" r="2"   fill="#f5ead8"/>
        <circle cx="720" cy="30" r="4"   fill="#e8b84b"/>
        <circle cx="720" cy="30" r="2"   fill="#f5ead8"/>
        <circle cx="1080" cy="28" r="4"  fill="#e8b84b"/>
        <circle cx="1080" cy="28" r="2"  fill="#f5ead8"/>
      </svg>
    </div>
  );
}

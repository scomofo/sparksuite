/* ===== ChordSpark Performance: Highway Theme Manifest ===== */

window.PERFORMANCE_HIGHWAY_THEME_MANIFEST = {
  defaultTheme: "classic",
  themes: {
    classic: {
      guitar: {
        background: "sparkgame/assets/highway/bg_concert.png",
        surface: "sparkgame/assets/highway/guitar_highway_v3.png"
      },
      piano: {
        background: "sparkgame/assets/highway/bg_recital.png",
        surface: "sparkgame/assets/highway/piano_highway_v3.png"
      }
    },
    legacy: {
      guitar: {
        background: "sparkgame/assets/highway/bg_concert.png",
        surface: "sparkgame/assets/highway/guitar_highway_v2.jpg"
      },
      piano: {
        background: "sparkgame/assets/highway/bg_recital.png",
        surface: "sparkgame/assets/highway/piano_highway_v2.jpg"
      }
    },
    experimental: {
      guitar: {
        background: "sparkgame/assets/highway/bg_concert_next.png",
        surface: "sparkgame/assets/highway/guitar_highway_v3.png",
        shellOverlayTop: 0.34,
        shellOverlayBottom: 0.68,
        surfaceOpacity: 0.18,
        vfx: {
          strikeline: "sparkgame/assets/vfx/strikeline_refined.png",
          strikelineOpacity: 0.58
        }
      },
      piano: {
        background: "sparkgame/assets/highway/bg_recital_next.png",
        surface: "sparkgame/assets/highway/piano_highway_v3.png",
        shellOverlayTop: 0.24,
        shellOverlayBottom: 0.54,
        surfaceOpacity: 0.12,
        vfx: {
          strikeline: "sparkgame/assets/vfx/strikeline_refined.png",
          strikelineOpacity: 0.48
        }
      }
    }
  }
};

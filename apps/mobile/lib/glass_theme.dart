import 'package:flutter/material.dart';

/// ==============================================================================
/// CST Capstone: Liquid Glassmorphic Design System (VisionOS & One UI 6 Inspired)
/// ==============================================================================
/// Transitions away from harsh cyberpunk neons toward a calm, ultra-refined
/// frosted acrylic aesthetic featuring deep ambient slate gradients, delicate
/// specular hairline reflections, and disciplined monochromatic accents.
class GlassTheme {
  const GlassTheme._();

  // ---------------------------------------------------------------------------
  // 1. AMBIENT CANVAS & FROSTED ACRYLIC SURFACES
  // ---------------------------------------------------------------------------
  /// Deep ambient slate mesh base (#0B111E)
  static const Color canvasBase = Color(0xFF0B111E);

  /// Ambient secondary slate gradient stop (#0F1B2E)
  static const Color canvasSurface = Color(0xFF0F1B2E);

  /// Deepest canvas depth for sunken wells & terminal containers (#070C15)
  static const Color canvasDeep = Color(0xFF070C15);

  /// Ultra-clear frosted acrylic card surface: rgba(15, 27, 46, 0.55)
  static const Color glassSurface = Color(0x8C0F1B2E);

  /// High-elevation frosted sheet: rgba(20, 34, 58, 0.70)
  static const Color glassElevated = Color(0xB314223A);

  /// Subtle translucent frosted card: rgba(255, 255, 255, 0.04)
  static const Color glassUltraLight = Color(0x0AFFFFFF);

  /// Modal and navigation backdrop scrim: rgba(7, 12, 21, 0.75)
  static const Color glassScrim = Color(0xBF070C15);

  /// Desaturated offline acrylic surface: rgba(15, 23, 42, 0.40)
  static const Color glassOffline = Color(0x660F172A);

  // ---------------------------------------------------------------------------
  // 2. REFINED MONOCHROMATIC ACCENTS & SEMANTIC STATUS
  // ---------------------------------------------------------------------------
  /// Calm Primary Accent: Ice Cyan (#38BDF8)
  static const Color accentIce = Color(0xFF38BDF8);
  static const Color accentIceDim = Color(0x2638BDF8); // 15% opacity
  static const Color accentIceGlow = Color(0x4D38BDF8); // 30% soft diffusion

  /// Secondary Accent: Pure White (#FFFFFF)
  static const Color accentWhite = Color(0xFFFFFFFF);

  /// Autonomous AI Accent: Subdued Soft Violet (#A78BFA)
  static const Color accentAi = Color(0xFFA78BFA);
  static const Color accentAiDim = Color(0x26A78BFA);

  // --- STRICT SEMANTIC STATUS (NO RAINBOW NOISE) ---
  /// Online / Ready status: Soft Emerald (#34D399)
  static const Color statusOnline = Color(0xFF34D399);
  static const Color statusOnlineDim = Color(0x2634D399);

  /// Warning / Pending / Asleep: Muted Amber (#FBBF24)
  static const Color statusPending = Color(0xFFFBBF24);
  static const Color statusPendingDim = Color(0x26FBBF24);

  /// Destructive / Critical / Panic Abort: Soft Coral Rose (#FB7185)
  static const Color statusCritical = Color(0xFFFB7185);
  static const Color statusCriticalDim = Color(0x26FB7185);

  // --- NEUTRAL WCAG AA TYPOGRAPHY SCALES ---
  static const Color textPrimary = Color(0xFFF8FAFC);   // Crisp frosted white
  static const Color textSecondary = Color(0xFF94A3B8); // Muted slate
  static const Color textTertiary = Color(0xFF64748B);  // Subdued hints & icons
  static const Color textDisabled = Color(0xFF475569);  // Inactive placeholders

  // ---------------------------------------------------------------------------
  // 3. SPECULAR BORDER GRADIENTS & AMBIENT OCCLUSION SHADOWS
  // ---------------------------------------------------------------------------
  /// Delicate specular hairline border (Simulates overhead ambient light reflection)
  static const LinearGradient specularBorder = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0x1FFFFFFF), // 12% white at top-left
      Color(0x05FFFFFF), // 2% white at bottom-right
    ],
  );

  /// Focused/Selected specular border with subtle Ice Cyan infusion
  static const LinearGradient specularBorderActive = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0x8038BDF8), // 50% ice cyan highlight
      Color(0x1A38BDF8), // 10% ice cyan base
    ],
  );

  /// Subtle ambient occlusion drop shadow (Layered depth without harsh neon glow)
  static const List<BoxShadow> glassShadow = [
    BoxShadow(
      color: Color(0x59000000), // 35% black
      blurRadius: 32,
      spreadRadius: -4,
      offset: Offset(0, 12),
    ),
    BoxShadow(
      color: Color(0x1F000000), // 12% black micro-shadow
      blurRadius: 8,
      offset: Offset(0, 2),
    ),
  ];

  /// Floating pill dock elevation shadow
  static const List<BoxShadow> dockShadow = [
    BoxShadow(
      color: Color(0x73000000), // 45% black
      blurRadius: 40,
      spreadRadius: 2,
      offset: Offset(0, 16),
    ),
  ];

  // ---------------------------------------------------------------------------
  // 4. ANIMATION CURVES & SPRING CONSTANTS
  // ---------------------------------------------------------------------------
  static const Curve smoothCurve = Cubic(0.4, 0.0, 0.2, 1.0);
  static const Curve snappyCurve = Cubic(0.2, 0.9, 0.1, 1.05);
  static const Curve springOvershoot = Cubic(0.34, 1.45, 0.64, 1.0);

  static const Duration durationFast = Duration(milliseconds: 160);
  static const Duration durationNormal = Duration(milliseconds: 280);
  static const Duration durationModal = Duration(milliseconds: 360);
  static const Duration holdToConfirmDuration = Duration(milliseconds: 1500);

  // ---------------------------------------------------------------------------
  // 5. REFINED TYPOGRAPHY STYLES (TITLE CASE & ZERO STRING CLIPPING)
  // ---------------------------------------------------------------------------
  static const TextStyle displayLarge = TextStyle(
    fontFamily: 'Rajdhani',
    fontSize: 26,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.3,
    color: textPrimary,
  );

  static const TextStyle titleLarge = TextStyle(
    fontFamily: 'Rajdhani',
    fontSize: 20,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.2,
    color: textPrimary,
  );

  static const TextStyle titleMedium = TextStyle(
    fontFamily: 'Rajdhani',
    fontSize: 16,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.2,
    color: textPrimary,
  );

  static const TextStyle bodyLarge = TextStyle(
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: FontWeight.w400,
    height: 1.45,
    color: textPrimary,
  );

  static const TextStyle bodyMedium = TextStyle(
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: FontWeight.w400,
    height: 1.4,
    color: textSecondary,
  );

  static const TextStyle bodySmall = TextStyle(
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: FontWeight.w400,
    color: textTertiary,
  );

  static const TextStyle labelMedium = TextStyle(
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.1,
    color: textPrimary,
  );

  static const TextStyle labelSmall = TextStyle(
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.1,
    color: textSecondary,
  );

  static const TextStyle monoIpMac = TextStyle(
    fontFamily: 'JetBrains Mono',
    fontSize: 12,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.4,
    color: accentIce,
  );

  static const TextStyle monoTerminal = TextStyle(
    fontFamily: 'JetBrains Mono',
    fontSize: 11.5,
    fontWeight: FontWeight.w400,
    height: 1.4,
    color: Color(0xFFE2E8F0),
  );
}

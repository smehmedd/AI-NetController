import 'dart:ui';
import 'package:flutter/material.dart';

/// ==============================================================================
/// CST Capstone Project: Centralized Design System & Semantic Color Tokens
/// ==============================================================================
/// Enforces strict visual hierarchy, zero rainbow noise, glassmorphic decoration
/// presets, and standard spring physics curves to unify the UI across all
/// Flutter & Web components in the LAN PC Inspector & Agentic OS Bridge.
class AppThemeTokens {
  AppThemeTokens._();

  // ---------------------------------------------------------------------------
  // 1. SEMANTIC COLOR PALETTE (DEEP ABYSS NAVY & ZERO RAINBOW NOISE)
  // ---------------------------------------------------------------------------
  /// Base canvas: Deep Abyss Navy (#040812)
  static const Color background = Color(0xFF040812);

  /// Primary surface containers: (#070F1E)
  static const Color surface = Color(0xFF070F1E);

  /// Elevated cards, active containers & floating dialogs: (#0C182E)
  static const Color surfaceElevated = Color(0xFF0C182E);

  /// Sunken wells, terminal outputs & text input fields: (#060B16)
  static const Color surfaceMuted = Color(0xFF060B16);

  /// Desaturated offline cards & dormant nodes: (#0F172A)
  static const Color surfaceSteel = Color(0xFF0F172A);

  /// Semi-transparent scrim for modal backdrops & drawers
  static const Color surfaceScrim = Color(0xCC040812);

  // ---------------------------------------------------------------------------
  // 2. PRIMARY & SECONDARY ACCENT TOKENS
  // ---------------------------------------------------------------------------
  /// Primary interactive brand accent: Electric Neon Cyan (#00F0FF)
  static const Color primaryCyan = Color(0xFF00F0FF);
  static const Color cyanDim =
      Color(0x3300F0FF); // 20% opacity for hairline borders
  static const Color cyanGlow = Color(0x6600F0FF); // 40% glow for active states
  static const Color cyanUltraGlow =
      Color(0x9900F0FF); // 60% glow for selected focus

  /// AI / Agent Accent: Electric Violet (#8A2BE2)
  /// STRICTLY reserved for Autonomous AI agent tasks, LLM thinking indicators & diagnostics
  static const Color agentViolet = Color(0xFF8A2BE2);
  static const Color violetDim =
      Color(0x338A2BE2); // 20% opacity for AI outlines
  static const Color violetGlow =
      Color(0x668A2BE2); // 40% glow for LLM streaming

  // ---------------------------------------------------------------------------
  // 3. STRICT SEMANTIC STATUS COLORS
  // ---------------------------------------------------------------------------
  /// Active / Ready / Online / mDNS resolved: Emerald Green (#00FFA3)
  static const Color statusGreen = Color(0xFF00FFA3);
  static const Color statusGreenDim = Color(0x2600FFA3);

  /// Pending approval / Degraded link / Asleep / Reconnecting: Amber (#FFB800)
  static const Color statusAmber = Color(0xFFFFB800);
  static const Color statusAmberDim = Color(0x26FFB800);

  /// Critical error / Panic kill / High-risk HITL / Offline: Ruby Red (#FF2A6D)
  static const Color statusRed = Color(0xFFFF2A6D);
  static const Color statusRedDim = Color(0x26FF2A6D);

  // ---------------------------------------------------------------------------
  // 4. NEUTRAL TYPOGRAPHY SCALES (WCAG AA COMPLIANT ON #040812)
  // ---------------------------------------------------------------------------
  static const Color textPrimary =
      Color(0xFFF1F5F9); // High contrast white-slate
  static const Color textSecondary =
      Color(0xFF94A3B8); // Muted descriptive labels
  static const Color textTertiary =
      Color(0xFF64748B); // Inactive tabs & subtle hints
  static const Color textDisabled =
      Color(0xFF334155); // Dormant placeholder text

  // ---------------------------------------------------------------------------
  // 5. BORDER & HAIRLINE TOKENS
  // ---------------------------------------------------------------------------
  static const Color borderHairline = Color(0x2600F0FF); // 15% cyan hairline
  static const Color borderFocus = Color(0x9900F0FF); // 60% active cyan
  static const Color borderOffline =
      Color(0x14FFFFFF); // 8% white for asleep cards
  static const Color borderAi = Color(0x4D8A2BE2); // 30% violet for AI panels

  static const LinearGradient subtleBorderGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0x4000F0FF), // Top-left: subtle cyan
      Color(0x268A2BE2), // Bottom-right: subtle violet
    ],
  );

  static const LinearGradient activeBorderGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF00F0FF),
      Color(0xFF8A2BE2),
    ],
  );

  static const LinearGradient offlineBorderGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0x2294A3B8),
      Color(0x11475569),
    ],
  );

  // ---------------------------------------------------------------------------
  // 6. TYPOGRAPHY STYLES (RAJDHANI HEADERS & INTER LABELS / BODY HYGIENE)
  // ---------------------------------------------------------------------------
  // --- 6.1 RAJDHANI FONT FAMILY (DISPLAY, HEADERS, TITLES & STAT COUNTERS) ---
  /// Large hero/display headline (28px, Bold, letterSpacing 0.6)
  static const TextStyle rajdhaniDisplayLarge = TextStyle(
    fontFamily: 'Rajdhani',
    fontSize: 28,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.6,
    color: textPrimary,
  );

  /// Medium display headline for viewports & modals (24px, Bold, letterSpacing 0.5)
  static const TextStyle rajdhaniDisplayMedium = TextStyle(
    fontFamily: 'Rajdhani',
    fontSize: 24,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.5,
    color: textPrimary,
  );

  /// Main screen & app bar title (22px, Bold, letterSpacing 0.5)
  static const TextStyle rajdhaniTitleLarge = TextStyle(
    fontFamily: 'Rajdhani',
    fontSize: 22,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.5,
    color: textPrimary,
  );

  /// Card headers & modal section titles (18px, SemiBold, letterSpacing 0.4)
  static const TextStyle rajdhaniTitleMedium = TextStyle(
    fontFamily: 'Rajdhani',
    fontSize: 18,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.4,
    color: textPrimary,
  );

  /// Device names & panel subsection titles (15px, SemiBold, letterSpacing 0.3)
  static const TextStyle rajdhaniTitleSmall = TextStyle(
    fontFamily: 'Rajdhani',
    fontSize: 15,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.3,
    color: textPrimary,
  );

  /// Section category banner / eyebrow label (12px, Bold, letterSpacing 0.6)
  static const TextStyle rajdhaniSectionHeader = TextStyle(
    fontFamily: 'Rajdhani',
    fontSize: 12,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.6,
    color: primaryCyan,
  );

  /// Stat telemetry numbers (CPU, RAM, FPS, ping metrics) (22px, Bold, letterSpacing 0.4)
  static const TextStyle rajdhaniStatNumber = TextStyle(
    fontFamily: 'Rajdhani',
    fontSize: 22,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.4,
    color: primaryCyan,
  );

  /// Compact badge text in status pills (11px, Bold, letterSpacing 0.3)
  static const TextStyle rajdhaniBadge = TextStyle(
    fontFamily: 'Rajdhani',
    fontSize: 11,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.3,
    color: textPrimary,
  );

  // --- 6.2 INTER FONT FAMILY (LABELS, SUBTITLES, BUTTONS & BODY TEXT) ---
  /// Prominent descriptive subtitle below headers (14px, Medium, height 1.4)
  static const TextStyle interSubtitle = TextStyle(
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: FontWeight.w500,
    height: 1.4,
    color: textSecondary,
  );

  /// Standard readable body paragraph (16px, Regular, height 1.5)
  static const TextStyle interBodyLarge = TextStyle(
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: FontWeight.w400,
    height: 1.5,
    color: textPrimary,
  );

  /// Standard content body text (14px, Regular, height 1.5)
  static const TextStyle interBodyMedium = TextStyle(
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.5,
    color: textPrimary,
  );

  /// Secondary metadata and descriptive notes (12px, Regular, height 1.4)
  static const TextStyle interBodySmall = TextStyle(
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: FontWeight.w400,
    height: 1.4,
    color: textSecondary,
  );

  /// Primary button label and action trigger text (14px, SemiBold, letterSpacing 0.2)
  static const TextStyle interButton = TextStyle(
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.2,
    color: textPrimary,
  );

  /// Filter chips and tab bar labels (12px, SemiBold, letterSpacing 0.1)
  static const TextStyle interChip = TextStyle(
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.1,
    color: textPrimary,
  );

  /// Standard UI label for inputs and controls (12px, Medium, letterSpacing 0.2)
  static const TextStyle interLabelMedium = TextStyle(
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.2,
    color: textSecondary,
  );

  /// Small UI label, timestamps, and captions (11px, Medium, letterSpacing 0.2)
  static const TextStyle interLabelSmall = TextStyle(
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.2,
    color: textSecondary,
  );

  /// Input placeholder and disabled hint text (13px, Regular, height 1.4)
  static const TextStyle interHint = TextStyle(
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: FontWeight.w400,
    height: 1.4,
    color: textDisabled,
  );

  /// Micro metadata, footnote, and trackpad gestures (10px, Medium, letterSpacing 0.1)
  static const TextStyle interMicro = TextStyle(
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.1,
    color: textTertiary,
  );

  // --- 6.3 SHORTCUT ALIASES FOR COMPONENT BACKWARD-COMPATIBILITY ---
  static const TextStyle titleLarge = rajdhaniTitleLarge;
  static const TextStyle titleMedium = rajdhaniTitleMedium;
  static const TextStyle titleSmall = rajdhaniTitleSmall;
  static const TextStyle bodyLarge = interBodyLarge;
  static const TextStyle bodyMedium = interBodyMedium;
  static const TextStyle bodySmall = interBodySmall;
  static const TextStyle labelSmall = interLabelSmall;

  /// Monospace font strictly restricted to IP addresses, MAC IDs, and live terminal
  static const TextStyle monoIpMac = TextStyle(
    fontFamily: 'JetBrains Mono',
    fontSize: 12,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.5,
    color: primaryCyan,
  );

  static const TextStyle monoTerminal = TextStyle(
    fontFamily: 'JetBrains Mono',
    fontSize: 12,
    fontWeight: FontWeight.w400,
    height: 1.45,
    color: Color(0xFFD1E8FF),
  );

  // ---------------------------------------------------------------------------
  // 7. GLASSMORPHIC DECORATION PRESETS
  // ---------------------------------------------------------------------------
  /// Standard Frosted Glass Backdrop Filter (16px sigma blur)
  static ImageFilter glassBlur({double sigma = 16.0}) =>
      ImageFilter.blur(sigmaX: sigma, sigmaY: sigma);

  /// Subtle Glass Backdrop Filter (8px sigma blur)
  static ImageFilter subtleBlur({double sigma = 8.0}) =>
      ImageFilter.blur(sigmaX: sigma, sigmaY: sigma);

  /// Standard Host Device Card Decoration
  static BoxDecoration cardDecoration({
    bool isSelected = false,
    bool isOffline = false,
    bool isExecuting = false,
    double radius = 16.0,
  }) {
    Color bgFill = isOffline
        ? surfaceSteel.withValues(alpha: 0.50)
        : (isSelected ? surfaceElevated : surface.withValues(alpha: 0.85));

    List<BoxShadow> shadows = [];
    if (isSelected || isExecuting) {
      shadows.add(
        BoxShadow(
          color:
              (isExecuting ? agentViolet : primaryCyan).withValues(alpha: 0.20),
          blurRadius: 16,
          spreadRadius: 1,
          offset: const Offset(0, 4),
        ),
      );
    } else {
      shadows.add(
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.35),
          blurRadius: 8,
          offset: const Offset(0, 3),
        ),
      );
    }

    return BoxDecoration(
      color: bgFill,
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(
        color: isOffline
            ? borderOffline
            : (isSelected ? primaryCyan.withValues(alpha: 0.6) : cyanDim),
        width: 1.0,
      ),
      boxShadow: shadows,
    );
  }

  /// Generic Glass Panel Decoration for floating cards, modals & toolbars
  static BoxDecoration glassPanelDecoration({
    Color borderColor = cyanDim,
    Color? fillColor,
    double radius = 16.0,
    double opacity = 0.85,
    bool hasGlow = false,
    Color glowColor = primaryCyan,
  }) {
    return BoxDecoration(
      color: (fillColor ?? surfaceElevated).withValues(alpha: opacity),
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(color: borderColor, width: 1.0),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.40),
          blurRadius: 14,
          offset: const Offset(0, 5),
        ),
        if (hasGlow)
          BoxShadow(
            color: glowColor.withValues(alpha: 0.20),
            blurRadius: 20,
            spreadRadius: 1,
            offset: const Offset(0, 2),
          ),
      ],
    );
  }

  /// Floating Samsung OneUI-inspired Pill Navigation Dock Decoration
  static BoxDecoration pillDockDecoration({
    double radius = 28.0,
    bool isElevated = true,
  }) {
    return BoxDecoration(
      color: surfaceElevated.withValues(alpha: 0.90),
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(color: cyanDim, width: 1.0),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.55),
          blurRadius: 20,
          spreadRadius: 2,
          offset: const Offset(0, 8),
        ),
      ],
    );
  }

  /// Sunken Well Decoration (Terminal Logs, Input Fields, Code Containers)
  static BoxDecoration sunkenWellDecoration({
    double radius = 12.0,
    Color borderColor = const Color(0x1A00F0FF),
  }) {
    return BoxDecoration(
      color: surfaceMuted,
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(color: borderColor, width: 1.0),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.40),
          blurRadius: 6,
          offset: const Offset(0, 2),
        ),
      ],
    );
  }

  /// AI Agent Card Decoration with violet glow
  static BoxDecoration aiCardDecoration({
    bool isExecuting = false,
    double radius = 16.0,
  }) {
    return BoxDecoration(
      color: agentViolet.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(
        color: isExecuting ? agentViolet : violetDim,
        width: 1.0,
      ),
      boxShadow: [
        BoxShadow(
          color: agentViolet.withValues(alpha: isExecuting ? 0.25 : 0.10),
          blurRadius: isExecuting ? 20 : 10,
          spreadRadius: isExecuting ? 2 : 0,
          offset: const Offset(0, 4),
        ),
      ],
    );
  }

  /// Capsule / Chip Decoration
  static BoxDecoration capsuleDecoration({
    Color borderColor = cyanDim,
    Color fillColor = const Color(0x33070F1E),
    double radius = 24.0,
  }) {
    return BoxDecoration(
      color: fillColor,
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(color: borderColor, width: 1.0),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.25),
          blurRadius: 6,
          offset: const Offset(0, 2),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // 8. STANDARD SPRING PHYSICS CURVES & ANIMATION CONSTANTS
  // ---------------------------------------------------------------------------
  /// Tactile Snappy Spring Physics (Mass: 1.0, Stiffness: 450.0, Damping: 35.0)
  /// Used for responsive button presses, segmented controls, and pill selection
  static const SpringDescription tactileSpring = SpringDescription(
    mass: 1.0,
    stiffness: 450.0,
    damping: 35.0,
  );

  /// Bouncy Micro-Interaction Spring Physics (Mass: 1.0, Stiffness: 300.0, Damping: 20.0)
  /// Used for status badge pops, icon animations, and radar ping oscillations
  static const SpringDescription bouncySpring = SpringDescription(
    mass: 1.0,
    stiffness: 300.0,
    damping: 20.0,
  );

  /// Gentle Spring Physics (Mass: 1.0, Stiffness: 180.0, Damping: 24.0)
  /// Used for modal sheet reveals, responsive navigation rail expansions
  static const SpringDescription gentleSpring = SpringDescription(
    mass: 1.0,
    stiffness: 180.0,
    damping: 24.0,
  );

  /// Standard Curves
  static const Curve snappyCurve = Cubic(0.2, 0.9, 0.1, 1.05);
  static const Curve smoothCurve = Curves.easeOutCubic;
  static const Curve expressiveCurve = Cubic(0.34, 1.56, 0.64, 1.0);
  static const Curve enterCurve = Cubic(0.0, 0.0, 0.2, 1.0);
  static const Curve exitCurve = Cubic(0.4, 0.0, 1.0, 1.0);

  /// Standard Durations
  static const Duration instantAnim = Duration(milliseconds: 75);
  static const Duration fastAnim = Duration(milliseconds: 150);
  static const Duration normalAnim = Duration(milliseconds: 250);
  static const Duration modalAnim = Duration(milliseconds: 320);
  static const Duration holdToConfirmDuration = Duration(milliseconds: 1500);
  static const Duration wolCountdownDuration = Duration(seconds: 45);

  // ---------------------------------------------------------------------------
  // 9. STANDARD RADIUS METRICS
  // ---------------------------------------------------------------------------
  static const double radiusPill = 28.0;
  static const double radiusModal = 20.0;
  static const double radiusCard = 16.0;
  static const double radiusInner = 12.0;
  static const double radiusBadge = 8.0;
  static const double radiusSmall = 6.0;
}

import 'dart:ui';
import 'package:flutter/material.dart';
import 'app_theme_tokens.dart';

/// Navigation Item specification for responsive transitions
class ResponsiveNavItem {
  final String label;
  final IconData icon;
  final IconData? activeIcon;
  final int? badgeCount;

  const ResponsiveNavItem({
    required this.label,
    required this.icon,
    this.activeIcon,
    this.badgeCount,
  });
}

/// Unified Multi-Form Factor Responsive Scaffold
/// ============================================================================
/// Smoothly transitions between:
/// - Mobile (<600dp): Floating Samsung OneUI-inspired glassmorphic bottom pill dock
/// - Tablet / Desktop (>600dp): Left-edge vertical Navigation Rail + Split Master/Detail
/// Preserves active tab index and state across screen rotations and window resizes.
class ResponsiveScaffold extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onIndexChanged;
  final List<ResponsiveNavItem> navItems;
  final Widget body;
  final Widget? masterPane;
  final Widget? detailPane;
  final double masterWidthFraction;
  final List<Widget>? actions;

  const ResponsiveScaffold({
    super.key,
    required this.selectedIndex,
    required this.onIndexChanged,
    required this.navItems,
    required this.body,
    this.masterPane,
    this.detailPane,
    this.masterWidthFraction = 0.35,
    this.actions,
  });

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final isMobile = width < 600;
    final isExpanded = width >= 900 && masterPane != null && detailPane != null;

    return Scaffold(
      backgroundColor: AppThemeTokens.background,
      body: SafeArea(
        top: true,
        bottom: false, // Edge-to-edge bottom dock
        child: isMobile
            ? _buildMobileLayout(context)
            : _buildRailLayout(context, isExpanded: isExpanded),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 1. MOBILE LAYOUT (<600dp): FLOATING BOTTOM PILL DOCK
  // ---------------------------------------------------------------------------
  Widget _buildMobileLayout(BuildContext context) {
    final insets = MediaQuery.viewInsetsOf(context);
    final isKeyboardVisible = insets.bottom > 60;
    final padding = MediaQuery.paddingOf(context);

    return Stack(
      children: [
        // Main content area with padding for the floating pill dock
        Positioned.fill(
          child: Padding(
            padding: EdgeInsets.only(
              bottom: isKeyboardVisible ? insets.bottom : (padding.bottom + 68.0),
            ),
            child: body,
          ),
        ),

        // Floating Samsung OneUI-inspired Pill Navigation Dock
        if (!isKeyboardVisible)
          Positioned(
            left: 20,
            right: 20,
            bottom: padding.bottom + 12,
            child: _buildFloatingBottomPill(context),
          ),
      ],
    );
  }

  Widget _buildFloatingBottomPill(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(28),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: Container(
          height: 56,
          padding: const EdgeInsets.symmetric(horizontal: 8),
          decoration: BoxDecoration(
            color: AppThemeTokens.surfaceElevated.withValues(alpha: 0.85),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: AppThemeTokens.cyanDim, width: 1.0),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.5),
                blurRadius: 18,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(navItems.length, (index) {
              final item = navItems[index];
              final isSelected = selectedIndex == index;

              return Expanded(
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () => onIndexChanged(index),
                  child: AnimatedContainer(
                    duration: AppThemeTokens.fastAnim,
                    curve: Curves.easeOut,
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    decoration: isSelected
                        ? BoxDecoration(
                            color: AppThemeTokens.primaryCyan.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20),
                          )
                        : null,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          isSelected ? (item.activeIcon ?? item.icon) : item.icon,
                          size: 20,
                          color: isSelected
                              ? AppThemeTokens.primaryCyan
                              : AppThemeTokens.textSecondary,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          item.label,
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 10,
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                            color: isSelected
                                ? AppThemeTokens.primaryCyan
                                : AppThemeTokens.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 2. TABLET / DESKTOP LAYOUT (>=600dp): VERTICAL NAVIGATION RAIL
  // ---------------------------------------------------------------------------
  Widget _buildRailLayout(BuildContext context, {required bool isExpanded}) {
    return Row(
      children: [
        // Left Vertical Navigation Rail
        Container(
          width: 80,
          decoration: BoxDecoration(
            color: AppThemeTokens.surfaceElevated,
            border: const Border(
              right: BorderSide(color: Color(0x1AFFFFFF), width: 1),
            ),
          ),
          child: Column(
            children: [
              const SizedBox(height: 20),
              // App Brand Mark
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppThemeTokens.primaryCyan.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                  border: Border.all(color: AppThemeTokens.primaryCyan),
                ),
                child: const Icon(
                  Icons.hub_rounded,
                  color: AppThemeTokens.primaryCyan,
                  size: 22,
                ),
              ),
              const SizedBox(height: 32),

              // Nav items in rail
              Expanded(
                child: ListView.builder(
                  itemCount: navItems.length,
                  itemBuilder: (context, index) {
                    final item = navItems[index];
                    final isSelected = selectedIndex == index;

                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                      child: InkWell(
                        onTap: () => onIndexChanged(index),
                        borderRadius: BorderRadius.circular(14),
                        child: AnimatedContainer(
                          duration: AppThemeTokens.fastAnim,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: isSelected
                              ? BoxDecoration(
                                  color: AppThemeTokens.primaryCyan.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(color: AppThemeTokens.cyanDim),
                                )
                              : null,
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                isSelected ? (item.activeIcon ?? item.icon) : item.icon,
                                size: 22,
                                color: isSelected
                                    ? AppThemeTokens.primaryCyan
                                    : AppThemeTokens.textSecondary,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                item.label,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontFamily: 'Inter',
                                  fontSize: 10,
                                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                                  color: isSelected
                                      ? AppThemeTokens.primaryCyan
                                      : AppThemeTokens.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),

              // Bottom status dot
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: AppThemeTokens.statusGreen,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
        ),

        // Split Panes or Single Content Area
        Expanded(
          child: isExpanded && selectedIndex == 0
              ? Row(
                  children: [
                    // Master Pane (35% default)
                    SizedBox(
                      width: MediaQuery.sizeOf(context).width * masterWidthFraction,
                      child: masterPane,
                    ),
                    // Crisp 1px divider
                    Container(width: 1, color: Colors.white.withValues(alpha: 0.08)),
                    // Detail Pane (65%)
                    Expanded(child: detailPane!),
                  ],
                )
              : body,
        ),
      ],
    );
  }
}

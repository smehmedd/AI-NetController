import 'package:flutter/material.dart';
import 'fluid_theme.dart';
import 'responsive_sidebar.dart';
import 'samsung_pill_nav_bar.dart';

export 'responsive_sidebar.dart';

/// Screen tier classification based on Material 3 adaptive design breakpoints
enum AdaptiveTier {
  compact,  // < 600dp: Standard Phones (Portrait)
  medium,   // 600 - 840dp: Foldables & Small Tablets
  expanded, // > 840dp: Large Tablets & Desktops
}

/// AdaptiveLayout: Responsive container utilizing both MediaQuery and LayoutBuilder
/// to dynamically orchestrate master-detail desktop/tablet views and tabbed mobile views.
class AdaptiveLayout extends StatelessWidget {
  /// Navigation items for sidebar (desktop/tablet) and bottom dock (mobile)
  final List<SidebarNavItem> navItems;

  /// Currently selected navigation index
  final int selectedIndex;

  /// Callback when navigation index changes
  final ValueChanged<int> onIndexChanged;

  /// Header widget (app bar, title, actions)
  final PreferredSizeWidget? appBar;

  /// Single-view body for compact tabbed mobile views (<600dp)
  final Widget compactBody;

  /// Medium view body (600-840dp), optional (falls back to compact or master-detail)
  final Widget? mediumBody;

  /// Master pane widget (e.g. host device list) for expanded master-detail (>840dp)
  final Widget? masterPane;

  /// Detail pane widget (e.g. terminal console / live viewport stream) for expanded (>840dp)
  final Widget? detailPane;

  /// Master pane fixed width or ratio (default: 340.0)
  final double masterPaneWidth;

  /// Floating action button if any
  final Widget? floatingActionButton;

  /// Active host name for sidebar status display
  final String? activeHostName;

  /// Quick action callbacks
  final VoidCallback? onQuickWol;
  final VoidCallback? onTriggerPanic;

  const AdaptiveLayout({
    super.key,
    required this.navItems,
    required this.selectedIndex,
    required this.onIndexChanged,
    this.appBar,
    required this.compactBody,
    this.mediumBody,
    this.masterPane,
    this.detailPane,
    this.masterPaneWidth = 340.0,
    this.floatingActionButton,
    this.activeHostName,
    this.onQuickWol,
    this.onTriggerPanic,
  });

  @override
  Widget build(BuildContext context) {
    // 1. Utilize MediaQuery for system insets, text scaling, and safe area metrics
    final mediaQuery = MediaQuery.of(context);
    final clampedScaler = FluidSize.clampedTextScaler(context);

    return MediaQuery(
      data: mediaQuery.copyWith(textScaler: clampedScaler),
      child: Scaffold(
        backgroundColor: CyberColors.background,
        appBar: appBar,
        floatingActionButton: floatingActionButton,
        // 2. Utilize LayoutBuilder for precise boundary constraints and breakpoint dispatch
        body: LayoutBuilder(
          builder: (context, constraints) {
            final double maxWidth = constraints.maxWidth;
            final AdaptiveTier tier;

            if (maxWidth < 600.0) {
              tier = AdaptiveTier.compact;
            } else if (maxWidth <= 840.0) {
              tier = AdaptiveTier.medium;
            } else {
              tier = AdaptiveTier.expanded;
            }

            switch (tier) {
              // -------------------------------------------------------------
              // COMPACT (<600dp): Tabbed Mobile View + Floating Bottom Dock
              // -------------------------------------------------------------
              case AdaptiveTier.compact:
                return Stack(
                  children: [
                    // Main tabbed body
                    Positioned.fill(
                      child: compactBody,
                    ),

                    // Floating Samsung Pill Bottom Dock (Avoids overflow via Stack)
                    Positioned(
                      left: 0,
                      right: 0,
                      bottom: 0,
                      child: SamsungPillNavBar(
                        selectedIndex: selectedIndex,
                        onTabSelected: onIndexChanged,
                        items: navItems.map((item) => PillNavItem(
                          icon: item.icon,
                          activeIcon: item.activeIcon,
                          label: item.label,
                        )).toList(),
                      ),
                    ),
                  ],
                );

              // -------------------------------------------------------------
              // MEDIUM (600 - 840dp): Rail Sidebar + Flexible Body
              // -------------------------------------------------------------
              case AdaptiveTier.medium:
                return Row(
                  children: [
                    // Compact 72dp Rail Sidebar
                    ResponsiveSidebar(
                      selectedIndex: selectedIndex,
                      onDestinationSelected: onIndexChanged,
                      destinations: navItems,
                      isCompactRail: true,
                      onQuickWol: onQuickWol,
                      onTriggerPanic: onTriggerPanic,
                      activeHostName: activeHostName,
                    ),

                    // Content Area (mediumBody or master-detail split if space allows)
                    Expanded(
                      child: mediumBody ?? (masterPane != null && detailPane != null && maxWidth > 720
                          ? Row(
                              children: [
                                SizedBox(
                                  width: 280,
                                  child: masterPane!,
                                ),
                                const VerticalDivider(
                                  width: 1,
                                  thickness: 1,
                                  color: Color(0x3300F0FF),
                                ),
                                Expanded(child: detailPane!),
                              ],
                            )
                          : compactBody),
                    ),
                  ],
                );

              // -------------------------------------------------------------
              // EXPANDED (>840dp): Full Master-Detail (List-Console) + Sidebar
              // -------------------------------------------------------------
              case AdaptiveTier.expanded:
                return Row(
                  children: [
                    // Full 240dp Cyber Responsive Sidebar
                    ResponsiveSidebar(
                      selectedIndex: selectedIndex,
                      onDestinationSelected: onIndexChanged,
                      destinations: navItems,
                      isCompactRail: false,
                      onQuickWol: onQuickWol,
                      onTriggerPanic: onTriggerPanic,
                      activeHostName: activeHostName,
                    ),

                    // Master-Detail Split Screen Area (Zero overflow with Expanded)
                    Expanded(
                      child: Row(
                        children: [
                          // Master Pane (Device Fleet List)
                          if (masterPane != null)
                            SizedBox(
                              width: masterPaneWidth,
                              height: double.infinity,
                              child: Container(
                                decoration: const BoxDecoration(
                                  color: Color(0xFF070E1C),
                                  border: Border(
                                    right: BorderSide(
                                      color: Color(0x3300F0FF),
                                      width: 1.0,
                                    ),
                                  ),
                                ),
                                child: masterPane!,
                              ),
                            ),

                          // Detail Pane (Interactive Terminal Console & Live Stream)
                          Expanded(
                            child: detailPane != null
                                ? detailPane!
                                : compactBody,
                          ),
                        ],
                      ),
                    ),
                  ],
                );
            }
          },
        ),
      ),
    );
  }
}

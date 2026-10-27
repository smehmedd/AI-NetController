import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'glass_theme.dart';

/// Item descriptor for navigation tabs in the glass pill
class GlassNavItem {
  final IconData icon;
  final String label;

  const GlassNavItem({
    required this.icon,
    required this.label,
  });
}

/// ==============================================================================
/// CST Capstone: Samsung One UI 6 & VisionOS Floating Glass Pill Navigation
/// ==============================================================================
/// Floats 24dp above screen bottom with a high-diffusion frosted acrylic surface
/// (`sigma: 28`) and a spring-driven fluid sliding capsule indicator that
/// expands the selected label while keeping inactive items as minimalist icons.
class GlassPillNav extends StatefulWidget {
  final int currentIndex;
  final ValueChanged<int> onTabSelected;
  final List<GlassNavItem> items;

  const GlassPillNav({
    super.key,
    required this.currentIndex,
    required this.onTabSelected,
    this.items = const [
      GlassNavItem(icon: Icons.dns_rounded, label: 'Устройства'),
      GlassNavItem(icon: Icons.terminal_rounded, label: 'Конзола'),
      GlassNavItem(icon: Icons.tune_rounded, label: 'Настройки'),
    ],
  });

  @override
  State<GlassPillNav> createState() => _GlassPillNavState();
}

class _GlassPillNavState extends State<GlassPillNav> {
  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.bottomCenter,
      child: Padding(
        padding: const EdgeInsets.only(bottom: 24.0, left: 24.0, right: 24.0),
        child: Container(
          decoration: const BoxDecoration(
            borderRadius: BorderRadius.all(Radius.circular(32.0)),
            boxShadow: GlassTheme.dockShadow,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(32.0),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 28.0, sigmaY: 28.0),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 8.0),
                decoration: BoxDecoration(
                  color: const Color(0xA60F172A), // rgba(15, 23, 42, 0.65)
                  borderRadius: BorderRadius.circular(32.0),
                  border: Border.all(
                    color: const Color(0x24FFFFFF), // 0.5px white specular rim
                    width: 0.6,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: List.generate(widget.items.length, (index) {
                    final item = widget.items[index];
                    final isSelected = widget.currentIndex == index;

                    return _PillTabItem(
                      item: item,
                      isSelected: isSelected,
                      onTap: () {
                        if (!isSelected) {
                          // HapticFeedback removed for smoothness
                          widget.onTabSelected(index);
                        }
                      },
                    );
                  }),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// An individual animated tab item inside the floating glass pill with bubbly spring physics
class _PillTabItem extends StatefulWidget {
  final GlassNavItem item;
  final bool isSelected;
  final VoidCallback onTap;

  const _PillTabItem({
    required this.item,
    required this.isSelected,
    required this.onTap,
  });

  @override
  State<_PillTabItem> createState() => _PillTabItemState();
}

class _PillTabItemState extends State<_PillTabItem>
    with SingleTickerProviderStateMixin {
  late AnimationController _scaleController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 180),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.88).animate(
      CurvedAnimation(
        parent: _scaleController,
        curve: Curves.easeOutCubic,
        reverseCurve: Curves.elasticOut,
      ),
    );
  }

  @override
  void dispose() {
    _scaleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isSelected = widget.isSelected;
    final item = widget.item;

    return GestureDetector(
      onTapDown: (_) => _scaleController.forward(),
      onTapUp: (_) => _scaleController.reverse(),
      onTapCancel: () => _scaleController.reverse(),
      onTap: () {
        // HapticFeedback removed for smoothness
        widget.onTap();
      },
      behavior: HitTestBehavior.opaque,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 280),
          curve: GlassTheme.snappyCurve,
          margin: const EdgeInsets.symmetric(horizontal: 4.0),
          padding: EdgeInsets.symmetric(
            horizontal: isSelected ? 16.0 : 12.0,
            vertical: 10.0,
          ),
          decoration: BoxDecoration(
            color: isSelected
                ? GlassTheme.accentIce.withValues(alpha: 0.18)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(24.0),
            border: Border.all(
              color: isSelected
                  ? GlassTheme.accentIce.withValues(alpha: 0.40)
                  : Colors.transparent,
              width: 0.9,
            ),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: GlassTheme.accentIce.withValues(alpha: 0.20),
                      blurRadius: 18,
                      offset: const Offset(0, 3),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                item.icon,
                size: 20.0,
                color: isSelected
                    ? GlassTheme.accentIce
                    : GlassTheme.textTertiary,
              ),
              if (isSelected) ...[
                const SizedBox(width: 8.0),
                AnimatedOpacity(
                  opacity: isSelected ? 1.0 : 0.0,
                  duration: const Duration(milliseconds: 200),
                  child: Text(
                    item.label,
                    style: GlassTheme.labelMedium.copyWith(
                      color: GlassTheme.accentIce,
                      fontSize: 13.0,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

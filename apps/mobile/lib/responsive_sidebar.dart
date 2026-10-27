import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'fluid_theme.dart';

/// Navigation item model for the sidebar and dock
class SidebarNavItem {
  final String label;
  final IconData icon;
  final IconData activeIcon;
  final String? badge;

  const SidebarNavItem({
    required this.label,
    required this.icon,
    required this.activeIcon,
    this.badge,
  });
}

/// Cybernetic Responsive Sidebar for tablets and desktops (>840dp / 600-840dp rail)
class ResponsiveSidebar extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onDestinationSelected;
  final List<SidebarNavItem> destinations;
  final bool isCompactRail; // true for 600-840dp medium tier
  final VoidCallback? onQuickWol;
  final VoidCallback? onTriggerPanic;
  final String? activeHostName;
  final bool isConnected;

  const ResponsiveSidebar({
    super.key,
    required this.selectedIndex,
    required this.onDestinationSelected,
    required this.destinations,
    this.isCompactRail = false,
    this.onQuickWol,
    this.onTriggerPanic,
    this.activeHostName,
    this.isConnected = true,
  });

  @override
  Widget build(BuildContext context) {
    final double width = isCompactRail ? 72.0 : 240.0;

    return Container(
      width: width,
      height: double.infinity,
      decoration: BoxDecoration(
        color: const Color(0xFF050A14),
        border: Border(
          right: BorderSide(
            color: NeonColors.cyan.withValues(alpha: 0.2),
            width: 1.0,
          ),
        ),
      ),
      child: Column(
        children: [
          // Sidebar Header / Brand Logo
          Container(
            height: 72,
            padding: EdgeInsets.symmetric(horizontal: isCompactRail ? 12 : 16),
            alignment: Alignment.centerLeft,
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(
                  color: NeonColors.cyan.withValues(alpha: 0.15),
                ),
              ),
            ),
            child: Row(
              mainAxisAlignment: isCompactRail
                  ? MainAxisAlignment.center
                  : MainAxisAlignment.start,
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: NeonColors.cyan.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                        color: NeonColors.cyan.withValues(alpha: 0.3)),
                  ),
                  child: Icon(Icons.radar, color: NeonColors.cyan, size: 20),
                ),
                if (!isCompactRail) ...[
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          'CST CAPSTONE',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.8,
                            fontFamily: 'monospace',
                          ),
                        ),
                        Text(
                          isConnected ? 'DAEMON SYNCED' : 'STANDBY MODE',
                          style: TextStyle(
                            color: isConnected
                                ? const Color(0xFF00FF88)
                                : Colors.amberAccent,
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.5,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),

          // Navigation items list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
              itemCount: destinations.length,
              itemBuilder: (context, index) {
                final item = destinations[index];
                final isSelected = index == selectedIndex;

                if (isCompactRail) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Tooltip(
                      message: item.label,
                      child: InkWell(
                        onTap: () {
                          // HapticFeedback removed for smoothness
                          onDestinationSelected(index);
                        },
                        borderRadius: BorderRadius.circular(14),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          height: 48,
                          decoration: BoxDecoration(
                            color: isSelected
                                ? NeonColors.cyan.withValues(alpha: 0.15)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: isSelected
                                  ? NeonColors.cyan.withValues(alpha: 0.4)
                                  : Colors.transparent,
                            ),
                          ),
                          child: Icon(
                            isSelected ? item.activeIcon : item.icon,
                            color:
                                isSelected ? NeonColors.cyan : Colors.white54,
                            size: 22,
                          ),
                        ),
                      ),
                    ),
                  );
                }

                return Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: InkWell(
                    onTap: () {
                      // HapticFeedback removed for smoothness
                      onDestinationSelected(index);
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? NeonColors.cyan.withValues(alpha: 0.12)
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected
                              ? NeonColors.cyan.withValues(alpha: 0.35)
                              : Colors.transparent,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            isSelected ? item.activeIcon : item.icon,
                            color:
                                isSelected ? NeonColors.cyan : Colors.white54,
                            size: 20,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              item.label,
                              style: TextStyle(
                                color:
                                    isSelected ? Colors.white : Colors.white60,
                                fontSize: 13,
                                fontWeight: isSelected
                                    ? FontWeight.w700
                                    : FontWeight.w500,
                              ),
                            ),
                          ),
                          if (item.badge != null)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: NeonColors.violet.withValues(alpha: 0.3),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                    color: NeonColors.violet
                                        .withValues(alpha: 0.5)),
                              ),
                              child: Text(
                                item.badge!,
                                style: TextStyle(
                                  color: NeonColors.violet,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'monospace',
                                ),
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

          // Target host quick glance widget (only full sidebar)
          if (!isCompactRail && activeHostName != null)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFF091222),
                borderRadius: BorderRadius.circular(12),
                border:
                    Border.all(color: NeonColors.cyan.withValues(alpha: 0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0xFF00FF88),
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Text(
                        'ACTIVE TARGET',
                        style: TextStyle(
                          color: Colors.white54,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    activeHostName!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'monospace',
                    ),
                  ),
                ],
              ),
            ),

          // Quick Action / Emergency Panic Buttons
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(
                  color: NeonColors.cyan.withValues(alpha: 0.15),
                ),
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (onQuickWol != null)
                  SizedBox(
                    width: double.infinity,
                    height: 38,
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: NeonColors.cyan,
                        side: BorderSide(
                            color: NeonColors.cyan.withValues(alpha: 0.4)),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                        padding: EdgeInsets.zero,
                      ),
                      onPressed: onQuickWol,
                      child: isCompactRail
                          ? const Icon(Icons.bolt, size: 18)
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: const [
                                Icon(Icons.bolt, size: 16),
                                SizedBox(width: 6),
                                Text(
                                  'Directed WoL',
                                  style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                    ),
                  ),
                if (onTriggerPanic != null) ...[
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    height: 38,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor:
                            Colors.redAccent.withValues(alpha: 0.2),
                        foregroundColor: Colors.redAccent,
                        elevation: 0,
                        side: BorderSide(
                            color: Colors.redAccent.withValues(alpha: 0.4)),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                        padding: EdgeInsets.zero,
                      ),
                      onPressed: onTriggerPanic,
                      child: isCompactRail
                          ? const Icon(Icons.security, size: 18)
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: const [
                                Icon(Icons.security, size: 16),
                                SizedBox(width: 6),
                                Text(
                                  'Panic: Kill Tasks',
                                  style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

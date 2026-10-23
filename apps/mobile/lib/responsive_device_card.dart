import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/material.dart';
import 'fluid_theme.dart';

// =====================================================================
// VECTOR NEON NODE BADGE (RESOLUTION-INDEPENDENT & ANTI-ALIASED)
// =====================================================================
class CyberNodeBadgePainter extends CustomPainter {
  final bool isOnline;
  final double pulsePhase;

  CyberNodeBadgePainter({required this.isOnline, this.pulsePhase = 0.0});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width / 2) - 2.0;

    final baseColor = isOnline ? CyberColors.primary : Colors.grey;

    // Outer cyber hexagon / ring with explicit sub-pixel anti-aliasing
    final ringPaint = Paint()
      ..color = baseColor.withValues(alpha: isOnline ? 0.35 : 0.15)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..isAntiAlias = true
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, ringPaint);

    if (isOnline) {
      // Outer glow pulse
      final glowPaint = Paint()
        ..color = CyberColors.primary
            .withValues(alpha: 0.15 + (math.sin(pulsePhase) * 0.1).abs())
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3.0
        ..isAntiAlias = true
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3.0);
      canvas.drawCircle(center, radius - 1, glowPaint);
    }

    // Inner solid core node
    final corePaint = Paint()
      ..color = isOnline ? CyberColors.primary : Colors.grey.shade600
      ..style = PaintingStyle.fill
      ..isAntiAlias = true;

    canvas.drawCircle(center, radius * 0.45, corePaint);
  }

  @override
  bool shouldRepaint(covariant CyberNodeBadgePainter oldDelegate) {
    return oldDelegate.isOnline != isOnline ||
        oldDelegate.pulsePhase != pulsePhase;
  }
}

// =====================================================================
// RESPONSIVE GLASSMORPHIC DEVICE CARD
// =====================================================================
// RESPONSIVE GLASSMORPHIC DEVICE CARD WITH BUBBLY SPRING PHYSICS
// =====================================================================
class ResponsiveDeviceCard extends StatefulWidget {
  final String id;
  final String name;
  final String ip;
  final String mac;
  final bool isOnline;
  final int cpuUsage;
  final int ramUsage;
  final bool isSelected;
  final VoidCallback? onTap;
  final VoidCallback? onWakeOnLan;
  final VoidCallback? onOpenStream;

  const ResponsiveDeviceCard({
    super.key,
    required this.id,
    required this.name,
    required this.ip,
    required this.mac,
    required this.isOnline,
    this.cpuUsage = 0,
    this.ramUsage = 0,
    this.isSelected = false,
    this.onTap,
    this.onWakeOnLan,
    this.onOpenStream,
  });

  @override
  State<ResponsiveDeviceCard> createState() => _ResponsiveDeviceCardState();
}

class _ResponsiveDeviceCardState extends State<ResponsiveDeviceCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _scaleController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 220),
    );

    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.94).animate(
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

  void _onTapDown(TapDownDetails details) {
    _scaleController.forward();
  }

  void _onTapUp(TapUpDetails details) {
    _scaleController.reverse();
  }

  void _onTapCancel() {
    _scaleController.reverse();
  }

  @override
  Widget build(BuildContext context) {
    final isOnline = widget.isOnline;
    final isSelected = widget.isSelected;

    return RepaintBoundary(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4.0),
        child: GestureDetector(
          onTapDown: _onTapDown,
          onTapUp: _onTapUp,
          onTapCancel: _onTapCancel,
          onTap: widget.onTap,
          child: ScaleTransition(
            scale: _scaleAnimation,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(18.0),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 14.0, sigmaY: 14.0),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  curve: Curves.easeOutCubic,
                  padding: const EdgeInsets.all(14.0),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? CyberColors.primary.withValues(alpha: 0.15)
                        : CyberColors.surfaceElevated.withValues(alpha: 0.70),
                    borderRadius: BorderRadius.circular(18.0),
                    border: Border.all(
                      color: isSelected
                          ? CyberColors.primary
                          : (isOnline
                              ? CyberColors.primary.withValues(alpha: 0.40)
                              : CyberColors.glassBorderIdle),
                      width: isSelected ? 2.0 : 1.0,
                    ),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color:
                                  CyberColors.primary.withValues(alpha: 0.35),
                              blurRadius: 18,
                              spreadRadius: 1,
                              offset: const Offset(0, 4),
                            ),
                          ]
                        : null,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Header Row: Node indicator, Name, IP & Online Tag
                      Row(
                        children: [
                          CustomPaint(
                            size: const Size(22, 22),
                            painter: CyberNodeBadgePainter(isOnline: isOnline),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  widget.name,
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: context.fluidFont(13),
                                    color: CyberColors.textPrimary,
                                    letterSpacing: 0.5,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${widget.ip} • ${isOnline ? "mDNS Active" : "Sleeping (WoL)"}',
                                  style: TextStyle(
                                    fontSize: context.fluidFont(11),
                                    color: isOnline
                                        ? CyberColors.primary
                                            .withValues(alpha: 0.85)
                                        : CyberColors.textSecondary,
                                    fontFamily: 'monospace',
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),

                          // Quick Action Buttons
                          if (isOnline && widget.onOpenStream != null)
                            IconButton(
                              tooltip: 'Open Live Stream',
                              icon:
                                  const Icon(Icons.videocam_rounded, size: 20),
                              color: CyberColors.primary,
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(
                                  minWidth: 36, minHeight: 36),
                              onPressed: widget.onOpenStream,
                            )
                          else if (!isOnline && widget.onWakeOnLan != null)
                            IconButton(
                              tooltip: 'Send Wake-on-LAN Magic Packet',
                              icon: const Icon(Icons.bolt_rounded, size: 20),
                              color: CyberColors.warning,
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(
                                  minWidth: 36, minHeight: 36),
                              onPressed: widget.onWakeOnLan,
                            ),
                        ],
                      ),

                      // Optional Telemetry Gauges when host is Online
                      if (isOnline) ...[
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(
                              child: _buildMiniTelemetryBar(
                                context: context,
                                label: 'CPU',
                                value: widget.cpuUsage,
                                color: widget.cpuUsage > 80
                                    ? CyberColors.accent
                                    : CyberColors.primary,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildMiniTelemetryBar(
                                context: context,
                                label: 'RAM',
                                value: widget.ramUsage,
                                color: widget.ramUsage > 85
                                    ? CyberColors.warning
                                    : CyberColors.secondary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMiniTelemetryBar({
    required BuildContext context,
    required String label,
    required int value,
    required Color color,
  }) {
    final clampedPercent = (value / 100.0).clamp(0.0, 1.0);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: context.fluidFont(9),
                fontWeight: FontWeight.bold,
                color: CyberColors.textSecondary,
                letterSpacing: 0.8,
              ),
            ),
            Text(
              '$value%',
              style: TextStyle(
                fontSize: context.fluidFont(9),
                fontFamily: 'monospace',
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 3),
        ClipRRect(
          borderRadius: BorderRadius.circular(3),
          child: Container(
            height: 4,
            width: double.infinity,
            color: Colors.white.withValues(alpha: 0.08),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: clampedPercent,
              child: Container(
                decoration: BoxDecoration(
                  color: color,
                  boxShadow: [
                    BoxShadow(
                      color: color.withValues(alpha: 0.6),
                      blurRadius: 4,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

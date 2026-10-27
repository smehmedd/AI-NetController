import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app_theme_tokens.dart';

/// Failsafe "Hold-to-Execute" Button with Animated Progress Ring & Tactile Haptics
/// ==============================================================================
/// Prevents catastrophic accidental clicks on destructive operations (Restart,
/// Sleep, Panic Kill All). Requires continuous press for 1.5s.
class HoldToConfirmButton extends StatefulWidget {
  final String label;
  final IconData icon;
  final VoidCallback onConfirmed;
  final VoidCallback? onCancelled;
  final Duration holdDuration;
  final Color accentColor;
  final double height;
  final double? width;
  final bool isDestructive;

  const HoldToConfirmButton({
    super.key,
    required this.label,
    required this.icon,
    required this.onConfirmed,
    this.onCancelled,
    this.holdDuration = const Duration(milliseconds: 1500),
    this.accentColor = AppThemeTokens.statusRed,
    this.height = 46.0,
    this.width,
    this.isDestructive = true,
  });

  @override
  State<HoldToConfirmButton> createState() => _HoldToConfirmButtonState();
}

class _HoldToConfirmButtonState extends State<HoldToConfirmButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _progressController;
  // _hapticTicker removed
  bool _isHolding = false;
  bool _isCompleted = false;

  @override
  void initState() {
    super.initState();
    _progressController = AnimationController(
      vsync: this,
      duration: widget.holdDuration,
    );

    _progressController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _handleCompleted();
      }
    });
  }

  void _startHolding() {
    if (_isCompleted) return;
    setState(() {
      _isHolding = true;
    });

    // HapticFeedback removed for smoothness
    _progressController.forward(from: 0.0);

    // Periodic tactile haptic tick every 180ms during active hold
    
    _hapticTicker = Timer.periodic(const Duration(milliseconds: 180), (_) {
      if (_isHolding && !_isCompleted) {
        // HapticFeedback removed for smoothness
      }
    });
  }

  void _cancelHolding() {
    if (_isCompleted) return;
    
    

    if (_isHolding) {
      setState(() {
        _isHolding = false;
      });
      _progressController.reverse();
      widget.onCancelled?.call();
    }
  }

  void _handleCompleted() {
    
    

    setState(() {
      _isCompleted = true;
      _isHolding = false;
    });

    // HapticFeedback removed for smoothness
    widget.onConfirmed();

    // Reset button state smoothly after feedback
    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) {
        setState(() {
          _isCompleted = false;
        });
        _progressController.reset();
      }
    });
  }

  @override
  void dispose() {
    
    _progressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final activeColor =
        widget.isDestructive ? AppThemeTokens.statusRed : widget.accentColor;

    return GestureDetector(
      onTapDown: (_) => _startHolding(),
      onTapUp: (_) => _cancelHolding(),
      onTapCancel: () => _cancelHolding(),
      child: AnimatedBuilder(
        animation: _progressController,
        builder: (context, child) {
          final progress = _progressController.value;
          // Bubbly scale animation: button grows slightly (1.0 -> 1.04) as hold fills
          final scale = 1.0 + (progress * 0.04) - (_isHolding ? 0.02 : 0.0);

          return Transform.scale(
            scale: scale,
            child: CustomPaint(
              painter: _RadialBorderPainter(
                progress: progress,
                color: activeColor,
                borderRadius: widget.height / 2,
                strokeWidth: 2.2,
              ),
              child: Container(
                height: widget.height,
                width: widget.width,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: _isHolding
                      ? activeColor.withValues(alpha: 0.20)
                      : AppThemeTokens.surfaceElevated.withValues(alpha: 0.9),
                  borderRadius: BorderRadius.circular(widget.height / 2),
                  border: Border.all(
                    color: _isHolding
                        ? activeColor.withValues(alpha: 0.5)
                        : Colors.white.withValues(alpha: 0.08),
                    width: 1.0,
                  ),
                  boxShadow: _isHolding
                      ? [
                          BoxShadow(
                            color: activeColor.withValues(alpha: 0.35),
                            blurRadius: 16,
                            spreadRadius: 2,
                          )
                        ]
                      : [],
                ),
                child: Row(
                  mainAxisSize: widget.width != null
                      ? MainAxisSize.max
                      : MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      widget.icon,
                      size: 18,
                      color:
                          _isHolding ? activeColor : AppThemeTokens.textPrimary,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _isCompleted
                          ? 'Потвърдено'
                          : (_isHolding
                              ? 'Задръжте... ${(progress * 100).toInt()}%'
                              : widget.label),
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: _isHolding
                            ? activeColor
                            : AppThemeTokens.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// CustomPainter that renders a continuous rounded-rect progress ring
class _RadialBorderPainter extends CustomPainter {
  final double progress;
  final Color color;
  final double borderRadius;
  final double strokeWidth;

  _RadialBorderPainter({
    required this.progress,
    required this.color,
    required this.borderRadius,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (progress <= 0.0) return;

    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    final rrect = RRect.fromRectAndRadius(rect, Radius.circular(borderRadius));
    final fullPath = Path()..addRRect(rrect);

    final pMetric = fullPath.computeMetrics().firstOrNull;
    if (pMetric == null) return;

    final extractLength = pMetric.length * progress.clamp(0.0, 1.0);
    final extractedPath = pMetric.extractPath(0.0, extractLength);

    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawPath(extractedPath, paint);
  }

  @override
  bool shouldRepaint(covariant _RadialBorderPainter oldDelegate) {
    return oldDelegate.progress != progress || oldDelegate.color != color;
  }
}

import 'dart:ui';
import 'package:flutter/material.dart';
import 'glass_theme.dart';

/// ==============================================================================
/// CST Capstone: Reusable Liquid Glassmorphic Container
/// ==============================================================================
/// High-performance frosted acrylic wrapper ensuring strict [ClipRRect]
/// containment around [BackdropFilter] to prevent GPU shader bleed and preserve
/// 120 FPS render loops on modern mobile and desktop runtimes.
class GlassContainer extends StatelessWidget {
  final Widget child;
  final double? width;
  final double? height;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double borderRadius;
  final double blurSigma;
  final Color? backgroundColor;
  final Gradient? borderGradient;
  final Color? borderColor;
  final double borderWidth;
  final List<BoxShadow>? shadows;
  final VoidCallback? onTap;
  final bool isInteractive;
  final bool isSelected;
  final bool isOffline;

  const GlassContainer({
    super.key,
    required this.child,
    this.width,
    this.height,
    this.padding,
    this.margin,
    this.borderRadius = 20.0,
    this.blurSigma = 24.0,
    this.backgroundColor,
    this.borderGradient,
    this.borderColor,
    this.borderWidth = 1.0,
    this.shadows,
    this.onTap,
    this.isInteractive = false,
    this.isSelected = false,
    this.isOffline = false,
  });

  @override
  Widget build(BuildContext context) {
    // 1. Resolve Background Color
    final Color effectiveBg = backgroundColor ??
        (isOffline
            ? GlassTheme.glassOffline
            : (isSelected
                ? GlassTheme.glassElevated
                : GlassTheme.glassSurface));

    // 2. Resolve Border Gradient / Color
    final Gradient effectiveBorderGradient = borderGradient ??
        (isSelected
            ? GlassTheme.specularBorderActive
            : (isOffline
                ? const LinearGradient(
                    colors: [Color(0x0FFFFFFF), Color(0x03FFFFFF)],
                  )
                : GlassTheme.specularBorder));

    // 3. Resolve Box Shadows
    final List<BoxShadow> effectiveShadows = shadows ??
        (isSelected
            ? [
                BoxShadow(
                  color: GlassTheme.accentIce.withValues(alpha: 0.18),
                  blurRadius: 28,
                  offset: const Offset(0, 8),
                ),
                ...GlassTheme.glassShadow,
              ]
            : (isOffline ? [] : GlassTheme.glassShadow));

    final content = Container(
      width: width,
      height: height,
      padding: padding ?? const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: effectiveBg,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
      child: child,
    );

    // Specular border painted cleanly via custom decoration
    final glassCard = Container(
      margin: margin,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(borderRadius),
        boxShadow: effectiveShadows,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blurSigma, sigmaY: blurSigma),
          child: CustomPaint(
            foregroundPainter: _SpecularBorderPainter(
              borderRadius: borderRadius,
              borderWidth: borderWidth,
              gradient: effectiveBorderGradient,
              solidColor: borderColor,
            ),
            child: isInteractive || onTap != null
                ? Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(borderRadius),
                      splashColor: GlassTheme.accentIceDim,
                      highlightColor: GlassTheme.glassUltraLight,
                      onTap: onTap,
                      child: content,
                    ),
                  )
                : content,
          ),
        ),
      ),
    );

    return glassCard;
  }
}

/// Custom painter that draws a 0.5px - 1.0px delicate specular hairline
/// simulating overhead ambient light reflection on the bevel of the glass.
class _SpecularBorderPainter extends CustomPainter {
  final double borderRadius;
  final double borderWidth;
  final Gradient gradient;
  final Color? solidColor;

  _SpecularBorderPainter({
    required this.borderRadius,
    required this.borderWidth,
    required this.gradient,
    this.solidColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final rrect = RRect.fromRectAndRadius(
      rect.deflate(borderWidth / 2),
      Radius.circular(borderRadius),
    );

    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth;

    if (solidColor != null) {
      paint.color = solidColor!;
    } else {
      paint.shader = gradient.createShader(rect);
    }

    canvas.drawRRect(rrect, paint);
  }

  @override
  bool shouldRepaint(covariant _SpecularBorderPainter oldDelegate) {
    return oldDelegate.borderRadius != borderRadius ||
        oldDelegate.borderWidth != borderWidth ||
        oldDelegate.gradient != gradient ||
        oldDelegate.solidColor != solidColor;
  }
}

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'glass_theme.dart';
import 'glass_container.dart';

/// ==============================================================================
/// CST Capstone: Liquid Glassmorphic Command Console & Screen View
/// ==============================================================================
/// Ultra-refined console removing the ambiguous circular play button and
/// noisy debugging text, implementing:
/// - Conversational AI input bar with send trigger
/// - 4 symmetrical 1-tap quick action glass tiles with discreet amber safety dots
/// - Live desktop display viewport with clean overlay status pill [● На живо • 1080p]
/// - Isolated RepaintBoundary for 120 FPS high-refresh rendering
class ConsoleView extends StatefulWidget {
  final String hostName;
  final String hostIp;
  final bool isOnline;
  final ValueChanged<String>? onExecuteCommand;
  final VoidCallback? onRestartHost;
  final VoidCallback? onCheckUpdates;
  final VoidCallback? onLaunchBrowser;
  final VoidCallback? onToggleTelemetry;
  final VoidCallback? onToggleFullscreenStream;

  const ConsoleView({
    super.key,
    this.hostName = 'Лабораторен компютър 1',
    this.hostIp = '192.168.1.50',
    this.isOnline = true,
    this.onExecuteCommand,
    this.onRestartHost,
    this.onCheckUpdates,
    this.onLaunchBrowser,
    this.onToggleTelemetry,
    this.onToggleFullscreenStream,
  });

  @override
  State<ConsoleView> createState() => _ConsoleViewState();
}

class _ConsoleViewState extends State<ConsoleView> {
  final TextEditingController _promptController = TextEditingController();
  final ScrollController _terminalScrollController = ScrollController();
  final List<_TerminalMessage> _terminalLogs = [];
  bool _isExecuting = false;
  bool _showScrollDown = false;
  bool _isFullscreenStream = false;

  @override
  void initState() {
    super.initState();
    _terminalLogs.addAll([
      _TerminalMessage(
        text: 'CST Agentic OS Bridge v2.4 (Active Node: ${widget.hostName})',
        type: _LogType.info,
      ),
      _TerminalMessage(
        text: 'Link established via WebSocket [::ffff:${widget.hostIp}] • 16ms',
        type: _LogType.success,
      ),
      _TerminalMessage(
        text: 'System telemetry: CPU 24% | RAM 5.8/16.0 GB | GPU Intel Iris Xe',
        type: _LogType.info,
      ),
    ]);

    _terminalScrollController.addListener(() {
      if (_terminalScrollController.hasClients) {
        final isNearBottom = _terminalScrollController.offset >=
            _terminalScrollController.position.maxScrollExtent - 40;
        if (_showScrollDown == isNearBottom) {
          setState(() => _showScrollDown = !isNearBottom);
        }
      }
    });
  }

  @override
  void dispose() {
    _promptController.dispose();
    _terminalScrollController.dispose();
    super.dispose();
  }

  void _submitCommand() {
    final raw = _promptController.text.trim();
    if (raw.isEmpty || _isExecuting) return;

    HapticFeedback.lightImpact();
    setState(() {
      _terminalLogs.add(_TerminalMessage(text: '> $raw', type: _LogType.prompt));
      _isExecuting = true;
    });

    widget.onExecuteCommand?.call(raw);
    _promptController.clear();
    _scrollToBottom();

    // Simulated AI/OS response
    Timer(const Duration(milliseconds: 700), () {
      if (!mounted) return;
      setState(() {
        _isExecuting = false;
        if (raw.toLowerCase().contains('update') || raw.toLowerCase().contains('обнови')) {
          _terminalLogs.add(const _TerminalMessage(
            text: '[Windows Update] Всички системи са актуализирани до най-новата стабилна версия (KB5034441).',
            type: _LogType.success,
          ));
        } else if (raw.toLowerCase().contains('reboot') || raw.toLowerCase().contains('рестарт')) {
          _terminalLogs.add(const _TerminalMessage(
            text: '[Система] Изпратена заявка за планиран рестарт след 30 секунди...',
            type: _LogType.warning,
          ));
        } else {
          _terminalLogs.add(_TerminalMessage(
            text: '[Агент] Изпълнено успешно: "$raw"\nРезултат: Код за изход 0 (SUCCESS).',
            type: _LogType.info,
          ));
        }
      });
      _scrollToBottom();
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_terminalScrollController.hasClients) {
        _terminalScrollController.animateTo(
          _terminalScrollController.position.maxScrollExtent + 60,
          duration: GlassTheme.durationNormal,
          curve: GlassTheme.smoothCurve,
        );
      }
    });
  }

  void _copyTerminalLogs() {
    HapticFeedback.selectionClick();
    final allText = _terminalLogs.map((m) => m.text).join('\n');
    Clipboard.setData(ClipboardData(text: allText));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: GlassTheme.canvasSurface,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        content: const Text(
          'Терминалният лог е копиран в клипборда',
          style: GlassTheme.bodyMedium,
        ),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _handleHoldRestart() {
    HapticFeedback.heavyImpact();
    setState(() {
      _terminalLogs.add(const _TerminalMessage(
        text: '⚠ [СИСТЕМА] Потвърден рестарт на отдалечената машина.',
        type: _LogType.warning,
      ));
    });
    widget.onRestartHost?.call();
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            // 1. Top Header Capsule with Back trigger & machine status
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(widget.hostName, style: GlassTheme.titleLarge),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: GlassTheme.statusOnline,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              widget.hostIp,
                              style: GlassTheme.monoIpMac.copyWith(fontSize: 11.5),
                            ),
                          ],
                        ),
                      ],
                    ),

                    // Discreet Live Status Pill
                    GlassContainer(
                      borderRadius: 18,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      backgroundColor: GlassTheme.glassUltraLight,
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.wifi_tethering_rounded, size: 14, color: GlassTheme.statusOnline),
                          SizedBox(width: 6),
                          Text('Свързан', style: GlassTheme.labelSmall),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // 2. Conversational AI Bar (Section 3.2)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: GlassContainer(
                  borderRadius: 24,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  backgroundColor: GlassTheme.canvasDeep.withValues(alpha: 0.75),
                  borderColor: Colors.white12,
                  child: Row(
                    children: [
                      const Icon(
                        Icons.auto_awesome_rounded,
                        color: GlassTheme.accentAi,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: _promptController,
                          onSubmitted: (_) => _submitCommand(),
                          style: GlassTheme.bodyLarge,
                          decoration: InputDecoration(
                            hintText: 'Задай въпрос или команда към AI...',
                            hintStyle: GlassTheme.bodySmall.copyWith(color: GlassTheme.textTertiary),
                            border: InputBorder.none,
                            isDense: true,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Glowing Glass Send Button
                      InkWell(
                        borderRadius: BorderRadius.circular(20),
                        onTap: _submitCommand,
                        child: Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            color: _isExecuting
                                ? GlassTheme.accentAiDim
                                : GlassTheme.accentIce.withValues(alpha: 0.18),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: _isExecuting
                                  ? GlassTheme.accentAi.withValues(alpha: 0.4)
                                  : GlassTheme.accentIce.withValues(alpha: 0.4),
                              width: 0.8,
                            ),
                          ),
                          child: _isExecuting
                              ? const Center(
                                  child: SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: GlassTheme.accentAi,
                                    ),
                                  ),
                                )
                              : const Icon(
                                  Icons.arrow_upward_rounded,
                                  color: GlassTheme.accentIce,
                                  size: 20,
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // 3. Symmetrical 2x2 Quick-Action Glass Tiles (Section 3.2)
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              sliver: SliverGrid.count(
                crossAxisCount: 2,
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 2.2,
                children: [
                  _buildQuickActionTile(
                    title: 'Обновления',
                    icon: Icons.system_update_rounded,
                    onTap: () {
                      _promptController.text = 'winget upgrade --all';
                      _submitCommand();
                      widget.onCheckUpdates?.call();
                    },
                  ),
                  _buildQuickActionTile(
                    title: 'Рестартирай',
                    icon: Icons.restart_alt_rounded,
                    hasSafetyAmber: true,
                    onTap: _handleHoldRestart,
                  ),
                  _buildQuickActionTile(
                    title: 'Браузър',
                    icon: Icons.public_rounded,
                    onTap: () {
                      _promptController.text = 'start msedge.exe https://google.com';
                      _submitCommand();
                      widget.onLaunchBrowser?.call();
                    },
                  ),
                  _buildQuickActionTile(
                    title: 'Телеметрия',
                    icon: Icons.analytics_outlined,
                    onTap: () {
                      _promptController.text = 'systeminfo';
                      _submitCommand();
                      widget.onToggleTelemetry?.call();
                    },
                  ),
                ],
              ),
            ),

            // 4. Live Display Viewport (Section 3.2 & Directive 2 RepaintBoundary)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: RepaintBoundary(
                  child: GlassContainer(
                    borderRadius: 20,
                    padding: EdgeInsets.zero,
                    backgroundColor: GlassTheme.canvasDeep,
                    child: Column(
                      children: [
                        // Live Viewport Screen Frame
                        ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                          child: Container(
                            height: _isFullscreenStream ? 320 : 180,
                            width: double.infinity,
                            color: const Color(0xFF070B14),
                            child: Stack(
                              children: [
                                // Mock live desktop background with grid
                                Positioned.fill(
                                  child: CustomPaint(
                                    painter: _DesktopPreviewGridPainter(),
                                  ),
                                ),

                                // Top Overlay Bar: Status pill & controls
                                Positioned(
                                  top: 12,
                                  left: 12,
                                  right: 12,
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      // Discreet status pill: [● На живо • 1080p]
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                        decoration: BoxDecoration(
                                          color: Colors.black54,
                                          borderRadius: BorderRadius.circular(14),
                                          border: Border.all(color: Colors.white12),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Container(
                                              width: 6,
                                              height: 6,
                                              decoration: const BoxDecoration(
                                                shape: BoxShape.circle,
                                                color: GlassTheme.statusOnline,
                                              ),
                                            ),
                                            const SizedBox(width: 6),
                                            const Text(
                                              'На живо • 1080p',
                                              style: TextStyle(
                                                fontFamily: 'Inter',
                                                fontSize: 11,
                                                fontWeight: FontWeight.w500,
                                                color: Colors.white,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),

                                      // Minimal triggers for Fullscreen & Switching
                                      Row(
                                        children: [
                                          _buildStreamControlBtn(
                                            icon: Icons.monitor_rounded,
                                            tooltip: 'Смяна на дисплей',
                                            onTap: () {
                                              HapticFeedback.lightImpact();
                                            },
                                          ),
                                          const SizedBox(width: 6),
                                          _buildStreamControlBtn(
                                            icon: _isFullscreenStream
                                                ? Icons.fullscreen_exit_rounded
                                                : Icons.fullscreen_rounded,
                                            tooltip: 'Цял екран',
                                            onTap: () {
                                              setState(() => _isFullscreenStream = !_isFullscreenStream);
                                              widget.onToggleFullscreenStream?.call();
                                            },
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // 5. Rich Terminal Console (Directive 2 RepaintBoundary)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 96),
                child: RepaintBoundary(
                  child: GlassContainer(
                    borderRadius: 20,
                    padding: const EdgeInsets.all(16),
                    backgroundColor: GlassTheme.canvasDeep.withValues(alpha: 0.92),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Terminal Header
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.terminal_rounded, size: 16, color: GlassTheme.textTertiary),
                                const SizedBox(width: 8),
                                Text(
                                  'Терминален изход',
                                  style: GlassTheme.labelSmall.copyWith(color: GlassTheme.textSecondary),
                                ),
                              ],
                            ),
                            InkWell(
                              borderRadius: BorderRadius.circular(8),
                              onTap: _copyTerminalLogs,
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                child: Row(
                                  children: [
                                    const Icon(Icons.copy_rounded, size: 12, color: GlassTheme.textTertiary),
                                    const SizedBox(width: 4),
                                    Text('Копирай', style: GlassTheme.bodySmall.copyWith(fontSize: 11)),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        const Divider(color: Colors.white10, height: 1),
                        const SizedBox(height: 10),

                        // Terminal Log Stream
                        SizedBox(
                          height: 160,
                          child: Stack(
                            children: [
                              ListView.builder(
                                controller: _terminalScrollController,
                                physics: const ClampingScrollPhysics(),
                                itemCount: _terminalLogs.length,
                                itemBuilder: (ctx, i) {
                                  final msg = _terminalLogs[i];
                                  Color textColor = GlassTheme.monoTerminal.color!;
                                  if (msg.type == _LogType.prompt) textColor = GlassTheme.accentIce;
                                  if (msg.type == _LogType.success) textColor = GlassTheme.statusOnline;
                                  if (msg.type == _LogType.warning) textColor = GlassTheme.statusPending;

                                  return Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 2),
                                    child: SelectableText(
                                      msg.text,
                                      style: GlassTheme.monoTerminal.copyWith(color: textColor),
                                    ),
                                  );
                                },
                              ),

                              // Floating Auto-Scroll Down Indicator
                              if (_showScrollDown)
                                Positioned(
                                  bottom: 8,
                                  right: 8,
                                  child: InkWell(
                                    borderRadius: BorderRadius.circular(16),
                                    onTap: _scrollToBottom,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                      decoration: BoxDecoration(
                                        color: GlassTheme.canvasSurface,
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(color: GlassTheme.accentIce.withValues(alpha: 0.3)),
                                      ),
                                      child: const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.arrow_downward_rounded, size: 12, color: GlassTheme.accentIce),
                                          SizedBox(width: 4),
                                          Text('↓ Най-нови', style: TextStyle(fontFamily: 'Inter', fontSize: 10, color: GlassTheme.accentIce)),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActionTile({
    required String title,
    required IconData icon,
    required VoidCallback onTap,
    bool hasSafetyAmber = false,
  }) {
    return GlassContainer(
      borderRadius: 18,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      backgroundColor: GlassTheme.glassSurface,
      isInteractive: true,
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: GlassTheme.glassUltraLight,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.white10),
            ),
            child: Icon(icon, size: 16, color: GlassTheme.accentIce),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              title,
              style: GlassTheme.labelMedium.copyWith(fontSize: 13),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (hasSafetyAmber)
            Container(
              width: 6,
              height: 6,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: GlassTheme.statusPending,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildStreamControlBtn({
    required IconData icon,
    required String tooltip,
    required VoidCallback onTap,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Container(
        width: 30,
        height: 30,
        decoration: BoxDecoration(
          color: Colors.black54,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white12),
        ),
        child: Icon(icon, color: Colors.white, size: 16),
      ),
    );
  }
}

enum _LogType { info, prompt, success, warning }

class _TerminalMessage {
  final String text;
  final _LogType type;
  const _TerminalMessage({required this.text, this.type = _LogType.info});
}

/// Custom painter rendering a subtle desktop perspective grid
class _DesktopPreviewGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.04)
      ..strokeWidth = 1.0;

    const step = 24.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

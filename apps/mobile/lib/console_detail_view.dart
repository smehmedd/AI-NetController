import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app_theme_tokens.dart';
import 'hold_to_confirm_button.dart';
import 'binary_protocol.dart';

/// CST Capstone Console Detail View
/// ============================================================================
/// Features:
/// - Reconciled execution UX (Clean prompt bar + 2x2 Quick Action Grid)
/// - Failsafe HoldToConfirmButton for destructive actions (Restart, Sleep, Panic)
/// - ANSI Escape Sequence color parser & Rich Monospace Terminal
/// - Floating "↓ Нови данни" auto-scroll restoration indicator
/// - One-tap terminal output copy to clipboard
class ConsoleDetailView extends StatefulWidget {
  final String hostName;
  final String hostIp;
  final bool isOnline;
  final Stream<ShellResult> shellStream;
  final Stream<HitlApprovalEvent>? hitlStream;
  final TelemetryData? telemetry;
  final ValueChanged<String> onExecuteCommand;
  final ValueChanged<String>? onSendAudioAction;
  final VoidCallback? onSyncClipboard;
  final VoidCallback? onRestartHost;
  final VoidCallback? onSleepHost;
  final VoidCallback? onPanicKillAll;

  const ConsoleDetailView({
    super.key,
    required this.hostName,
    required this.hostIp,
    this.isOnline = true,
    required this.shellStream,
    this.hitlStream,
    this.telemetry,
    required this.onExecuteCommand,
    this.onSendAudioAction,
    this.onSyncClipboard,
    this.onRestartHost,
    this.onSleepHost,
    this.onPanicKillAll,
  });

  @override
  State<ConsoleDetailView> createState() => _ConsoleDetailViewState();
}

class _ConsoleDetailViewState extends State<ConsoleDetailView> {
  final TextEditingController _promptController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<_ConsoleLogItem> _logs = [];

  StreamSubscription<ShellResult>? _shellSub;
  StreamSubscription<HitlApprovalEvent>? _hitlSub;

  bool _showScrollToBottom = false;
  bool _isAIEvaluating = false;

  @override
  void initState() {
    super.initState();

    // Initial greeting log
    _logs.add(
      _ConsoleLogItem(
        command: 'cst-agent.exe --listen 8765',
        output: 'CST Autonomous Bridge Connected.\nHost: ${widget.hostName} (${widget.hostIp})\nProtocol: CST Binary Wire v2 (0xC5, 0x71)',
        isSuccess: true,
        timestamp: DateTime.now(),
      ),
    );

    _shellSub = widget.shellStream.listen((result) {
      if (!mounted) return;
      setState(() {
        _isAIEvaluating = false;
        _logs.add(_ConsoleLogItem(
          command: result.command,
          output: result.output,
          isSuccess: result.isSuccess,
          timestamp: DateTime.now(),
        ));
      });
      _handleAutoScroll();
    });

    _hitlSub = widget.hitlStream?.listen((event) {
      if (!mounted) return;
      _showHitlSecurityDialog(event);
    });

    _scrollController.addListener(_onScrollChanged);
  }

  void _onScrollChanged() {
    if (!_scrollController.hasClients) return;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.offset;
    final isScrolledUp = (maxScroll - currentScroll) > 100;

    if (isScrolledUp != _showScrollToBottom) {
      setState(() {
        _showScrollToBottom = isScrolledUp;
      });
    }
  }

  void _handleAutoScroll() {
    if (!_showScrollToBottom && _scrollController.hasClients) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: AppThemeTokens.normalAnim,
            curve: Curves.easeOut,
          );
        }
      });
    }
  }

  void _scrollToBottomNow() {
    // HapticFeedback removed for smoothness
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: AppThemeTokens.normalAnim,
        curve: Curves.easeOut,
      );
      setState(() => _showScrollToBottom = false);
    }
  }

  void _dispatchCommand(String cmd) {
    final clean = cmd.trim();
    if (clean.isEmpty) return;

    // HapticFeedback removed for smoothness
    if (clean.startsWith('AI:') || clean.contains('ollama') || clean.contains('deepseek')) {
      setState(() => _isAIEvaluating = true);
    }

    widget.onExecuteCommand(clean);
    _promptController.clear();
  }

  void _showHitlSecurityDialog(HitlApprovalEvent event) {
    // HapticFeedback removed for smoothness
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppThemeTokens.surfaceElevated,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppThemeTokens.statusRed, width: 2),
        ),
        title: Row(
          children: const [
            Icon(Icons.shield_rounded, color: AppThemeTokens.statusRed, size: 24),
            SizedBox(width: 10),
            Text('HITL Защитна намеса', style: AppThemeTokens.titleMedium),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Засечена е команда с висок риск, изискваща биометрично одобрение от оператор:',
              style: AppThemeTokens.bodySmall,
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppThemeTokens.surfaceMuted,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppThemeTokens.statusRed.withValues(alpha: 0.3)),
              ),
              child: SelectableText(
                event.command,
                style: const TextStyle(
                  fontFamily: 'JetBrains Mono',
                  fontSize: 12,
                  color: AppThemeTokens.statusRed,
                ),
              ),
            ),
            const SizedBox(height: 10),
            Text(
              'Причина: ${event.reason}',
              style: const TextStyle(fontFamily: 'Inter', fontSize: 12, color: AppThemeTokens.textSecondary),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Откажи', style: TextStyle(color: AppThemeTokens.textSecondary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppThemeTokens.statusRed,
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              Navigator.pop(ctx);
              _dispatchCommand('cst:hitl-approve:${event.approvalId}');
            },
            child: const Text('Потвърди с биометрия'),
          ),
        ],
      ),
    );
  }

  void _copyToClipboard(String text) {
    Clipboard.setData(ClipboardData(text: text));
    // HapticFeedback removed for smoothness
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        backgroundColor: AppThemeTokens.surfaceElevated,
        content: Text('Копирано в клипборда', style: TextStyle(color: AppThemeTokens.primaryCyan)),
        duration: Duration(seconds: 1),
      ),
    );
  }

  @override
  void dispose() {
    _shellSub?.cancel();
    _hitlSub?.cancel();
    _scrollController.dispose();
    _promptController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          Column(
            children: [
              // 1. Header & Live Telemetry Capsule
              _buildHeaderBar(),

              // 2. Clean Conversational Prompt Input Bar (Section 2.2)
              _buildPromptInputBar(),

              // 3. 2x2 Quick Action Grid (Section 2.2)
              _buildQuickActionGrid(),

              // 4. Destructive Failsafe Hold-to-Confirm Strip (Section 4.1)
              _buildDestructiveActionStrip(),

              // 5. Rich Markdown / ANSI Terminal Console (Section 4.2)
              Expanded(
                child: Container(
                  margin: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                  decoration: BoxDecoration(
                    color: AppThemeTokens.surfaceMuted.withValues(alpha: 0.95),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: ListView.builder(
                      controller: _scrollController,
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.all(14),
                      itemCount: _logs.length,
                      itemBuilder: (context, index) {
                        final log = _logs[index];
                        return _buildLogItem(log);
                      },
                    ),
                  ),
                ),
              ),
            ],
          ),

          // 6. Floating "↓ Нови данни" Indicator (Section 4.2)
          if (_showScrollToBottom)
            Positioned(
              bottom: 24,
              right: 28,
              child: GestureDetector(
                onTap: _scrollToBottomNow,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: AppThemeTokens.capsuleDecoration(
                    borderColor: AppThemeTokens.primaryCyan,
                    fillColor: AppThemeTokens.surfaceElevated,
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Icon(Icons.arrow_downward_rounded, size: 16, color: AppThemeTokens.primaryCyan),
                      SizedBox(width: 6),
                      Text(
                        'Нови данни',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppThemeTokens.primaryCyan,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildHeaderBar() {
    final cpu = widget.telemetry?.cpuPercent.toStringAsFixed(1) ?? '18.4';
    final ram = widget.telemetry?.ramPercent.toStringAsFixed(1) ?? '44.0';

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(widget.hostName, style: AppThemeTokens.titleMedium),
                Text(widget.hostIp, style: AppThemeTokens.monoIpMac),
              ],
            ),
          ),
          if (_isAIEvaluating)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppThemeTokens.agentViolet.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppThemeTokens.agentViolet),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  SizedBox(
                    width: 10,
                    height: 10,
                    child: CircularProgressIndicator(
                      strokeWidth: 1.5,
                      color: AppThemeTokens.agentViolet,
                    ),
                  ),
                  SizedBox(width: 6),
                  Text(
                    'AI мисли...',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppThemeTokens.agentViolet,
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: AppThemeTokens.capsuleDecoration(),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('CPU: $cpu%', style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11, color: AppThemeTokens.primaryCyan)),
                const SizedBox(width: 8),
                Text('RAM: $ram%', style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11, color: AppThemeTokens.textSecondary)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPromptInputBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
        decoration: BoxDecoration(
          color: AppThemeTokens.surfaceElevated,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppThemeTokens.cyanDim),
        ),
        child: Row(
          children: [
            const Icon(Icons.terminal_rounded, color: AppThemeTokens.primaryCyan, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: _promptController,
                style: const TextStyle(
                  fontFamily: 'JetBrains Mono',
                  fontSize: 13,
                  color: AppThemeTokens.textPrimary,
                ),
                decoration: const InputDecoration(
                  hintText: 'Въведете команда или AI запитване...',
                  hintStyle: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: AppThemeTokens.textDisabled,
                  ),
                  border: InputBorder.none,
                  isDense: true,
                ),
                onSubmitted: _dispatchCommand,
              ),
            ),
            IconButton(
              icon: const Icon(Icons.send_rounded, color: AppThemeTokens.primaryCyan, size: 20),
              tooltip: 'Изпълни команда',
              onPressed: () => _dispatchCommand(_promptController.text),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActionGrid() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final width = (constraints.maxWidth - 8) / 2;
          return Column(
            children: [
              Row(
                children: [
                  _buildQuickActionTile('Информация за системата', 'systeminfo', Icons.info_outline_rounded, AppThemeTokens.primaryCyan, width),
                  const SizedBox(width: 8),
                  _buildQuickActionTile('Мрежов статус', 'ipconfig /all', Icons.network_check_rounded, AppThemeTokens.primaryCyan, width),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  _buildQuickActionTile('Файлова структура', 'dir C:\\', Icons.folder_open_rounded, AppThemeTokens.primaryCyan, width),
                  const SizedBox(width: 8),
                  _buildQuickActionTile('AI Диагностика', 'ollama run deepseek-r1:14b "Summarize host health and active tasks"', Icons.auto_awesome_rounded, AppThemeTokens.agentViolet, width, isAI: true),
                ],
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildQuickActionTile(String label, String command, IconData icon, Color color, double width, {bool isAI = false}) {
    return SizedBox(
      width: width,
      child: InkWell(
        onTap: () => _dispatchCommand(command),
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: isAI ? AppThemeTokens.agentViolet.withValues(alpha: 0.12) : AppThemeTokens.surface.withValues(alpha: 0.6),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isAI ? AppThemeTokens.agentViolet.withValues(alpha: 0.4) : Colors.white.withValues(alpha: 0.06),
            ),
          ),
          child: Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: isAI ? AppThemeTokens.agentViolet : AppThemeTokens.textPrimary,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDestructiveActionStrip() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            HoldToConfirmButton(
              label: 'Рестарт',
              icon: Icons.restart_alt_rounded,
              accentColor: AppThemeTokens.statusAmber,
              isDestructive: false,
              height: 36,
              onConfirmed: () {
                widget.onRestartHost?.call();
                _dispatchCommand('shutdown /r /t 0');
              },
            ),
            const SizedBox(width: 8),
            HoldToConfirmButton(
              label: 'Приспиване',
              icon: Icons.bedtime_rounded,
              accentColor: AppThemeTokens.statusAmber,
              isDestructive: false,
              height: 36,
              onConfirmed: () {
                widget.onSleepHost?.call();
                _dispatchCommand('rundll32.exe powrprof.dll,SetSuspendState 0,1,0');
              },
            ),
            const SizedBox(width: 8),
            HoldToConfirmButton(
              label: 'Panic: Спри всички процеси',
              icon: Icons.cancel_rounded,
              accentColor: AppThemeTokens.statusRed,
              isDestructive: true,
              height: 36,
              onConfirmed: () {
                widget.onPanicKillAll?.call();
                _dispatchCommand('taskkill /f /fi "status eq running"');
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLogItem(_ConsoleLogItem log) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Command header with copy trigger
          Row(
            children: [
              Text(
                '> ${log.command}',
                style: const TextStyle(
                  fontFamily: 'JetBrains Mono',
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppThemeTokens.primaryCyan,
                ),
              ),
              const Spacer(),
              GestureDetector(
                onTap: () => _copyToClipboard(log.output),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Icon(Icons.copy_rounded, size: 11, color: AppThemeTokens.textTertiary),
                      SizedBox(width: 4),
                      Text('Копирай', style: TextStyle(fontFamily: 'Inter', fontSize: 10, color: AppThemeTokens.textTertiary)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          // Output decoded text
          SelectableText.rich(
            _parseAnsiText(log.output),
            style: AppThemeTokens.monoTerminal,
          ),
        ],
      ),
    );
  }

  /// Parses basic ANSI escape codes to TextSpans (Section 4.2)
  TextSpan _parseAnsiText(String text) {
    final List<TextSpan> spans = [];
    final pattern = RegExp(r'\x1b\[([0-9;]+)m');
    int lastMatchEnd = 0;
    Color currentColor = const Color(0xFFCBD5E1);

    for (final match in pattern.allMatches(text)) {
      if (match.start > lastMatchEnd) {
        spans.add(
          TextSpan(
            text: text.substring(lastMatchEnd, match.start),
            style: TextStyle(color: currentColor),
          ),
        );
      }

      final code = match.group(1);
      switch (code) {
        case '31':
          currentColor = AppThemeTokens.statusRed;
          break;
        case '32':
        case '92':
          currentColor = AppThemeTokens.statusGreen;
          break;
        case '33':
        case '93':
          currentColor = AppThemeTokens.statusAmber;
          break;
        case '36':
        case '96':
          currentColor = AppThemeTokens.primaryCyan;
          break;
        case '35':
          currentColor = AppThemeTokens.agentViolet;
          break;
        case '0':
        default:
          currentColor = const Color(0xFFCBD5E1);
          break;
      }
      lastMatchEnd = match.end;
    }

    if (lastMatchEnd < text.length) {
      spans.add(
        TextSpan(
          text: text.substring(lastMatchEnd),
          style: TextStyle(color: currentColor),
        ),
      );
    }

    return TextSpan(children: spans);
  }
}

class _ConsoleLogItem {
  final String command;
  final String output;
  final bool isSuccess;
  final DateTime timestamp;

  const _ConsoleLogItem({
    required this.command,
    required this.output,
    required this.isSuccess,
    required this.timestamp,
  });
}

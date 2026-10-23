import 'dart:convert';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'binary_protocol.dart';
import 'fluid_theme.dart';

class ConsoleScreen extends StatefulWidget {
  final Function(String) onExecuteCommand;
  final Function(Map<String, dynamic>) onSendInput;
  final Function(String) onSendAudioAction;
  final VoidCallback onSyncClipboard;
  final Stream<ShellResult> shellStream;
  final Stream<HitlApprovalEvent> hitlStream;
  final TelemetryData? currentTelemetry;

  const ConsoleScreen({
    super.key,
    required this.onExecuteCommand,
    required this.onSendInput,
    required this.onSendAudioAction,
    required this.onSyncClipboard,
    required this.shellStream,
    required this.hitlStream,
    this.currentTelemetry,
  });

  @override
  State<ConsoleScreen> createState() => _ConsoleScreenState();
}

class _ConsoleScreenState extends State<ConsoleScreen> {
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<ShellResult> _history = [];
  bool _isTrackpadOpen = false;
  Offset _lastTrackpadPos = Offset.zero;

  @override
  void initState() {
    super.initState();
    widget.shellStream.listen((result) {
      if (mounted) {
        setState(() {
          _history.add(result);
        });
        _scrollToBottom();
      }
    });

    widget.hitlStream.listen((event) {
      if (mounted) {
        _showHitlDialog(event);
      }
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _showHitlDialog(HitlApprovalEvent event) {
    HapticFeedback.heavyImpact();
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF0C172B),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: Colors.redAccent, width: 2),
        ),
        title: Row(
          children: const [
            Icon(Icons.warning_amber_rounded,
                color: Colors.redAccent, size: 28),
            SizedBox(width: 10),
            Text(
              'HITL Security Intercept',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'A high-privilege administrative action was triggered and requires human confirmation:',
              style: TextStyle(color: Colors.white70, fontSize: 13),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white12),
              ),
              child: Text(
                event.command,
                style: const TextStyle(
                  color: CyberColors.primary,
                  fontFamily: 'monospace',
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Reason: ${event.reason}',
              style: const TextStyle(color: Colors.redAccent, fontSize: 11),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              widget.onExecuteCommand(jsonEncode({
                'action': 'hitl_response',
                'approval_id': event.approvalId,
                'approved': false,
              }));
            },
            child: const Text('Reject & Abort',
                style: TextStyle(color: Colors.white60)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent.withValues(alpha: 0.8),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              widget.onExecuteCommand(jsonEncode({
                'action': 'hitl_response',
                'approval_id': event.approvalId,
                'approved': true,
              }));
            },
            child: const Text('Authorize Execution'),
          ),
        ],
      ),
    );
  }

  void _handleSubmit() {
    final text = _inputController.text.trim();
    if (text.isNotEmpty) {
      HapticFeedback.lightImpact();
      widget.onExecuteCommand(text);
      _inputController.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    final telemetry = widget.currentTelemetry;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Column(
        children: [
          // Quadrant HUD Telemetry Bar (Liquid Glass)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Colors.white.withValues(alpha: 0.08),
                        const Color(0xFF070E1C).withValues(alpha: 0.78),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(20),
                    border:
                        Border.all(color: Colors.white.withValues(alpha: 0.14)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _HudItem(
                        label: 'CPU',
                        value:
                            '${telemetry?.cpuPercent.toStringAsFixed(1) ?? '22.4'}%',
                        color: NeonColors.cyan,
                      ),
                      _HudItem(
                        label: 'RAM',
                        value:
                            '${telemetry?.ramPercent.toStringAsFixed(1) ?? '56.1'}%',
                        color: NeonColors.violet,
                      ),
                      const _HudItem(
                        label: 'NET PING',
                        value: '1.8 ms',
                        color: Color(0xFF00FF88),
                      ),
                      _HudItem(
                        label: 'FPS',
                        value: '60.0',
                        color: Colors.white.withValues(alpha: 0.9),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Quick Command Shortcuts
          SizedBox(
            height: 38,
            child: ListView(
              physics: const BouncingScrollPhysics(),
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                _QuickChip(
                    label: 'systeminfo',
                    onTap: () => widget.onExecuteCommand('systeminfo')),
                _QuickChip(
                    label: 'ipconfig',
                    onTap: () => widget.onExecuteCommand('ipconfig')),
                _QuickChip(
                    label: 'dir', onTap: () => widget.onExecuteCommand('dir')),
                _QuickChip(
                    label: 'AI: Status Check',
                    onTap: () => widget.onExecuteCommand(
                        'ollama run deepseek-r1:14b "Summarize host health"')),
                _QuickChip(
                  label: 'Clipboard Sync',
                  icon: Icons.content_paste,
                  onTap: widget.onSyncClipboard,
                ),
                _QuickChip(
                  label: _isTrackpadOpen ? 'Hide Trackpad' : 'Virtual Trackpad',
                  icon: Icons.touch_app,
                  onTap: () {
                    HapticFeedback.selectionClick();
                    setState(() => _isTrackpadOpen = !_isTrackpadOpen);
                  },
                ),
              ],
            ),
          ),

          // Terminal Execution Output Stream (Liquid Glass)
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF040812).withValues(alpha: 0.78),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                          color: Colors.white.withValues(alpha: 0.1)),
                    ),
                    child: _history.isEmpty
                        ? Center(
                            child: Text(
                              'Autonomous Shell Terminal Ready\nType command or AI prompt below...',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.35),
                                fontSize: 12,
                                fontFamily: 'monospace',
                              ),
                            ),
                          )
                        : ListView.builder(
                            physics: const BouncingScrollPhysics(),
                            controller: _scrollController,
                            itemCount: _history.length,
                            itemBuilder: (context, index) {
                              final item = _history[index];
                              final isError = item.exitCode != 0;
                              return Padding(
                                padding:
                                    const EdgeInsets.symmetric(vertical: 4),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '> ${item.command}',
                                      style: const TextStyle(
                                        color: NeonColors.cyan,
                                        fontFamily: 'monospace',
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      item.output,
                                      style: TextStyle(
                                        color: isError
                                            ? Colors.redAccent
                                            : Colors.white
                                                .withValues(alpha: 0.85),
                                        fontFamily: 'monospace',
                                        fontSize: 11,
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                  ),
                ),
              ),
            ),
          ),

          // Smooth Animated Slide-up Virtual Trackpad Surface
          AnimatedSize(
            duration: const Duration(milliseconds: 280),
            curve: Curves.easeOutCubic,
            child: _isTrackpadOpen
                ? Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(22),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
                        child: Container(
                          height: 180,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                Colors.white.withValues(alpha: 0.08),
                                const Color(0xFF070E1C).withValues(alpha: 0.88),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(22),
                            border: Border.all(
                                color: NeonColors.cyan.withValues(alpha: 0.35)),
                          ),
                          child: Column(
                            children: [
                              // Trackpad Area
                              Expanded(
                                child: GestureDetector(
                                  onPanStart: (details) {
                                    _lastTrackpadPos = details.localPosition;
                                  },
                                  onPanUpdate: (details) {
                                    final delta = details.localPosition -
                                        _lastTrackpadPos;
                                    _lastTrackpadPos = details.localPosition;
                                    widget.onSendInput({
                                      'action': 'move',
                                      'dx': delta.dx * 1.5,
                                      'dy': delta.dy * 1.5,
                                    });
                                  },
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color:
                                          Colors.black.withValues(alpha: 0.4),
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(
                                          color: Colors.white
                                              .withValues(alpha: 0.1)),
                                    ),
                                    child: Center(
                                      child: Text(
                                        'Drag to move cursor · Tap buttons below',
                                        style: TextStyle(
                                          color: Colors.white
                                              .withValues(alpha: 0.45),
                                          fontSize: 11,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              // Mouse & Media Buttons
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceEvenly,
                                children: [
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor:
                                          Colors.white.withValues(alpha: 0.1),
                                      foregroundColor: Colors.white,
                                    ),
                                    onPressed: () => widget.onSendInput(
                                        {'action': 'click', 'button': 'left'}),
                                    child: const Text('Left Click'),
                                  ),
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor:
                                          Colors.white.withValues(alpha: 0.1),
                                      foregroundColor: Colors.white,
                                    ),
                                    onPressed: () => widget.onSendInput(
                                        {'action': 'click', 'button': 'right'}),
                                    child: const Text('Right Click'),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.volume_down,
                                        color: Colors.white),
                                    onPressed: () =>
                                        widget.onSendAudioAction('volume_down'),
                                    tooltip: 'Volume Down',
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.volume_up,
                                        color: Colors.white),
                                    onPressed: () =>
                                        widget.onSendAudioAction('volume_up'),
                                    tooltip: 'Volume Up',
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.play_arrow,
                                        color: NeonColors.cyan),
                                    onPressed: () =>
                                        widget.onSendAudioAction('play_pause'),
                                    tooltip: 'Play / Pause',
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  )
                : const SizedBox.shrink(),
          ),

          // Command Input Bar (Liquid Glass Capsule)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 88),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(26),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Colors.white.withValues(alpha: 0.09),
                        const Color(0xFF070E1C).withValues(alpha: 0.85),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(26),
                    border: Border.all(
                        color: NeonColors.cyan.withValues(alpha: 0.35)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.chevron_right,
                          color: NeonColors.cyan, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _inputController,
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontFamily: 'monospace'),
                          decoration: InputDecoration(
                            hintText: 'Enter command or AI prompt...',
                            hintStyle: TextStyle(
                                color: Colors.white.withValues(alpha: 0.35),
                                fontSize: 13),
                            border: InputBorder.none,
                          ),
                          onSubmitted: (_) => _handleSubmit(),
                        ),
                      ),
                      IconButton(
                        icon: Icon(Icons.send_rounded,
                            color: NeonColors.cyan, size: 20),
                        onPressed: _handleSubmit,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _HudItem extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _HudItem({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.5),
            fontSize: 9,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            color: color,
            fontSize: 12,
            fontWeight: FontWeight.bold,
            fontFamily: 'monospace',
          ),
        ),
      ],
    );
  }
}

class _QuickChip extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback onTap;

  const _QuickChip({
    required this.label,
    this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            onTap();
          },
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (icon != null) ...[
                  Icon(icon, size: 14, color: NeonColors.cyan),
                  const SizedBox(width: 6),
                ],
                Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontFamily: 'monospace',
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

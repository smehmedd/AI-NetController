import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'glass_theme.dart';
import 'glass_container.dart';

/// Representation of a host machine in the LAN fleet
class FleetHost {
  final String id;
  final String name;
  final String ip;
  final String mac;
  final int port;
  final bool isOnline;
  final double cpuPercent;
  final double ramPercent;
  final String osName;
  final bool isServer;
  final int latencyMs;

  const FleetHost({
    required this.id,
    required this.name,
    required this.ip,
    required this.mac,
    this.port = 8765,
    this.isOnline = false,
    this.cpuPercent = 0.0,
    this.ramPercent = 0.0,
    this.osName = 'Windows 11 Pro',
    this.isServer = false,
    this.latencyMs = 16,
  });

  FleetHost copyWith({
    bool? isOnline,
    double? cpuPercent,
    double? ramPercent,
    String? osName,
    bool? isServer,
    int? latencyMs,
  }) {
    return FleetHost(
      id: id,
      name: name,
      ip: ip,
      mac: mac,
      port: port,
      isOnline: isOnline ?? this.isOnline,
      cpuPercent: cpuPercent ?? this.cpuPercent,
      ramPercent: ramPercent ?? this.ramPercent,
      osName: osName ?? this.osName,
      isServer: isServer ?? this.isServer,
      latencyMs: latencyMs ?? this.latencyMs,
    );
  }
}

/// ==============================================================================
/// CST Capstone: Liquid Glassmorphic Fleet View
/// ==============================================================================
/// Ultra-refined, decluttered device overview implementing:
/// - Single, unified frosted status pill: [ 🟢 2 Активни • 16ms ]
/// - Frosted squircle device cards with zero string clipping
/// - Single contextual right action (Wake with orbital timer vs. Console transition)
/// - Single deduplicated Add Device trigger (Floating frosted Glass FAB)
/// - Silent animated radar ripple empty state
class FleetView extends StatefulWidget {
  final List<FleetHost>? hosts;
  final FleetHost? selectedHost;
  final ValueChanged<FleetHost>? onSelectHost;
  final ValueChanged<FleetHost>? onWakeHost;
  final ValueChanged<FleetHost>? onOpenConsole;
  final ValueChanged<FleetHost>? onAddHost;
  final VoidCallback? onRefresh;

  const FleetView({
    super.key,
    this.hosts,
    this.selectedHost,
    this.onSelectHost,
    this.onWakeHost,
    this.onOpenConsole,
    this.onAddHost,
    this.onRefresh,
  });

  @override
  State<FleetView> createState() => _FleetViewState();
}

class _FleetViewState extends State<FleetView> with SingleTickerProviderStateMixin {
  late List<FleetHost> _hosts;
  FleetHost? _selectedHost;
  final TextEditingController _searchController = TextEditingController();
  String _filterQuery = '';
  final Map<String, int> _wakingTimers = {};
  Timer? _tickerTimer;

  // Radar animation controller for empty state
  late AnimationController _radarController;

  @override
  void initState() {
    super.initState();
    _hosts = widget.hosts ?? _defaultDemoHosts();
    _selectedHost = widget.selectedHost ?? (_hosts.isNotEmpty ? _hosts.first : null);

    _radarController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat();
  }

  @override
  void didUpdateWidget(covariant FleetView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.hosts != null) {
      setState(() {
        _hosts = widget.hosts!;
      });
    }
    if (widget.selectedHost != null) {
      _selectedHost = widget.selectedHost;
    }
  }

  @override
  void dispose() {
    _tickerTimer?.cancel();
    _radarController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  List<FleetHost> _defaultDemoHosts() {
    return const [];
  }

  void _triggerWake(FleetHost host) {
    // HapticFeedback removed
    setState(() {
      _wakingTimers[host.id] = 45;
    });

    widget.onWakeHost?.call(host);

    _tickerTimer?.cancel();
    _tickerTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      setState(() {
        final toRemove = <String>[];
        _wakingTimers.forEach((key, val) {
          if (val <= 1) {
            toRemove.add(key);
          } else {
            _wakingTimers[key] = val - 1;
          }
        });
        for (var k in toRemove) {
          _wakingTimers.remove(k);
          // Transition machine to online demo state
          final idx = _hosts.indexWhere((h) => h.id == k);
          if (idx != -1) {
            _hosts[idx] = _hosts[idx].copyWith(isOnline: true, cpuPercent: 18, ramPercent: 35);
          }
        }
        if (_wakingTimers.isEmpty) {
          timer.cancel();
        }
      });
    });
  }

  void _openDeviceDetails(FleetHost host) {
    // HapticFeedback removed
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _buildHostDetailSheet(host),
    );
  }

  void _openAddDeviceModal() {
    // HapticFeedback removed
    final nameCtrl = TextEditingController();
    final ipCtrl = TextEditingController(text: '192.168.1.');
    final macCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom,
        ),
        child: GlassContainer(
          borderRadius: 24,
          padding: const EdgeInsets.all(24),
          backgroundColor: GlassTheme.canvasSurface.withValues(alpha: 0.92),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              const Text('Добавяне на машина', style: GlassTheme.titleLarge),
              const SizedBox(height: 6),
              const Text(
                'Въведете параметрите на устройството за дистанционен контрол и WoL.',
                style: GlassTheme.bodyMedium,
              ),
              const SizedBox(height: 20),
              _buildInputField('Име на хост', nameCtrl, Icons.computer_rounded, 'напр. Office-PC-4'),
              const SizedBox(height: 12),
              _buildInputField('IP Адрес', ipCtrl, Icons.lan_rounded, '192.168.1.120'),
              const SizedBox(height: 12),
              _buildInputField('MAC Адрес', macCtrl, Icons.fingerprint_rounded, 'AA:BB:CC:DD:EE:FF'),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: Text(
                        'Отказ',
                        style: GlassTheme.bodyMedium.copyWith(color: GlassTheme.textTertiary),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: GlassContainer(
                      borderRadius: 14,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      backgroundColor: GlassTheme.accentIce.withValues(alpha: 0.18),
                      borderColor: GlassTheme.accentIce.withValues(alpha: 0.4),
                      isInteractive: true,
                      onTap: () {
                        if (ipCtrl.text.isNotEmpty && nameCtrl.text.isNotEmpty) {
                          final newHost = FleetHost(
                            id: nameCtrl.text.trim(),
                            name: nameCtrl.text.trim(),
                            ip: ipCtrl.text.trim(),
                            mac: macCtrl.text.trim().isEmpty ? '00:11:22:33:44:55' : macCtrl.text.trim(),
                            isOnline: false,
                          );
                          setState(() {
                            _hosts.add(newHost);
                          });
                          widget.onAddHost?.call(newHost);
                          Navigator.pop(ctx);
                        }
                      },
                      child: Center(
                        child: Text(
                          'Запази машина',
                          style: GlassTheme.labelMedium.copyWith(color: GlassTheme.accentIce),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInputField(String label, TextEditingController ctrl, IconData icon, String hint) {
    return Container(
      decoration: BoxDecoration(
        color: GlassTheme.canvasDeep.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white10),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      child: TextField(
        controller: ctrl,
        style: GlassTheme.bodyLarge,
        decoration: InputDecoration(
          icon: Icon(icon, color: GlassTheme.textTertiary, size: 20),
          labelText: label,
          labelStyle: GlassTheme.labelSmall.copyWith(color: GlassTheme.textSecondary),
          hintText: hint,
          hintStyle: GlassTheme.bodySmall.copyWith(color: GlassTheme.textDisabled),
          border: InputBorder.none,
        ),
      ),
    );
  }

  Widget _buildHostDetailSheet(FleetHost host) {
    return GlassContainer(
      borderRadius: 24,
      padding: const EdgeInsets.all(24),
      backgroundColor: GlassTheme.canvasSurface.withValues(alpha: 0.95),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: GlassTheme.glassUltraLight,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.white12),
                ),
                child: Icon(
                  host.isServer ? Icons.dns_rounded : Icons.desktop_windows_rounded,
                  color: host.isOnline ? GlassTheme.statusOnline : GlassTheme.textTertiary,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(host.name, style: GlassTheme.titleLarge),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: host.isOnline ? GlassTheme.statusOnline : GlassTheme.textDisabled,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          host.isOnline ? 'Активен хост' : 'В режим на покой',
                          style: GlassTheme.bodySmall.copyWith(
                            color: host.isOnline ? GlassTheme.statusOnline : GlassTheme.textTertiary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 22),
          const Divider(color: Colors.white10),
          const SizedBox(height: 14),
          _buildDetailRow('IP Адрес', host.ip, isMono: true),
          _buildDetailRow('MAC Адрес', host.mac, isMono: true),
          _buildDetailRow('Порт на агента', '${host.port} (TCP/WS)'),
          _buildDetailRow('Операционна система', host.osName),
          _buildDetailRow('Мрежово закъснение', host.isOnline ? '${host.latencyMs} ms' : 'Няма връзка'),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: GlassContainer(
                  borderRadius: 14,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  backgroundColor: host.isOnline
                      ? GlassTheme.accentIce.withValues(alpha: 0.18)
                      : GlassTheme.statusPending.withValues(alpha: 0.18),
                  borderColor: host.isOnline
                      ? GlassTheme.accentIce.withValues(alpha: 0.4)
                      : GlassTheme.statusPending.withValues(alpha: 0.4),
                  isInteractive: true,
                  onTap: () {
                    Navigator.pop(context);
                    if (host.isOnline) {
                      widget.onOpenConsole?.call(host);
                    } else {
                      _triggerWake(host);
                    }
                  },
                  child: Center(
                    child: Text(
                      host.isOnline ? 'Отвори конзола' : 'Изпрати WoL пакет',
                      style: GlassTheme.labelMedium.copyWith(
                        color: host.isOnline ? GlassTheme.accentIce : GlassTheme.statusPending,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isMono = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GlassTheme.bodyMedium),
          Text(
            value,
            style: isMono
                ? GlassTheme.monoIpMac.copyWith(fontSize: 12)
                : GlassTheme.bodyMedium.copyWith(color: GlassTheme.textPrimary, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final onlineCount = _hosts.where((h) => h.isOnline).length;
    final avgLatency = _hosts.where((h) => h.isOnline).fold(0, (sum, h) => sum + h.latencyMs) ~/
        math.max(1, onlineCount);

    final filtered = _hosts.where((h) {
      if (_filterQuery.isEmpty) return true;
      return h.name.toLowerCase().contains(_filterQuery.toLowerCase()) ||
          h.ip.contains(_filterQuery);
    }).toList();

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton(
        onPressed: _openAddDeviceModal,
        backgroundColor: GlassTheme.accentIce,
        foregroundColor: GlassTheme.canvasDeep,
        elevation: 12,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        child: const Icon(Icons.add_rounded, size: 28),
      ),
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            // 1. Header Capsule & Title (Section 3.1)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Машини', style: GlassTheme.displayLarge),
                        const SizedBox(height: 2),
                        Text('Локален мрежов флот', style: GlassTheme.bodySmall.copyWith(color: GlassTheme.textTertiary)),
                      ],
                    ),

                    // Clean Frosted Status Capsule
                    GlassContainer(
                      borderRadius: 20,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      backgroundColor: GlassTheme.glassUltraLight,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: GlassTheme.statusOnline,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '$onlineCount Активни • ${avgLatency}ms',
                            style: GlassTheme.labelSmall.copyWith(color: GlassTheme.textPrimary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // 2. Translucent Search Bar
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: GlassContainer(
                  borderRadius: 16,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                  backgroundColor: GlassTheme.glassSurface,
                  child: Row(
                    children: [
                      const Icon(Icons.search_rounded, color: GlassTheme.textTertiary, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: _searchController,
                          onChanged: (val) => setState(() => _filterQuery = val.trim()),
                          style: GlassTheme.bodyMedium.copyWith(color: GlassTheme.textPrimary),
                          decoration: InputDecoration(
                            hintText: 'Търси по име или IP адрес...',
                            hintStyle: GlassTheme.bodySmall.copyWith(color: GlassTheme.textDisabled),
                            border: InputBorder.none,
                            isDense: true,
                          ),
                        ),
                      ),
                      if (_filterQuery.isNotEmpty)
                        GestureDetector(
                          onTap: () {
                            _searchController.clear();
                            setState(() => _filterQuery = '');
                          },
                          child: const Icon(Icons.close_rounded, color: GlassTheme.textTertiary, size: 18),
                        ),
                    ],
                  ),
                ),
              ),
            ),

            // 3. Device Cards List or Radar Pulse Zero-State
            if (filtered.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Animated Frosted Radar Ripple
                      AnimatedBuilder(
                        animation: _radarController,
                        builder: (ctx, child) {
                          return CustomPaint(
                            painter: _FrostedRadarPainter(_radarController.value),
                            size: const Size(140, 140),
                          );
                        },
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'Търсене на машини в локалната мрежа...',
                        style: GlassTheme.bodyMedium.copyWith(color: GlassTheme.textSecondary),
                      ),
                      const SizedBox(height: 12),
                      TextButton.icon(
                        onPressed: widget.onRefresh,
                        icon: const Icon(Icons.refresh_rounded, size: 18, color: GlassTheme.accentIce),
                        label: Text(
                          'Сканирай отново',
                          style: GlassTheme.labelMedium.copyWith(color: GlassTheme.accentIce),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (ctx, i) {
                      final host = filtered[i];
                      final isSelected = host.id == _selectedHost?.id;
                      final wakingSeconds = _wakingTimers[host.id];

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _buildDeviceCard(host, isSelected, wakingSeconds),
                      );
                    },
                    childCount: filtered.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDeviceCard(FleetHost host, bool isSelected, int? wakingSeconds) {
    return GlassContainer(
      borderRadius: 20,
      padding: const EdgeInsets.all(16),
      isSelected: isSelected,
      isOffline: !host.isOnline && wakingSeconds == null,
      isInteractive: true,
      onTap: () {
        setState(() => _selectedHost = host);
        widget.onSelectHost?.call(host);
        _openDeviceDetails(host);
      },
      child: Row(
        children: [
          // Left Squircle Icon (44x44dp)
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: host.isOnline
                  ? GlassTheme.accentIceDim
                  : Colors.white.withValues(alpha: 0.04),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: host.isOnline
                    ? GlassTheme.accentIce.withValues(alpha: 0.3)
                    : Colors.white.withValues(alpha: 0.08),
                width: 0.8,
              ),
            ),
            child: Icon(
              host.isServer ? Icons.dns_rounded : Icons.desktop_windows_rounded,
              color: host.isOnline ? GlassTheme.accentIce : GlassTheme.textTertiary,
              size: 22,
            ),
          ),

          const SizedBox(width: 14),

          // Middle Machine Info (Zero String Clipping)
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  host.name,
                  style: GlassTheme.titleMedium.copyWith(
                    fontWeight: FontWeight.w600,
                    color: host.isOnline ? GlassTheme.textPrimary : GlassTheme.textSecondary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: host.isOnline
                            ? GlassTheme.statusOnline
                            : (wakingSeconds != null
                                ? GlassTheme.statusPending
                                : GlassTheme.textDisabled),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      wakingSeconds != null
                          ? 'Събуждане ($wakingSeconds s)'
                          : (host.isOnline ? 'Готов' : 'В покой'),
                      style: GlassTheme.bodySmall.copyWith(
                        color: host.isOnline
                            ? GlassTheme.statusOnline
                            : (wakingSeconds != null
                                ? GlassTheme.statusPending
                                : GlassTheme.textTertiary),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text('•', style: GlassTheme.bodySmall.copyWith(color: GlassTheme.textDisabled)),
                    const SizedBox(width: 10),
                    Text(
                      host.ip,
                      style: GlassTheme.monoIpMac.copyWith(
                        fontSize: 11.5,
                        color: host.isOnline ? GlassTheme.accentIce : GlassTheme.textTertiary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(width: 10),

          // Right Contextual Action
          if (host.isOnline)
            InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () {
                widget.onOpenConsole?.call(host);
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: GlassTheme.glassUltraLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white10),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('Конзола', style: GlassTheme.labelSmall),
                    SizedBox(width: 4),
                    Icon(Icons.chevron_right_rounded, size: 16, color: GlassTheme.textSecondary),
                  ],
                ),
              ),
            )
          else
            wakingSeconds != null
                ? SizedBox(
                    width: 38,
                    height: 38,
                    child: CircularProgressIndicator(
                      value: (45 - wakingSeconds) / 45,
                      strokeWidth: 2.5,
                      color: GlassTheme.statusPending,
                      backgroundColor: Colors.white10,
                    ),
                  )
                : InkWell(
                    borderRadius: BorderRadius.circular(20),
                    onTap: () => _triggerWake(host),
                    child: Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: GlassTheme.statusPendingDim,
                        shape: BoxShape.circle,
                        border: Border.all(color: GlassTheme.statusPending.withValues(alpha: 0.3)),
                      ),
                      child: const Icon(
                        Icons.power_settings_new_rounded,
                        color: GlassTheme.statusPending,
                        size: 18,
                      ),
                    ),
                  ),
        ],
      ),
    );
  }
}

/// Custom painter for the animated frosted radar empty state
class _FrostedRadarPainter extends CustomPainter {
  final double progress;

  _FrostedRadarPainter(this.progress);

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final maxRadius = size.width / 2;

    final paintCenter = Paint()
      ..color = GlassTheme.accentIce
      ..style = PaintingStyle.fill;

    // Center pulse dot
    canvas.drawCircle(center, 4, paintCenter);

    // Expanding concentric rings
    for (int i = 0; i < 3; i++) {
      final ringProgress = (progress + (i * 0.33)) % 1.0;
      final radius = ringProgress * maxRadius;
      final opacity = (1.0 - ringProgress).clamp(0.0, 1.0) * 0.35;

      final paintRing = Paint()
        ..color = GlassTheme.accentIce.withValues(alpha: opacity)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.2;

      canvas.drawCircle(center, radius, paintRing);
    }
  }

  @override
  bool shouldRepaint(covariant _FrostedRadarPainter oldDelegate) =>
      oldDelegate.progress != progress;
}

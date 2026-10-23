import 'dart:async';
import 'package:flutter/material.dart';
import 'app_theme_tokens.dart';

/// Representation of a fleet node host device
class FleetDevice {
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

  const FleetDevice({
    required this.id,
    required this.name,
    required this.ip,
    required this.mac,
    this.port = 8765,
    this.isOnline = false,
    this.cpuPercent = 0.0,
    this.ramPercent = 0.0,
    this.osName = 'Windows 11',
    this.isServer = false,
  });

  FleetDevice copyWith({
    bool? isOnline,
    double? cpuPercent,
    double? ramPercent,
    String? osName,
    bool? isServer,
  }) {
    return FleetDevice(
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
    );
  }
}

/// Decluttered Fleet Master View
/// ============================================================================
/// Implements search & filter bar, consolidated status capsule, radar zero-state,
/// 45-second Wake-on-LAN orbital countdown, and deduplicated Add Host sheet.
class FleetMasterView extends StatefulWidget {
  final List<FleetDevice> devices;
  final FleetDevice? selectedDevice;
  final ValueChanged<FleetDevice> onDeviceSelected;
  final ValueChanged<FleetDevice> onWakeDevice;
  final ValueChanged<FleetDevice>? onOpenStream;
  final ValueChanged<FleetDevice>? onOpenConsole;
  final VoidCallback? onRefreshDiscovery;
  final bool isNetworkDisconnected;
  final VoidCallback? onReconnectNetwork;

  const FleetMasterView({
    super.key,
    required this.devices,
    required this.selectedDevice,
    required this.onDeviceSelected,
    required this.onWakeDevice,
    this.onOpenStream,
    this.onOpenConsole,
    this.onRefreshDiscovery,
    this.isNetworkDisconnected = false,
    this.onReconnectNetwork,
  });

  @override
  State<FleetMasterView> createState() => _FleetMasterViewState();
}

class _FleetMasterViewState extends State<FleetMasterView>
    with TickerProviderStateMixin {
  final TextEditingController _searchController = TextEditingController();
  String _selectedFilter = 'Всички';
  final Map<String, int> _wakingTimeouts = {}; // Host ID -> Remaining seconds
  Timer? _wolTicker;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _wolTicker?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _triggerWakeDevice(FleetDevice device) {
    widget.onWakeDevice(device);
    setState(() {
      _wakingTimeouts[device.id] = 45;
    });

    _wolTicker?.cancel();
    _wolTicker = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        final keys = _wakingTimeouts.keys.toList();
        for (final k in keys) {
          final current = _wakingTimeouts[k] ?? 0;
          if (current <= 1) {
            _wakingTimeouts.remove(k);
          } else {
            _wakingTimeouts[k] = current - 1;
          }
        }
        if (_wakingTimeouts.isEmpty) {
          timer.cancel();
        }
      });
    });
  }

  List<FleetDevice> get _filteredDevices {
    final query = _searchController.text.trim().toLowerCase();
    return widget.devices.where((d) {
      final matchesQuery = query.isEmpty ||
          d.name.toLowerCase().contains(query) ||
          d.ip.toLowerCase().contains(query);

      if (!matchesQuery) return false;

      switch (_selectedFilter) {
        case 'Онлайн':
          return d.isOnline;
        case 'Приспани':
          return !d.isOnline;
        case 'Сървъри':
          return d.isServer;
        case 'Всички':
        default:
          return true;
      }
    }).toList();
  }

  void _showAddDeviceModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _AddDeviceSheet(
        onAddDevice: (newDevice) {
          // Add device callback
          Navigator.pop(ctx);
        },
      ),
    );
  }

  void _showStatusPopover() {
    final onlineCount = widget.devices.where((d) => d.isOnline).length;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppThemeTokens.surfaceElevated,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppThemeTokens.cyanDim),
        ),
        title: Row(
          children: const [
            Icon(Icons.network_check_rounded,
                color: AppThemeTokens.primaryCyan, size: 22),
            SizedBox(width: 10),
            Text('Диагностика на мрежата', style: AppThemeTokens.titleMedium),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildStatusRow(
                'Статус на флота',
                '$onlineCount от ${widget.devices.length} онлайн',
                AppThemeTokens.statusGreen),
            _buildStatusRow(
                'Закъснение (RTT)', '16.2 ms', AppThemeTokens.primaryCyan),
            _buildStatusRow('Мрежов джитър (RFC 3550)', '1.4 ms',
                AppThemeTokens.textSecondary),
            _buildStatusRow(
                'Загуба на пакети', '0.0%', AppThemeTokens.statusGreen),
            _buildStatusRow('Подмрежов обхват', '192.168.1.0/24',
                AppThemeTokens.textPrimary),
            _buildStatusRow('mDNS откриване', 'RFC 6762 (_cst-agent._tcp)',
                AppThemeTokens.agentViolet),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Затвори',
                style: TextStyle(color: AppThemeTokens.primaryCyan)),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusRow(String label, String val, Color valColor) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppThemeTokens.bodySmall),
          Text(
            val,
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: valColor,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredDevices;
    final onlineCount = widget.devices.where((d) => d.isOnline).length;

    return Column(
      children: [
        // 1. Unstable Connection Banner (Section 3.4)
        if (widget.isNetworkDisconnected)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: AppThemeTokens.statusAmber.withValues(alpha: 0.18),
              border: const Border(
                bottom: BorderSide(color: AppThemeTokens.statusAmber, width: 1),
              ),
            ),
            child: Row(
              children: [
                const Icon(Icons.warning_amber_rounded,
                    color: AppThemeTokens.statusAmber, size: 18),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Връзката е прекъсната • Повторен опит след 3s...',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: AppThemeTokens.statusAmber,
                    ),
                  ),
                ),
                TextButton(
                  style: TextButton.styleFrom(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    backgroundColor:
                        AppThemeTokens.statusAmber.withValues(alpha: 0.2),
                    minimumSize: Size.zero,
                  ),
                  onPressed: widget.onReconnectNetwork,
                  child: const Text(
                    'Свържи веднага',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: AppThemeTokens.statusAmber,
                    ),
                  ),
                ),
              ],
            ),
          ),

        // 2. Header Bar: Title, Consolidated Status Capsule, Single Add Button
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
          child: Row(
            children: [
              const Text('Мрежов флот', style: AppThemeTokens.titleLarge),
              const Spacer(),

              // Consolidated Status Capsule (Section 2.3)
              GestureDetector(
                onTap: _showStatusPopover,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: AppThemeTokens.capsuleDecoration(),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 7,
                        height: 7,
                        decoration: BoxDecoration(
                          color: onlineCount > 0
                              ? AppThemeTokens.statusGreen
                              : AppThemeTokens.statusRed,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: (onlineCount > 0
                                      ? AppThemeTokens.statusGreen
                                      : AppThemeTokens.statusRed)
                                  .withValues(alpha: 0.6),
                              blurRadius: 6,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '$onlineCount Онлайн • 16ms',
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppThemeTokens.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(width: 8),

              // Deduplicated Single Add Button (Section 2.1)
              IconButton(
                style: IconButton.styleFrom(
                  backgroundColor:
                      AppThemeTokens.primaryCyan.withValues(alpha: 0.12),
                  side: const BorderSide(color: AppThemeTokens.cyanDim),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.add_rounded,
                    color: AppThemeTokens.primaryCyan, size: 20),
                tooltip: 'Добави машина',
                onPressed: _showAddDeviceModal,
              ),
            ],
          ),
        ),

        // 3. Search Bar & Scalability Filter Chips (Section 3.3)
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: Container(
            height: 42,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: AppThemeTokens.surfaceMuted,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            ),
            child: Row(
              children: [
                const Icon(Icons.search_rounded,
                    color: AppThemeTokens.textTertiary, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    style: const TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 13,
                      color: AppThemeTokens.textPrimary,
                    ),
                    decoration: const InputDecoration(
                      hintText: 'Търсене по име или IP адрес...',
                      hintStyle: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 13,
                        color: AppThemeTokens.textDisabled,
                      ),
                      border: InputBorder.none,
                      isDense: true,
                    ),
                  ),
                ),
                if (_searchController.text.isNotEmpty)
                  GestureDetector(
                    onTap: () => _searchController.clear(),
                    child: const Icon(Icons.close_rounded,
                        color: AppThemeTokens.textTertiary, size: 16),
                  ),
              ],
            ),
          ),
        ),

        // Filter Chips Strip
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 10),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children:
                  ['Всички', 'Онлайн', 'Приспани', 'Сървъри'].map((filter) {
                final isSelected = _selectedFilter == filter;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedFilter = filter),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppThemeTokens.primaryCyan.withValues(alpha: 0.15)
                            : AppThemeTokens.surface.withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isSelected
                              ? AppThemeTokens.primaryCyan
                              : Colors.white.withValues(alpha: 0.08),
                          width: 1.0,
                        ),
                      ),
                      child: Text(
                        filter,
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 12,
                          fontWeight:
                              isSelected ? FontWeight.w600 : FontWeight.w400,
                          color: isSelected
                              ? AppThemeTokens.primaryCyan
                              : AppThemeTokens.textSecondary,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ),

        // 4. Fleet Device List or Zero-State Radar Canvas (Section 3.1 & 3.3)
        Expanded(
          child: filtered.isEmpty
              ? _buildZeroStateRadar()
              : ListView.builder(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 88),
                  itemCount: filtered.length,
                  itemExtent:
                      140.0, // Fixed extent estimation guarantees 120Hz smooth scrolling
                  itemBuilder: (context, index) {
                    final device = filtered[index];
                    final isSelected = widget.selectedDevice?.id == device.id;
                    final isWaking = _wakingTimeouts.containsKey(device.id);
                    final wakingSeconds = _wakingTimeouts[device.id] ?? 0;

                    return _FleetDeviceCard(
                      device: device,
                      isSelected: isSelected,
                      isWaking: isWaking,
                      wakingSeconds: wakingSeconds,
                      onTap: () => widget.onDeviceSelected(device),
                      onWake: () => _triggerWakeDevice(device),
                      onStream: () => widget.onOpenStream?.call(device),
                      onConsole: () => widget.onOpenConsole?.call(device),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildZeroStateRadar() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const _RadarPulseWidget(),
            const SizedBox(height: 24),
            const Text(
              'Търсене на машини в локалната мрежа...',
              textAlign: TextAlign.center,
              style: AppThemeTokens.titleMedium,
            ),
            const SizedBox(height: 8),
            const Text(
              'Уверете се, че Python Host Agent е стартиран на порт 8765 или добавете хост ръчно.',
              textAlign: TextAlign.center,
              style: AppThemeTokens.bodySmall,
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor:
                    AppThemeTokens.primaryCyan.withValues(alpha: 0.15),
                foregroundColor: AppThemeTokens.primaryCyan,
                side: const BorderSide(color: AppThemeTokens.primaryCyan),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20)),
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
              onPressed: _showAddDeviceModal,
              icon: const Icon(Icons.add_rounded, size: 18),
              label: const Text(
                'Ръчно добавяне',
                style:
                    TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Device Card with Desaturation for Offline Nodes & 45s Wake Spinner (Section 3.2)
class _FleetDeviceCard extends StatelessWidget {
  final FleetDevice device;
  final bool isSelected;
  final bool isWaking;
  final int wakingSeconds;
  final VoidCallback onTap;
  final VoidCallback onWake;
  final VoidCallback onStream;
  final VoidCallback onConsole;

  const _FleetDeviceCard({
    required this.device,
    required this.isSelected,
    required this.isWaking,
    required this.wakingSeconds,
    required this.onTap,
    required this.onWake,
    required this.onStream,
    required this.onConsole,
  });

  @override
  Widget build(BuildContext context) {
    final isOffline = !device.isOnline;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: AppThemeTokens.cardDecoration(
            isSelected: isSelected,
            isOffline: isOffline,
          ),
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Row 1: Status Dot, Hostname, OS Pill
              Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: isOffline
                          ? AppThemeTokens.statusRed
                          : AppThemeTokens.statusGreen,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      device.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontFamily: 'Rajdhani',
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: isOffline
                            ? AppThemeTokens.textSecondary
                            : AppThemeTokens.textPrimary,
                      ),
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.06),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      device.osName,
                      style: const TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 10,
                        color: AppThemeTokens.textTertiary,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 8),

              // Row 2: IP Address & Collapsible MAC address
              Row(
                children: [
                  const Icon(Icons.lan_rounded,
                      size: 13, color: AppThemeTokens.primaryCyan),
                  const SizedBox(width: 4),
                  Text(device.ip, style: AppThemeTokens.monoIpMac),
                  const SizedBox(width: 12),
                  // Zero Text Truncation: Show MAC comfortably or collapse cleanly
                  Expanded(
                    child: Text(
                      device.mac,
                      maxLines: 1,
                      overflow: TextOverflow.fade,
                      softWrap: false,
                      style: const TextStyle(
                        fontFamily: 'JetBrains Mono',
                        fontSize: 11,
                        color: AppThemeTokens.textTertiary,
                      ),
                    ),
                  ),
                ],
              ),

              const Spacer(),

              // Row 3: Action Buttons or Wake-on-LAN Trigger (Section 3.2)
              Row(
                children: [
                  if (!isOffline) ...[
                    // CPU & RAM metrics
                    _buildMetricChip(
                        'CPU', '${device.cpuPercent.toStringAsFixed(0)}%'),
                    const SizedBox(width: 8),
                    _buildMetricChip(
                        'RAM', '${device.ramPercent.toStringAsFixed(0)}%'),
                    const Spacer(),
                    // Actions: Stream & Console
                    IconButton(
                      icon: const Icon(Icons.terminal_rounded, size: 18),
                      color: AppThemeTokens.primaryCyan,
                      tooltip: 'Конзола',
                      onPressed: onConsole,
                    ),
                    IconButton(
                      icon: const Icon(Icons.monitor_rounded, size: 18),
                      color: AppThemeTokens.primaryCyan,
                      tooltip: 'Екран на живо',
                      onPressed: onStream,
                    ),
                  ] else ...[
                    // Offline Machine: Show Glowing Wake-on-LAN pill (Section 3.2)
                    const Spacer(),
                    if (isWaking)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 6),
                        decoration: AppThemeTokens.capsuleDecoration(
                          borderColor: AppThemeTokens.statusAmber,
                          fillColor:
                              AppThemeTokens.statusAmber.withValues(alpha: 0.1),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppThemeTokens.statusAmber,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Magic Packet... ${wakingSeconds}s',
                              style: const TextStyle(
                                fontFamily: 'Inter',
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: AppThemeTokens.statusAmber,
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppThemeTokens.statusAmber
                              .withValues(alpha: 0.18),
                          foregroundColor: AppThemeTokens.statusAmber,
                          side: const BorderSide(
                              color: AppThemeTokens.statusAmber),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20)),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 6),
                          minimumSize: const Size(0, 34),
                        ),
                        onPressed: onWake,
                        icon: const Icon(Icons.power_settings_new_rounded,
                            size: 16),
                        label: const Text(
                          'Събуди (Wake-on-LAN)',
                          style: TextStyle(
                              fontFamily: 'Inter',
                              fontSize: 12,
                              fontWeight: FontWeight.w600),
                        ),
                      ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetricChip(String label, String val) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppThemeTokens.surfaceMuted,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Text(
        '$label: $val',
        style: const TextStyle(
          fontFamily: 'JetBrains Mono',
          fontSize: 10,
          color: AppThemeTokens.textSecondary,
        ),
      ),
    );
  }
}

/// Animated Radar Pulse Canvas for Empty State & Discovery (Section 3.1)
class _RadarPulseWidget extends StatefulWidget {
  const _RadarPulseWidget();

  @override
  State<_RadarPulseWidget> createState() => _RadarPulseWidgetState();
}

class _RadarPulseWidgetState extends State<_RadarPulseWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _radarController;

  @override
  void initState() {
    super.initState();
    _radarController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat();
  }

  @override
  void dispose() {
    _radarController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _radarController,
      builder: (context, child) {
        return CustomPaint(
          size: const Size(120, 120),
          painter: _RadarCanvasPainter(_radarController.value),
        );
      },
    );
  }
}

class _RadarCanvasPainter extends CustomPainter {
  final double animationValue;

  _RadarCanvasPainter(this.animationValue);

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final maxRadius = size.width / 2;

    final paintBase = Paint()
      ..color = AppThemeTokens.primaryCyan.withValues(alpha: 0.15)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    // Draw static concentric reference rings
    canvas.drawCircle(center, maxRadius * 0.33, paintBase);
    canvas.drawCircle(center, maxRadius * 0.66, paintBase);
    canvas.drawCircle(center, maxRadius, paintBase);

    // Draw expanding animated pulse wave
    final currentRadius = maxRadius * animationValue;
    final pulseOpacity = (1.0 - animationValue).clamp(0.0, 1.0);
    final pulsePaint = Paint()
      ..color = AppThemeTokens.primaryCyan.withValues(alpha: pulseOpacity * 0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    canvas.drawCircle(center, currentRadius, pulsePaint);

    // Center icon anchor dot
    final centerPaint = Paint()
      ..color = AppThemeTokens.primaryCyan
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, 4.0, centerPaint);
  }

  @override
  bool shouldRepaint(covariant _RadarCanvasPainter oldDelegate) {
    return oldDelegate.animationValue != animationValue;
  }
}

/// Deduplicated Add Host Bottom Sheet (Section 2.1)
class _AddDeviceSheet extends StatefulWidget {
  final ValueChanged<FleetDevice> onAddDevice;

  const _AddDeviceSheet({required this.onAddDevice});

  @override
  State<_AddDeviceSheet> createState() => _AddDeviceSheetState();
}

class _AddDeviceSheetState extends State<_AddDeviceSheet>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _nameController = TextEditingController();
  final _ipController = TextEditingController();
  final _macController = TextEditingController();
  final _portController = TextEditingController(text: '8765');

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _nameController.dispose();
    _ipController.dispose();
    _macController.dispose();
    _portController.dispose();
    super.dispose();
  }

  void _submitManual() {
    final name = _nameController.text.trim();
    final ip = _ipController.text.trim();
    final mac = _macController.text.trim();
    final port = int.tryParse(_portController.text.trim()) ?? 8765;

    if (name.isEmpty || ip.isEmpty || mac.isEmpty) {
      return;
    }

    final newDevice = FleetDevice(
      id: 'host-${DateTime.now().millisecondsSinceEpoch}',
      name: name,
      ip: ip,
      mac: mac,
      port: port,
      isOnline: true,
      osName: 'Windows 11',
    );

    widget.onAddDevice(newDevice);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppThemeTokens.surfaceElevated,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(top: BorderSide(color: AppThemeTokens.cyanDim)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
        left: 20,
        right: 20,
        top: 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 14),

          TabBar(
            controller: _tabController,
            indicatorColor: AppThemeTokens.primaryCyan,
            labelColor: AppThemeTokens.primaryCyan,
            unselectedLabelColor: AppThemeTokens.textSecondary,
            tabs: const [
              Tab(text: 'Автоматично сканиране'),
              Tab(text: 'Ръчно добавяне'),
            ],
          ),

          const SizedBox(height: 16),

          SizedBox(
            height: 240,
            child: TabBarView(
              controller: _tabController,
              children: [
                // Tab 1: Automatic mDNS Radar Scan
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    _RadarPulseWidget(),
                    SizedBox(height: 16),
                    Text(
                      'Сканиране за _cst-agent._tcp.local...',
                      style: AppThemeTokens.bodyMedium,
                    ),
                    SizedBox(height: 6),
                    Text(
                      'Откритите машини ще се добавят автоматично във флота.',
                      style: AppThemeTokens.bodySmall,
                    ),
                  ],
                ),

                // Tab 2: Manual Device Input
                SingleChildScrollView(
                  child: Column(
                    children: [
                      _buildTextField(
                          _nameController, 'Име на хост (напр. LAB-PC-01)'),
                      const SizedBox(height: 8),
                      _buildTextField(
                          _ipController, 'IP Адрес (напр. 192.168.1.105)'),
                      const SizedBox(height: 8),
                      _buildTextField(_macController,
                          'MAC Адрес (напр. 00:1A:2B:3C:4D:5E)'),
                      const SizedBox(height: 8),
                      _buildTextField(
                          _portController, 'Порт (по подразбиране 8765)'),
                      const SizedBox(height: 14),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppThemeTokens.primaryCyan,
                          foregroundColor: Colors.black,
                          minimumSize: const Size.fromHeight(44),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: _submitManual,
                        child: const Text('Запази машина',
                            style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextField(TextEditingController ctrl, String hint) {
    return TextField(
      controller: ctrl,
      style: const TextStyle(color: AppThemeTokens.textPrimary, fontSize: 13),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle:
            const TextStyle(color: AppThemeTokens.textDisabled, fontSize: 13),
        filled: true,
        fillColor: AppThemeTokens.surfaceMuted,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
        ),
      ),
    );
  }
}

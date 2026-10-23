import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'fluid_theme.dart';

class HostDevice {
  final String id;
  final String name;
  final String ip;
  final String mac;
  final int port;
  final bool isOnline;
  final double cpuPercent;
  final double ramPercent;
  final String osName;

  const HostDevice({
    required this.id,
    required this.name,
    required this.ip,
    required this.mac,
    this.port = 8765,
    this.isOnline = false,
    this.cpuPercent = 0.0,
    this.ramPercent = 0.0,
    this.osName = 'Windows 11',
  });

  HostDevice copyWith({
    bool? isOnline,
    double? cpuPercent,
    double? ramPercent,
    String? osName,
  }) {
    return HostDevice(
      id: id,
      name: name,
      ip: ip,
      mac: mac,
      port: port,
      isOnline: isOnline ?? this.isOnline,
      cpuPercent: cpuPercent ?? this.cpuPercent,
      ramPercent: ramPercent ?? this.ramPercent,
      osName: osName ?? this.osName,
    );
  }
}

class FleetScreen extends StatefulWidget {
  final ValueChanged<HostDevice> onSelectHost;
  final HostDevice? activeHost;

  const FleetScreen({
    super.key,
    required this.onSelectHost,
    this.activeHost,
  });

  @override
  State<FleetScreen> createState() => _FleetScreenState();
}

class _FleetScreenState extends State<FleetScreen> {
  final List<HostDevice> _devices = [
    const HostDevice(
      id: 'host-1',
      name: 'LAB-WORKSTATION-01',
      ip: '192.168.1.105',
      mac: '00:D8:61:4A:2B:90',
      port: 8765,
      isOnline: true,
      cpuPercent: 28.4,
      ramPercent: 58.2,
      osName: 'Windows 11 Pro',
    ),
    const HostDevice(
      id: 'host-2',
      name: 'GPU-NODE-COMPUTE',
      ip: '192.168.1.112',
      mac: 'B4:2E:99:1C:45:F1',
      port: 8765,
      isOnline: false,
      cpuPercent: 0.0,
      ramPercent: 0.0,
      osName: 'Ubuntu 24.04 LTS',
    ),
    const HostDevice(
      id: 'host-3',
      name: 'CST-CAPSTONE-TESTBENCH',
      ip: '127.0.0.1',
      mac: 'AA:BB:CC:DD:EE:FF',
      port: 8765,
      isOnline: true,
      cpuPercent: 14.1,
      ramPercent: 42.0,
      osName: 'Windows 10 Enterprise',
    ),
  ];

  /// Dispatches a Wake-on-LAN Magic Packet (6x 0xFF followed by 16x MAC address)
  Future<void> _sendDirectedWol(HostDevice device) async {
    HapticFeedback.mediumImpact();

    try {
      final cleanMac = device.mac.replaceAll(RegExp(r'[^0-9A-Fa-f]'), '');
      if (cleanMac.length != 12) {
        throw const FormatException('Invalid MAC address format');
      }

      // Parse MAC bytes
      final macBytes = <int>[];
      for (int i = 0; i < 12; i += 2) {
        macBytes.add(int.parse(cleanMac.substring(i, i + 2), radix: 16));
      }

      // 6 x 0xFF + 16 repetitions of MAC
      final packet = <int>[...List.filled(6, 0xFF)];
      for (int i = 0; i < 16; i++) {
        packet.addAll(macBytes);
      }

      // Send via Raw UDP socket to Subnet Directed Broadcast (Port 9 & 7)
      final socket = await RawDatagramSocket.bind(InternetAddress.anyIPv4, 0);
      try {
        socket.broadcastEnabled = true;

        // Attempt directed subnet broadcast and universal broadcast
        final broadcastIp = InternetAddress('255.255.255.255');
        socket.send(packet, broadcastIp, 9);
        socket.send(packet, broadcastIp, 7);

        // Also target device IP directly (Layer 3 traversal)
        try {
          final targetIp = InternetAddress(device.ip);
          socket.send(packet, targetIp, 9);
        } catch (_) {}
      } finally {
        socket.close();
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF0C172B),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: NeonColors.cyan.withValues(alpha: 0.4)),
            ),
            content: Row(
              children: [
                Icon(Icons.bolt, color: NeonColors.cyan, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Directed WoL Packet sent to ${device.name} (${device.mac})',
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.red.shade900,
            behavior: SnackBarBehavior.floating,
            content: Text('Failed to transmit magic packet: $e'),
          ),
        );
      }
    }
  }

  void _showAddHostDialog() {
    final nameCtrl = TextEditingController();
    final ipCtrl = TextEditingController(text: '192.168.1.');
    final macCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF070E1C),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: NeonColors.cyan.withValues(alpha: 0.3)),
        ),
        title: Row(
          children: [
            Icon(Icons.add_to_queue, color: NeonColors.cyan, size: 22),
            const SizedBox(width: 10),
            const Text(
              'Register LAN PC Host',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Hostname / Identifier',
                  labelStyle:
                      TextStyle(color: Colors.white.withValues(alpha: 0.6)),
                  enabledBorder: UnderlineInputBorder(
                    borderSide:
                        BorderSide(color: Colors.white.withValues(alpha: 0.2)),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: ipCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'IP Address',
                  labelStyle:
                      TextStyle(color: Colors.white.withValues(alpha: 0.6)),
                  enabledBorder: UnderlineInputBorder(
                    borderSide:
                        BorderSide(color: Colors.white.withValues(alpha: 0.2)),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: macCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'MAC Address (e.g. 00:11:22:33:44:55)',
                  labelStyle:
                      TextStyle(color: Colors.white.withValues(alpha: 0.6)),
                  enabledBorder: UnderlineInputBorder(
                    borderSide:
                        BorderSide(color: Colors.white.withValues(alpha: 0.2)),
                  ),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel',
                style: TextStyle(color: Colors.white.withValues(alpha: 0.6))),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: NeonColors.cyan.withValues(alpha: 0.2),
              foregroundColor: NeonColors.cyan,
              side: BorderSide(color: NeonColors.cyan),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () {
              final name = nameCtrl.text.trim();
              final ip = ipCtrl.text.trim();
              final mac = macCtrl.text.trim();
              if (name.isNotEmpty && ip.isNotEmpty) {
                setState(() {
                  _devices.add(HostDevice(
                    id: 'host_${DateTime.now().millisecondsSinceEpoch}',
                    name: name,
                    ip: ip,
                    mac: mac.isEmpty ? '00:00:00:00:00:00' : mac,
                    isOnline: true,
                    cpuPercent: 12.0,
                    ramPercent: 38.0,
                  ));
                });
                Navigator.pop(ctx);
              }
            },
            child: const Text('Register Host'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final onlineCount = _devices.where((d) => d.isOnline).length;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: CustomScrollView(
        slivers: [
          // Header Summary Banner
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
              child: Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      const Color(0xFF071226).withValues(alpha: 0.9),
                      const Color(0xFF040A18).withValues(alpha: 0.95),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                      color: NeonColors.cyan.withValues(alpha: 0.25)),
                  boxShadow: [
                    BoxShadow(
                      color: NeonColors.cyan.withValues(alpha: 0.08),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: NeonColors.cyan.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child:
                          Icon(Icons.radar, color: NeonColors.cyan, size: 28),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Autonomous PC Fleet',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.3,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '$onlineCount of ${_devices.length} Nodes Active · ZeroConf mDNS Online',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.65),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.add_circle_outline,
                          color: NeonColors.cyan),
                      onPressed: _showAddHostDialog,
                      tooltip: 'Register Host',
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Host Device Cards List
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final device = _devices[index];
                  final isSelected = widget.activeHost?.id == device.id;

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFF070E1C).withValues(alpha: 0.85),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                          color: isSelected
                              ? NeonColors.cyan
                              : Colors.white.withValues(alpha: 0.08),
                          width: isSelected ? 1.8 : 1.0,
                        ),
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () {
                            HapticFeedback.selectionClick();
                            widget.onSelectHost(device);
                          },
                          borderRadius: BorderRadius.circular(18),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      width: 10,
                                      height: 10,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: device.isOnline
                                            ? const Color(0xFF00FF88)
                                            : Colors.grey.shade600,
                                        boxShadow: device.isOnline
                                            ? [
                                                BoxShadow(
                                                  color: const Color(0xFF00FF88)
                                                      .withValues(alpha: 0.6),
                                                  blurRadius: 8,
                                                )
                                              ]
                                            : null,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            device.name,
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 14,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            '${device.ip}:${device.port} · ${device.mac}',
                                            style: TextStyle(
                                              color: Colors.white
                                                  .withValues(alpha: 0.5),
                                              fontSize: 11,
                                              fontFamily: 'monospace',
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    // Quick WoL Action
                                    IconButton(
                                      icon: Icon(
                                        Icons.bolt,
                                        color: device.isOnline
                                            ? Colors.white
                                                .withValues(alpha: 0.3)
                                            : NeonColors.violet,
                                      ),
                                      onPressed: () => _sendDirectedWol(device),
                                      tooltip: 'Send Wake-on-LAN',
                                    ),
                                  ],
                                ),
                                if (device.isOnline) ...[
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: _MetricBar(
                                          label: 'CPU',
                                          value: device.cpuPercent,
                                          color: NeonColors.cyan,
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: _MetricBar(
                                          label: 'RAM',
                                          value: device.ramPercent,
                                          color: NeonColors.violet,
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
                  );
                },
                childCount: _devices.length,
              ),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 96)),
        ],
      ),
    );
  }
}

class _MetricBar extends StatelessWidget {
  final String label;
  final double value;
  final Color color;

  const _MetricBar({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.6),
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              '${value.toStringAsFixed(1)}%',
              style: TextStyle(
                color: color,
                fontSize: 10,
                fontWeight: FontWeight.w700,
                fontFamily: 'monospace',
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: (value / 100.0).clamp(0.0, 1.0),
            backgroundColor: Colors.white.withValues(alpha: 0.08),
            valueColor: AlwaysStoppedAnimation(color),
            minHeight: 4,
          ),
        ),
      ],
    );
  }
}

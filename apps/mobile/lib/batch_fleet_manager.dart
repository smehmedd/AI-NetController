import 'dart:async';
import 'package:flutter/material.dart';

/// Target Host Device Model with Offline Caching metadata
class CachedHostDevice {
  final String id;
  final String name;
  final String ip;
  final String mac;
  final bool isOnline;
  final int dominantColorHex;
  final double cpuUsage;
  final double ramUsage;
  final DateTime lastSeen;

  const CachedHostDevice({
    required this.id,
    required this.name,
    required this.ip,
    required this.mac,
    required this.isOnline,
    this.dominantColorHex = 0xFF00F0FF,
    this.cpuUsage = 0.0,
    this.ramUsage = 0.0,
    required this.lastSeen,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'ip': ip,
        'mac': mac,
        'is_online': isOnline ? 1 : 0,
        'dominant_color': dominantColorHex,
        'cpu_usage': cpuUsage,
        'ram_usage': ramUsage,
        'last_seen': lastSeen.toIso8601String(),
      };

  factory CachedHostDevice.fromMap(Map<String, dynamic> map) =>
      CachedHostDevice(
        id: map['id'] as String,
        name: map['name'] as String,
        ip: map['ip'] as String,
        mac: map['mac'] as String,
        isOnline: (map['is_online'] as int?) == 1,
        dominantColorHex: map['dominant_color'] as int? ?? 0xFF00F0FF,
        cpuUsage: (map['cpu_usage'] as num?)?.toDouble() ?? 0.0,
        ramUsage: (map['ram_usage'] as num?)?.toDouble() ?? 0.0,
        lastSeen: DateTime.tryParse(map['last_seen'] as String? ?? '') ??
            DateTime.now(),
      );
}

/// Host Command Execution Result
class HostBatchExecutionResult {
  final String hostId;
  final String hostName;
  final bool success;
  final int exitCode;
  final String stdout;
  final String stderr;
  final int durationMs;

  const HostBatchExecutionResult({
    required this.hostId,
    required this.hostName,
    required this.success,
    required this.exitCode,
    required this.stdout,
    required this.stderr,
    required this.durationMs,
  });
}

/// Multi-Select Fleet & Batch Command Dispatch Orchestrator
class BatchFleetManager extends ChangeNotifier {
  final Set<String> _selectedHostIds = <String>{};
  bool _isMultiSelectMode = false;
  bool _isExecutingBatch = false;

  final Map<String, HostBatchExecutionResult> _lastBatchResults = {};
  List<CachedHostDevice> _cachedDevices = [];

  bool get isMultiSelectMode => _isMultiSelectMode;
  bool get isExecutingBatch => _isExecutingBatch;
  Set<String> get selectedHostIds => Set.unmodifiable(_selectedHostIds);
  int get selectedCount => _selectedHostIds.length;
  Map<String, HostBatchExecutionResult> get lastBatchResults =>
      Map.unmodifiable(_lastBatchResults);
  List<CachedHostDevice> get cachedDevices => List.unmodifiable(_cachedDevices);

  void toggleMultiSelectMode() {
    _isMultiSelectMode = !_isMultiSelectMode;
    if (!_isMultiSelectMode) {
      _selectedHostIds.clear();
    }
    notifyListeners();
  }

  void enterMultiSelectWithHost(String hostId) {
    _isMultiSelectMode = true;
    _selectedHostIds.add(hostId);
    notifyListeners();
  }

  void toggleHostSelection(String hostId, {bool isOnline = true}) {
    if (!isOnline) return; // Only ready machines can be selected

    if (_selectedHostIds.contains(hostId)) {
      _selectedHostIds.remove(hostId);
      if (_selectedHostIds.isEmpty) {
        _isMultiSelectMode = false;
      }
    } else {
      _selectedHostIds.add(hostId);
    }
    notifyListeners();
  }

  void selectAllReady(List<CachedHostDevice> allHosts) {
    _selectedHostIds.clear();
    for (final host in allHosts) {
      if (host.isOnline) {
        _selectedHostIds.add(host.id);
      }
    }
    _isMultiSelectMode = _selectedHostIds.isNotEmpty;
    notifyListeners();
  }

  void clearSelection() {
    _selectedHostIds.clear();
    _isMultiSelectMode = false;
    notifyListeners();
  }

  /// Dispatches identical command simultaneously across all selected machines
  Future<Map<String, HostBatchExecutionResult>> executeBatchCommand({
    required String command,
    required Map<
            String,
            Future<HostBatchExecutionResult> Function(
                String hostId, String cmd)>
        dispatchPool,
  }) async {
    if (_selectedHostIds.isEmpty) return {};

    _isExecutingBatch = true;
    _lastBatchResults.clear();
    notifyListeners();

    final List<Future<void>> tasks = [];

    for (final hostId in _selectedHostIds) {
      final dispatcher = dispatchPool[hostId];
      if (dispatcher != null) {
        tasks.add(dispatcher(hostId, command).then((result) {
          _lastBatchResults[hostId] = result;
          notifyListeners();
        }).catchError((err) {
          _lastBatchResults[hostId] = HostBatchExecutionResult(
            hostId: hostId,
            hostName: hostId,
            success: false,
            exitCode: -1,
            stdout: '',
            stderr: 'Грешка при комуникация: $err',
            durationMs: 0,
          );
          notifyListeners();
        }));
      }
    }

    await Future.wait(tasks);
    _isExecutingBatch = false;
    notifyListeners();
    return _lastBatchResults;
  }

  /// Offline Cache Seed for Instant Cold Boot Ghost UI
  void loadOfflineCache(List<CachedHostDevice> initialCache) {
    _cachedDevices = List.from(initialCache);
    notifyListeners();
  }
}

/// Tabbed Aggregate Console Sheet for Batch Results
class BatchConsoleResultView extends StatefulWidget {
  final Map<String, HostBatchExecutionResult> results;
  final VoidCallback onClose;

  const BatchConsoleResultView({
    super.key,
    required this.results,
    required this.onClose,
  });

  @override
  State<BatchConsoleResultView> createState() => _BatchConsoleResultViewState();
}

class _BatchConsoleResultViewState extends State<BatchConsoleResultView>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late List<String> _hostKeys;

  @override
  void initState() {
    super.initState();
    _hostKeys = widget.results.keys.toList();
    _tabController = TabController(
      length: _hostKeys.isEmpty ? 1 : _hostKeys.length,
      vsync: this,
    );
  }

  @override
  void didUpdateWidget(BatchConsoleResultView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.results.keys.toList() != _hostKeys) {
      _tabController.dispose();
      _hostKeys = widget.results.keys.toList();
      _tabController = TabController(
        length: _hostKeys.isEmpty ? 1 : _hostKeys.length,
        vsync: this,
      );
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_hostKeys.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      height: 340,
      decoration: const BoxDecoration(
        color: Color(0xFF060D1A),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(top: BorderSide(color: Color(0x4400F0FF))),
      ),
      child: Column(
        children: [
          // Header Bar with Semantic Label
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Semantics(
                  label: "Резултати от групово изпълнение на команди",
                  child: Row(
                    children: [
                      const Icon(Icons.hub_outlined,
                          color: Color(0xFF00F0FF), size: 18),
                      const SizedBox(width: 8),
                      Text(
                        'ГРУПОВИ РЕЗУЛТАТИ (${_hostKeys.length} ХОСТА)',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'monospace',
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                Semantics(
                  label: "Затвори конзолния панел",
                  button: true,
                  child: IconButton(
                    icon: const Icon(Icons.close,
                        color: Color(0xFF7A93B2), size: 20),
                    onPressed: widget.onClose,
                  ),
                ),
              ],
            ),
          ),

          // Host Tabs
          TabBar(
            controller: _tabController,
            isScrollable: true,
            indicatorColor: const Color(0xFF00F0FF),
            labelColor: const Color(0xFF00F0FF),
            unselectedLabelColor: const Color(0xFF7A93B2),
            tabs: _hostKeys.map((hostId) {
              final res = widget.results[hostId];
              final bool ok = res?.success ?? false;
              return Tab(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      ok ? Icons.check_circle : Icons.error,
                      size: 14,
                      color: ok
                          ? const Color(0xFF00FFA3)
                          : const Color(0xFFFF2A6D),
                    ),
                    const SizedBox(width: 6),
                    Text(res?.hostName ?? hostId),
                  ],
                ),
              );
            }).toList(),
          ),

          // Terminal Output View
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: _hostKeys.map((hostId) {
                final res = widget.results[hostId];
                final String text = (res?.stdout.isNotEmpty ?? false)
                    ? res!.stdout
                    : (res?.stderr.isNotEmpty ?? false)
                        ? res!.stderr
                        : 'Няма изходни данни от терминала.';

                return Container(
                  margin: const EdgeInsets.all(12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white10),
                  ),
                  child: SingleChildScrollView(
                    child: SelectableText(
                      text,
                      style: TextStyle(
                        color: res?.success == true
                            ? const Color(0xFF00FFA3)
                            : const Color(0xFFFF2A6D),
                        fontFamily: 'monospace',
                        fontSize: 12,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

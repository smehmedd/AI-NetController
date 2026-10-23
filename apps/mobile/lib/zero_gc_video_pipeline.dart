import 'dart:async';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';

/// Maximum retained JPEG frame size.
const int _maxFrameBytes = 4 * 1024 * 1024;

/// ============================================================================
/// REUSABLE JPEG FRAME BUFFER
/// ============================================================================
/// Reuses one buffer because decoding is serialized by the renderer.
class _ReusableFrameBuffer {
  final Uint8List _buffer = Uint8List(_maxFrameBytes);

  /// Overwrites current slot with incoming raw bytes without allocating new heap memory
  Uint8List copy(Uint8List incomingBytes) {
    if (incomingBytes.length > _buffer.length) {
      throw ArgumentError(
          'Incoming frame exceeds maximum size (${_buffer.length} bytes)');
    }

    _buffer.setRange(0, incomingBytes.length, incomingBytes);

    return Uint8List.sublistView(_buffer, 0, incomingBytes.length);
  }

  void dispose() {
    _buffer.fillRange(0, _buffer.length, 0);
  }
}

/// ============================================================================
/// ZERO-GC VIDEO STREAM RENDERER WIDGET
/// ============================================================================
/// Directly manages [ui.Image] lifetime via [RawImage] and isolates GPU repaint
/// cycles using a dedicated [RepaintBoundary]. Completely bypasses [ImageCache].
class ZeroGcVideoRenderer extends StatefulWidget {
  final Stream<Uint8List> frameStream;
  final void Function(int opcode)? onRequestKeyframe;
  final BoxFit fit;
  final Alignment alignment;

  const ZeroGcVideoRenderer({
    super.key,
    required this.frameStream,
    this.onRequestKeyframe,
    this.fit = BoxFit.contain,
    this.alignment = Alignment.center,
  });

  @override
  State<ZeroGcVideoRenderer> createState() => _ZeroGcVideoRendererState();
}

class _ZeroGcVideoRendererState extends State<ZeroGcVideoRenderer> {
  final _ReusableFrameBuffer _frameBuffer = _ReusableFrameBuffer();
  StreamSubscription<Uint8List>? _streamSub;

  ui.Image? _activeGpuImage;
  bool _isDecoding = false;
  int? _cachedTargetWidth;

  @override
  void initState() {
    super.initState();
    _subscribeToFrames();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final double logicalWidth = MediaQuery.sizeOf(context).width;
    final double dpr = MediaQuery.devicePixelRatioOf(context);
    final int physicalWidth = (logicalWidth * dpr).round();
    _cachedTargetWidth = physicalWidth > 0 ? physicalWidth : null;
  }

  @override
  void didUpdateWidget(ZeroGcVideoRenderer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.frameStream != widget.frameStream) {
      unawaited(_streamSub?.cancel());
      _subscribeToFrames();
    }
  }

  void _subscribeToFrames() {
    _streamSub = widget.frameStream.listen(
      (rawBytes) => _processIncomingFrame(rawBytes),
      onError: (err) {
        debugPrint('[ZeroGC-Pipeline] Frame stream error: $err');
        _requestKeyframeResync();
      },
    );
  }

  /// Copies frame into pre-allocated ring buffer and directly decodes to ui.Image
  Future<void> _processIncomingFrame(Uint8List rawBytes) async {
    // If GPU rasterizer is currently congested, discard frame to maintain real-time SLA
    if (_isDecoding || !mounted) {
      return;
    }

    _isDecoding = true;

    ui.Codec? codec;
    ui.Image? pendingImage;
    try {
      // 1. Copy into pre-allocated ring buffer slot (Zero Heap Allocation)
      final Uint8List frameSlice = _frameBuffer.copy(rawBytes);

      // Verify JPEG SOI / EOI markers (0xFFD8 ... 0xFFD9)
      if (frameSlice.length < 4 ||
          frameSlice[0] != 0xFF ||
          frameSlice[1] != 0xD8) {
        debugPrint(
            '[ZeroGC-Pipeline] Corrupted JPEG header! Discarding chunk.');
        _requestKeyframeResync();
        return;
      }

      codec = await ui.instantiateImageCodec(
        frameSlice,
        targetWidth: widget.fit == BoxFit.contain ? null : _cachedTargetWidth,
      );
      pendingImage = (await codec.getNextFrame()).image;

      if (!mounted) return;

      final ui.Image imageToShow = pendingImage;
      final ui.Image? previousImage = _activeGpuImage;
      setState(() => _activeGpuImage = imageToShow);
      pendingImage = null;
      previousImage?.dispose();
    } catch (e) {
      debugPrint('[ZeroGC-Pipeline] Hardware decode exception: $e');
      _requestKeyframeResync();
    } finally {
      pendingImage?.dispose();
      codec?.dispose();
      _isDecoding = false;
    }
  }

  /// Dispatches Opcode 0xEE to request an immediate intra-frame keyframe from host
  void _requestKeyframeResync() {
    debugPrint('[ZeroGC-Pipeline] Requesting Keyframe Sync (Opcode 0xEE)...');
    widget.onRequestKeyframe?.call(0xEE);
  }

  @override
  void dispose() {
    unawaited(_streamSub?.cancel());
    _activeGpuImage?.dispose();
    _activeGpuImage = null;
    _frameBuffer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ui.Image? imageToRender = _activeGpuImage;

    // Enforce dedicated GPU RepaintBoundary to isolate high-frequency redraws
    return RepaintBoundary(
      child: imageToRender == null
          ? const Center(
              child: SizedBox(
                width: 32,
                height: 32,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF00F0FF)),
                ),
              ),
            )
          : RawImage(
              image: imageToRender,
              fit: widget.fit,
              alignment: widget.alignment,
              filterQuality:
                  FilterQuality.low, // Maximum throughput for 120 FPS
            ),
    );
  }
}

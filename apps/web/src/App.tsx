import React, { useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FloatingPillNav } from './components/FloatingPillNav';
import { FleetDashboard } from './components/FleetDashboard';
import { CommandOmnibar } from './components/CommandOmnibar';
import { ModalManager } from './components/ModalManager';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { HitlApprovalModal } from './components/HitlApprovalModal';
import { useWorkerEngine } from './hooks/useWorkerEngine';
import { useFleetState } from './hooks/useFleetState';
import { useUIStore } from './store/uiStore';
import { triggerHapticFeedback } from './services/hapticService';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

const CommandTerminal = React.lazy(() =>
  import('./components/CommandTerminal').then((module) => ({
    default: module.CommandTerminal,
  }))
);
const GeminiChatbot = React.lazy(() =>
  import('./components/GeminiChatbot').then((module) => ({
    default: module.GeminiChatbot,
  }))
);
const SettingsScreen = React.lazy(() =>
  import('./components/SettingsScreen').then((module) => ({
    default: module.SettingsScreen,
  }))
);

const TabLoadingFallback = () => (
  <div
    className="grid min-h-[320px] flex-1 place-items-center"
    aria-busy="true"
  >
    <div
      className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"
      aria-hidden="true"
    />
  </div>
);

export default function App() {
  const activeTab = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const openModal = useUIStore((s) => s.openModal);
  const isOmnibarOpen = useUIStore((s) => s.isOmnibarOpen);
  const setOmnibarOpen = useUIStore((s) => s.setOmnibarOpen);
  const language = useUIStore((s) => s.language);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const fleet = useFleetState();
  const agent = useWorkerEngine({
    targetId: fleet.selectedTarget,
    onTelemetry: fleet.updateHostTelemetry,
    onHostUnreachable: fleet.markHostUnreachable,
  });

  // Global Pull-Down Gesture for Spotlight-style Omnibar search
  useEffect(() => {
    let startY = 0;
    let startX = 0;
    let isTracking = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1 && window.scrollY <= 5 && e.touches[0].clientY < 250) {
        startY = e.touches[0].clientY;
        startX = e.touches[0].clientX;
        isTracking = true;
      } else {
        isTracking = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTracking || isOmnibarOpen) return;
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = currentY - startY;
      const deltaX = Math.abs(currentX - startX);

      if (deltaY > 60 && deltaY > deltaX * 1.3) {
        isTracking = false;
        triggerHapticFeedback('medium');
        setOmnibarOpen(true);
      }
    };

    const handleTouchEnd = () => {
      isTracking = false;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOmnibarOpen, setOmnibarOpen]);

  const handleSelectHostTerminal = useCallback(
    (hostId: string) => {
      fleet.setSelectedTarget(hostId);
      setActiveTab('terminal');
    },
    [fleet, setActiveTab]
  );

  const handleSelectHost = useCallback(
    (hostId: string) => fleet.setSelectedTarget(hostId),
    [fleet]
  );

  const handleInspectWol = useCallback(
    (dev: any) => openModal('wol', { device: dev, tab: 'direct' }),
    [openModal]
  );

  const handleViewScreen = useCallback(
    (dev: any) => {
      openModal('screen', dev);
      agent.requestScreenRefresh(dev.id);
    },
    [openModal, agent.requestScreenRefresh]
  );

  const handleOpenMemory = useCallback(() => openModal('memory'), [openModal]);
  const handleOpenCode = useCallback(() => openModal('code'), [openModal]);
  const handleOpenWs = useCallback(() => openModal('wsConfig'), [openModal]);
  const handleOpenTerminal = useCallback(() => setActiveTab('terminal'), [setActiveTab]);
  const handleOpenUpdate = useCallback(() => openModal('update'), [openModal]);
  const handleOpenWolScheduler = useCallback(() => openModal('wol', { tab: 'schedules' }), [openModal]);

  return (
    <GlobalErrorBoundary>
      <div className="min-h-[100dvh] bg-[#050811] text-white flex flex-col font-sans selection:bg-cyan-500/30 relative overflow-x-hidden">
        {/* Liquid Glass Ambient Refraction Field */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(circle at 85% 5%, rgba(0,212,255,0.08) 0%, transparent 45%), radial-gradient(circle at 10% 45%, rgba(99,102,241,0.07) 0%, transparent 50%), radial-gradient(circle at 80% 90%, rgba(14,165,233,0.06) 0%, transparent 45%)',
          }}
        />

        {agent.unreachableAlert && (
          <div className="fixed top-[env(safe-area-inset-top,10px)] left-1/2 -translate-x-1/2 z-[90] w-11/12 max-w-lg bg-rose-950/90 border border-rose-500/50 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-rose-200">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div className="text-xs leading-snug">{agent.unreachableAlert.message}</div>
            </div>
            <button
              onClick={agent.clearUnreachableAlert}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-1 rounded-lg text-rose-300 cursor-pointer"
              aria-label={language === 'bg' ? 'Затвори' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {agent.securityAlert && (
          <div className="fixed top-[calc(env(safe-area-inset-top,10px)+60px)] left-1/2 -translate-x-1/2 z-[95] w-11/12 max-w-lg bg-amber-950/95 border border-amber-500/60 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-amber-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-amber-100">{agent.securityAlert.title}</div>
                <div className="text-[11px] leading-snug text-amber-300/90 mt-0.5 break-words">{agent.securityAlert.reason}</div>
              </div>
            </div>
            <button
              onClick={agent.clearSecurityAlert}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-1 rounded-lg text-amber-300 shrink-0 hover:text-white cursor-pointer"
              aria-label={language === 'bg' ? 'Затвори' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <main className="w-full max-w-3xl mx-auto px-4 pt-3 pb-24 sm:pb-28 flex-1 flex flex-col overflow-x-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === 'fleet' && (
              <motion.div
                key="fleet"
                initial={{ opacity: 0, y: 8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.99, transition: { duration: 0.1 } }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 flex flex-col transform-gpu"
              >
                <FleetDashboard
                  hosts={fleet.hosts}
                  selectedTarget={fleet.selectedTarget}
                  onSelectHost={handleSelectHost}
                  quarantinedHosts={agent.quarantinedHosts}
                  circuitTrippedHosts={agent.circuitTrippedHosts}
                  onPanicKill={agent.panicKillAll}
                  onSelectHostForCommand={handleSelectHostTerminal}
                  onInspectWolPacket={handleInspectWol}
                  onViewScreen={handleViewScreen}
                  onRescan={fleet.scanMdns}
                  isScanning={fleet.isScanning}
                  isNetworkDisconnected={agent.isReconnecting}
                  onReconnectNetwork={agent.reconnectNow}
                />
              </motion.div>
            )}

            {activeTab === 'terminal' && (
              <motion.div
                key="terminal"
                initial={{ opacity: 0, y: 8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.99, transition: { duration: 0.1 } }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 flex flex-col transform-gpu"
              >
                <React.Suspense fallback={<TabLoadingFallback />}>
                  <CommandTerminal
                    hosts={fleet.hosts}
                    selectedTarget={fleet.selectedTarget}
                    onSelectTarget={fleet.setSelectedTarget}
                    onSendCommand={agent.sendCommand}
                    isExecuting={agent.isSendingCommand}
                    lastExecutionResult={agent.lastExecutionResult}
                    onViewScreen={handleViewScreen}
                    screenBase64={null}
                    onRefreshScreen={agent.requestScreenRefresh}
                    isCapturingScreen={agent.isCapturingScreen}
                  />
                </React.Suspense>
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.99, transition: { duration: 0.1 } }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 flex flex-col transform-gpu"
              >
                <React.Suspense fallback={<TabLoadingFallback />}>
                  <GeminiChatbot
                    hosts={fleet.hosts}
                    selectedTarget={fleet.selectedTarget}
                    onSendWol={(dev) => openModal('wol', { device: dev, tab: 'direct' })}
                    onSelectHost={handleSelectHostTerminal}
                    onTriggerRescan={fleet.scanMdns}
                    onToggleLabMode={() => openModal('wsConfig')}
                    isRealWsConnected={agent.isConnected}
                    latency={agent.latency}
                    wolSchedules={fleet.wolSchedules}
                  />
                </React.Suspense>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.99, transition: { duration: 0.1 } }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 flex flex-col transform-gpu"
              >
                <React.Suspense fallback={<TabLoadingFallback />}>
                  <SettingsScreen
                    onOpenPersistentInstructions={handleOpenMemory}
                    onOpenCodeViewer={handleOpenCode}
                    onOpenWsConfig={handleOpenWs}
                    onOpenTerminalLogs={handleOpenTerminal}
                    onOpenUpdateCenter={handleOpenUpdate}
                    onOpenWolScheduler={handleOpenWolScheduler}
                    activeWolSchedulesCount={fleet.activeWolSchedulesCount}
                    wolSchedules={fleet.wolSchedules}
                    hostsCount={fleet.hosts.length}
                  />
                </React.Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Global Detached Floating Pill Nav */}
        <FloatingPillNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          isConnected={agent.isConnected}
          latency={agent.latency}
        />

        {/* Spotlight Command Palette */}
        <CommandOmnibar
          hosts={fleet.hosts}
          selectedTarget={fleet.selectedTarget}
          onSelectHost={handleSelectHostTerminal}
          onSendCommand={agent.sendCommand}
          onSendWolDirect={(dev) => openModal('wol', { device: dev, tab: 'direct' })}
          onRescanMdns={fleet.scanMdns}
        />

        <HitlApprovalModal
          event={agent.activeHitlEvent}
          isOpen={!!agent.activeHitlEvent}
          onDecision={agent.resolveHitl}
        />

        <ModalManager
          hosts={fleet.hosts}
          wolSchedules={fleet.wolSchedules}
          onSendWolPacket={fleet.sendWolPacket}
          onTriggerSchedule={fleet.triggerSchedule}
          onUpdateSchedules={fleet.updateSchedules}
          onUpdateHostInstructions={fleet.updateHostInstructions}
          onAddHost={fleet.addCustomHost}
          isCapturingScreen={agent.isCapturingScreen}
          onRequestScreenRefresh={agent.requestScreenRefresh}
          wsUrl={agent.wsUrl}
          setWsUrl={agent.setWsUrl}
          isConnected={agent.isConnected}
          isConnecting={agent.isConnecting}
          heartbeatStatus={agent.heartbeatStatus}
          latency={agent.latency}
          heartbeatMetrics={agent.heartbeatMetrics}
          quarantinedHosts={agent.quarantinedHosts}
          onToggleQuarantine={agent.toggleQuarantine}
          circuitTrippedHosts={agent.circuitTrippedHosts}
          onResetCircuit={agent.resetHostCircuit}
          onConnectWs={agent.connect}
          onDisconnectWs={agent.disconnect}
          onSelectTarget={handleSelectHostTerminal}
          onViewScreen={(h) => openModal('screen', h)}
        />
      </div>
    </GlobalErrorBoundary>
  );
}

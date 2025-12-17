import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  Volume2, 
  Monitor, 
  Clock, 
  Gauge, 
  Sliders,
  ChevronLeft,
  Check
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface VideoSettingsMenuProps {
  // Stable Volume
  stableVolume: boolean;
  onStableVolumeChange: (enabled: boolean) => void;
  
  // Subtitles
  availableTextTracks: any[];
  currentTextTrack: string;
  onTextTrackChange: (language: string, role?: string) => void;
  
  // Sleep Timer
  sleepTimer: number;
  onSleepTimerChange: (minutes: number) => void;
  
  // Playback Speed
  playbackSpeed: number;
  onPlaybackSpeedChange: (speed: number) => void;
  
  // Quality
  availableQualities: string[];
  currentQuality: string;
  autoQualityEnabled: boolean;
  onQualityChange: (quality: string) => void;
  onAutoQualityToggle: () => void;
  sourceType?: string;
}

type MenuView = 'main' | 'subtitles' | 'sleep-timer' | 'speed' | 'quality';

export const VideoSettingsMenu = ({
  stableVolume,
  onStableVolumeChange,
  availableTextTracks,
  currentTextTrack,
  onTextTrackChange,
  sleepTimer,
  onSleepTimerChange,
  playbackSpeed,
  onPlaybackSpeedChange,
  availableQualities,
  currentQuality,
  autoQualityEnabled,
  onQualityChange,
  onAutoQualityToggle,
  sourceType
}: VideoSettingsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<MenuView>('main');

  const handleClose = () => {
    setIsOpen(false);
    setCurrentView('main');
  };

  const sleepTimerOptions = [
    { label: 'Off', value: 0 },
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '45 minutes', value: 45 },
    { label: '60 minutes', value: 60 }
  ];

  const speedOptions = [
    { label: '0.5x', value: 0.5 },
    { label: '0.75x', value: 0.75 },
    { label: '1x (Normal)', value: 1 },
    { label: '1.25x', value: 1.25 },
    { label: '1.5x', value: 1.5 },
    { label: '2x', value: 2 }
  ];

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 text-white hover:bg-white/10 hover:text-white transition-all"
      >
        <Settings className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={handleClose}
          />
          
          {/* Menu */}
          <div className="absolute bottom-12 right-0 w-80 bg-black/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-2xl z-[9999] overflow-hidden">
            {currentView === 'main' && (
              <div className="p-2">
                {/* Stable Volume */}
                <div 
                  className="flex items-center justify-between px-3 py-3 hover:bg-cyan-500/30 rounded-md cursor-pointer transition-colors"
                  onClick={() => onStableVolumeChange(!stableVolume)}
                >
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-5 w-5 text-white/90" />
                    <span className="text-sm font-medium text-white">Stable volume</span>
                  </div>
                  <Switch
                    checked={stableVolume}
                    onCheckedChange={onStableVolumeChange}
                    className="data-[state=checked]:bg-cyan-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Subtitles/CC */}
                <button
                  onClick={() => setCurrentView('subtitles')}
                  className="w-full flex items-center justify-between px-3 py-3 hover:bg-cyan-500/30 rounded-md transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-white/90" />
                    <span className="text-sm font-medium text-white">Subtitles/CC</span>
                  </div>
                  <span className="text-sm text-white/60">
                    {currentTextTrack === 'off' ? 'Off' : currentTextTrack.toUpperCase()}
                  </span>
                </button>

                {/* Sleep Timer */}
                <button
                  onClick={() => setCurrentView('sleep-timer')}
                  className="w-full flex items-center justify-between px-3 py-3 hover:bg-cyan-500/30 rounded-md transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-white/90" />
                    <span className="text-sm font-medium text-white">Sleep timer</span>
                  </div>
                  <span className="text-sm text-white/60">
                    {sleepTimer > 0 ? `${sleepTimer} min` : 'Off'}
                  </span>
                </button>

                {/* Playback Speed */}
                <button
                  onClick={() => setCurrentView('speed')}
                  className="w-full flex items-center justify-between px-3 py-3 hover:bg-cyan-500/30 rounded-md transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Gauge className="h-5 w-5 text-white/90" />
                    <span className="text-sm font-medium text-white">Playback speed</span>
                  </div>
                  <span className="text-sm text-white/60">
                    {playbackSpeed}x
                  </span>
                </button>

                {/* Quality */}
                {availableQualities.length > 0 && (
                  <button
                    onClick={() => setCurrentView('quality')}
                    className="w-full flex items-center justify-between px-3 py-3 hover:bg-cyan-500/30 rounded-md transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Sliders className="h-5 w-5 text-white/90" />
                      <span className="text-sm font-medium text-white">Quality</span>
                    </div>
                    <span className="text-sm text-white/60">
                      {autoQualityEnabled ? `Auto (${currentQuality})` : currentQuality}
                    </span>
                  </button>
                )}
              </div>
            )}

            {currentView === 'subtitles' && (
              <div className="p-2">
                <div className="flex items-center gap-2 px-3 py-2 mb-1">
                  <button 
                    onClick={() => setCurrentView('main')}
                    className="hover:bg-white/10 rounded p-1"
                  >
                    <ChevronLeft className="h-4 w-4 text-white" />
                  </button>
                  <span className="text-sm font-medium text-white">Subtitles/CC</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <button
                    onClick={() => {
                      onTextTrackChange('off');
                      setCurrentView('main');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-cyan-500/30 rounded-md transition-colors text-left ${
                      currentTextTrack === 'off' ? 'bg-cyan-500/20' : ''
                    }`}
                  >
                    <span className="text-sm text-white">Off</span>
                    {currentTextTrack === 'off' && <Check className="h-4 w-4 text-cyan-500" />}
                  </button>
                  {availableTextTracks.map((track, index) => {
                    const label = track.label || track.language || `Track ${index + 1}`;
                    const isActive = currentTextTrack === track.language;
                    return (
                      <button
                        key={`${track.language}-${track.role || index}`}
                        onClick={() => {
                          onTextTrackChange(track.language, track.role);
                          setCurrentView('main');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-cyan-500/30 rounded-md transition-colors text-left ${
                          isActive ? 'bg-cyan-500/20' : ''
                        }`}
                      >
                        <span className="text-sm text-white">{label}</span>
                        {isActive && <Check className="h-4 w-4 text-cyan-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {currentView === 'sleep-timer' && (
              <div className="p-2">
                <div className="flex items-center gap-2 px-3 py-2 mb-1">
                  <button 
                    onClick={() => setCurrentView('main')}
                    className="hover:bg-white/10 rounded p-1"
                  >
                    <ChevronLeft className="h-4 w-4 text-white" />
                  </button>
                  <span className="text-sm font-medium text-white">Sleep timer</span>
                </div>
                {sleepTimerOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSleepTimerChange(option.value);
                      setCurrentView('main');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-cyan-500/30 rounded-md transition-colors text-left ${
                      sleepTimer === option.value ? 'bg-cyan-500/20' : ''
                    }`}
                  >
                    <span className="text-sm text-white">{option.label}</span>
                    {sleepTimer === option.value && <Check className="h-4 w-4 text-cyan-500" />}
                  </button>
                ))}
              </div>
            )}

            {currentView === 'speed' && (
              <div className="p-2">
                <div className="flex items-center gap-2 px-3 py-2 mb-1">
                  <button 
                    onClick={() => setCurrentView('main')}
                    className="hover:bg-white/10 rounded p-1"
                  >
                    <ChevronLeft className="h-4 w-4 text-white" />
                  </button>
                  <span className="text-sm font-medium text-white">Playback speed</span>
                </div>
                {speedOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onPlaybackSpeedChange(option.value);
                      setCurrentView('main');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-cyan-500/30 rounded-md transition-colors text-left ${
                      playbackSpeed === option.value ? 'bg-cyan-500/20' : ''
                    }`}
                  >
                    <span className="text-sm text-white">{option.label}</span>
                    {playbackSpeed === option.value && <Check className="h-4 w-4 text-cyan-500" />}
                  </button>
                ))}
              </div>
            )}

            {currentView === 'quality' && (
              <div className="p-2">
                <div className="flex items-center gap-2 px-3 py-2 mb-1">
                  <button 
                    onClick={() => setCurrentView('main')}
                    className="hover:bg-white/10 rounded p-1"
                  >
                    <ChevronLeft className="h-4 w-4 text-white" />
                  </button>
                  <span className="text-sm font-medium text-white">Quality</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {(sourceType === "hls" || sourceType === "dash") && (
                    <button
                      onClick={() => {
                        onAutoQualityToggle();
                        setCurrentView('main');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-cyan-500/30 rounded-md transition-colors text-left ${
                        autoQualityEnabled ? 'bg-cyan-500/20' : ''
                      }`}
                    >
                      <span className="text-sm text-white">Auto ({currentQuality})</span>
                      {autoQualityEnabled && <Check className="h-4 w-4 text-cyan-500" />}
                    </button>
                  )}
                  {availableQualities.map((quality) => (
                    <button
                      key={quality}
                      onClick={() => {
                        onQualityChange(quality);
                        setCurrentView('main');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-cyan-500/30 rounded-md transition-colors text-left ${
                        currentQuality === quality && !autoQualityEnabled ? 'bg-cyan-500/20' : ''
                      }`}
                    >
                      <span className="text-sm text-white">{quality}</span>
                      {currentQuality === quality && !autoQualityEnabled && <Check className="h-4 w-4 text-cyan-500" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

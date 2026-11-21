import React from 'react';
import { ArrowLeft, ArrowRight, ArrowDown, ArrowUp, Zap, Flame, Wind } from 'lucide-react';
import { InputState } from '../types';
import { soundEngine } from '../audio/SoundEngine';

interface TouchControlsProps {
  input: InputState;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ input }) => {
  const setInputState = (key: keyof InputState, value: boolean) => {
    soundEngine.enableAudio();
    input[key] = value as any;
    if ((key === 'jump' || key === 'up') && value) {
      input.jumpPressed = true;
      input.jump = true;
    } else if ((key === 'jump' || key === 'up') && !value) {
      input.jumpReleased = true;
      input.jump = false;
    }
    if (key === 'attack' && value) {
      input.attackPressed = true;
    }
    if (key === 'dash' && value) {
      input.dashPressed = true;
      input.sprint = true;
    }
  };

  const handleTouch = (key: keyof InputState, active: boolean) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setInputState(key, active);
  };

  return (
    <div id="touch-controls-overlay" className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-end p-4 select-none touch-none">
      <div className="flex justify-between items-end w-full max-w-5xl mx-auto pointer-events-auto">
        {/* Left Side: D-Pad Cross */}
        <div className="flex flex-col items-center gap-1">
          {/* Up Arrow (Also jumps) */}
          <button
            id="touch-btn-up"
            onTouchStart={handleTouch('up', true)}
            onTouchEnd={handleTouch('up', false)}
            onTouchCancel={handleTouch('up', false)}
            onMouseDown={handleTouch('up', true)}
            onMouseUp={handleTouch('up', false)}
            className="w-14 h-14 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 active:bg-sky-500/40 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <ArrowUp className="w-7 h-7" />
          </button>

          <div className="flex items-center gap-1">
            {/* Left Arrow */}
            <button
              id="touch-btn-left"
              onTouchStart={handleTouch('left', true)}
              onTouchEnd={handleTouch('left', false)}
              onTouchCancel={handleTouch('left', false)}
              onMouseDown={handleTouch('left', true)}
              onMouseUp={handleTouch('left', false)}
              className="w-14 h-14 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 active:bg-sky-500/40 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-7 h-7" />
            </button>

            {/* Down (Crouch / Ground Pound) */}
            <button
              id="touch-btn-down"
              onTouchStart={handleTouch('down', true)}
              onTouchEnd={handleTouch('down', false)}
              onTouchCancel={handleTouch('down', false)}
              onMouseDown={handleTouch('down', true)}
              onMouseUp={handleTouch('down', false)}
              className="w-14 h-14 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 active:bg-sky-500/40 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <ArrowDown className="w-7 h-7" />
            </button>

            {/* Right Arrow */}
            <button
              id="touch-btn-right"
              onTouchStart={handleTouch('right', true)}
              onTouchEnd={handleTouch('right', false)}
              onTouchCancel={handleTouch('right', false)}
              onMouseDown={handleTouch('right', true)}
              onMouseUp={handleTouch('right', false)}
              className="w-14 h-14 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 active:bg-sky-500/40 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <ArrowRight className="w-7 h-7" />
            </button>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Dash / Speed Burst */}
          <button
            id="touch-btn-dash"
            onTouchStart={handleTouch('dash', true)}
            onTouchEnd={handleTouch('dash', false)}
            onTouchCancel={handleTouch('dash', false)}
            onMouseDown={handleTouch('dash', true)}
            onMouseUp={handleTouch('dash', false)}
            className="w-13 h-13 rounded-full bg-cyan-600/85 backdrop-blur-md border border-cyan-300/80 active:bg-cyan-500 text-white flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform font-bold text-[10px]"
          >
            <Wind className="w-5 h-5 mb-0.5" />
            <span>DASH</span>
          </button>

          {/* Attack / Fire (X) */}
          <button
            id="touch-btn-attack"
            onTouchStart={handleTouch('attack', true)}
            onTouchEnd={handleTouch('attack', false)}
            onTouchCancel={handleTouch('attack', false)}
            onMouseDown={handleTouch('attack', true)}
            onMouseUp={handleTouch('attack', false)}
            className="w-13 h-13 rounded-full bg-orange-600/85 backdrop-blur-md border border-orange-400/80 active:bg-orange-500 text-white flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform font-bold text-[10px]"
          >
            <Flame className="w-5 h-5 mb-0.5" />
            <span>FIRE</span>
          </button>

          {/* Sprint / Run (B) */}
          <button
            id="touch-btn-sprint"
            onTouchStart={handleTouch('sprint', true)}
            onTouchEnd={handleTouch('sprint', false)}
            onTouchCancel={handleTouch('sprint', false)}
            onMouseDown={handleTouch('sprint', true)}
            onMouseUp={handleTouch('sprint', false)}
            className="w-13 h-13 rounded-full bg-amber-600/85 backdrop-blur-md border border-amber-400/80 active:bg-amber-500 text-white flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform font-bold text-[10px]"
          >
            <Zap className="w-5 h-5 mb-0.5" />
            <span>RUN</span>
          </button>

          {/* Jump (A) */}
          <button
            id="touch-btn-jump"
            onTouchStart={handleTouch('jump', true)}
            onTouchEnd={handleTouch('jump', false)}
            onTouchCancel={handleTouch('jump', false)}
            onMouseDown={handleTouch('jump', true)}
            onMouseUp={handleTouch('jump', false)}
            className="w-15 h-15 rounded-full bg-sky-600/90 backdrop-blur-md border-2 border-sky-300 active:bg-sky-500 text-white flex flex-col items-center justify-center shadow-xl shadow-sky-500/30 active:scale-95 transition-transform font-black text-xs"
          >
            <span>JUMP</span>
          </button>
        </div>
      </div>
    </div>
  );
};

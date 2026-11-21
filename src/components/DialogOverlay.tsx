import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DialogOverlayProps {
  storyId: string;
  onComplete: () => void;
}

export const DialogOverlay: React.FC<DialogOverlayProps> = ({ storyId, onComplete }) => {
  const [step, setStep] = useState(0);

  // Simplified dialog content based on the memory shard
  const dialogs: Record<string, { speaker: string, text: string }[]> = {
    'memory_sunmeadow_1': [
      { speaker: 'Mysterious Voice', text: 'You found one. A fragment of the Astral Heart.' },
      { speaker: 'Mysterious Voice', text: 'It shattered so long ago, scattering memories across Luminara...' },
      { speaker: 'Milo', text: 'It feels... warm. Like a forgotten summer.' },
      { speaker: 'Mysterious Voice', text: 'Hold onto that warmth, young one. You will need it against the coming cold.' }
    ],
    'memory_sunmeadow_2': [
      { speaker: 'Milo', text: 'The wind here... it feels heavier.' },
      { speaker: 'Mysterious Voice', text: 'The shadow encroaches even here. The peaceful fields are only an illusion now.' }
    ],
    'memory_crystal_caverns_1': [
      { speaker: 'Ancient Miner', text: 'The crystals used to sing to us...' },
      { speaker: 'Ancient Miner', text: 'But when the shadow fell, their song turned to screams.' },
    ],
    'memory_crystal_caverns_2': [
      { speaker: 'Milo', text: 'These geodes... they\'re completely hollowed out.' },
      { speaker: 'Mysterious Voice', text: 'The darkness feeds on their inner light. Do not let it consume yours.' }
    ],
    'memory_whispering_woods_1': [
      { speaker: 'Forest Spirit', text: 'He was our protector once. Lord Malakor.' },
      { speaker: 'Forest Spirit', text: 'But the void whispered promises of eternal light. And he listened.' }
    ],
    'memory_whispering_woods_2': [
      { speaker: 'Mysterious Voice', text: 'Can you hear it, Milo? The forest is weeping.' },
      { speaker: 'Milo', text: 'I\'ll make it stop. I promise.' }
    ],
    'memory_emberpeak_1': [
      { speaker: 'Ignis', text: 'The flames... they burn cold now. The shadow consumes all.' },
    ],
    'memory_emberpeak_2': [
      { speaker: 'Milo', text: 'Even the magma feels wrong here. Like it\'s artificial.' },
      { speaker: 'Mysterious Voice', text: 'When the Heart broke, the natural order broke with it.' }
    ],
    'memory_cloudspire_1': [
      { speaker: 'Skywarden', text: 'We watched the darkness rise from the castle. We should have acted sooner.' },
      { speaker: 'Milo', text: 'I won\'t make that same mistake.' },
    ],
    'memory_cloudspire_2': [
      { speaker: 'Skywarden', text: 'Take the wind with you, boy. It is the only thing the shadow cannot touch.' }
    ],
    'memory_tidal_kingdom_1': [
      { speaker: 'Ocean Oracle', text: 'The tides have stopped. The heart of the world is broken.' }
    ],
    'memory_tidal_kingdom_2': [
      { speaker: 'Milo', text: 'The water is so murky. What happened here?' },
      { speaker: 'Mysterious Voice', text: 'Stagnation. A world without a heartbeat.' }
    ],
    'memory_clockwork_citadel_1': [
      { speaker: 'Chief Engineer', text: 'We built these machines to protect the shards. But we only locked them away from those who needed them.' }
    ],
    'memory_clockwork_citadel_2': [
      { speaker: 'Chief Engineer', text: 'The gears are rusted with sorrow. Be careful, adventurer.' }
    ],
    'memory_shadowfall_1': [
      { speaker: 'Malakor (Echo)', text: 'I only wanted to save them. If the light fades, I will become the eternal sun.' },
      { speaker: 'Milo', text: 'You didn\'t save them. You only trapped them in the dark.' }
    ],
    'memory_shadowfall_2': [
      { speaker: 'Mysterious Voice', text: 'This is the center. The place where the heart broke. And where it must be mended.' },
      { speaker: 'Milo', text: 'I\'m ready.' }
    ],
    // Default fallback
    'default': [
      { speaker: 'System', text: 'Memory Fragment Recovered.' },
      { speaker: 'System', text: 'The fragment pulses with an ancient energy.' }
    ]
  };

  const currentSequence = dialogs[storyId] || dialogs['default'];
  const currentMessage = currentSequence[step];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Enter', 'Space', 'KeyZ'].includes(e.code)) {
        e.preventDefault();
        if (step < currentSequence.length - 1) {
          setStep(s => s + 1);
        } else {
          onComplete();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, currentSequence.length, onComplete]);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-end p-4 sm:p-8"
        onClick={() => {
            if (step < currentSequence.length - 1) {
                setStep(s => s + 1);
            } else {
                onComplete();
            }
        }}
      >
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="bg-slate-900 border-2 border-sky-500/50 rounded-2xl shadow-2xl shadow-sky-900/50 max-w-4xl w-full mx-auto p-6 sm:p-8 relative overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-sky-500/10 to-transparent pointer-events-none" />

          <div className="relative z-10">
            <h3 className="text-sky-400 font-bold text-xl uppercase tracking-widest mb-2 font-serif">
              {currentMessage.speaker}
            </h3>
            
            <p className="text-slate-200 text-lg sm:text-2xl leading-relaxed font-serif">
              {currentMessage.text}
            </p>

            <div className="mt-8 flex justify-end">
              <motion.div 
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="flex items-center gap-2 text-sky-400 font-mono text-sm opacity-80"
              >
                <span>{step < currentSequence.length - 1 ? 'NEXT' : 'CONTINUE'}</span>
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

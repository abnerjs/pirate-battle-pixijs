import { Navigation } from 'lucide-react'
import type React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const ControlInstructions: React.FC = () => {
  return (
    <Card className="bg-slate-950/90 border-amber-900/50 text-secondary backdrop-blur-md">
      <CardHeader className="py-2.5 px-4 border-b border-amber-950/40">
        <CardTitle className="text-sm flex items-center gap-2 text-secondary font-sans">
          <Navigation className="h-4 w-4 text-secondary" /> Controls Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {/* Navigation & Steer */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-amber-950/40 space-y-1.5">
          <div className="font-bold text-secondary flex items-center gap-1.5 text-[11px]">
            <Navigation className="h-3.5 w-3.5 text-secondary" /> Steer & Sail
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-secondary/80">Move:</span>
              <div className="flex gap-1 font-mono">
                <kbd className="px-1 rounded bg-slate-800 text-secondary border border-slate-700">
                  W
                </kbd>
                <kbd className="px-1 rounded bg-slate-800 text-secondary border border-slate-700">
                  S
                </kbd>
                <span className="text-slate-500">/</span>
                <kbd className="px-1 rounded bg-slate-800 text-secondary border border-slate-700">
                  ↑
                </kbd>
                <kbd className="px-1 rounded bg-slate-800 text-secondary border border-slate-700">
                  ↓
                </kbd>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary/80">Turn:</span>
              <div className="flex gap-1 font-mono">
                <kbd className="px-1 rounded bg-slate-800 text-secondary border border-slate-700">
                  A
                </kbd>
                <kbd className="px-1 rounded bg-slate-800 text-secondary border border-slate-700">
                  D
                </kbd>
                <span className="text-slate-500">/</span>
                <kbd className="px-1 rounded bg-slate-800 text-secondary border border-slate-700">
                  ←
                </kbd>
                <kbd className="px-1 rounded bg-slate-800 text-secondary border border-slate-700">
                  →
                </kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Front Cannon */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-amber-950/40 space-y-1.5">
          <div className="font-bold text-secondary flex items-center gap-1.5 text-[11px]">
            <img
              src="/assets/png/default/ui/controls/icon_fire_front.png"
              alt="Front Fire"
              className="h-4 w-4 object-contain"
            />{' '}
            Front Shot
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-secondary/80">Single Cannon:</span>
              <div className="flex gap-1 font-mono">
                <kbd className="px-1.5 rounded bg-slate-800 text-secondary border border-slate-700">
                  Space
                </kbd>
                <span className="text-slate-500">/</span>
                <kbd className="px-1 rounded bg-slate-800 text-secondary border border-slate-700">
                  J
                </kbd>
              </div>
            </div>
            <p className="text-[10px] text-secondary/70 italic">Precision frontal attack</p>
          </div>
        </div>

        {/* Broadside Cannons */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-amber-950/40 space-y-1.5">
          <div className="font-bold text-secondary flex items-center gap-1.5 text-[11px]">
            <img
              src="/assets/png/default/ui/controls/icon_fire_left.png"
              alt="Side Fire"
              className="h-4 w-4 object-contain"
            />{' '}
            Broadside Fire (3x)
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-secondary/80">Left Side:</span>
              <div className="flex gap-1 font-mono">
                <kbd className="px-1 rounded bg-slate-800 text-secondary border border-slate-700">
                  Q
                </kbd>
                <span className="text-slate-500">/</span>
                <kbd className="px-1 rounded bg-slate-800 text-secondary border border-slate-700">
                  U
                </kbd>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary/80">Right Side:</span>
              <div className="flex gap-1 font-mono">
                <kbd className="px-1 rounded bg-slate-800 text-secondary border border-slate-700">
                  E
                </kbd>
                <span className="text-slate-500">/</span>
                <kbd className="px-1 rounded bg-slate-800 text-secondary border border-slate-700">
                  I
                </kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Pause & Mobile Controls */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-amber-950/40 space-y-1.5">
          <div className="font-bold text-secondary flex items-center gap-1.5 text-[11px]">
            <img
              src="/assets/png/default/ui/controls/icon_pause.png"
              alt="Pause"
              className="h-4 w-4 object-contain"
            />{' '}
            Pause & Mobile
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-secondary/80">Pause:</span>
              <div className="flex gap-1 font-mono">
                <kbd className="px-1 rounded bg-slate-800 text-secondary border border-slate-700">
                  P
                </kbd>
                <span className="text-slate-500">/</span>
                <kbd className="px-1.5 rounded bg-slate-800 text-secondary border border-slate-700">
                  Esc
                </kbd>
              </div>
            </div>
            <p className="text-[10px] text-secondary/70 italic">Touch overlay active on mobile</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

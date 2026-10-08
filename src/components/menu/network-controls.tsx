import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Clock, FileX, RefreshCw, ShieldCheck, Wifi } from 'lucide-react'
import type React from 'react'
import { HISTORY_QUERY_KEY, RANKING_QUERY_KEY } from '@/api/queries'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useNetworkStore } from '@/lib/network-store'
import { resetMockDatabase } from '@/mocks/handlers'
import type { NetworkScenario } from '@/types/game'

export const NetworkControls: React.FC = () => {
  const { scenario, setScenario, triggerResetFixtures } = useNetworkStore()
  const queryClient = useQueryClient()

  const handleScenarioChange = (value: string) => {
    setScenario(value as NetworkScenario)
    queryClient.invalidateQueries({ queryKey: RANKING_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY })
  }

  const handleResetData = () => {
    resetMockDatabase()
    triggerResetFixtures()
    queryClient.invalidateQueries({ queryKey: RANKING_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY })
  }

  const getScenarioBadge = () => {
    switch (scenario) {
      case 'success':
        return (
          <Badge variant="success" className="gap-1 border-emerald-500/40 text-[10px] py-0 px-1.5">
            <ShieldCheck className="h-3 w-3" /> 200 OK
          </Badge>
        )
      case 'slow':
        return (
          <Badge variant="gold" className="gap-1 border-amber-500/40 text-[10px] py-0 px-1.5">
            <Clock className="h-3 w-3" /> Latency (+2s)
          </Badge>
        )
      case 'empty':
        return (
          <Badge variant="secondary" className="gap-1 border-slate-600 text-[10px] py-0 px-1.5">
            <FileX className="h-3 w-3" /> Empty Data
          </Badge>
        )
      case 'error_500':
        return (
          <Badge variant="destructive" className="gap-1 border-red-500/40 text-[10px] py-0 px-1.5">
            <AlertTriangle className="h-3 w-3" /> HTTP 500
          </Badge>
        )
      case 'timeout':
        return (
          <Badge variant="destructive" className="gap-1 border-red-500/40 text-[10px] py-0 px-1.5">
            <Wifi className="h-3 w-3" /> Timeout
          </Badge>
        )
      case 'delayed_post':
        return (
          <Badge variant="gold" className="gap-1 border-amber-500/40 text-[10px] py-0 px-1.5">
            <Clock className="h-3 w-3" /> Delayed Post (3s)
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-slate-950/90 border border-amber-950/60 rounded-lg px-3 py-1.5 backdrop-blur-md flex flex-row items-center justify-between gap-2 text-xs shrink-0 text-secondary">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 font-bold text-secondary text-[11px]">
          <Wifi className="h-3.5 w-3.5 text-secondary" /> MSW Simulator:
        </div>
        {getScenarioBadge()}
      </div>

      <div className="flex items-center gap-2">
        <Select value={scenario} onValueChange={handleScenarioChange}>
          <SelectTrigger className="w-[150px] h-7 text-[11px] border-amber-900/60 bg-slate-900 text-secondary">
            <SelectValue placeholder="Scenario" />
          </SelectTrigger>
          <SelectContent className="bg-slate-950 border-amber-900/60 text-secondary">
            <SelectItem value="success">Success (200 OK)</SelectItem>
            <SelectItem value="empty">Empty Data List</SelectItem>
            <SelectItem value="slow">Slow Network (2s delay)</SelectItem>
            <SelectItem value="delayed_post">Delayed Match Post (3s)</SelectItem>
            <SelectItem value="error_500">Server Error (500)</SelectItem>
            <SelectItem value="timeout">Network Timeout</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={handleResetData}
          className="h-7 text-[11px] border-amber-900/60 text-secondary hover:text-white px-2"
          title="Reset local fixtures to initial state"
        >
          <RefreshCw className="h-3 w-3 mr-1 text-secondary" /> Reset Data
        </Button>
      </div>
    </div>
  )
}

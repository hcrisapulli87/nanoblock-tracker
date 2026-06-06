import { spawn } from 'child_process'
import { EventEmitter } from 'events'

export type TunnelStatus = 'connecting' | 'connected' | 'stopped'

export class TunnelManager extends EventEmitter {
  status: TunnelStatus = 'connecting'
  private proc: ReturnType<typeof spawn> | null = null
  private stopped = false

  constructor(private readonly tunnelName: string) {
    super()
    this.launch()
  }

  private launch(): void {
    this.proc = spawn('cloudflared', ['tunnel', 'run', this.tunnelName], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    const onData = (data: Buffer): void => {
      if (data.toString().includes('Registered tunnel connection')) {
        this.status = 'connected'
        this.emit('status', 'connected' as TunnelStatus)
      }
    }

    this.proc.stdout?.on('data', onData)
    this.proc.stderr?.on('data', onData)

    this.proc.on('exit', () => {
      if (this.stopped) return
      this.status = 'connecting'
      this.emit('status', 'connecting' as TunnelStatus)
      setTimeout(() => {
        if (!this.stopped) this.launch()
      }, 5000)
    })
  }

  stop(): void {
    this.stopped = true
    this.status = 'stopped'
    this.emit('status', 'stopped' as TunnelStatus)
    this.proc?.kill()
  }
}

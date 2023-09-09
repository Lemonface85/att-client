export type SubscriptionEvent =
  | 'DebugLog'
  | 'ErrorLog'
  | 'FatalLog'
  | 'InfoLog'
  | 'InventoryChanged'
  | 'ObjectKilled'
  | 'PlayerJoined'
  | 'PlayerKilled'
  | 'PlayerLeft'
  | 'PlayerMovedChunk'
  | 'PlayerStateChanged'
  | 'PopulationModified'
  | 'ProfilingData'
  | 'SocialTabletPlayerReported'
  | 'TraceLog'
  | 'TradeDeckUsed'
  | 'TrialFinished'
  | 'TrialStarted'
  | 'WarnLog';

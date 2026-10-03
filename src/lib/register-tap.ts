export interface TapState { count: number; last: number; }
export function registerTap(state: TapState,now:number): { state:TapState;triggered:boolean } {const count=now>=state.last && now-state.last<=700?state.count+1:1;return {state:{count:count===3?0:count,last:now},triggered:count===3};}

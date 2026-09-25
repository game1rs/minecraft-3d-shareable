export class NetworkSession {
  constructor() {
    this.mode = "offline";
    this.peers = [];
  }
  isOnline() { return false; }
  dispatch(action) { return action; }
  apply(state, action) { return state; }
}

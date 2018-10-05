import { Hypermerge } from "."
import RouterClient from "./RouterClient"

export default function routerSwarm(hm: Hypermerge, opts: any) {
  const mergedOpts = {
    stream: (opts: any) => hm.replicate(opts),
    ...opts,
  }

  const swarm = (hm.swarm = new RouterClient(mergedOpts))

  swarm.join(hm.core.archiver.changes.discoveryKey)

  Object.values(hm.feeds).forEach(feed => {
    swarm.join(feed.discoveryKey)
  })

  hm.core.archiver.on("add", (feed: any) => {
    swarm.join(feed.discoveryKey)
  })

  hm.core.archiver.on("remove", (feed: any) => {
    swarm.leave(feed.discoveryKey)
  })

  swarm.listen(0)

  swarm.once("error", err => {
    swarm.listen(0)
  })

  return swarm
}

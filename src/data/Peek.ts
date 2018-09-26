
import { once } from "lodash"

var _enable = once(() => {
  let global : any = window;
  global.peek = (id : any, flags = "") => {
    if (id) {
      for (let docId in global.sm.docHandles) {
        if (docId.startsWith(id)) {
            // copy to clipboard
            let handle = global.sm.docHandles[docId]
            let _peers = handle.__actorIds().reduce((acc : any,id: any) => acc.concat(global.hm._trackedFeed(id).peers),[])

            let peers = _peers.filter((p: any) => !!p.user)

            if (flags.includes("c")) {
              console.log(`%c begin copy...`, "color: green");
              const el = document.createElement('textarea');
              el.value = JSON.stringify(global.sm.debugLogs[docId])
              const len = el.value.length
              el.setAttribute('readonly', '');
              el.style.position = 'absolute';
              el.style.left = '-9999px';
              document.body.appendChild(el);
              el.select();
              document.execCommand('copy');
              document.body.removeChild(el);
              console.log(`%c ${len} characters copied to clipboard`, "color: green");
            }

            if (flags.includes("p")) {
              console.log(`${_peers.length} total connections`)
              console.log("Swarm",global.hm._swarmStats)
              peers.forEach((p : any) => {
                let age = Date.now() - p.synTime
                let stats = age < 10000 ? "connected" : "disconnected"
                let red = "color: red"
                let green = "color: green"
                let black = "color: black"
                let purple = "color: purple"
                let statusColor = age < 10000 ? green : red;
                console.log(
                  `user=%c"${p.user}"%c doc=%c"${p.docId.slice(0,5)}"%c status=%c'${stats}'%c" lastSyn=%c${age}ms`,
                  red, black, red, black, statusColor, black, purple)
              })
            }

            if (flags.includes("j")) {
              console.log(handle.toString(4))
            }

            if (flags == "") {
              // doc detail
              console.log("DocId: - %c " + docId, "color: blue")
              console.log("Document: ", handle)
              //console.log(JSON.parse(handle.toString(4)))
              console.log("ActorIds:", handle.__actorIds())
              console.log("Peers:", _peers)
            }
        }
      }
    } else {
      console.log("%c USAGE:", "color: green")
      console.log("%c  peek(docid) - get detailed summary", "color: green")
      console.log("%c  peek(docid, 'j') - show a json dump of the document", "color: green")
      console.log("%c  peek(docid, 'c') - copy automerge history to clipboard", "color: green")
      console.log("%c  peek(docid, 'p') - show peer and connectivity info", "color: green")
      console.log("%c  peek(docid, 'jcp') - do all there", "color: green")
      for (let docId in global.sm.docHandles) {
        let handle = global.sm.docHandles[docId]
        let body = handle.toString()
        let peers = handle.__actorIds().reduce((acc: any,id: any) => acc.concat(global.hm._trackedFeed(id).peers),[])
        if (body.length > 40) body = body.slice(0,37) + "..."
        console.log("%c " + docId.slice(0,5), "color: blue", " : " + peers.length + " peers, '" + body + "'",)
      }
    }
  }
})


export function enable() {
  _enable()
}

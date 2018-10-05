
const PORT = 8080

let express = require('express');
let app = express();
let expressWs = require('express-ws')(app);

app.use(function (req, res, next) {
//  console.log('headers', req.headers);
//  console.log('url', req.url);
  return next();
});

 
app.get('/', (req, res, next) => {
  console.log("get /");
  res.end();
});
 
app.ws('/discovery', (ws, req) => {
  console.log("discovery connection")
  ws.on('message', (data) => {
    console.log("message",data);
    const msg = JSON.parse(data)
//    console.log("message",msg);
    const reply = {
      id: "abc123",
      dks: ["foo","bar"],
    }
    ws.send(JSON.stringify(reply))
  });
});

app.ws('/peer/:peer1/:peer2', (ws, req) => {
  console.log("connect peers", req.params)
})
 
app.listen(PORT, "0.0.0.0", (err) => {
  console.log("Listening on port",PORT)
});


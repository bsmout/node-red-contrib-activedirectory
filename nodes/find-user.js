module.exports = function(RED) {

  function findUserNode(config) {
    RED.nodes.createNode(this,config);
    let node = this;
    // we get the properties
    node.url = config.url;
    node.baseDN = config.baseDN
    // we get the credentials
    let cUsername = this.credentials.username;
    let cPassword = this.credentials.password;
    this.on('input', function(msg) {
      node.status({fill:"blue",shape:"ring",text:"connecting"});
      // import activedirectory2
      var ActiveDirectory = require('activedirectory2');
      var adConfig = {
        url: node.url,
        baseDN: node.baseDN,
        username: cUsername,
        password: cPassword
      };
      // set attributes if defined
      if (msg.ad_attributes) {
        // Validates the Object format (required for IBMi platform)
        adConfig.attributes = JSON.parse(JSON.stringify(msg.ad_attributes));
      }
      if (msg.tlsOptions) {
        // Validates the Object format (required for IBMi platform)
        adConfig.tlsOptions = JSON.parse(JSON.stringify(msg.tlsOptions));
      }
      try {
        var ad = new ActiveDirectory(adConfig);
        node.status({fill:"green",shape:"dot",text:"connected"});
        // Find user by his DN
        var dn = msg.payload;
        node.status({fill:"blue",shape:"ring",text:"querying"});
        ad.findUser(dn, function(err, user) {
          if (err) {
            let errTxt = 'ERROR querying: ' + JSON.stringify(err);
            node.status({fill:"red", shape:"dot", text:"error querying"});
            node.error(errTxt);
          } else if (! user) {
            var errTxt = "User " + dn + " not found";
            delete msg.payload;
            msg.ad_error = errTxt;
            node.status({fill:"yellow", shape:"dot", text: errTxt});
            node.send(msg);
          } else {
            msg.payload = user;
            node.status({fill:"green", shape:"dot", text:"user" + dn + "found"});
            node.send(msg);
          }
        });
      } catch(e) {
        let errTxt = 'ERROR connecting: ' + e.message;
        node.status({fill:"red", shape:"dot", text:"connection error"});
        node.error(errTxt, msg);
      }
    });
  }

  RED.nodes.registerType("find-user",findUserNode,{
    credentials: {
      username: {type:"text"},
      password: {type:"password"}
    }
  });
}

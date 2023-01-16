const express = require('express');
const https = require('https');
const app = express();

const getFireStoreProp = value => {
    const props = { 'arrayValue': 1, 'bytesValue': 1, 'booleanValue': 1, 'doubleValue': 1, 'geoPointValue': 1, 'integerValue': 1, 'mapValue': 1, 'nullValue': 1, 'referenceValue': 1, 'stringValue': 1, 'timestampValue': 1 }
    return Object.keys(value).find(k => props[k] === 1)
  }
  
  const FireStoreParser = value => {
    const prop = getFireStoreProp(value)
    if (prop === 'doubleValue' || prop === 'integerValue') {
      value = Number(value[prop])
    }
    else if (prop === 'arrayValue') {
      value = (value[prop] && value[prop].values || []).map(v => FireStoreParser(v))
    }
    else if (prop === 'mapValue') {
      value = FireStoreParser(value[prop] && value[prop].fields || {})
    }
    else if (prop === 'geoPointValue') {
      value = { latitude: 0, longitude: 0, ...value[prop] }
    }
    else if (prop) {
      value = value[prop]
    }
    else if (typeof value === 'object') {
      Object.keys(value).forEach(k => value[k] = FireStoreParser(value[k]))
    }
    return value;
  }

app.get('/Characters', function(req, res) {
    
    
    https.get('https://api.lucasarts.fr/genshin/Characters.json', function(httpsRes) {

        var data = '';

        httpsRes.on('data', function(chunk) {
            data += chunk;
        });

        httpsRes.on('end', function() {
            // Set Header    
            res.set({'Content-Type': 'application/json'});     
            // Get Data
            var json = JSON.parse(data); 
            // Beautify Firestore Doc
            var FireStoreParserData = FireStoreParser(json["documents"]); 
            // Create the New Json With Data Only
            const NewJson = FireStoreParserData.map(Chara => {
                return {[Chara.name.split('/').pop()] : {...Chara.fields, Update : Chara.updateTime}}
            })
            // Format Json for Browser          
            var formattedJson = JSON.stringify(NewJson, 0, 2);       
            // Display Json     
            res.send(formattedJson);

        });
    });
});

app.listen(8080, function() { console.log('Server listening on port 8080');});
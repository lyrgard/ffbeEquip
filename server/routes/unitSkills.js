import fs from 'fs'
import express from 'express'

export const route = express.Router();

let data = {
    GL: {version: 0, date: 0, data: {}},
    JP: {version: 0, date: 0, data: {}}
}

route.get('/:server/unit/:unitId', async (req, res) => {
  const { server, unitId } = req.params;
  
  let now = Date.now();
    
  if (data[server]) {
      // check if new data available
      if ((data[server].date > now - 300000 || !data[server].data[unitId])) {
          const dataVersionContent = fs.readFileSync(`./static/${server}/dataVersion.json`, 'utf8');
          const dataVersion = JSON.parse(dataVersionContent).version;
          if (dataVersion > data[server].version) {
              data[server].data = JSON.parse(fs.readFileSync(`./static/${server}/unitsWithSkill.json`, 'utf8'));
          }
          data[server].date = now;
          data[server].version = dataVersion;
      }
      
      if (data[server].data[unitId]) {
          return res.status(200).json(data[server].data[unitId]);        
      } else {
          res.status(500).send({error: "Unknown unit: " + unitId});
      }
  } else {
      res.status(500).send({error: "Unknown server: " + server});
  }
});

export default route;
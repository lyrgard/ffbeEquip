#!/bin/bash

node initReleasedUnits.js
cp releasedUnits.json ../../static/JP
node parseUnits.js
cp unit* ../../static/JP
node parseItems.js
cp data* ../../static/JP
cp visionCards.json ../../static/JP

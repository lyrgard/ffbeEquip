import express from 'express'
import fs from 'fs'

console.log("Starting");
let currentUnits = JSON.parse(fs.readFileSync('../../static/GL/units.json', {encoding: 'utf8'}));


let newUnits = JSON.parse(fs.readFileSync('./units.json', {encoding: 'utf8'}));


let changes = {}

Object.keys(newUnits).forEach(newUnit => {
    let notFound = true;
    Object.keys(currentUnits).forEach(unit => {
        if (newUnits[newUnit].id == currentUnits[unit].id){
            notFound = false;
            if (newUnits[newUnit].name !== currentUnits[unit].name){
                console.log("Name Change For " + currentUnits[unit].name + " Detected");
                console.log(currentUnits[unit].name + " should be " + newUnits[newUnit].name);
                changes[newUnits[newUnit].id] = newUnits[newUnit]
                currentUnits[unit] = newUnits[newUnit]
            }

            if (newUnits[newUnit].roles !== currentUnits[unit].roles){
                //console.log("Writing " + currentUnits[unit].name + " role from " + currentUnits[unit].roles  + " to " + newUnits[newUnit].roles)
                currentUnits[unit].roles = newUnits[newUnit].roles
            }
        }
    })

    if (notFound === true){
        changes[newUnits[newUnit].id] = newUnits[newUnit]
    }
})

let releasedUnits = JSON.parse(fs.readFileSync('../../static/GL/releasedUnits.json', {encoding: 'utf8'}));

Object.keys(changes).forEach((unit) => {
    currentUnits[changes[unit].id] = changes[unit]
    if (changes[unit].braveShift){
        console.log(changes[unit].braveShift)
        console.log(changes[unit].id)
        console.log(changes[unit].name)
        releasedUnits[changes[unit].id] = {"type":"summon","name":changes[unit].name}
    }
})

console.log("Writing to units.json...")
fs.writeFileSync('../../static/GL/units.json', JSON.stringify(currentUnits))
console.log("Writing to releasedUnits.json...")
fs.writeFileSync('../../static/GL/releasedUnits.json', JSON.stringify(releasedUnits))
console.log("Completed writing changes...")
console.log("Please verify changes are correct.")
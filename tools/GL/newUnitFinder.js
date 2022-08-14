import express from 'express'
import fs from 'fs'

console.log("Starting");
let currentUnits = JSON.parse(fs.readFileSync('../../static/GL/units.json', {encoding: 'utf8'}));


let newUnits = JSON.parse(fs.readFileSync('./units.json', {encoding: 'utf8'}));


let changes = {}

Object.keys(newUnits).forEach(newUnit => {
    Object.keys(currentUnits).forEach(unit => {
        if (newUnits[newUnit].id == currentUnits[unit].id){
            if (newUnits[newUnit].name !== currentUnits[unit].name){
                console.log("Name Change For " + currentUnits[unit].name + " Detected");
                console.log(currentUnits[unit].name + " should be " + newUnits[newUnit].name);
                changes[newUnits[newUnit].id] = newUnits[newUnit]
                currentUnits[unit] = newUnits[newUnit]
            }

            if (newUnits[newUnit].roles !== currentUnits[unit].roles){
                console.log("Writing " + currentUnits[unit].name + " role from " + currentUnits[unit].roles  + " to " + newUnits[newUnit].roles)
                currentUnits[unit].roles = newUnits[newUnit].roles
            }
        }
    })
})

console.log(changes)

console.log("Writing to units.json...")
fs.writeFileSync('../../static/GL/units.json', JSON.stringify(currentUnits))
console.log("Completed writing changes...")
console.log("Please verify changes are correct in unit.json")
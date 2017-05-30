/*
honeycomb

Creates a grid of hexagons.

https://github.com/danmarshall/easel-apps

Copyright 2107 Dan Marshall

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

var makerjs = require('makerjs');
var meapi = require('makerjs-easel-api');

// Define a properties array that returns array of objects representing
// the accepted properties for your application
var properties = [
    { id: 'Hex width in mm', type: 'range', min: 2, max: 100, value: 20 },
    { id: 'Margin in mm', type: 'range', min: 0, max: 16, value: 3 },
    { id: 'Columns', type: 'range', min: 1, max: 50, value: 7 },
    { id: 'Rows', type: 'range', min: 1, max: 50, value: 7 },
];

// Define an executor function that builds an array of volumes,
// and passes it to the provided success callback, or invokes the failure
// callback if unable to do so
var executor = function (args, success, failure) {
    var params = args.params;
    var material = args.material;

    var mmScale = makerjs.units.conversionScale('mm', 'inch');

    var hexWidth = params["Hex width in mm"] * mmScale;
    var margin = params["Margin in mm"] * mmScale;
    var xcount = params["Columns"];
    var ycount = params["Rows"];

    var hex = new makerjs.models.Polygon(6, hexWidth / 2, 30, true);

    var honeycomb = makerjs.layout.cloneToHoneycomb(hex, xcount, ycount, margin);
    makerjs.model.zero(honeycomb);
    makerjs.model.originate(honeycomb);

    var allPoints = [];
    var measurement = makerjs.measure.modelExtents(honeycomb);

    makerjs.model.findChains(honeycomb, function (chains, loose, layer) {
        chains.forEach(function (chain) {
            allPoints.push(meapi.exportChainToEaselPoints(chain));
        });
    });

    var volume = {
        shape: {
            type: "path",
            points: allPoints,
            flipping: {},
            center: meapi.toEaselPoint(measurement.center),
            width: measurement.width,
            height: measurement.height,
            rotation: 0
        },
        cut: {
            depth: material.dimensions.z,
            type: 'fill',
            outlineStyle: 'on-path',
            tabPreference: false
        }
    };

    success([volume]);
};

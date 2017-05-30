/*
streamliner

Streamlines a path by adding fillets at all sharp corners.

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
    { type: 'range', id: "Radius", value: 2, min: 0, max: 20, step: 0.5 },
    { type: 'boolean', id: "Replace", value: false }
];

// Define an executor function that builds an array of volumes,
// and passes it to the provided success callback, or invokes the failure
// callback if unable to do so
var executor = function (args, success, failure) {
    var params = args.params;
    var radius = params.Radius * makerjs.units.conversionScale('mm', 'inch');

    //get selected volume
    if (args.selectedVolumeIds.length > 1) {
        return failure('please select only one volume.');
    }

    var v = (function (volumes, selectedId) { for (var i = 0; i < volumes.length; i++) { if (volumes[i].id == selectedId) return volumes[i] } })(args.volumes, args.selectedVolumeIds[0]);

    if (!v) {
        return failure('could not get selected volume :(');
    }

    var shape = v.shape;

    if (shape.type == 'ellipse') {
        return failure('can\'t streamline an ellipse :)');
    }

    if (shape.type == 'line') {
        return failure('can\'t streamline a line :)');
    }

    if (shape.type == 'text') {
        return failure('can\'t streamline text. Try converting it to a path first.');
    }

    var model = meapi.importEaselShape(shape);

    var allPoints = [];
    var measurement;

    makerjs.model.findChains(model, function (chains, loose, layer) {

        chains.forEach(function (chain) {

            var fillets = makerjs.chain.fillet(chain, radius);
            var chainModel = makerjs.chain.toNewModel(chain);

            if (fillets) {
                chainModel.models = { fillets: fillets };
            }

            if (!measurement) {
                measurement = makerjs.measure.modelExtents(chainModel);
            }

            //now find a new chain including the fillets
            var fChain = makerjs.model.findSingleChain(chainModel);
            //allPoints.push(toKeyPoints2(fChain));
            allPoints.push(meapi.exportChainToEaselPoints(fChain));

        });
    });

    var volume = {
        shape: {
            type: "path",
            points: allPoints,
            flipping: {},
            center: shape.center,
            width: measurement.width,
            height: measurement.height,
            rotation: 0
        },
        cut: v.cut
    };

    if (params.Replace) {
        volume.id = v.id;
    }

    success([volume]);
};

define(function () {
    return {
        getClass: function (value, datapoint) {

            var classIndex = 0,
                match = false,
                scales = {
                "U5MR_": [25, 50, 100, 150, 200],
                "NMR_": [10, 20, 30, 40, 50]
            };

            for (var i = 0; i < scales[datapoint].length; i++) {
                if (value <= scales[datapoint][i]) {
                    classIndex = i;
                    match = true;
                    break;
                }
            }

            if (match === false) {
                classIndex = scales[datapoint].length;
            }

            return datapoint + classIndex;
        }
    };
});
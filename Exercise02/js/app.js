


// Create the all up Angular application
var WReader = {}

// Angular Object model for entry items
WReader.Item = function () {
    /* Exercise 2.1 */
};

function DataController($scope) {
  /* Exercise 2.2 */

  // Binary search implementation that finds the index where a entry
  // should be inserted when sorting by date.
  $scope.binarySearch = function (value, low, high, data) {
        var mid, midValue;
        if (low === high) {
            return low;
        }
        mid = low + Math.floor((high - low) / 2);
        midValue = Date.parse(data[mid].pub_date);

        if (value < midValue) {
            return this.binarySearch(value, mid + 1, high, data);
        } else if (value > midValue) {
            return this.binarySearch(value, low, mid, data);
        }
        return mid;
    };
};

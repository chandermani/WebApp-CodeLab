// Create the all up Angular application
var WReader = {}

// Angular Object model for entry items
WReader.Item = function () {
    this.read = false;
    this.starred = false;
    this.item_id = null;
    this.title = null;
    this.pub_name = null;
    this.pub_author = null;
    this.pub_date = new Date(0);
    this.short_desc = null;
    this.content = null;
    this.feed_link = null;
    this.item_link = null
};

function DataController($scope) {
    // content array for Anuglar's data
    $scope.content = [];

    // Adds an item to the controller if it's not already in the controller
    $scope.addItem = function (item) {
        // Check to see if there are any items in the controller with the same
        //  item_id already
        var exists = this.content.filter(function (element) { return element.item_id == item.item_id; }).length;
        if (exists === 0) {
            // If no results are returned, we insert the new item into the data
            // controller in order of publication date
            var length = $scope.content.length, idx;
            idx = this.binarySearch(Date.parse(item.pub_date), 0, length, $scope.content);
            this.content.splice(idx, 0, item);
        }
    };
    //Exercise 3.1

    //Exercise 3.4 is not required.

    //Exercise 3.5

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
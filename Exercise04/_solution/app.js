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

    $scope.filteredContent = [];

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

    $scope.filterAll = function () {
        this.filteredContent = this.content;
    };
    $scope.filterUnread = function () {
        this.filteredContent = this.content.filter(function (element) { return element.read == false });
    };
    $scope.filterRead = function () {
        this.filteredContent = this.content.filter(function (element) { return element.read == true });
    };
    $scope.filterStarred = function () {
        this.filteredContent = this.content.filter(function (element) { return element.starred == true });
    };

    $scope.readCount = function () {
        return this.content.filter(function (element) { return element.read == true }).length;
    };

    $scope.itemCount = function () {
        return this.content.length;
    };

    $scope.unreadCount = function () {
        return this.content.filter(function (element) { return element.read == false }).length;
    };

    $scope.starredCount = function () {
        return this.content.filter(function (element) { return element.starred == true }).length;
    };

    $scope.formattedDate = function (item) {
        return moment(item.pub_date).format('MMMM Do, YYYY');
    }
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
document.addEventListener('keydown', handleBodyKeyDown, false);


appEvents = {
    ITEM_SELECTED: "itemselected",
};

angular.module('feedReader', ['ngResource'])
    .factory('Feed', function ($resource) {
        var feedUrl = encodeURIComponent('http://blog.chromium.org/feeds/posts/default?alt=rss');
        var feedPipeURL = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D'";
        feedPipeURL += feedUrl + "'&format=json&callback=JSON_CALLBACK";

        var Feed = $resource(feedPipeURL,
                            {},
                            { get: { method: "JSONP"} });
        return Feed;
    });

angular.module('persistance',[])
    .service('store',function() {
        var self=this;
        var storeReady=false;
        // Create or open the data store where objects are stored for offline use
        // Initialization of Lawnchair takes times. Any call to 'all' method causes error http://code.google.com/p/chromium/issues/detail?id=141575
        var lawnChairStore = new Lawnchair({name: 'entries', record: 'entry'}, function() { 
            storeReady=true;
        });
        this.all=function(callback) {
            lawnChairStore.all(callback);
        }; 
        this.save=function(item) {
            lawnChairStore.save(item);
        };
        this.ready=function(callback) {         //Make calls after the store is ready.
            sometimeWhen(function(){ return storeReady; }, callback);
        };

        var async = function (fn) {
            setTimeout(fn, 1000);
        };


        var sometimeWhen = function (test, then) {
            async(function () {
                if ( test() ) {
                    then();
                } 
                else {
                    async(arguments.callee);
                }
            });
        };
    });

angular.module('main', ['feedReader','persistance']);

// Create the all up Angular application
var WReader = {}

// Angular Object model for entry items. Class definition
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

function DataController($scope, Feed, store) {

    var fnFilterAll = function (element) { return true; };
    var fnFilterUnread = function (element) { return element.read == false };
    var fnFilterRead = function (element) { return element.read == true };
    var fnFilterStarred = function (element) { return element.starred == true };

    // content array for Anuglar's data
    $scope.content = [];
    $scope.selectedItem = null;

    var FetchFeed = function (callback) {
        Feed.get(function (data) {
            // Get the items object from the result
            var items = data.query.results.rss.channel.item;

            // Get the original feed URL from the result
            var feedLink = data.query.results.rss.channel.link;

            var mappedData = items.map(function (entry) {
                var item = {};
                // Set the item ID to the item GUID
                item.item_id = entry.guid.content;
                // Set the publication name to the RSS Feed Title
                item.pub_name = data.query.results.rss.channel.title;
                item.pub_author = entry.author;
                item.title = entry.title;
                // Set the link to the entry to it's original source if it exists
                //  or set it to the entry link
                if (entry.origLink) {
                    item.item_link = entry.origLink;
                } else if (entry.link) {
                    item.item_link = entry.link;
                }
                item.feed_link = feedLink;
                // Set the content of the entry
                item.content = entry.description;
                // Ensure the summary is less than 128 characters
                if (entry.description) {
                    item.short_desc = entry.description.substr(0, 128) + "...";
                }
                // Create a new date object with the entry publication date
                item.pub_date = new Date(entry.pubDate);
                item.read = false;
                // Set the item key to the item_id/GUID
                item.key = item.item_id;
                return item;
            });
            callback(mappedData);
        });
    };

    $scope.markAllRead = function () {
        $.each($scope.content, function (index, value) {
            value.read = true;
        });
    };

    // Adds an item to the controller if it's not already in the controller
    $scope.addItem = function (item) {
        // Check to see if there are any items in the controller with the same
        //  item_id already
        var exists = this.content.filter(function (element) { return element.item_id == item.item_id; }).length;
        if (exists === 0) {
            // If no results are returned, we insert the new item into the data
            // controller in order of publication date
            var length = $scope.content.length, idx;
            idx = $scope.binarySearch(Date.parse(item.pub_date), 0, length, $scope.content);
            $scope.content.splice(idx, 0, item);
            return true;
        }
        return false;
    };

    $scope.selectItem = function (item) {
        $scope.selectedItem = item;
        $scope.selectedItem.read = true;
        amplify.publish(appEvents.ITEM_SELECTED, { itemSelected: item, itemIndex: this.selectedItemIndex(), itemCount: this.filteredItemsCount() });
    };

    $scope.selectNextItem=function() {
        var nextItemIndex = $scope.selectedItemIndex() + 1;
        var items = $scope.filteredItems();
        if (nextItemIndex < 0 || nextItemIndex >= items.length) return;
        var nextItem = items[nextItemIndex];
        $scope.selectItem(nextItem); 
    };

    $scope.selectPreviousItem=function(){
        var previousItemIndex = $scope.selectedItemIndex() - 1;
        var items = $scope.filteredItems();
        if (previousItemIndex < 0 || previousItemIndex >= items.length) return;
        var previousItem = items[previousItemIndex];
        $scope.selectItem(previousItem);
    };
    

    $scope.itemSelected = function () {
        if (this.selectedItem === null) return false;
        return true;
    };

    $scope.refresh = function () {
        FetchFeed(function (data) {
            $scope.content = data;
            $scope.currentFilter = fnFilterAll;
        });
    };

    $scope.currentFilter = fnFilterAll;

    $scope.filterAll = function () {
        this.currentFilter = fnFilterAll;
        this.selectedItem=null;
        amplify.publish(appEvents.ITEM_SELECTED, { itemSelected: this.selectedItem, itemIndex: this.selectedItemIndex(), itemCount: this.filteredItemsCount() });
    };
    $scope.filterUnread = function () {
        this.currentFilter = fnFilterUnread;
        this.selectedItem=null;
        amplify.publish(appEvents.ITEM_SELECTED, { itemSelected: this.selectedItem, itemIndex: this.selectedItemIndex(), itemCount: this.filteredItemsCount() });
    };
    $scope.filterRead = function () {
        this.currentFilter = fnFilterRead;
        this.selectedItem=null;
        amplify.publish(appEvents.ITEM_SELECTED, { itemSelected: this.selectedItem, itemIndex: this.selectedItemIndex(), itemCount: this.filteredItemsCount() });
    };
    $scope.filterStarred = function () {
        this.currentFilter = fnFilterRead
        this.selectedItem=null;
        amplify.publish(appEvents.ITEM_SELECTED, { itemSelected: this.selectedItem, itemIndex: this.selectedItemIndex(), itemCount: this.filteredItemsCount() });
    };

    $scope.readCount = function () {
        return this.content.filter(fnFilterRead).length;
    };

    $scope.itemCount = function () {
        return this.content.filter(fnFilterAll).length;
    };

    $scope.unreadCount = function () {
        return this.content.filter(fnFilterUnread).length;
    };

    $scope.starredCount = function () {
        return this.content.filter(fnFilterStarred).length;
    };

    $scope.filteredItemsCount=function(){
        return this.content.filter(this.currentFilter).length;
    };

    $scope.filteredItems = function () {
        return this.content.filter(this.currentFilter);
    };

    $scope.selectedItemIndex = function () {
        return $.inArray(this.selectedItem, this.filteredItems());
    };
        
    $scope.formattedDate = function (item) {
        return moment(item.pub_date).fromNow();
    };
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

    var init = function () {
        store.ready(function() {            //Store should be ready to recieve request before calling any store method
            //Load items from local store.
            store.all(function(localStoreItems) {

                localStoreItems.forEach(function(localStoreItem) {
                    $scope.addItem(localStoreItem);
            
                });
                //Once local items are loaded load data from online feed.
                FetchFeed(function (remoteItems) {
                    remoteItems.forEach(function(remoteItem) {
                        if($scope.addItem(remoteItem)) {
                            store.save(remoteItem);
                        }
                    });
                    $scope.currentFilter = fnFilterAll;
                });
            });
        });
    };

    init();
};

function ItemController($scope) {

    var onItemSelected = function (data) {
        $scope.item = data.itemSelected;
        $scope.itemIndex = data.itemIndex;
        $scope.itemCount = data.itemCount;
    };

    amplify.subscribe(appEvents.ITEM_SELECTED, $scope, onItemSelected);

    $scope.toggleRead = function () {
        if (this.item === undefined) return;
        this.item.read = !this.item.read;
    };
    $scope.toggleStar = function () {
        if (this.item === undefined) return;
        this.item.starred = !this.item.starred;
    };

}

function NavControlsController($scope) {
    
    $scope.item = null;
    $scope.itemIndex = -1;
    $scope.itemCount = 0;

    var onItemSelected = function (data) {
        $scope.item = data.itemSelected;
        $scope.itemIndex = data.itemIndex;
        $scope.itemCount = data.itemCount;
    };

    amplify.subscribe(appEvents.ITEM_SELECTED, $scope, onItemSelected);

    $scope.toggleStar = function () {
        if (this.item === undefined) return;
        this.item.starred = !this.item.starred;
    };

    $scope.toggleRead = function () {
        if (this.item === undefined) return;
        this.item.read = !this.item.read;
    };

    $scope.itemSelected = function () {
        if (this.item === null) return false;
        return true;
    };

    $scope.canGotoNext = function () {
        return (this.itemIndex < this.itemCount - 1 && this.itemCount > 0 && this.itemSelected());
    };

    $scope.canGotoPrevious = function () {
        return (this.itemIndex > 0 && this.itemCount > 0 && this.itemSelected());
    };
};


function handleBodyKeyDown(evt) {
    var dataControllerScope = angular.element('#datacontroller').scope();
    var itemControllerScope = angular.element('#itemcontroller').scope();

    if (evt.srcElement.tagName === "BODY") {
        switch (evt.keyCode) {
            case 34: // PgDn
            case 39: // right arrow
            case 40: // down arrow
            case 74: // j
                dataControllerScope.$apply(dataControllerScope.selectNextItem());
                break;

            case 32: // Space
//                WReader.HandleSpaceKey();
                evt.preventDefault();
                break;

            case 33: // PgUp
            case 37: // left arrow
            case 38: // up arrow
            case 75: // k
                dataControllerScope.$apply(dataControllerScope.selectPreviousItem());
                break;

            case 85: // U
                itemControllerScope.$apply(itemControllerScope.toggleRead());                
                break;

            case 72: // H
                itemControllerScope.$apply(itemControllerScope.toggleStar());                
                break;
        }
    }
};
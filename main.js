Array.prototype.centroid = function () {
    var self = this;

    var sum = self.reduce(function (sum, point) {
            sum.lat += point.lat;
            sum.lng += point.lng;
            return sum;
        }, {
            lat : 0,
            lng : 0
        });

    return {
        "lat" : sum.lat / self.length,
        "lng" : sum.lng / self.length
    };
};

Array.prototype.lerp = function (lerpStep) {
    var self = this;

    var result = [];

    self.forEach(function (elem) {
        elem.time = moment(elem.time);
    });

    /**
    from point1 ~ (point2 - 1)
     */
    var lerpBetween = function (point1, point2) {

        var lerp = function (v0, v1, t) {
            return (1 - t) * v0 + t * v1; ;
        };
        var diff = point2.time.diff(point1.time);
        var numOfInterpolatePoint = Math.floor(diff / lerpStep);

        var lerped = [];
        for (var j = 0; j < numOfInterpolatePoint; j++) {
            var t = j / numOfInterpolatePoint;
            var lerpLat = lerp(point1.lat, point2.lat, t);
            var lerpLng = lerp(point1.lng, point2.lng, t);
            lerped.push({
                "lat" : lerpLat,
                "lng" : lerpLng
            });
        }
        return lerped;
    };

    var expectedCount = Math.floor(self[self.length - 1].time.diff(self[0].time) / lerpStep);
    console.log("Should have ", expectedCount, " points.");

    for (var i = 0; i < self.length - 1; i++) {
        var lerpedPoints = lerpBetween(self[i], self[i + 1]);
        Array.prototype.push.apply(result, lerpedPoints);
    }

    return result;

};

MapTapePlayer = function(map, path, audio) {
    
    var lerpStep = 1000;
    var points = path.lerp(lerpStep);
    var map = map;
    var audio = audio;
    
    var pointer = new google.maps.Marker({
        position : points[0],
        map: map
    });
    
    audio.ontimeupdate = function() {
        var index = Math.floor(audio.currentTime);
        
        if (index < points.length) {
            pointer.setPosition(points[index]);
        }
    };
    
    return {
        play: function() {
            audio.play();
        },
        
        pause: function() {
            audio.pause();
        }
    };
    
};

var player;

function init() {

    var center = data.path.centroid();
    var map = new google.maps.Map(document.getElementById('map'), {
            center : center,
            zoom : data.zoom_level
    });
    
    player = new MapTapePlayer(map, data.path, document.getElementsByTagName('audio')[0]);
};

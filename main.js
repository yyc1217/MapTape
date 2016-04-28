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

Array.prototype.lerp = function (lerpStepInSeconds) {
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
        var diff = point2.time.diff(point1.time) / 1000;
        var numOfInterpolatePoint = Math.floor(diff / lerpStepInSeconds);

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

    var expectedCount = Math.floor(self[self.length - 1].time.diff(self[0].time) / lerpStepInSeconds / 1000);
    console.log("Should have ", expectedCount, " points.");

    for (var i = 0; i < self.length - 1; i++) {
        var lerpedPoints = lerpBetween(self[i], self[i + 1]);
        Array.prototype.push.apply(result, lerpedPoints);
    }

    return result;

};

MapTapePlayer = function(map, path, audioSelector) {
    
    var lerpStepInSeconds = 1;
    var points = path.lerp(lerpStepInSeconds);
    var map = map;
    var dolbyAudioType = 'audio/mp4';
    var isDolbyEnabled = Dolby.checkDDPlus();
    var audio = document.querySelectorAll(audioSelector)[0];
    audio.volume = 0.5;
    
    var pointer = new google.maps.Marker({
        position : points[0],
        map: map
    });
    
    var oldCenter = map.getCenter();
    var distanceThresholdInMeter = 30;
    var isOverDistance = function(oldCenter, next) {
        return google.maps.geometry.spherical.computeDistanceBetween(oldCenter, next) > distanceThresholdInMeter;
    };
    
    audio.ontimeupdate = function() {
        var index = Math.floor(audio.currentTime / lerpStepInSeconds);
        var next = new google.maps.LatLng(points[index]);
        
        if (index >= points.length) {
            return;
        }

        if (isOverDistance(oldCenter, next)) {
            map.panTo(next);
            oldCenter = next;
        }
        
        pointer.setPosition(next);
    };

    return {
        play: function() {
            var cachedCurrentTime = audio.currentTime;
            var findSource = function() {
                var children = audio.childNodes;
                for (var i = 0; i < children.length; i++) {
                    if (isDolbyEnabled && children[i].type && children[i].type == dolbyAudioType) { 
                        return children[i];
                    }
                    
                    if (!isDolbyEnabled && children[i].type && children[i].type != dolbyAudioType) {
                        return children[i];
                    }
                }
                
                return undefined;
            };
            
            audio.src = findSource().src;
            audio.load();
            audio.currentTime = cachedCurrentTime;
            audio.play();
        },
        
        pause: function() {
            audio.pause();
        },
        
        dolby: {
            enable: function() {
                isDolbyEnabled = true;
            },
            
            disable: function() {
                isDolbyEnabled = false;
            }
        }
    };
    
};

DolbySwitch = function(dolbySwitchSelector) {
    
    var elem = document.querySelectorAll(dolbySwitchSelector)[0];
    var check = document.querySelectorAll(dolbySwitchSelector + ' input[type=checkbox]')[0];
    
    if (Dolby.checkDDPlus()) {
        elem.style.display = 'block';
        check.checked = true;
    }
    
    check.onchange = function(e) {
        player.pause();
        e.target.checked ? player.dolby.enable() : player.dolby.disable();
        player.play();
    }
    
    return {};
};

var player;
var dolbySwitch;

function init() {

    var center = data.path[0];
    var map = new google.maps.Map(document.getElementById('map'), {
            center : center,
            zoom : data.zoom_level,
            disableDefaultUI: true
    });
    
    player = new MapTapePlayer(map, data.path, 'audio');   
    google.maps.event.addListenerOnce(map, 'idle', function() {
        player.play();
    });
    
    dolbySwitch = new DolbySwitch('.switch');
};

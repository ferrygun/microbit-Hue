var Service, Characteristic;
var request = require("request");
var BBCMicrobit = require('bbc-microbit')

var EVENT_FAMILY    = 8888;
var EVENT_VALUE_ANY = 0;
var EVENT_RED       = 1001;
var EVENT_GREEN     = 1002;
var EVENT_BLUE      = 1003;
var EVENT_OFF       = 1004;
var microbit_;


console.log('Scanning for microbit');
BBCMicrobit.discover(function(microbit) {
    console.log('\tdiscovered microbit: id = %s, address = %s', microbit.id, microbit.address);


    microbit.on('event', function(id, value) {
        console.log('\ton -> micro:bit event received event: %d value: %d', id, value);
    });

    microbit.on('disconnect', function() {
        console.log('\tmicrobit disconnected!');
        process.exit(0);
    });

    console.log('connecting to microbit');
    microbit.connectAndSetUp(function() {
        console.log('\tconnected to microbit');
        console.log('subscribing to event family, any event value');
        microbit.subscribeEvents(EVENT_VALUE_ANY, EVENT_FAMILY, function() {
            console.log('\tsubscribed to micro:bit events of required type');
        });

        microbit_ = microbit;
    });

});


function hsv2rgb(H, S, V) {
    var Hi, Vmin, a, Vinc, Vdec, R, G, B;
    Hi = Math.floor(H / 60) % 6;
    Vmin = ((100 - S) * V) / 100;
    a = (V - Vmin) * (H % 60) / 60;
    Vinc = Vmin + a;
    Vdec = V - a;
    V = V * 255;
    Vmod = V % 100;
    V = Vmod < 50 ? (V - Vmod) / 100 : (V + (100 - Vmod)) / 100;
    Vinc = Vinc * 255;
    var Vincmod = Vinc % 100;
    Vinc = Vincmod < 50 ? (Vinc - Vincmod) / 100 : (Vinc + (100 - Vincmod)) / 100;
    Vdec = Vdec * 255;
    var Vdecmod = Vdec % 100;
    Vdec = Vdecmod < 50 ? (Vdec - Vdecmod) / 100 : (Vdec + (100 - Vdecmod)) / 100;
    Vmin = Vmin * 255;
    var Vminmod = Vmin % 100;
    Vmin = Vminmod < 50 ? (Vmin - Vminmod) / 100 : (Vmin + (100 - Vminmod)) / 100;
    if (Hi == 0) {
        R = V;
        G = Vinc;
        B = Vmin;
    }
    if (Hi == 1) {
        R = Vdec;
        G = V;
        B = Vmin;
    }
    if (Hi == 2) {
        R = Vmin;
        G = V;
        B = Vinc;
    }
    if (Hi == 3) {
        R = Vmin;
        G = Vdec;
        B = V;
    }
    if (Hi == 4) {
        R = Vinc;
        G = Vmin;
        B = V;
    }
    if (Hi == 5) {
        R = V;
        G = Vmin;
        B = Vdec;
    }
    return {
        'r': R,
        'g': G,
        'b': B
    }
}

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-microbit", "Microbit", microbitAccessory);
};


function microbitAccessory(log, config) {
    this.log = log;

    this.status_on = config["status_on"];
    this.status_off = config["status_off"];
    this.service = config["service"] || "Switch";
    this.name = config["name"];
    this.brightnessHandling = config["brightnessHandling"] || "no";

    //realtime polling info
    this.state = false;
    this.currentlevel = 0;
    this.enableSet = true;
    this.Saturation = 0;
    this.Hue = 0;

    var that = this;
}


microbitAccessory.prototype = {

    setPowerState: function(powerState, callback) {
        this.log("Power On", powerState);
        this.log("Enable Set", this.enableSet);
        this.log("Current Level", this.currentlevel);
        if (this.enableSet === true) {
            if (powerState) {
                this.log("Setting power state to on");
                this.state = true;
            } else {
                this.log("Setting power state to off");
                microbit_.writeEvent(EVENT_OFF, EVENT_FAMILY, function() {
                });
                this.state = false;
            }
            callback();

        } else 
            callback();
        
    },


    getHue: function(callback) {
        this.log("Getting Hue level");
        callback();
    },

    setHue: function(level, callback) {
        this.log('Caching Hue as %s ...', level);
        this.Hue = level;

        console.log('Hue:' + this.Hue + ', Saturation:' + this.Saturation);
        var rgb = hsv2rgb(this.Hue,this.Saturation,50);
        console.log(rgb);
        
        if(this.state) {
            microbit_.writeEvent(EVENT_RED, EVENT_FAMILY, function() {
            });
            var red = rgb.r/128 * 1023;
            microbit_.writeEvent(red, EVENT_FAMILY, function() {
            });
            
                 
            microbit_.writeEvent(EVENT_GREEN, EVENT_FAMILY, function() {
            });
            var green = rgb.g/128 * 1023;
            microbit_.writeEvent(green, EVENT_FAMILY, function() {
            });

            
            microbit_.writeEvent(EVENT_BLUE, EVENT_FAMILY, function() {
            });
            var blue = rgb.b/128 * 1023;
            microbit_.writeEvent(blue, EVENT_FAMILY, function() {
            });
        }
        
        callback();
    },

    getSaturation: function(callback) {
        this.log("Getting Saturation level");
        callback();
    },

    setSaturation: function(level, callback) {
        this.log('Caching Saturation as %s ...', level);
        this.Saturation = level;
        callback();
    },

    identify: function(callback) {
        this.log("Identify requested!");
        callback(); 
    },

    getServices: function() {

        var that = this;

        // you can OPTIONALLY create an information service if you wish to override
        // the default values for things like serial number, model, etc.
        var informationService = new Service.AccessoryInformation();

        informationService
            .setCharacteristic(Characteristic.Manufacturer, "HTTP Manufacturer")
            .setCharacteristic(Characteristic.Model, "HTTP Model")
            .setCharacteristic(Characteristic.SerialNumber, "HTTP Serial Number");

            this.lightbulbService = new Service.Lightbulb(this.name);

            this.lightbulbService
                .getCharacteristic(Characteristic.On)
                .on("get", function(callback) {
                    callback(null, that.state)
                })
                .on("set", this.setPowerState.bind(this));

                               
            this.lightbulbService
                .addCharacteristic(new Characteristic.Hue())
                .on('get', this.getHue.bind(this))
                .on('set', this.setHue.bind(this));

            this.lightbulbService
                .addCharacteristic(new Characteristic.Saturation())
                .on('get', this.getSaturation.bind(this))
                .on('set', this.setSaturation.bind(this));

             

        return [informationService, this.lightbulbService];
        
    }
};

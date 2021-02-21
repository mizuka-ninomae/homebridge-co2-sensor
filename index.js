let Service, Characteristic;
const { CronJob } = require('cron');
const SerialPort  = require('serialport');

module.exports = function(homebridge){
  Service         = homebridge.hap.Service;
  Characteristic  = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-co2-sensor", "Co2Sensor", Co2SensorAccessory);
}

function Co2SensorAccessory(log, config) {
  this.log           = log;
  this.name          = config["name"];
  this.deviceName    = config["namedeviceName"];
  this.uart          = config["uart"];
  this.schedule      = config["nameschedule"] || '*/5 * * * *';
  this.warning_level = config["warning_level"] || 1500;
  this.debag         = config["debag"] || false;
  this.uart_path     = "/dev/" + this.uart;
  this.sdata         = Buffer.from([0xFF, 0x01, 0x86, 0x00, 0x00, 0x00, 0x00, 0x00, 0x79]);

  this.informationService         = new Service.AccessoryInformation();
  this.CarbonDioxideSensorService = new Service.CarbonDioxideSensor(this.name);

  this.informationService
    .setCharacteristic(Characteristic.Manufacturer, "Co2Sensor Manufacturer")
    .setCharacteristic(Characteristic.Model, 'Co2Sensor Model')
    .setCharacteristic(Characteristic.SerialNumber, 'Co2Sensor Serial Number');

  this.CarbonDioxideSensorService
    .getCharacteristic(Characteristic.CarbonDioxideLevel)
    .on('get', this.getCarbonDioxideLevel.bind(this));

  this.CarbonDioxideSensorService
    .getCharacteristic(Characteristic.CarbonDioxideDetected)
    .on('get', this.getCarbonDioxideDetected.bind(this));

  this.job = new CronJob({
    cronTime: this.schedule,
    onTick: () => {
      this.getCarbonDioxide(function(error, co2_level, co2_detected) {
        this.log(`>>> [Update] CarbonDioxideLevel => ${co2_level}`);
        this.log(`>>> [Update] CarbonDioxideDetected => ${co2_detected}`);
        this.CarbonDioxideSensorService
          .getCharacteristic(Characteristic.CarbonDioxideLevel)
          .updateValue(co2_level);
        this.CarbonDioxideSensorService
          .getCharacteristic(Characteristic.CarbonDioxideDetected)
          .updateValue(co2_detected);
      }.bind(this));
    },
    runOnInit: true
  })
  this.job.start()
}

Co2SensorAccessory.prototype.getServices = function() {
  return [this.informationService, this.CarbonDioxideSensorService];
}
Co2SensorAccessory.prototype.getCarbonDioxideLevel = function(callback) {
  this.getCarbonDioxide(function(error, co2_level, co2_detected) {
    this.log('CO2_Level: ' + co2_level)
    callback(null, co2_level);
  }.bind(this));
}

Co2SensorAccessory.prototype.getCarbonDioxideDetected = function(callback) {
  this.getCarbonDioxide(function(error, co2_level, co2_detected) {
    this.log('CO2_Detected: ' + co2_detected);
    callback(null, co2_detected);
  }.bind(this));
}

Co2SensorAccessory.prototype.getCarbonDioxide = function(callback) {
  let sdata        = this.sdata;
  let rdata        = Buffer.alloc(0);
  let co2_level    = 0;
  let co2_detected = 0;
  const port       = new SerialPort(this.uart_path, {
                                    autoOpen: true,
                                    baudRate: 9600,
                                    dataBits: 8,
                                    parity:   'none',
                                    stopBits: 1
  });

  port.on("open", function() {
    if (this.debag) {
      this.log("Co2Sensor SerialPort: Open");
      this.log('Co2Sensor send data:    ', sdata);
    }
    port.write(sdata);
  }.bind(this));

  port.on("data", function(data) {
    rdata = Buffer.concat([rdata, data]);
    if (rdata.byteLength >= 9) {
      if (this.debag) {
        this.log('Co2Sensor receive data: ', rdata);
      }
      let adata    = new Uint8Array(rdata);
      co2_level    = adata[2]*256+adata[3];
      let checksum = (256-(adata[1]+adata[2]+adata[3]+adata[4]+adata[5]+adata[6]+adata[7]));
      if (adata[8] == checksum) {
      }
      else {
        this.log('Co2Sensor Bad Checksum: ' + adata[8] + ' / ' + checksum)
      }
      port.close();
      if (this.debag) {
        this.log("Co2Sensor SerialPort: Close");
      }
      if (this.warning_level > co2_level) {
        co2_detected = 0;
      }
      else {
        co2_detected = 1;
      }
      if (this.debag) {
        this.log(co2_level);
        this.log(co2_detected);
      }
      callback(null, co2_level, co2_detected);
    }
  }.bind(this));

  port.on("error", function(err) {
    if (this.debag) {
      this.log("Co2Sensor error");
    }
    port.close();
    callback(err, co2_level, co2_detected);
  }.bind(this));
}

let Service, Characteristic;
const { CronJob } = require('cron');
const MH_Z19      = require('mh_z19');

module.exports = function(homebridge){
  Service         = homebridge.hap.Service;
  Characteristic  = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-co2-sensor", "Co2Sensor", Co2SensorAccessory);
}

function Co2SensorAccessory(log, config) {
  this.log           = log;
  this.name          = config["name"];
  this.uart_path     = config["uart_path"];
  this.schedule      = config["schedule"] || '*/5 * * * *';
  this.warning_level = config["warning_level"] || 1500;
  this.debag         = config["debag"] || false;

  this.informationService         = new Service.AccessoryInformation();
  this.CarbonDioxideSensorService = new Service.CarbonDioxideSensor(this.name);

  this.job = new CronJob({
    cronTime: this.schedule,
    onTick: () => {
      new MH_Z19 (this.uart_path, function(error, co2_level, stderr) {
        if (co2_level == null) {
          this.CarbonDioxideSensorService
            .updateCharacteristic(Characteristic.CarbonDioxideLevel, new Error(error));
          this.CarbonDioxideSensorService
            .updateCharacteristic(Characteristic.CarbonDioxideDetected, new Error(error));
        }
        else {
          let co2_detected = (this.warning_level > co2_level) ? 0 : 1;
          this.log(`>>> [Update] CarbonDioxideLevel => ${co2_level}`);
          this.log(`>>> [Update] CarbonDioxideDetected => ${co2_detected}`);
          this.CarbonDioxideSensorService
            .updateCharacteristic(Characteristic.CarbonDioxideLevel, co2_level);
          this.CarbonDioxideSensorService
            .updateCharacteristic(Characteristic.CarbonDioxideDetected, co2_detected);
        }
      }.bind(this))
    },
    runOnInit: true
  })
  this.job.start()
}

Co2SensorAccessory.prototype.getServices = function() {
  this.informationService
    .setCharacteristic(Characteristic.Manufacturer, "Co2Sensor Manufacturer")
    .setCharacteristic(Characteristic.Model, 'Co2Sensor Model')
    .setCharacteristic(Characteristic.SerialNumber, 'Co2Sensor Serial Number');

  return [this.informationService, this.CarbonDioxideSensorService];
}

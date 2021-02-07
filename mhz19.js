const uart       = "ttyS0";

const SerialPort = require('serialport');
const uart_path  = "/dev/" + uart;
const sdata      = Buffer.from([0xFF, 0x01, 0x86, 0x00, 0x00, 0x00, 0x00, 0x00, 0x79]);
let   rdata      = Buffer.alloc(0);
let   co2_level;
const port       = new SerialPort(uart_path, {
  autoOpen: true,
  baudRate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1
});

port.on("open", function() {
  console.log("SerialPort: Open ('" + uart_path + "')");
  console.log('send data:    ', sdata);
  port.write(sdata);
})

port.on("data", function(data) {
  rdata = Buffer.concat([rdata, data]);
  if (rdata.byteLength >= 9) {
    console.log('receive data: ', rdata);
    let adata    = new Uint8Array(rdata);
    co2_level    = adata[2]*256+adata[3];
    let checksum = (256-(adata[1]+adata[2]+adata[3]+adata[4]+adata[5]+adata[6]+adata[7]));
    if (adata[8] == checksum) {  
    }
    else {
      console.log('Bad Checksum: ' + adata[8] + ' / ' + checksum)
    }
    port.close();
  }
});

port.on("error", function() {
  console.log("error");
});

port.on("close", function() {
  console.log("SerialPort: Close");
  console.log(co2_level);
});

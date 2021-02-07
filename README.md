<p align="center">
  <img src="img/mhz19c_omote.png" width="300">
</p>

### テスト環境（Testing Environment）

* Raspberry Pi 4 modelB 4GB（UART1、UART2、UART4）
* Winsen MH-Z19C

他の環境でも動くかもしれません。

### 配線図 (Wiring diagram)

<img src="img/raspi4.png" width="900">

<img src="img/mhz19c_ura.png" width="600">

### 設定 （Configuration）

#### ① シリアルポートの有効化 （Enable serial port）

<img src="img/serialport_1.png" width="900">

メニューの『設定＞Raspberry Pi の設定＞インターフェイス』のシリアルポートを有効にします。（SerialPort ⇒ enable）

この際、シリアルコンソールは無効のままにしてください。（Serial console ⇒ Disable）

#### ② UART2,UART4を使用する場合 （When using UART2 and UART4）

`/boot/config.txt` を編集します。（Edit）

例えば（For example）、 `sudo nano /boot/config.txt`

```
・・・・

[all]

・・・・

dtoverlay=uart2
dtoverlay=uart4

```

一番最後に上記の２行を追加します。（Add the above two lines at the very end.）

UART4を使用しない場合は、UART2の行だけを追加します。（If you are not using UART4, add only the UART2 line.）

保存したら再起動します。（After saving, reboot.）

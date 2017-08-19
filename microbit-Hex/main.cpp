#include "MicroBit.h"
MicroBit uBit;

#define EVENT_ID    8888
#define RED   1001
#define GREEN 1002
#define BLUE  1003
#define OFF   1004

uint8_t r = 0;
uint8_t g = 0;
uint8_t b = 0;


void onConnected(MicroBitEvent) {
  //uBit.display.print("C");
}

 
void onDisconnected(MicroBitEvent){
  //uBit.display.print("D");
}


void onControllerEvent(MicroBitEvent e) {
  //uBit.display.print(e.value);

  //Off
  if (e.value == OFF)  {
    uBit.io.P0.setAnalogValue(1023);
    uBit.io.P1.setAnalogValue(1023);
    uBit.io.P2.setAnalogValue(1023);
  }

  //Red
  if (e.value == RED && r == 0)  {
    r = 1;
  } 
  if (r == 1) {
    if (e.value != RED) {
      uBit.io.P0.setAnalogValue(1023 - e.value);
      r = 0;
    }
  }

  //Green
  if (e.value == GREEN && g == 0)  {
    g = 1;
  } 
  if (g == 1) {
    if (e.value != GREEN) {
      uBit.io.P2.setAnalogValue(1023 - e.value);
      g = 0;
    }
  }


  //Blue
  if (e.value == BLUE && b == 0)  {
    b = 1;
  } 
  if (b == 1) {
    if (e.value != BLUE) {
      uBit.io.P1.setAnalogValue(1023 - e.value);
      b = 0;
    }
  }

}

int main() {
    uBit.init();
    uBit.display.scroll("DC");

    uBit.messageBus.listen(MICROBIT_ID_BLE, MICROBIT_BLE_EVT_CONNECTED, onConnected);
    uBit.messageBus.listen(MICROBIT_ID_BLE, MICROBIT_BLE_EVT_DISCONNECTED, onDisconnected);
    uBit.messageBus.listen(EVENT_ID, MICROBIT_EVT_ANY, onControllerEvent);
    
    release_fiber();
}

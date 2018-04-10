"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by Andolsi on 04/04/2018.
 */
exports.deviceDetect = require('device-detect')();
exports.isMobile = () => {
    const mobileListDevices = ['iPhone', 'iPad', 'iPod', 'Blackberry', 'WindowsMobile', 'Android'];
    let deviceDetectValue = exports.deviceDetect.device;
    let list = mobileListDevices.filter((e) => e == deviceDetectValue);
    if (list.length) {
        return true;
    }
    return false;
};
//# sourceMappingURL=DeviceDetect.js.map
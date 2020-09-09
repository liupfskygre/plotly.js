/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');
var ms2DateTime = require('../../lib').ms2DateTime;
var constants = require('../../constants/numerical');

var ONEAVGYEAR = constants.ONEAVGYEAR;
var ONEMINYEAR = constants.ONEMINYEAR;
var ONEAVGQUARTER = constants.ONEAVGQUARTER;
var ONEMINQUARTER = constants.ONEMINQUARTER;
var ONEAVGMONTH = constants.ONEAVGMONTH;
var ONEMINMONTH = constants.ONEMINMONTH;
var ONEWEEK = constants.ONEWEEK;
var ONEDAY = constants.ONEDAY;

module.exports = function alignPeriod(trace, ax, axLetter, vals) {
    var alignment = trace[axLetter + 'periodalignment'];
    if(!alignment || alignment === 'start') return vals;

    var dynamic = false;
    var period = trace[axLetter + 'period'];
    if(isNumeric(period)) {
        period = +period; // milliseconds
        if(period <= 0) return vals;
    } else if(typeof period === 'string' && period.charAt(0) === 'M') {
        var v = +(period.substring(1));
        if(v > 0 && Math.round(v) === v) period = v; // positive integer months
        else return vals;

        dynamic = true;
    }

    if(period > 0) {
        var ratio = 0.5; // (alignment === 'end') ? 1 : 0.5;

        var len = vals.length;
        for(var i = 0; i < len; i++) {
            var v0 = vals[i];

            var dateStr0 = ms2DateTime(v0, 0, ax.calendar);
            var d0 = new Date(dateStr0);
            d0 = new Date(d0.getTime() + d0.getTimezoneOffset() * 60000);
            var year0 = d0.getFullYear();
            var month0 = d0.getMonth();
            var day0 = d0.getDate();
            var hours0 = d0.getHours();
            var minutes0 = d0.getMinutes();
            var seconds0 = d0.getSeconds();
            var milliseconds0 = d0.getMilliseconds();

            var delta;
            if(dynamic) {
                var y = year0;
                var m = month0;

                // calculate the number of days in the following months
                var totalDaysInMonths = 0;
                for(var k = 0; k < period; k++) {
                    m += 1;
                    if(m > 12) {
                        m = 1;
                        y++;
                    }

                    var daysOfMonth = (
                        new Date(y, m, 0)
                    ).getDate();

                    totalDaysInMonths += daysOfMonth;
                }

                delta = ONEDAY * totalDaysInMonths; // convert to ms
            } else {
                delta = period;
            }

            var v2 = v0 + ratio * delta;

            var dateStr2 = ms2DateTime(v2, 0, ax.calendar);
            var d2 = new Date(dateStr2);
            d2 = new Date(d2.getTime() + d2.getTimezoneOffset() * 60000);
            var year2 = d2.getFullYear();
            var month2 = d2.getMonth();
            var day2 = d2.getDate();
            var hours2 = d2.getHours();
            var minutes2 = d2.getMinutes();
            var seconds2 = d2.getSeconds();
            var milliseconds2 = d2.getMilliseconds();

            if(month2 < month0) month2 += 12;
            if(day2 < day0) {
                var nDays = (
                    new Date(year2, month2, 0)
                ).getDate();

                day2 += nDays;
            }
            if(hours2 < hours0) hours2 += 24;
            if(minutes2 < minutes0) minutes2 += 60;
            if(seconds2 < seconds0) seconds2 += 60;
            if(milliseconds2 < milliseconds0) milliseconds2 += 1000;

            var newYear = Math.floor((year0 + year2) / 2);
            var newMonth = Math.floor((month0 + month2) / 2);
            var newDay = Math.floor((day0 + day2) / 2);
            var newHours = Math.floor((hours0 + hours2) / 2);
            var newMinutes = Math.floor((minutes0 + minutes2) / 2);
            var newSeconds = Math.floor((seconds0 + seconds2) / 2);
            var newMilliseconds = Math.floor((milliseconds0 + milliseconds2) / 2);

            console.log('year:', year0, year2, newYear)
            console.log('month:', month0, month2, newMonth)
            console.log('day:', day0, day2, newDay)

            var newDate = new Date(
                newYear,
                newMonth,
                newDay,
                newHours,
                newMinutes,
                newSeconds,
                newMilliseconds
            );

            var newV = newDate.getTime();

            vals[i] = newV;
        }
    }
    return vals;
};

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
        var ratio = 1; // (alignment === 'end') ? 1 : 0.5;

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

            var v1 = v0 + ratio * delta;

            var dateStr1 = ms2DateTime(v1, 0, ax.calendar);
            var d1 = new Date(dateStr1);
            d1 = new Date(d1.getTime() + d1.getTimezoneOffset() * 60000);
            var year1 = d1.getFullYear();
            var month1 = d1.getMonth();
            var day1 = d1.getDate();
            var hours1 = d1.getHours();
            var minutes1 = d1.getMinutes();
            var seconds1 = d1.getSeconds();
            var milliseconds1 = d1.getMilliseconds();

            if(month1 < month0) month1 += 12;
            if(day1 < day0) {
                var nDays = (
                    new Date(year1, month1, 0)
                ).getDate();

                day1 += nDays;
            }
            if(hours1 < hours0) hours1 += 24;
            if(minutes1 < minutes0) minutes1 += 60;
            if(seconds1 < seconds0) seconds1 += 60;
            if(milliseconds1 < milliseconds0) milliseconds1 += 1000;

            var newYear = Math.floor((year0 + year1) / 2);
            var newMonth = Math.floor((month0 + month1) / 2);
            var newDay = Math.floor((day0 + day1) / 2);
            var newHours = Math.floor((hours0 + hours1) / 2);
            var newMinutes = Math.floor((minutes0 + minutes1) / 2);
            var newSeconds = Math.floor((seconds0 + seconds1) / 2);
            var newMilliseconds = Math.floor((milliseconds0 + milliseconds1) / 2);

            console.log('year:', year0, year1, newYear)
            console.log('month:', month0, month1, newMonth)
            console.log('day:', day0, day1, newDay)

            var newDate = new Date(
                newYear,
                newMonth,
                newDay,
                newHours,
                newMinutes,
                newSeconds,
                newMilliseconds
            );

            // console.log(newDate)

            var newV = newDate.getTime();

            // console.log((newV - v0) / (v1 - v0))

            vals[i] = newV;
        }
    }
    return vals;
};
